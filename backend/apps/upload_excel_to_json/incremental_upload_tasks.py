"""
Enhanced Incremental Upload Tasks with File Validation
Handles merging new LinkedIn data with existing data based on date ranges
Includes special handling for content files with header rows
"""
import pandas as pd
import json
import os
import subprocess
import shutil
from datetime import datetime
from typing import Dict, List, Tuple, Any
from .models import LinkedInFollower, LinkedInVisitor, LinkedInContent
from .tasks import sanitize_data_for_mongodb
from django.conf import settings
import tempfile


def validate_linkedin_file_structure(file_obj, file_type: str) -> Dict:
    """
    Validate LinkedIn file structure and detect issues
    
    Args:
        file_obj: Uploaded file object
        file_type: 'followers', 'visitors', or 'content'
        
    Returns:
        Dictionary with validation results
    """
    temp_file_path = None
    repaired_file_path = None
    
    try:
        # Save to temp file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.xls')
        temp_file_path = temp_file.name
        
        if hasattr(file_obj, 'seek'):
            file_obj.seek(0)
        
        for chunk in file_obj.chunks():
            temp_file.write(chunk)
        temp_file.close()
        
        # Try to read Excel file, with special handling for content files
        try:
            df_dict = pd.read_excel(temp_file_path, sheet_name=None, dtype=str)
        except UnicodeDecodeError as e:
            if file_type == 'content':
                print(f"[VALIDATION] Content file has encoding issues (will be repaired during processing)")
                # For content files with corruption, skip detailed validation
                # The main processing will handle repair with LibreOffice or binary patch
                if temp_file_path and os.path.exists(temp_file_path):
                    os.remove(temp_file_path)
                
                return {
                    'valid': True,
                    'sheets_found': ['Metrics', 'All posts'],  # Assume standard content structure
                    'expected_sheets': ['Metrics', 'All posts'],
                    'has_expected_sheets': True,
                    'message': 'Content file detected (validation skipped due to encoding, will be repaired during processing)'
                }
            else:
                raise
        
        # Clean up temp files
        if temp_file_path and os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        if repaired_file_path and os.path.exists(repaired_file_path):
            os.remove(repaired_file_path)
        
        # Validate based on file type
        expected_sheets = {
            'followers': ['New followers', 'Location', 'Job function', 'Seniority', 'Industry', 'Company size'],
            'visitors': ['Visitor metrics', 'Location', 'Seniority', 'Industry', 'Company size', 'Job function'],
            'content': ['Metrics', 'All posts']
        }
        
        found_sheets = list(df_dict.keys())
        expected = expected_sheets.get(file_type, [])
        
        # Check if at least one expected sheet is present (not all are required)
        has_expected_sheets = any(sheet in found_sheets for sheet in expected)
        
        return {
            'valid': True,
            'sheets_found': found_sheets,
            'expected_sheets': expected,
            'has_expected_sheets': has_expected_sheets,
            'message': f"Found sheets: {', '.join(found_sheets)}"
        }
        
    except Exception as e:
        # Clean up temp files on error
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except:
                pass
        if repaired_file_path and os.path.exists(repaired_file_path):
            try:
                os.remove(repaired_file_path)
            except:
                pass
        
        print(f"[VALIDATION ERROR] {file_type}: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'valid': False,
            'error': str(e),
            'message': f"Failed to validate file: {str(e)}"
        }


def process_content_file_with_header_removal(file_obj, output_folder: str, session_id: str) -> Dict:
    """
    Special processing for content files that have header rows
    
    Args:
        file_obj: Content file object
        output_folder: Output directory path
        session_id: Upload session ID
        
    Returns:
        Processing result dictionary
    """
    from .tasks import excel_to_json
    
    # Use the standard excel_to_json which now has content file handling
    result = excel_to_json(file_obj, output_folder, 'content')
    
    return result


def parse_date_from_string(date_str: str) -> datetime:
    """
    Parse date string from various formats
    
    Args:
        date_str: Date string in various formats
        
    Returns:
        datetime object or None if parsing fails
    """
    if not date_str or pd.isna(date_str):
        return None
    
    # Common date formats in LinkedIn exports
    date_formats = [
        '%Y-%m-%d',
        '%m/%d/%Y',
        '%d/%m/%Y',
        '%Y/%m/%d',
        '%b %d, %Y',
        '%B %d, %Y',
        '%Y-%m-%d %H:%M:%S',
        '%m/%d/%Y %H:%M:%S'
    ]
    
    date_str = str(date_str).strip()
    
    for fmt in date_formats:
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue
    
    # Try pandas to_datetime as fallback
    try:
        return pd.to_datetime(date_str)
    except:
        return None


def extract_date_from_record(record: Dict, possible_date_fields: List[str]) -> datetime:
    """
    Extract date from a record by checking multiple possible field names
    
    Args:
        record: Data record dictionary
        possible_date_fields: List of possible date field names
        
    Returns:
        datetime object or None
    """
    for field in possible_date_fields:
        if field in record and record[field]:
            parsed_date = parse_date_from_string(record[field])
            if parsed_date:
                return parsed_date
    return None


def detect_date_ranges_from_data(json_data: Dict, data_type: str) -> Tuple[datetime, datetime]:
    """
    Detect date ranges from uploaded JSON data
    
    Args:
        json_data: Dictionary of sheet_name -> records
        data_type: 'followers', 'visitors', or 'content'
        
    Returns:
        Tuple of (min_date, max_date) or (None, None)
    """
    all_dates = []
    
    # Define possible date field names for each data type
    date_fields_map = {
        'followers': ['Date', 'date', 'Date range', 'Period'],
        'visitors': ['Date', 'date', 'Date range', 'Period', 'Day'],
        'content': ['Date', 'date', 'Published date', 'Post date', 'Created date', 'Created at']
    }
    
    possible_fields = date_fields_map.get(data_type, ['Date', 'date'])
    
    # Iterate through all sheets and records
    for sheet_name, records in json_data.items():
        if not isinstance(records, list):
            continue
            
        for record in records:
            if not isinstance(record, dict):
                continue
                
            date_obj = extract_date_from_record(record, possible_fields)
            if date_obj:
                all_dates.append(date_obj)
    
    if not all_dates:
        return None, None
    
    return min(all_dates), max(all_dates)


def get_existing_date_ranges(user_id: str, data_type: str) -> Tuple[datetime, datetime]:
    """
    Get existing date ranges from MongoDB for a specific data type
    
    Args:
        user_id: User ID string
        data_type: 'followers', 'visitors', or 'content'
        
    Returns:
        Tuple of (min_date, max_date) or (None, None)
    """
    model_map = {
        'followers': LinkedInFollower,
        'visitors': LinkedInVisitor,
        'content': LinkedInContent
    }
    
    date_fields_map = {
        'followers': ['Date', 'date', 'Date range', 'Period'],
        'visitors': ['Date', 'date', 'Date range', 'Period', 'Day'],
        'content': ['Date', 'date', 'Published date', 'Post date', 'Created date', 'Created at']
    }
    
    model = model_map.get(data_type)
    if not model:
        return None, None
    
    # Query all records for this user
    records = model.objects(user_id=str(user_id))
    
    all_dates = []
    possible_fields = date_fields_map.get(data_type, ['Date', 'date'])
    
    for record in records:
        if not record.data:
            continue
            
        date_obj = extract_date_from_record(record.data, possible_fields)
        if date_obj:
            all_dates.append(date_obj)
    
    if not all_dates:
        return None, None
    
    return min(all_dates), max(all_dates)


def delete_records_in_date_range(user_id: str, data_type: str, start_date: datetime, end_date: datetime, session_id: str = None) -> int:
    """
    Delete records within a specific date range
    
    Args:
        user_id: User ID string
        data_type: 'followers', 'visitors', or 'content'
        start_date: Start of date range
        end_date: End of date range
        session_id: Optional session ID to exclude from deletion
        
    Returns:
        Number of records deleted
    """
    model_map = {
        'followers': LinkedInFollower,
        'visitors': LinkedInVisitor,
        'content': LinkedInContent
    }
    
    date_fields_map = {
        'followers': ['Date', 'date', 'Date range', 'Period'],
        'visitors': ['Date', 'date', 'Date range', 'Period', 'Day'],
        'content': ['Date', 'date', 'Published date', 'Post date', 'Created date', 'Created at']
    }
    
    model = model_map.get(data_type)
    if not model:
        return 0
    
    # Get all records for this user
    query = {'user_id': str(user_id)}
    if session_id:
        # Exclude the current upload session
        query['upload_session_id__ne'] = session_id
    
    records = model.objects(**query)
    
    deleted_count = 0
    possible_fields = date_fields_map.get(data_type, ['Date', 'date'])
    
    for record in records:
        if not record.data:
            continue
            
        date_obj = extract_date_from_record(record.data, possible_fields)
        if date_obj and start_date <= date_obj <= end_date:
            record.delete()
            deleted_count += 1
    
    return deleted_count


def analyze_date_overlap(existing_range: Tuple[datetime, datetime], new_range: Tuple[datetime, datetime]) -> Dict:
    """
    Analyze overlap between existing and new date ranges
    
    Args:
        existing_range: Tuple of (min_date, max_date) for existing data
        new_range: Tuple of (min_date, max_date) for new data
        
    Returns:
        Dictionary with overlap analysis
    """
    if not existing_range[0] or not new_range[0]:
        return {
            'has_overlap': False,
            'overlap_start': None,
            'overlap_end': None,
            'is_extension': True
        }
    
    existing_start, existing_end = existing_range
    new_start, new_end = new_range
    
    # Check for overlap
    has_overlap = not (new_end < existing_start or new_start > existing_end)
    
    if has_overlap:
        overlap_start = max(existing_start, new_start)
        overlap_end = min(existing_end, new_end)
    else:
        overlap_start = None
        overlap_end = None
    
    # Check if new data extends existing data
    is_extension = new_end > existing_end or new_start < existing_start
    
    return {
        'has_overlap': has_overlap,
        'overlap_start': overlap_start,
        'overlap_end': overlap_end,
        'is_extension': is_extension,
        'existing_range': f"{existing_start.strftime('%Y-%m-%d')} to {existing_end.strftime('%Y-%m-%d')}",
        'new_range': f"{new_start.strftime('%Y-%m-%d')} to {new_end.strftime('%Y-%m-%d')}"
    }


def process_incremental_upload(followers_file, visitors_file, content_file, user, session_id: str) -> Dict:
    """
    Process incremental upload with date range merging and file validation
    
    Args:
        followers_file: Uploaded followers Excel file
        visitors_file: Uploaded visitors Excel file
        content_file: Uploaded content Excel file
        user: User object
        session_id: Upload session ID
        
    Returns:
        Dictionary with processing results
    """
    try:
        user_id_str = str(user.id)
        
        # Step 1: Validate files
        print(f"\n[INCREMENTAL] Validating uploaded files...")
        validation_results = {}
        
        try:
            validation_results['followers'] = validate_linkedin_file_structure(followers_file, 'followers')
            print(f"[INCREMENTAL] Followers: {validation_results['followers']['message']}")
        except Exception as e:
            print(f"[INCREMENTAL ERROR] Followers validation failed: {str(e)}")
            return {
                'status': 'failed',
                'error_message': f"Followers file validation error: {str(e)}",
                'step': 'file_validation'
            }
        
        try:
            validation_results['visitors'] = validate_linkedin_file_structure(visitors_file, 'visitors')
            print(f"[INCREMENTAL] Visitors: {validation_results['visitors']['message']}")
        except Exception as e:
            print(f"[INCREMENTAL ERROR] Visitors validation failed: {str(e)}")
            return {
                'status': 'failed',
                'error_message': f"Visitors file validation error: {str(e)}",
                'step': 'file_validation'
            }
        
        try:
            validation_results['content'] = validate_linkedin_file_structure(content_file, 'content')
            print(f"[INCREMENTAL] Content: {validation_results['content']['message']}")
        except Exception as e:
            print(f"[INCREMENTAL ERROR] Content validation failed: {str(e)}")
            return {
                'status': 'failed',
                'error_message': f"Content file validation error: {str(e)}",
                'step': 'file_validation'
            }
        
        # Check for validation errors
        for file_type, result in validation_results.items():
            if not result['valid']:
                return {
                    'status': 'failed',
                    'error_message': f"{file_type.capitalize()} file validation failed: {result.get('message', 'Unknown error')}",
                    'step': 'file_validation'
                }
        
        # Step 2: Process Excel files to JSON (with content header handling)
        print(f"\n[INCREMENTAL] Processing Excel files for session {session_id}")
        from .tasks import process_excel_files
        
        conversion_result = process_excel_files(
            followers_file,
            visitors_file,
            content_file,
            session_id
        )
        
        if conversion_result['status'] != 'success':
            return {
                'status': 'failed',
                'error_message': conversion_result.get('error_message'),
                'step': 'excel_conversion'
            }
        
        json_data = conversion_result['json_data']
        
        # Step 3: Analyze date ranges
        print(f"[INCREMENTAL] Analyzing date ranges...")
        date_analysis = {}
        merge_summary = {}
        
        for data_type in ['followers', 'visitors', 'content']:
            if data_type not in json_data:
                continue
            
            # Get existing date range
            existing_range = get_existing_date_ranges(user_id_str, data_type)
            
            # Get new data date range
            new_range = detect_date_ranges_from_data(json_data[data_type], data_type)
            
            # Analyze overlap
            overlap_info = analyze_date_overlap(existing_range, new_range)
            date_analysis[data_type] = overlap_info
            
            print(f"[INCREMENTAL] {data_type.upper()}:")
            print(f"  Existing: {overlap_info.get('existing_range', 'No existing data')}")
            print(f"  New: {overlap_info.get('new_range', 'No date range detected')}")
            print(f"  Has overlap: {overlap_info['has_overlap']}")
            
            # Step 4: Delete overlapping records
            deleted_count = 0
            if overlap_info['has_overlap'] and overlap_info['overlap_start']:
                print(f"[INCREMENTAL] Deleting overlapping {data_type} records...")
                deleted_count = delete_records_in_date_range(
                    user_id_str,
                    data_type,
                    overlap_info['overlap_start'],
                    overlap_info['overlap_end'],
                    session_id  # Exclude current session from deletion
                )
                print(f"[INCREMENTAL] Deleted {deleted_count} overlapping records")
            
            merge_summary[data_type] = {
                'replaced': deleted_count,
                'added': 0,  # Will be updated after saving
                'total': 0
            }
        
        # Step 5: Save new data to database
        print(f"[INCREMENTAL] Saving new data to database...")
        from .tasks import save_json_to_database
        
        db_result = save_json_to_database(json_data, user, session_id)
        
        if db_result['status'] != 'success':
            return {
                'status': 'failed',
                'error_message': db_result.get('error_message'),
                'step': 'database_save'
            }
        
        # Update merge summary with added counts
        merge_summary['followers']['added'] = db_result['followers_saved']
        merge_summary['followers']['total'] = merge_summary['followers']['added']
        
        merge_summary['visitors']['added'] = db_result['visitors_saved']
        merge_summary['visitors']['total'] = merge_summary['visitors']['added']
        
        merge_summary['content']['added'] = db_result['content_saved']
        merge_summary['content']['total'] = merge_summary['content']['added']
        
        print(f"[INCREMENTAL] Upload completed successfully")
        
        return {
            'status': 'success',
            'session_id': session_id,
            'date_analysis': date_analysis,
            'merge_summary': merge_summary,
            'output_files': conversion_result['output_files'],
            'validation_results': validation_results
        }
        
    except Exception as e:
        print(f"[INCREMENTAL ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'status': 'failed',
            'error_message': str(e),
            'step': 'unknown'
        }
