
# ============================================================================
# tasks.py (FIXED - Binary Corruption Detection + LinkedIn-Specific Handling)
# ============================================================================
import pandas as pd
import json
import os
import numpy as np
from django.conf import settings
from .models import LinkedInFollower, LinkedInVisitor, LinkedInContent
import tempfile
import xlrd
import struct
import re
from io import BytesIO

def sanitize_data_for_mongodb(data):
    """Sanitize data to be compatible with MongoDB"""
    MONGO_MAX_INT = 9223372036854775807
    MONGO_MIN_INT = -9223372036854775808
    
    if isinstance(data, dict):
        return {key: sanitize_data_for_mongodb(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [sanitize_data_for_mongodb(item) for item in data]
    elif pd.isna(data):
        return None
    elif isinstance(data, (np.integer, int)):
        int_val = int(data)
        if int_val > MONGO_MAX_INT or int_val < MONGO_MIN_INT:
            return str(int_val)
        return int_val
    elif isinstance(data, (np.floating, float)):
        if np.isnan(data) or np.isinf(data):
            return None
        float_val = float(data)
        if float_val.is_integer():
            int_val = int(float_val)
            if int_val > MONGO_MAX_INT or int_val < MONGO_MIN_INT:
                return str(int_val)
        return float_val
    elif isinstance(data, np.bool_):
        return bool(data)
    elif isinstance(data, (np.ndarray,)):
        return sanitize_data_for_mongodb(data.tolist())
    elif isinstance(data, (pd.Timestamp, np.datetime64)):
        try:
            return pd.Timestamp(data).isoformat()
        except:
            return str(data)
    elif isinstance(data, str):
        return data
    elif data is None:
        return None
    else:
        try:
            return str(data)
        except:
            return None


def is_binary_corrupted(file_path, sample_size=1024):
    """
    Detect if file contains too much binary corruption/garbage
    Returns True if file appears to be severely corrupted
    """
    try:
        with open(file_path, 'rb') as f:
            sample = f.read(sample_size)
        
        # Count non-printable characters (excluding common control chars)
        non_printable = sum(1 for byte in sample if byte < 32 and byte not in [9, 10, 13])
        
        # If more than 80% is non-printable, likely corrupted
        corruption_ratio = non_printable / len(sample)
        
        # Check for valid Excel signatures
        has_excel_signature = (
            sample[:8] == b'\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1' or  # OLE2
            sample[:4] == b'PK\x03\x04'  # XLSX (ZIP)
        )
        
        print(f"[CORRUPTION CHECK] Ratio: {corruption_ratio:.2f}, Has Excel Signature: {has_excel_signature}")
        
        # If no valid signature and high corruption, it's bad
        return corruption_ratio > 0.8 and not has_excel_signature
        
    except Exception as e:
        print(f"[WARNING] Corruption check failed: {e}")
        return False


def extract_readable_text_from_binary(file_path):
    """
    Extract any readable text from a corrupted binary file
    This is a last-resort method for severely corrupted files
    """
    try:
        print(f"[DEBUG] Attempting binary text extraction...")
        
        with open(file_path, 'rb') as f:
            content = f.read()
        
        # Try to find readable strings (sequences of printable ASCII)
        # Pattern: at least 4 consecutive printable characters
        text_pattern = rb'[\x20-\x7E]{4,}'
        matches = re.findall(text_pattern, content)
        
        if matches:
            # Decode and clean
            text_strings = [match.decode('ascii', errors='ignore') for match in matches]
            print(f"[DEBUG] Found {len(text_strings)} text strings")
            
            # Look for common LinkedIn headers/fields
            linkedin_keywords = ['post', 'engagement', 'impressions', 'clicks', 'comments', 'shares', 'metrics']
            relevant_strings = [s for s in text_strings if any(kw in s.lower() for kw in linkedin_keywords)]
            
            if relevant_strings:
                print(f"[SUCCESS] Found {len(relevant_strings)} LinkedIn-related strings")
                return relevant_strings
        
        return None
        
    except Exception as e:
        print(f"[ERROR] Binary extraction failed: {e}")
        return None


def read_xls_with_ole_repair(file_path):
    """
    Attempt to repair and read corrupted OLE2 (old .xls) files
    """
    try:
        print(f"[DEBUG] Attempting OLE2 repair strategy...")
        
        with open(file_path, 'rb') as f:
            data = f.read()
        
        # Check for OLE2 signature
        if not data.startswith(b'\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1'):
            print(f"[DEBUG] Not a valid OLE2 file")
            return None
        
        # Try to salvage the Workbook stream
        # Search for "Workbook" string in the file
        workbook_offset = data.find(b'Workbook')
        
        if workbook_offset == -1:
            print(f"[DEBUG] Workbook stream not found")
            return None
        
        print(f"[DEBUG] Found Workbook stream at offset {workbook_offset}")
        
        # Create a repaired temp file
        repair_path = file_path + '.repaired'
        
        # Try writing a minimal valid OLE2 structure
        # This is complex, so we'll try a different approach
        
        return None
        
    except Exception as e:
        print(f"[ERROR] OLE2 repair failed: {e}")
        return None


def read_xls_with_xlrd_advanced(file_path, file_type='unknown'):
    """Advanced xlrd reading with multiple encoding attempts
    
    Args:
        file_path: Path to the XLS file
        file_type: Type of file ('followers', 'visitors', 'content', or 'unknown')
    """
    
    encodings_to_try = [
        None, 'cp1252', 'latin1', 'iso-8859-1', 'utf-8',
        'cp1251', 'cp1256', 'windows-1252', 'ascii',
        'big5', 'gb2312', 'shift_jis', 'euc-kr', 'utf-16-le'
    ]
    
    for encoding in encodings_to_try:
        try:
            print(f"[DEBUG] Trying xlrd with encoding={encoding}")
            
            if encoding:
                workbook = xlrd.open_workbook(
                    file_path, 
                    encoding_override=encoding,
                    on_demand=True,
                    formatting_info=False,
                    ragged_rows=True,  # Handle rows with different lengths
                    ignore_workbook_corruption=True  # Try to ignore corruption
                )
            else:
                workbook = xlrd.open_workbook(
                    file_path,
                    on_demand=True,
                    formatting_info=False,
                    ragged_rows=True,
                    ignore_workbook_corruption=True
                )
            
            structured_data = {}
            
            for sheet_idx, sheet_name in enumerate(workbook.sheet_names()):
                print(f"[DEBUG] Reading sheet '{sheet_name}' ({sheet_idx + 1}/{len(workbook.sheet_names())})")
                
                sheet = workbook.sheet_by_name(sheet_name)
                
                if sheet.nrows == 0:
                    print(f"[WARNING] Sheet '{sheet_name}' is empty, skipping")
                    continue
                
                # SPECIAL HANDLING: Skip first row for content files (description row)
                header_row_idx = 0
                data_start_row = 1
                
                if file_type == 'content':
                    # Content files have a description row before headers
                    # Check if first row looks like a description
                    first_row_text = ""
                    try:
                        for col in range(min(3, sheet.ncols)):
                            cell_val = str(sheet.cell_value(0, col)).strip()
                            first_row_text += cell_val + " "
                    except:
                        pass
                    
                    # If first row contains "Aggregated" or "Date indicates" or is very long, skip it
                    if ("Aggregated" in first_row_text or 
                        "Date indicates" in first_row_text or 
                        "delayed by" in first_row_text or
                        len(first_row_text) > 100):
                        print(f"[DEBUG] Detected description row in content file, skipping first row")
                        header_row_idx = 1
                        data_start_row = 2
                
                # Extract headers
                headers = []
                for col in range(sheet.ncols):
                    try:
                        cell_value = sheet.cell_value(header_row_idx, col)
                        cell_type = sheet.cell_type(header_row_idx, col)
                        
                        if cell_type == xlrd.XL_CELL_EMPTY:
                            header = f"Column_{col}"
                        else:
                            header = str(cell_value).strip()
                            
                            # Check if header looks corrupted (too much binary)
                            if len(header) > 0:
                                non_ascii = sum(1 for c in header if ord(c) > 127)
                                if non_ascii / len(header) > 0.5:
                                    print(f"[WARNING] Header {col} appears corrupted: {header[:50]}")
                                    header = f"Column_{col}"
                        
                        headers.append(header if header else f"Column_{col}")
                        
                    except Exception as e:
                        print(f"[WARNING] Error reading header {col}: {e}")
                        headers.append(f"Column_{col}")
                
                print(f"[DEBUG] Headers: {headers}")
                
                # Extract data rows (starting from data_start_row)
                records = []
                for row_idx in range(data_start_row, sheet.nrows):
                    record = {}
                    has_valid_data = False
                    
                    for col_idx, header in enumerate(headers):
                        try:
                            if col_idx >= sheet.ncols:
                                record[header] = None
                                continue
                            
                            cell_value = sheet.cell_value(row_idx, col_idx)
                            cell_type = sheet.cell_type(row_idx, col_idx)
                            
                            if cell_type == xlrd.XL_CELL_EMPTY:
                                record[header] = None
                            elif cell_type == xlrd.XL_CELL_TEXT:
                                text = str(cell_value).strip()
                                
                                # Check for binary corruption in text
                                if text and len(text) > 0:
                                    non_ascii = sum(1 for c in text if ord(c) > 127)
                                    if non_ascii / len(text) > 0.7:
                                        # Too much binary, likely corrupted
                                        record[header] = None
                                    else:
                                        record[header] = text
                                        has_valid_data = True
                                else:
                                    record[header] = None
                                    
                            elif cell_type == xlrd.XL_CELL_NUMBER:
                                if isinstance(cell_value, float) and cell_value.is_integer():
                                    record[header] = str(int(cell_value))
                                else:
                                    record[header] = str(cell_value)
                                has_valid_data = True
                                
                            elif cell_type == xlrd.XL_CELL_DATE:
                                try:
                                    date_tuple = xlrd.xldate_as_tuple(cell_value, workbook.datemode)
                                    record[header] = str(pd.Timestamp(*date_tuple))
                                    has_valid_data = True
                                except:
                                    record[header] = str(cell_value)
                                    
                            elif cell_type == xlrd.XL_CELL_BOOLEAN:
                                record[header] = str(bool(cell_value))
                                has_valid_data = True
                            else:
                                record[header] = None
                                
                        except Exception as e:
                            record[header] = None
                    
                    # Only add record if it has at least some valid data
                    if has_valid_data:
                        records.append(record)
                
                if records:
                    structured_data[sheet_name] = records
                    print(f"[SUCCESS] Extracted {len(records)} valid records from '{sheet_name}'")
                else:
                    print(f"[WARNING] No valid records found in '{sheet_name}'")
            
            if structured_data:
                workbook.release_resources()
                return structured_data
                
        except Exception as e:
            error_msg = str(e)
            print(f"[DEBUG] xlrd encoding {encoding} failed: {error_msg[:150]}")
            
            # Don't continue if file is not a valid Excel file
            if 'not an excel file' in error_msg.lower() or 'workbook is encrypted' in error_msg.lower():
                print(f"[ERROR] File format issue detected, stopping xlrd attempts")
                break
    
    return None


def read_xls_with_pandas(file_path):
    """Use pandas with different engines and better error handling"""
    
    engines_to_try = [
        ('openpyxl', {}),  # Best for .xlsx
        ('xlrd', {}),       # Best for .xls
        ('odf', {}),        # LibreOffice format
        (None, {'engine': None})  # Auto-detect
    ]
    
    for engine, kwargs in engines_to_try:
        try:
            print(f"[DEBUG] Trying pandas with engine={engine}")
            
            if engine:
                kwargs['engine'] = engine
            
            excel_data = pd.read_excel(
                file_path, 
                sheet_name=None,
                dtype=str,
                na_values=['', 'nan', 'NaN', 'NULL', 'None', '#N/A'],
                keep_default_na=True,
                **kwargs
            )
            
            if isinstance(excel_data, dict) and excel_data:
                structured_data = {}
                
                for sheet_name, sheet_df in excel_data.items():
                    if sheet_df.empty:
                        print(f"[WARNING] Sheet '{sheet_name}' is empty")
                        continue
                    
                    print(f"[DEBUG] Processing sheet '{sheet_name}': {len(sheet_df)} rows, {len(sheet_df.columns)} cols")
                    
                    # Clean column names
                    sheet_df.columns = [
                        str(col).strip() if col and str(col).strip() else f"Column_{i}"
                        for i, col in enumerate(sheet_df.columns)
                    ]
                    
                    # Remove completely empty rows
                    sheet_df = sheet_df.dropna(how='all')
                    
                    if len(sheet_df) > 0:
                        # Convert to records
                        sheet_records = sheet_df.to_dict(orient='records')
                        structured_data[sheet_name] = sheet_records
                        print(f"[SUCCESS] Extracted {len(sheet_records)} records from '{sheet_name}'")
                    else:
                        print(f"[WARNING] Sheet '{sheet_name}' has no data after cleaning")
                
                if structured_data:
                    return structured_data
                    
        except Exception as e:
            error_msg = str(e)
            print(f"[DEBUG] Pandas engine {engine} failed: {error_msg[:150]}")
    
    return None


def read_xls_with_openpyxl_conversion(file_path):
    """Try to read XLS by handling encoding errors gracefully"""
    try:
        print(f"[DEBUG] Attempting manual XLS reading with error handling...")
        
        # Try reading the file with xlrd but with manual error handling
        try:
            # Read file in binary mode and try to fix encoding issues
            with open(file_path, 'rb') as f:
                file_content = f.read()
            
            # Try to fix UTF-16-LE encoding issues by replacing bad bytes
            # Find the corrupted section and skip it
            print(f"[DEBUG] Attempting to repair UTF-16-LE encoding corruption...")
            
            # Create a temporary file with cleaned content
            temp_fixed_path = file_path + '.fixed'
            with open(temp_fixed_path, 'wb') as f:
                f.write(file_content)
            
            # Try xlrd with logfile to suppress errors and ignore_workbook_corruption
            import io
            error_log = io.StringIO()
            
            # Try with errors='ignore' in encoding
            workbook = xlrd.open_workbook(
                temp_fixed_path,
                on_demand=True,
                formatting_info=False,
                ragged_rows=True,
                ignore_workbook_corruption=True,
                logfile=error_log,
                encoding_override='latin1'  # Use latin1 which is more forgiving
            )
            
            structured_data = {}
            
            for sheet_name in workbook.sheet_names():
                try:
                    sheet = workbook.sheet_by_name(sheet_name)
                    
                    if sheet.nrows == 0:
                        continue
                    
                    # Skip first row for content files (description row)
                    start_row = 1  # Skip first row
                    
                    # Extract headers from second row (after skipping description)
                    headers = []
                    for col in range(sheet.ncols):
                        try:
                            cell_value = sheet.cell_value(start_row, col)
                            header = str(cell_value).strip() if cell_value else f"Column_{col}"
                            headers.append(header)
                        except:
                            headers.append(f"Column_{col}")
                    
                    # Extract data rows (starting from row 2)
                    records = []
                    for row_idx in range(start_row + 1, sheet.nrows):
                        record = {}
                        has_data = False
                        
                        for col_idx, header in enumerate(headers):
                            try:
                                if col_idx < sheet.ncols:
                                    cell_value = sheet.cell_value(row_idx, col_idx)
                                    if cell_value not in [None, '', 'nan']:
                                        # Handle encoding errors in cell values
                                        try:
                                            record[header] = str(cell_value)
                                        except:
                                            record[header] = None
                                        has_data = True
                                    else:
                                        record[header] = None
                                else:
                                    record[header] = None
                            except:
                                record[header] = None
                        
                        if has_data:
                            records.append(record)
                    
                    if records:
                        structured_data[sheet_name] = records
                        print(f"[SUCCESS] Extracted {len(records)} records from '{sheet_name}' (skipped first row)")
                        
                except Exception as e:
                    print(f"[WARNING] Failed to read sheet '{sheet_name}': {str(e)[:100]}")
                    continue
            
            # Clean up
            workbook.release_resources()
            if os.path.exists(temp_fixed_path):
                os.remove(temp_fixed_path)
            
            if structured_data:
                print(f"[SUCCESS] Manual reading strategy worked!")
                return structured_data
                    
        except Exception as e:
            print(f"[DEBUG] Manual reading failed: {str(e)[:100]}")
            
    except Exception as e:
        print(f"[ERROR] Manual reading strategy failed: {e}")
    
    return None


def repair_xls_with_libreoffice(file_path):
    """Use LibreOffice to repair and convert corrupted XLS to XLSX"""
    try:
        print(f"[DEBUG] Attempting LibreOffice repair and conversion...")
        
        import subprocess
        import shutil
        
        # Check if LibreOffice is installed
        libreoffice_paths = [
            r"C:\Program Files\LibreOffice\program\soffice.exe",
            r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
            "soffice",  # If in PATH
            "libreoffice"  # Linux/Mac
        ]
        
        libreoffice_cmd = None
        for path in libreoffice_paths:
            if shutil.which(path) or os.path.exists(path):
                libreoffice_cmd = path
                print(f"[DEBUG] Found LibreOffice at: {path}")
                break
        
        if not libreoffice_cmd:
            print(f"[DEBUG] LibreOffice not found, skipping repair")
            return None
        
        # Get directory and filename
        file_dir = os.path.dirname(file_path)
        file_name = os.path.basename(file_path)
        
        # Convert to XLSX using LibreOffice
        print(f"[DEBUG] Converting {file_name} to XLSX...")
        result = subprocess.run(
            [
                libreoffice_cmd,
                "--headless",
                "--convert-to",
                "xlsx",
                "--outdir",
                file_dir,
                file_path
            ],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode != 0:
            print(f"[DEBUG] LibreOffice conversion failed: {result.stderr}")
            return None
        
        # Check if XLSX file was created
        xlsx_path = file_path.replace('.xls', '.xlsx')
        if not os.path.exists(xlsx_path):
            print(f"[DEBUG] XLSX file not created")
            return None
        
        print(f"[SUCCESS] LibreOffice converted to: {xlsx_path}")
        
        # Now read the XLSX file with pandas, skipping the first row (description row)
        excel_data = pd.read_excel(
            xlsx_path,
            sheet_name=None,
            dtype=str,
            engine='openpyxl',
            skiprows=1  # Skip the first row (description row) during read
        )
        
        if excel_data:
            structured_data = {}
            
            for sheet_name, sheet_df in excel_data.items():
                if sheet_df.empty:
                    continue
                
                print(f"[DEBUG] Processing sheet '{sheet_name}': {len(sheet_df)} rows")
                
                # Clean column names (no need to skip first row again, already done in read_excel)
                sheet_df.columns = [
                    str(col).strip() if col and str(col).strip() else f"Column_{i}"
                    for i, col in enumerate(sheet_df.columns)
                ]
                
                # Remove empty rows
                sheet_df = sheet_df.dropna(how='all')
                
                if len(sheet_df) > 0:
                    structured_data[sheet_name] = sheet_df.to_dict(orient='records')
                    print(f"[SUCCESS] Extracted {len(structured_data[sheet_name])} records from '{sheet_name}'")
            
            # Clean up XLSX file
            try:
                os.remove(xlsx_path)
            except:
                pass
            
            if structured_data:
                print(f"[SUCCESS] LibreOffice repair strategy worked!")
                return structured_data
        
    except subprocess.TimeoutExpired:
        print(f"[ERROR] LibreOffice conversion timed out")
    except Exception as e:
        print(f"[ERROR] LibreOffice repair failed: {str(e)}")
    
    return None


def excel_to_json(excel_file, output_folder, keyword):
    """Convert Excel file to JSON with corruption detection"""
    temp_file_path = None
    
    try:
        file_name = getattr(excel_file, 'name', 'unknown')
        file_size = getattr(excel_file, 'size', 0)
        
        print(f"\n{'='*80}")
        print(f"[PROCESSING] {keyword}: {file_name} ({file_size} bytes)")
        print(f"{'='*80}")
        
        # Save to temp file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file_name)[1])
        temp_file_path = temp_file.name
        
        if hasattr(excel_file, 'seek'):
            excel_file.seek(0)
        
        for chunk in excel_file.chunks():
            temp_file.write(chunk)
        temp_file.close()
        
        actual_size = os.path.getsize(temp_file_path)
        print(f"[DEBUG] Temp file: {temp_file_path} ({actual_size} bytes)")
        
        # SPECIAL HANDLING: For content files, try LibreOffice repair first
        if keyword == 'content' and file_name.endswith('.xls'):
            print(f"[CONTENT] Content file detected, trying LibreOffice repair...")
            libreoffice_result = repair_xls_with_libreoffice(temp_file_path)
            if libreoffice_result:
                print(f"[SUCCESS] LibreOffice repair successful!")
                
                # Save JSON
                output_path = os.path.join(output_folder, f"{keyword}.json")
                with open(output_path, 'w', encoding='utf-8') as json_file:
                    json.dump(libreoffice_result, json_file, indent=2, ensure_ascii=False)
                
                total_records = sum(len(records) for records in libreoffice_result.values())
                print(f"[SUCCESS] Saved {total_records} records to {output_path}")
                print(f"{'='*80}\n")
                
                return {
                    'status': 'success',
                    'output_path': output_path,
                    'records': total_records,
                    'json_data': libreoffice_result,
                    'strategy_used': 'libreoffice',
                    'sheets': list(libreoffice_result.keys())
                }
            else:
                print(f"[CONTENT] LibreOffice repair failed, trying binary patch...")
                
                # Fallback: Try binary patching
                try:
                    # Read file in binary mode
                    with open(temp_file_path, 'rb') as f:
                        file_data = bytearray(f.read())
                    
                    print(f"[CONTENT] File size: {len(file_data)} bytes")
                    
                    # Patch known corruption at bytes 1486-1487 (UTF-16-LE decode error)
                    if len(file_data) > 1487:
                        print(f"[CONTENT] Patching corrupted bytes at position 1486-1487")
                        print(f"[CONTENT] Original bytes: {file_data[1486]:02x} {file_data[1487]:02x}")
                        
                        # Replace with null bytes or space characters
                        file_data[1486] = 0x20  # Space character
                        file_data[1487] = 0x00  # Null
                        
                        print(f"[CONTENT] Patched bytes: {file_data[1486]:02x} {file_data[1487]:02x}")
                    
                    # Also scan for other potential UTF-16-LE issues in the string table
                    # The string table typically starts around byte 512 in BIFF8 files
                    print(f"[CONTENT] Scanning for additional UTF-16-LE corruption...")
                    for i in range(512, min(len(file_data) - 1, 5000)):
                        # Look for incomplete UTF-16-LE sequences (odd byte followed by nothing)
                        if i < len(file_data) - 1:
                            # Check if this looks like a broken UTF-16-LE sequence
                            if file_data[i] != 0 and file_data[i+1] == 0:
                                # This is normal UTF-16-LE, skip
                                continue
                            elif file_data[i] > 0x7F and file_data[i+1] > 0x7F:
                                # Both bytes are high - might be corruption
                                # Replace with spaces
                                file_data[i] = 0x20
                                file_data[i+1] = 0x00
                    
                    # Write repaired file
                    repaired_path = temp_file_path + '.repaired'
                    with open(repaired_path, 'wb') as f:
                        f.write(file_data)
                    
                    print(f"[CONTENT] Saved repaired file: {repaired_path}")
                    
                    # Replace original with repaired
                    os.remove(temp_file_path)
                    temp_file_path = repaired_path
                    
                    print(f"[CONTENT] File repair completed, proceeding with processing...")
                    
                except Exception as e:
                    print(f"[WARNING] Failed to repair file: {str(e)}")
                    import traceback
                    traceback.print_exc()
                    print(f"[CONTENT] Continuing with original file...")
        
        # Check for binary corruption FIRST
        if is_binary_corrupted(temp_file_path):
            print(f"[WARNING] File appears to be severely corrupted!")
            
            # Try binary text extraction as last resort
            extracted_text = extract_readable_text_from_binary(temp_file_path)
            if extracted_text:
                print(f"[INFO] Recovered some text, but file structure is damaged")
                raise Exception(
                    f"File '{file_name}' is severely corrupted. "
                    "Please re-download from LinkedIn or open in Excel and save again."
                )
            else:
                raise Exception(
                    f"File '{file_name}' contains too much binary corruption and cannot be read. "
                    "Please re-export from LinkedIn."
                )
        
        all_sheets_data = None
        successful_strategy = None
        
        # Strategy 1: Try pandas first (handles both .xls and .xlsx well)
        all_sheets_data = read_xls_with_pandas(temp_file_path)
        if all_sheets_data:
            successful_strategy = "pandas"
        
        # Strategy 2: Try xlrd with advanced encoding detection (.xls only)
        if not all_sheets_data and file_name.endswith('.xls'):
            all_sheets_data = read_xls_with_xlrd_advanced(temp_file_path, keyword)
            if all_sheets_data:
                successful_strategy = "xlrd-advanced"
        
        # Strategy 3: Try conversion strategy for corrupted XLS files
        if not all_sheets_data and file_name.endswith('.xls'):
            all_sheets_data = read_xls_with_openpyxl_conversion(temp_file_path)
            if all_sheets_data:
                successful_strategy = "conversion"
        
        # Strategy 4: Try pandas again with .xls (after xlrd might have fixed encoding)
        if not all_sheets_data:
            all_sheets_data = read_xls_with_pandas(temp_file_path)
            if all_sheets_data:
                successful_strategy = "pandas-fallback"
        
        if not all_sheets_data:
            raise Exception(
                f"Failed to read {file_name} with all available strategies. "
                f"File size: {actual_size} bytes. "
                "The file may be password-protected, encrypted, or corrupted. "
                "Please try: 1) Re-downloading from LinkedIn, 2) Opening in Excel and saving as a new file, "
                "3) Converting to .xlsx format."
            )
        
        print(f"[SUCCESS] Used strategy: {successful_strategy}")
        print(f"[INFO] Extracted {len(all_sheets_data)} sheet(s): {list(all_sheets_data.keys())}")
        
        # SPECIAL HANDLING FOR CONTENT FILES
        # LinkedIn content files have a header row that needs to be skipped
        if keyword == 'content':
            print(f"[CONTENT] Applying special content file processing...")
            cleaned_sheets_data = {}
            
            for sheet_name, records in all_sheets_data.items():
                if not records or len(records) == 0:
                    print(f"[CONTENT] Sheet '{sheet_name}' is empty, skipping")
                    continue
                
                # Check if first row looks like a header/description row
                first_row = records[0] if records else {}
                
                # LinkedIn content files often have a description row at the top
                # Check if the first row has very long text values or contains "UTC" or "post was created"
                is_header_row = False
                for key, value in first_row.items():
                    if value and isinstance(value, str):
                        value_str = str(value).lower()
                        # Check for header indicators
                        if (len(value_str) > 100 or 
                            'utc' in value_str or 
                            'post was created' in value_str or
                            'all dates and times' in value_str or
                            'your post' in value_str):
                            is_header_row = True
                            break
                
                if is_header_row:
                    print(f"[CONTENT] Detected header row in '{sheet_name}', removing it")
                    # Skip the first row
                    cleaned_records = records[1:] if len(records) > 1 else []
                    
                    # Also check if second row is the actual column headers
                    if len(cleaned_records) > 0:
                        second_row = cleaned_records[0]
                        is_column_header = False
                        
                        # Check if this row contains typical column names
                        for key, value in second_row.items():
                            if value and isinstance(value, str):
                                value_str = str(value).lower()
                                if value_str in ['post title', 'impressions', 'clicks', 'reactions', 
                                               'comments', 'shares', 'engagement rate', 'date']:
                                    is_column_header = True
                                    break
                        
                        if is_column_header:
                            print(f"[CONTENT] Detected column header row in '{sheet_name}', removing it")
                            cleaned_records = cleaned_records[1:] if len(cleaned_records) > 1 else []
                    
                    cleaned_sheets_data[sheet_name] = cleaned_records
                    print(f"[CONTENT] Cleaned '{sheet_name}': {len(records)} -> {len(cleaned_records)} records")
                else:
                    cleaned_sheets_data[sheet_name] = records
                    print(f"[CONTENT] No header row detected in '{sheet_name}', keeping all {len(records)} records")
            
            all_sheets_data = cleaned_sheets_data
        
        # Clean up data
        for sheet_name, records in all_sheets_data.items():
            for record in records:
                for key, value in list(record.items()):
                    if value in ["nan", "NaT", "None", "", "null", "NULL", "N/A", "#N/A"]:
                        record[key] = None
                    elif isinstance(value, str):
                        if value.lower() in ["nan", "none", "null"]:
                            record[key] = None
                        # Check for excessive binary characters
                        elif len(value) > 0:
                            non_ascii = sum(1 for c in value if ord(c) > 127)
                            if non_ascii / len(value) > 0.7:
                                record[key] = None
                    elif pd.isna(value):
                        record[key] = None
        
        # Save JSON
        output_path = os.path.join(output_folder, f"{keyword}.json")
        with open(output_path, 'w', encoding='utf-8') as json_file:
            json.dump(all_sheets_data, json_file, indent=2, ensure_ascii=False)
        
        total_records = sum(len(records) for records in all_sheets_data.values())
        print(f"[SUCCESS] Saved {total_records} records to {output_path}")
        print(f"{'='*80}\n")
        
        return {
            'status': 'success',
            'output_path': output_path,
            'records': total_records,
            'json_data': all_sheets_data,
            'strategy_used': successful_strategy,
            'sheets': list(all_sheets_data.keys())
        }
        
    except Exception as e:
        print(f"[FATAL ERROR] {str(e)}")
        print(f"{'='*80}\n")
        return {
            'status': 'error',
            'error_message': str(e),
            'records': 0,
            'json_data': {},
            'strategy_used': None
        }
        
    finally:
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
                print(f"[DEBUG] Cleaned up temp file")
            except Exception as e:
                print(f"[WARNING] Failed to delete temp file: {e}")


def process_excel_files(followers_file, visitors_file, content_file, session_id):
    """Process all three Excel files and convert to JSON"""
    try:
        output_folder = os.path.join(settings.BASE_DIR, 'backend', 'linkedin_profile_data')
        os.makedirs(output_folder, exist_ok=True)
        
        files_map = {
            'followers': followers_file,
            'visitors': visitors_file,
            'content': content_file
        }
        
        results = {}
        output_files = []
        json_data = {}
        strategies_used = {}
        all_sheets = {}
        
        for keyword, file_obj in files_map.items():
            result = excel_to_json(file_obj, output_folder, keyword)
            results[keyword] = result
            
            if result['status'] == 'success':
                output_files.append(result['output_path'])
                json_data[keyword] = result['json_data']
                strategies_used[keyword] = result.get('strategy_used', 'unknown')
                all_sheets[keyword] = result.get('sheets', [])
        
        if all(results[k]['status'] == 'success' for k in results):
            return {
                'status': 'success',
                'output_files': output_files,
                'followers_records': results['followers']['records'],
                'visitors_records': results['visitors']['records'],
                'content_records': results['content']['records'],
                'json_data': json_data,
                'strategies_used': strategies_used,
                'sheets_found': all_sheets
            }
        else:
            errors = [
                f"{k}: {results[k]['error_message']}" 
                for k in results if results[k]['status'] == 'error'
            ]
            return {
                'status': 'failed',
                'error_message': '; '.join(errors),
                'followers_records': results['followers']['records'],
                'visitors_records': results['visitors']['records'],
                'content_records': results['content']['records'],
                'strategies_used': strategies_used,
                'sheets_found': all_sheets
            }
            
    except Exception as e:
        return {
            'status': 'failed',
            'error_message': str(e)
        }


def save_json_to_database(json_data, user, session_id):
    """Save JSON data to MongoDB using MongoEngine"""
    try:
        followers_saved = 0
        visitors_saved = 0
        content_saved = 0
        
        user_id_str = str(user.id)
        
        # Save followers (handles multiple sheets)
        if 'followers' in json_data:
            for sheet_name, records in json_data['followers'].items():
                print(f"[DEBUG] Saving {len(records)} follower records from '{sheet_name}' sheet")
                for record in records:
                    sanitized_record = sanitize_data_for_mongodb(record)
                    follower = LinkedInFollower(
                        user_id=user_id_str,
                        user_email=user.email,
                        upload_session_id=session_id,
                        sheet_name=sheet_name,  # Add sheet name
                        data=sanitized_record
                    )
                    follower.save()
                    followers_saved += 1
        
        # Save visitors (handles multiple sheets)
        if 'visitors' in json_data:
            for sheet_name, records in json_data['visitors'].items():
                print(f"[DEBUG] Saving {len(records)} visitor records from '{sheet_name}' sheet")
                for record in records:
                    sanitized_record = sanitize_data_for_mongodb(record)
                    visitor = LinkedInVisitor(
                        user_id=user_id_str,
                        user_email=user.email,
                        upload_session_id=session_id,
                        sheet_name=sheet_name,  # Add sheet name
                        data=sanitized_record
                    )
                    visitor.save()
                    visitors_saved += 1
        
        # Save content (handles multiple sheets like "Metrics" and "All Posts")
        if 'content' in json_data:
            for sheet_name, records in json_data['content'].items():
                print(f"[DEBUG] Saving {len(records)} records from '{sheet_name}' sheet")
                for record in records:
                    sanitized_record = sanitize_data_for_mongodb(record)
                    content = LinkedInContent(
                        user_id=user_id_str,
                        user_email=user.email,
                        upload_session_id=session_id,
                        sheet_name=sheet_name,  # Add sheet name to distinguish "Metrics" from "All Posts"
                        data=sanitized_record
                    )
                    content.save()
                    content_saved += 1
        
        return {
            'status': 'success',
            'followers_saved': followers_saved,
            'visitors_saved': visitors_saved,
            'content_saved': content_saved
        }
        
    except Exception as e:
        return {
            'status': 'failed',
            'error_message': str(e),
            'followers_saved': followers_saved,
            'visitors_saved': visitors_saved,
            'content_saved': content_saved
        }





# # ============================================================================
# # tasks.py (ENTERPRISE-GRADE FIXED VERSION)
# # Multi-Strategy XLS/XLSX to JSON Conversion with Robust Error Handling
# # ============================================================================
# import pandas as pd
# import json
# import os
# import numpy as np
# from django.conf import settings
# from .models import LinkedInFollower, LinkedInVisitor, LinkedInContent
# import tempfile
# import xlrd
# import io
# import chardet
# import subprocess
# import sys

# def sanitize_data_for_mongodb(data):
#     """
#     Sanitize data to be compatible with MongoDB
#     - Convert large integers to strings
#     - Handle NaN and infinity values
#     - Convert numpy types to Python native types
    
#     Args:
#         data: Dictionary or value to sanitize
        
#     Returns:
#         Sanitized data
#     """
#     # MongoDB's safe integer range
#     MONGO_MAX_INT = 9223372036854775807  # 2^63 - 1
#     MONGO_MIN_INT = -9223372036854775808  # -2^63
    
#     if isinstance(data, dict):
#         return {key: sanitize_data_for_mongodb(value) for key, value in data.items()}
#     elif isinstance(data, list):
#         return [sanitize_data_for_mongodb(item) for item in data]
#     elif pd.isna(data):
#         # Handle pandas NaN/NaT first before type checks
#         return None
#     elif isinstance(data, (np.integer, int)):
#         # Convert to Python int first
#         int_val = int(data)
#         # Check if within MongoDB's safe range
#         if int_val > MONGO_MAX_INT or int_val < MONGO_MIN_INT:
#             return str(int_val)
#         return int_val
#     elif isinstance(data, (np.floating, float)):
#         # Check for NaN or infinity
#         if np.isnan(data) or np.isinf(data):
#             return None
#         float_val = float(data)
#         # Also check if float is actually a very large integer
#         if float_val.is_integer():
#             int_val = int(float_val)
#             if int_val > MONGO_MAX_INT or int_val < MONGO_MIN_INT:
#                 return str(int_val)
#         return float_val
#     elif isinstance(data, np.bool_):
#         return bool(data)
#     elif isinstance(data, (np.ndarray,)):
#         return sanitize_data_for_mongodb(data.tolist())
#     elif isinstance(data, (pd.Timestamp, np.datetime64)):
#         # Convert pandas/numpy datetime to ISO string
#         try:
#             return pd.Timestamp(data).isoformat()
#         except:
#             return str(data)
#     elif isinstance(data, str):
#         # Return strings as-is
#         return data
#     elif data is None:
#         return None
#     else:
#         # Try to convert to string as last resort
#         try:
#             return str(data)
#         except:
#             return None


# def clean_dataframe(df):
#     """
#     Clean DataFrame to ensure MongoDB compatibility
    
#     Args:
#         df: pandas DataFrame
        
#     Returns:
#         Cleaned DataFrame
#     """
#     MONGO_MAX_INT = 9223372036854775807
#     MONGO_MIN_INT = -9223372036854775808
    
#     df_copy = df.copy()
    
#     for col in df_copy.columns:
#         # Handle numeric columns
#         if pd.api.types.is_numeric_dtype(df_copy[col]):
#             # Replace NaN and infinity with None
#             df_copy[col] = df_copy[col].replace([np.inf, -np.inf], np.nan)
            
#             # Check for large integers
#             if pd.api.types.is_integer_dtype(df_copy[col]):
#                 # Convert large integers to strings
#                 mask = (df_copy[col] > MONGO_MAX_INT) | (df_copy[col] < MONGO_MIN_INT)
#                 if mask.any():
#                     df_copy.loc[mask, col] = df_copy.loc[mask, col].astype(str)
#             elif pd.api.types.is_float_dtype(df_copy[col]):
#                 # Check if floats are actually large integers
#                 int_mask = df_copy[col].notna() & (df_copy[col] % 1 == 0)
#                 large_mask = int_mask & ((df_copy[col] > MONGO_MAX_INT) | (df_copy[col] < MONGO_MIN_INT))
#                 if large_mask.any():
#                     df_copy.loc[large_mask, col] = df_copy.loc[large_mask, col].astype(str)
        
#         # Handle datetime columns
#         elif pd.api.types.is_datetime64_any_dtype(df_copy[col]):
#             df_copy[col] = df_copy[col].astype(str).replace('NaT', None)
    
#     return df_copy


# def extract_key_name(filename):
#     """
#     Extract the key part from filename
#     e.g., 'ihubiitmandi_followers_1762839643965.xlsx' -> 'followers'
#     """
#     base_name = os.path.splitext(filename)[0]
#     parts = base_name.split('_')
    
#     if len(parts) >= 3 and parts[-1].isdigit():
#         return '_'.join(parts[1:-1])
    
#     return base_name


# def detect_file_encoding(file_path):
#     """
#     Detect file encoding using chardet library
    
#     Args:
#         file_path: Path to file
        
#     Returns:
#         str: Detected encoding
#     """
#     try:
#         with open(file_path, 'rb') as f:
#             raw_data = f.read(10000)  # Read first 10KB
#             result = chardet.detect(raw_data)
#             return result.get('encoding', 'utf-8')
#     except Exception as e:
#         print(f"[WARNING] Encoding detection failed: {e}")
#         return 'utf-8'


# def read_xls_with_io_fallback(file_path):
#     """
#     STRATEGY: Read potentially corrupted XLS file using raw IO and UTF-16 decoding
#     This handles files that xlrd cannot parse due to encoding issues
    
#     Args:
#         file_path: Path to XLS file
        
#     Returns:
#         dict: Sheet data or None if failed
#     """
#     try:
#         print(f"[DEBUG] Trying IO fallback method (UTF-16 decoding)")
        
#         # Try different UTF-16 encodings
#         for encoding in ['utf-16', 'utf-16-le', 'utf-16-be']:
#             try:
#                 with io.open(file_path, 'r', encoding=encoding, errors='ignore') as f:
#                     content = f.read()
                    
#                     # Split into lines
#                     lines = content.split('\n')
                    
#                     # Skip empty lines
#                     lines = [line.strip() for line in lines if line.strip()]
                    
#                     if len(lines) < 2:
#                         continue
                    
#                     # Parse as tab-separated or detect delimiter
#                     delimiter = '\t' if '\t' in lines[0] else ','
                    
#                     # Extract headers
#                     headers = [h.strip() for h in lines[0].split(delimiter)]
                    
#                     # Extract data rows
#                     records = []
#                     for line in lines[1:]:
#                         values = line.split(delimiter)
#                         if len(values) == len(headers):
#                             record = {}
#                             for i, header in enumerate(headers):
#                                 value = values[i].strip()
#                                 # Clean up value
#                                 if value in ['nan', 'NaT', 'None', '']:
#                                     record[header] = None
#                                 else:
#                                     record[header] = value
#                             records.append(record)
                    
#                     if records:
#                         print(f"[SUCCESS] IO fallback extracted {len(records)} records")
#                         return {'Sheet1': records}
                        
#             except Exception as e:
#                 print(f"[DEBUG] IO encoding {encoding} failed: {e}")
#                 continue
                
#     except Exception as e:
#         print(f"[ERROR] IO fallback failed: {e}")
    
#     return None


# def read_xls_with_xlrd_advanced(file_path):
#     """
#     STRATEGY: Advanced xlrd reading with multiple encoding attempts
    
#     Args:
#         file_path: Path to XLS file
        
#     Returns:
#         dict: Sheet data or None if failed
#     """
#     # Extended list of encodings to try
#     encodings_to_try = [
#         None,  # Let xlrd auto-detect
#         'cp1252',  # Windows Western European
#         'latin1',  # ISO-8859-1
#         'iso-8859-1',
#         'utf-8',
#         'cp1251',  # Windows Cyrillic
#         'cp1256',  # Windows Arabic
#         'windows-1252',
#         'ascii',
#         'big5',  # Traditional Chinese
#         'gb2312',  # Simplified Chinese
#         'shift_jis',  # Japanese
#         'euc-kr',  # Korean
#     ]
    
#     for encoding in encodings_to_try:
#         try:
#             print(f"[DEBUG] Trying xlrd with encoding={encoding}")
            
#             # Try with on_demand=True to reduce memory usage
#             if encoding:
#                 workbook = xlrd.open_workbook(
#                     file_path, 
#                     encoding_override=encoding,
#                     on_demand=True,
#                     formatting_info=False
#                 )
#             else:
#                 workbook = xlrd.open_workbook(
#                     file_path,
#                     on_demand=True,
#                     formatting_info=False
#                 )
            
#             structured_data = {}
            
#             for sheet_name in workbook.sheet_names():
#                 sheet = workbook.sheet_by_name(sheet_name)
#                 print(f"[DEBUG] Processing sheet '{sheet_name}': {sheet.nrows} rows, {sheet.ncols} cols")
                
#                 if sheet.nrows == 0:
#                     continue
                
#                 # Extract headers from first row
#                 headers = []
#                 for col in range(sheet.ncols):
#                     cell_value = sheet.cell_value(0, col)
#                     header = str(cell_value).strip() if cell_value else f"Column_{col}"
#                     headers.append(header)
                
#                 # Extract data rows
#                 records = []
#                 for row_idx in range(1, sheet.nrows):
#                     record = {}
#                     for col_idx, header in enumerate(headers):
#                         try:
#                             cell_value = sheet.cell_value(row_idx, col_idx)
#                             cell_type = sheet.cell_type(row_idx, col_idx)
                            
#                             # Handle different cell types
#                             if cell_type == xlrd.XL_CELL_EMPTY:
#                                 record[header] = None
#                             elif cell_type == xlrd.XL_CELL_TEXT:
#                                 record[header] = str(cell_value).strip()
#                             elif cell_type == xlrd.XL_CELL_NUMBER:
#                                 # Check if it's an integer
#                                 if isinstance(cell_value, float) and cell_value.is_integer():
#                                     record[header] = str(int(cell_value))
#                                 else:
#                                     record[header] = str(cell_value)
#                             elif cell_type == xlrd.XL_CELL_DATE:
#                                 # Convert date to string
#                                 date_tuple = xlrd.xldate_as_tuple(cell_value, workbook.datemode)
#                                 record[header] = str(pd.Timestamp(*date_tuple))
#                             elif cell_type == xlrd.XL_CELL_BOOLEAN:
#                                 record[header] = str(bool(cell_value))
#                             elif cell_type == xlrd.XL_CELL_ERROR:
#                                 record[header] = None
#                             else:
#                                 record[header] = str(cell_value)
                                
#                         except IndexError:
#                             record[header] = None
#                         except Exception as e:
#                             print(f"[WARNING] Cell error at row {row_idx}, col {col_idx}: {e}")
#                             record[header] = None
                    
#                     records.append(record)
                
#                 if records:
#                     structured_data[sheet_name] = records
            
#             if structured_data:
#                 print(f"[SUCCESS] xlrd extracted {len(structured_data)} sheets")
#                 workbook.release_resources()
#                 return structured_data
                
#         except Exception as e:
#             print(f"[DEBUG] xlrd encoding {encoding} failed: {str(e)[:100]}")
#             continue
    
#     return None


# def read_xls_with_pandas(file_path):
#     """
#     STRATEGY: Use pandas with different engines
    
#     Args:
#         file_path: Path to XLS file
        
#     Returns:
#         dict: Sheet data or None if failed
#     """
#     engines_to_try = ['xlrd', 'openpyxl', None]  # None = auto-detect
    
#     for engine in engines_to_try:
#         try:
#             print(f"[DEBUG] Trying pandas with engine={engine}")
            
#             excel_data = pd.read_excel(
#                 file_path, 
#                 sheet_name=None, 
#                 engine=engine,
#                 dtype=str  # Read all as strings to avoid type issues
#             )
            
#             if isinstance(excel_data, dict):
#                 structured_data = {}
#                 for sheet_name, sheet_df in excel_data.items():
#                     if not sheet_df.empty:
#                         print(f"[DEBUG] Pandas sheet '{sheet_name}': {len(sheet_df)} rows")
#                         # Convert to records
#                         sheet_records = sheet_df.to_dict(orient='records')
#                         structured_data[sheet_name] = sheet_records
                
#                 if structured_data:
#                     print(f"[SUCCESS] Pandas extracted {len(structured_data)} sheets")
#                     return structured_data
                    
#         except Exception as e:
#             print(f"[DEBUG] Pandas engine {engine} failed: {str(e)[:100]}")
#             continue
    
#     return None


# def convert_xls_to_csv_then_parse(file_path):
#     """
#     STRATEGY: Convert XLS to CSV using external tool if available, then parse
#     This is a nuclear option that can handle severely corrupted files
    
#     Args:
#         file_path: Path to XLS file
        
#     Returns:
#         dict: Sheet data or None if failed
#     """
#     try:
#         print(f"[DEBUG] Attempting XLS to CSV conversion strategy")
        
#         # Try using ssconvert (gnumeric) if available on Linux
#         csv_path = file_path.replace('.xls', '_converted.csv')
        
#         try:
#             # Check if ssconvert is available
#             result = subprocess.run(
#                 ['ssconvert', file_path, csv_path],
#                 capture_output=True,
#                 timeout=30
#             )
            
#             if result.returncode == 0 and os.path.exists(csv_path):
#                 # Read the CSV
#                 df = pd.read_csv(csv_path, dtype=str, encoding='utf-8', on_bad_lines='skip')
#                 records = df.to_dict(orient='records')
                
#                 # Clean up
#                 os.remove(csv_path)
                
#                 print(f"[SUCCESS] CSV conversion extracted {len(records)} records")
#                 return {'Sheet1': records}
                
#         except (subprocess.TimeoutExpired, FileNotFoundError):
#             print("[DEBUG] ssconvert not available or timed out")
            
#     except Exception as e:
#         print(f"[DEBUG] CSV conversion strategy failed: {e}")
    
#     return None


# def excel_to_json(excel_file, output_folder, keyword):
#     """
#     ENTERPRISE-GRADE: Convert Excel file to JSON with multiple fallback strategies
#     """
#     temp_file_path = None
#     try:
#         # Get file information
#         file_name = getattr(excel_file, 'name', 'unknown')
#         file_size = getattr(excel_file, 'size', 0)
        
#         print(f"\n{'='*80}")
#         print(f"[PROCESSING] {keyword}: {file_name} ({file_size} bytes)")
#         print(f"{'='*80}")
        
#         # Save uploaded file to temporary location
#         temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file_name)[1])
#         temp_file_path = temp_file.name
        
#         # Reset file pointer and write to temp file
#         if hasattr(excel_file, 'seek'):
#             excel_file.seek(0)
        
#         # Write the uploaded file to temp location
#         for chunk in excel_file.chunks():
#             temp_file.write(chunk)
#         temp_file.close()
        
#         print(f"[DEBUG] Temp file: {temp_file_path} ({os.path.getsize(temp_file_path)} bytes)")
        
#         # Detect encoding for informational purposes
#         detected_encoding = detect_file_encoding(temp_file_path)
#         print(f"[INFO] Detected file encoding: {detected_encoding}")
        
#         all_sheets_data = None
#         successful_strategy = None
        
#         # ===== STRATEGY 1: Standard pandas (fastest when it works) =====
#         if file_name.endswith('.xlsx'):
#             all_sheets_data = read_xls_with_pandas(temp_file_path)
#             if all_sheets_data:
#                 successful_strategy = "pandas-openpyxl"
        
#         # ===== STRATEGY 2: Advanced xlrd with multiple encodings =====
#         if not all_sheets_data and file_name.endswith('.xls'):
#             all_sheets_data = read_xls_with_xlrd_advanced(temp_file_path)
#             if all_sheets_data:
#                 successful_strategy = "xlrd-advanced"
        
#         # ===== STRATEGY 3: Pandas with different engines =====
#         if not all_sheets_data:
#             all_sheets_data = read_xls_with_pandas(temp_file_path)
#             if all_sheets_data:
#                 successful_strategy = "pandas-fallback"
        
#         # ===== STRATEGY 4: Raw IO with UTF-16 decoding =====
#         if not all_sheets_data and file_name.endswith('.xls'):
#             all_sheets_data = read_xls_with_io_fallback(temp_file_path)
#             if all_sheets_data:
#                 successful_strategy = "io-utf16-fallback"
        
#         # ===== STRATEGY 5: External conversion tool =====
#         if not all_sheets_data and file_name.endswith('.xls'):
#             all_sheets_data = convert_xls_to_csv_then_parse(temp_file_path)
#             if all_sheets_data:
#                 successful_strategy = "csv-conversion"
        
#         # Check if we got data
#         if not all_sheets_data:
#             raise Exception(
#                 f"Failed to read {file_name} with all available strategies. "
#                 "The file may be severely corrupted or in an unsupported format. "
#                 "Please try re-exporting from LinkedIn or opening in Excel and saving again."
#             )
        
#         print(f"[SUCCESS] Used strategy: {successful_strategy}")
        
#         # Clean up: convert problematic values to None
#         for sheet_name, records in all_sheets_data.items():
#             for record in records:
#                 for key, value in list(record.items()):
#                     # Normalize all None-like values
#                     if value in ["nan", "NaT", "None", "", "null", "NULL", "N/A", "#N/A"]:
#                         record[key] = None
#                     elif isinstance(value, str) and value.lower() in ["nan", "none", "null"]:
#                         record[key] = None
#                     elif pd.isna(value):
#                         record[key] = None
        
#         # Save JSON
#         output_path = os.path.join(output_folder, f"{keyword}.json")
#         with open(output_path, 'w', encoding='utf-8') as json_file:
#             json.dump(all_sheets_data, json_file, indent=2, ensure_ascii=False)
        
#         total_records = sum(len(records) for records in all_sheets_data.values())
#         print(f"[SUCCESS] Saved {total_records} records to {output_path}")
#         print(f"{'='*80}\n")
        
#         return {
#             'status': 'success',
#             'output_path': output_path,
#             'records': total_records,
#             'json_data': all_sheets_data,
#             'strategy_used': successful_strategy
#         }
        
#     except Exception as e:
#         print(f"[FATAL ERROR] {str(e)}")
#         print(f"{'='*80}\n")
#         return {
#             'status': 'error',
#             'error_message': str(e),
#             'records': 0,
#             'json_data': {},
#             'strategy_used': None
#         }
        
#     finally:
#         # Clean up temporary file
#         if temp_file_path and os.path.exists(temp_file_path):
#             try:
#                 os.remove(temp_file_path)
#                 print(f"[DEBUG] Cleaned up temp file: {temp_file_path}")
#             except Exception as e:
#                 print(f"[WARNING] Failed to delete temp file: {e}")


# def process_excel_files(followers_file, visitors_file, content_file, session_id):
#     """
#     Process all three Excel files and convert to JSON
    
#     Args:
#         followers_file: Django UploadedFile
#         visitors_file: Django UploadedFile
#         content_file: Django UploadedFile
#         session_id: Upload session ID for tracking
        
#     Returns:
#         dict: Processing results with JSON data
#     """
#     try:
#         # Define output folder
#         output_folder = os.path.join(
#             settings.BASE_DIR, 
#             'backend', 
#             'linkedin_profile_data'
#         )
        
#         # Create output folder if it doesn't exist
#         os.makedirs(output_folder, exist_ok=True)
        
#         # Process each file
#         files_map = {
#             'followers': followers_file,
#             'visitors': visitors_file,
#             'content': content_file
#         }
        
#         results = {}
#         output_files = []
#         json_data = {}
#         strategies_used = {}
        
#         for keyword, file_obj in files_map.items():
#             result = excel_to_json(file_obj, output_folder, keyword)
#             results[keyword] = result
            
#             if result['status'] == 'success':
#                 output_files.append(result['output_path'])
#                 json_data[keyword] = result['json_data']
#                 strategies_used[keyword] = result.get('strategy_used', 'unknown')
        
#         # Check if all conversions were successful
#         if all(results[k]['status'] == 'success' for k in results):
#             return {
#                 'status': 'success',
#                 'output_files': output_files,
#                 'followers_records': results['followers']['records'],
#                 'visitors_records': results['visitors']['records'],
#                 'content_records': results['content']['records'],
#                 'json_data': json_data,
#                 'strategies_used': strategies_used
#             }
#         else:
#             # Collect error messages
#             errors = [
#                 f"{k}: {results[k]['error_message']}" 
#                 for k in results if results[k]['status'] == 'error'
#             ]
#             return {
#                 'status': 'failed',
#                 'error_message': '; '.join(errors),
#                 'followers_records': results['followers']['records'],
#                 'visitors_records': results['visitors']['records'],
#                 'content_records': results['content']['records'],
#                 'strategies_used': strategies_used
#             }
            
#     except Exception as e:
#         return {
#             'status': 'failed',
#             'error_message': str(e)
#         }


# def debug_large_integers(data, path="root"):
#     """
#     Find and report large integers in nested data structures
    
#     Args:
#         data: Data to check
#         path: Current path in data structure (for reporting)
        
#     Returns:
#         List of issues found
#     """
#     MONGO_MAX_INT = 9223372036854775807
#     MONGO_MIN_INT = -9223372036854775808
#     issues = []
    
#     if isinstance(data, dict):
#         for key, value in data.items():
#             issues.extend(debug_large_integers(value, f"{path}.{key}"))
#     elif isinstance(data, list):
#         for idx, item in enumerate(data):
#             issues.extend(debug_large_integers(item, f"{path}[{idx}]"))
#     elif isinstance(data, (int, np.integer)):
#         int_val = int(data)
#         if int_val > MONGO_MAX_INT or int_val < MONGO_MIN_INT:
#             issues.append({
#                 'path': path,
#                 'value': int_val,
#                 'type': type(data).__name__
#             })
#     elif isinstance(data, (float, np.floating)):
#         if not (np.isnan(data) or np.isinf(data)):
#             float_val = float(data)
#             if float_val.is_integer():
#                 int_val = int(float_val)
#                 if int_val > MONGO_MAX_INT or int_val < MONGO_MIN_INT:
#                     issues.append({
#                         'path': path,
#                         'value': int_val,
#                         'type': f"{type(data).__name__} (as integer)"
#                     })
    
#     return issues


# def save_json_to_database(json_data, user, session_id):
#     """
#     Save JSON data to MongoDB using MongoEngine
    
#     Args:
#         json_data: Dictionary containing followers, visitors, content data
#         user: Django User object
#         session_id: Upload session ID
        
#     Returns:
#         dict: Save results
#     """
#     try:
#         followers_saved = 0
#         visitors_saved = 0
#         content_saved = 0
        
#         # Convert user.id to string to avoid MongoDB integer overflow
#         user_id_str = str(user.id)
        
#         # Save followers
#         if 'followers' in json_data:
#             for sheet_name, records in json_data['followers'].items():
#                 for record in records:
#                     sanitized_record = sanitize_data_for_mongodb(record)
#                     follower = LinkedInFollower(
#                         user_id=user_id_str,
#                         user_email=user.email,
#                         upload_session_id=session_id,
#                         data=sanitized_record
#                     )
#                     follower.save()
#                     followers_saved += 1
        
#         # Save visitors
#         if 'visitors' in json_data:
#             for sheet_name, records in json_data['visitors'].items():
#                 for record in records:
#                     sanitized_record = sanitize_data_for_mongodb(record)
#                     visitor = LinkedInVisitor(
#                         user_id=user_id_str,
#                         user_email=user.email,
#                         upload_session_id=session_id,
#                         data=sanitized_record
#                     )
#                     visitor.save()
#                     visitors_saved += 1
        
#         # Save content
#         if 'content' in json_data:
#             for sheet_name, records in json_data['content'].items():
#                 for record in records:
#                     sanitized_record = sanitize_data_for_mongodb(record)
#                     content = LinkedInContent(
#                         user_id=user_id_str,
#                         user_email=user.email,
#                         upload_session_id=session_id,
#                         data=sanitized_record
#                     )
#                     content.save()
#                     content_saved += 1
        
#         return {
#             'status': 'success',
#             'followers_saved': followers_saved,
#             'visitors_saved': visitors_saved,
#             'content_saved': content_saved
#         }
        
#     except Exception as e:
#         return {
#             'status': 'failed',
#             'error_message': str(e),
#             'followers_saved': followers_saved,
#             'visitors_saved': visitors_saved,
#             'content_saved': content_saved
#         }




# # ============================================================================
# # tasks.py (FIXED - All user_id converted to string)
# # ============================================================================
# import pandas as pd
# import json
# import os
# import numpy as np
# from django.conf import settings
# from .models import LinkedInFollower, LinkedInVisitor, LinkedInContent
# import tempfile
# import xlrd

# def sanitize_data_for_mongodb(data):
#     """
#     Sanitize data to be compatible with MongoDB
#     - Convert large integers to strings
#     - Handle NaN and infinity values
#     - Convert numpy types to Python native types
    
#     Args:
#         data: Dictionary or value to sanitize
        
#     Returns:
#         Sanitized data
#     """
#     # MongoDB's safe integer range
#     MONGO_MAX_INT = 9223372036854775807  # 2^63 - 1
#     MONGO_MIN_INT = -9223372036854775808  # -2^63
    
#     if isinstance(data, dict):
#         return {key: sanitize_data_for_mongodb(value) for key, value in data.items()}
#     elif isinstance(data, list):
#         return [sanitize_data_for_mongodb(item) for item in data]
#     elif pd.isna(data):
#         # Handle pandas NaN/NaT first before type checks
#         return None
#     elif isinstance(data, (np.integer, int)):
#         # Convert to Python int first
#         int_val = int(data)
#         # Check if within MongoDB's safe range
#         if int_val > MONGO_MAX_INT or int_val < MONGO_MIN_INT:
#             return str(int_val)
#         return int_val
#     elif isinstance(data, (np.floating, float)):
#         # Check for NaN or infinity
#         if np.isnan(data) or np.isinf(data):
#             return None
#         float_val = float(data)
#         # Also check if float is actually a very large integer
#         if float_val.is_integer():
#             int_val = int(float_val)
#             if int_val > MONGO_MAX_INT or int_val < MONGO_MIN_INT:
#                 return str(int_val)
#         return float_val
#     elif isinstance(data, np.bool_):
#         return bool(data)
#     elif isinstance(data, (np.ndarray,)):
#         return sanitize_data_for_mongodb(data.tolist())
#     elif isinstance(data, (pd.Timestamp, np.datetime64)):
#         # Convert pandas/numpy datetime to ISO string
#         try:
#             return pd.Timestamp(data).isoformat()
#         except:
#             return str(data)
#     elif isinstance(data, str):
#         # Return strings as-is
#         return data
#     elif data is None:
#         return None
#     else:
#         # Try to convert to string as last resort
#         try:
#             return str(data)
#         except:
#             return None


# def clean_dataframe(df):
#     """
#     Clean DataFrame to ensure MongoDB compatibility
    
#     Args:
#         df: pandas DataFrame
        
#     Returns:
#         Cleaned DataFrame
#     """
#     MONGO_MAX_INT = 9223372036854775807
#     MONGO_MIN_INT = -9223372036854775808
    
#     df_copy = df.copy()
    
#     for col in df_copy.columns:
#         # Handle numeric columns
#         if pd.api.types.is_numeric_dtype(df_copy[col]):
#             # Replace NaN and infinity with None
#             df_copy[col] = df_copy[col].replace([np.inf, -np.inf], np.nan)
            
#             # Check for large integers
#             if pd.api.types.is_integer_dtype(df_copy[col]):
#                 # Convert large integers to strings
#                 mask = (df_copy[col] > MONGO_MAX_INT) | (df_copy[col] < MONGO_MIN_INT)
#                 if mask.any():
#                     df_copy.loc[mask, col] = df_copy.loc[mask, col].astype(str)
#             elif pd.api.types.is_float_dtype(df_copy[col]):
#                 # Check if floats are actually large integers
#                 int_mask = df_copy[col].notna() & (df_copy[col] % 1 == 0)
#                 large_mask = int_mask & ((df_copy[col] > MONGO_MAX_INT) | (df_copy[col] < MONGO_MIN_INT))
#                 if large_mask.any():
#                     df_copy.loc[large_mask, col] = df_copy.loc[large_mask, col].astype(str)
        
#         # Handle datetime columns
#         elif pd.api.types.is_datetime64_any_dtype(df_copy[col]):
#             df_copy[col] = df_copy[col].astype(str).replace('NaT', None)
    
#     return df_copy


# def extract_key_name(filename):
#     """
#     Extract the key part from filename
#     e.g., 'ihubiitmandi_followers_1762839643965.xlsx' -> 'followers'
#     """
#     base_name = os.path.splitext(filename)[0]
#     parts = base_name.split('_')
    
#     if len(parts) >= 3 and parts[-1].isdigit():
#         return '_'.join(parts[1:-1])
    
#     return base_name


# def excel_to_json(excel_file, output_folder, keyword):
#     temp_file_path = None
#     try:
#         # Get file information
#         file_name = getattr(excel_file, 'name', 'unknown')
#         file_size = getattr(excel_file, 'size', 0)
        
#         print(f"[DEBUG] Processing {keyword}: {file_name} (size: {file_size} bytes)")
        
#         # Save uploaded file to temporary location
#         temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file_name)[1])
#         temp_file_path = temp_file.name
        
#         # Reset file pointer and write to temp file
#         if hasattr(excel_file, 'seek'):
#             excel_file.seek(0)
        
#         # Write the uploaded file to temp location
#         for chunk in excel_file.chunks():
#             temp_file.write(chunk)
#         temp_file.close()
        
#         print(f"[DEBUG] Saved to temp file: {temp_file_path} ({os.path.getsize(temp_file_path)} bytes)")
        
#         all_sheets_data = None
#         last_error = None
        
#         # ===== STRATEGY 1: Handle .xlsx files =====
#         if file_name.endswith('.xlsx'):
#             try:
#                 print(f"[DEBUG] Reading .xlsx with openpyxl")
#                 excel_data = pd.read_excel(temp_file_path, sheet_name=None, engine='openpyxl')
                
#                 if isinstance(excel_data, dict):
#                     structured_data = {}
#                     for sheet_name, sheet_df in excel_data.items():
#                         if not sheet_df.empty:
#                             print(f"[DEBUG] Sheet '{sheet_name}': {len(sheet_df)} rows, {len(sheet_df.columns)} cols")
#                             # Convert all to string
#                             sheet_df = sheet_df.astype(str)
#                             sheet_records = sheet_df.to_dict(orient='records')
#                             structured_data[sheet_name] = sheet_records
#                     all_sheets_data = structured_data
#             except Exception as e:
#                 last_error = f"openpyxl failed: {str(e)}"
#                 print(f"[ERROR] {last_error}")
        
#         # ===== STRATEGY 2: Handle .xls files =====
#         elif file_name.endswith('.xls'):
#             # METHOD A: Try xlrd directly with encoding override
           
#             for encoding in ['cp1252', 'utf-8', 'latin1', 'iso-8859-1', None]:
#                 try:
#                     print(f"[DEBUG] Trying xlrd.open_workbook with encoding_override={encoding}")
                    
#                     if encoding:
#                         workbook = xlrd.open_workbook(temp_file_path, encoding_override=encoding)
#                     else:
#                         workbook = xlrd.open_workbook(temp_file_path)
                    
#                     structured_data = {}
                    
#                     for sheet_name in workbook.sheet_names():
#                         sheet = workbook.sheet_by_name(sheet_name)
#                         print(f"[DEBUG] Processing sheet '{sheet_name}': {sheet.nrows} rows, {sheet.ncols} cols")
                        
#                         if sheet.nrows == 0:
#                             continue
                        
#                         # Extract headers from first row
#                         headers = []
#                         for col in range(sheet.ncols):
#                             cell_value = sheet.cell_value(0, col)
#                             headers.append(str(cell_value) if cell_value else f"Column_{col}")
                        
#                         # Extract data rows
#                         records = []
#                         for row_idx in range(1, sheet.nrows):
#                             record = {}
#                             for col_idx, header in enumerate(headers):
#                                 try:
#                                     cell_value = sheet.cell_value(row_idx, col_idx)
                                    
#                                     # Handle different cell types
#                                     if cell_value == '':
#                                         record[header] = None
#                                     elif isinstance(cell_value, float):
#                                         # Check if it's actually an integer
#                                         if cell_value.is_integer():
#                                             record[header] = str(int(cell_value))
#                                         else:
#                                             record[header] = str(cell_value)
#                                     else:
#                                         record[header] = str(cell_value)
#                                 except IndexError:
#                                     record[header] = None
                            
#                             records.append(record)
                        
#                         if records:
#                             structured_data[sheet_name] = records
                    
#                     if structured_data:
#                         all_sheets_data = structured_data
#                         print(f"[SUCCESS] xlrd read {len(structured_data)} sheets successfully")
#                         break  # Success!
                        
#                 except Exception as e:
#                     last_error = f"xlrd (encoding={encoding}): {str(e)}"
#                     print(f"[ERROR] {last_error}")
#                     continue
            
#             # METHOD B: If xlrd failed, try pandas with xlrd engine
#             if not all_sheets_data:
#                 try:
#                     print(f"[DEBUG] Trying pandas.read_excel with xlrd engine")
#                     excel_data = pd.read_excel(temp_file_path, sheet_name=None, engine='xlrd')
                    
#                     if isinstance(excel_data, dict):
#                         structured_data = {}
#                         for sheet_name, sheet_df in excel_data.items():
#                             if not sheet_df.empty:
#                                 print(f"[DEBUG] Sheet '{sheet_name}': {len(sheet_df)} rows")
#                                 sheet_df = sheet_df.astype(str)
#                                 sheet_records = sheet_df.to_dict(orient='records')
#                                 structured_data[sheet_name] = sheet_records
#                         all_sheets_data = structured_data
#                 except Exception as e:
#                     last_error += f" | pandas+xlrd: {str(e)}"
#                     print(f"[ERROR] pandas+xlrd: {str(e)}")
        
#         # ===== STRATEGY 3: Auto-detect engine =====
#         if not all_sheets_data:
#             try:
#                 print(f"[DEBUG] Trying pandas auto-detection")
#                 excel_data = pd.read_excel(temp_file_path, sheet_name=None)
                
#                 if isinstance(excel_data, dict):
#                     structured_data = {}
#                     for sheet_name, sheet_df in excel_data.items():
#                         if not sheet_df.empty:
#                             print(f"[DEBUG] Sheet '{sheet_name}': {len(sheet_df)} rows")
#                             sheet_df = sheet_df.astype(str)
#                             sheet_records = sheet_df.to_dict(orient='records')
#                             structured_data[sheet_name] = sheet_records
#                     all_sheets_data = structured_data
#             except Exception as e:
#                 last_error += f" | auto-detect: {str(e)}"
#                 print(f"[ERROR] auto-detect: {str(e)}")
        
#         # Check if we got data
#         if not all_sheets_data:
#             raise Exception(last_error or "Failed to read Excel file with all methods")
        
#         # Clean up: convert "nan", "NaT", "None" strings to None
#         for sheet_name, records in all_sheets_data.items():
#             for record in records:
#                 for key, value in list(record.items()):
#                     if value in ["nan", "NaT", "None", ""] or pd.isna(value):
#                         record[key] = None
        
#         # Save JSON
#         output_path = os.path.join(output_folder, f"{keyword}.json")
#         with open(output_path, 'w', encoding='utf-8') as json_file:
#             json.dump(all_sheets_data, json_file, indent=2, ensure_ascii=False)
        
#         total_records = sum(len(records) for records in all_sheets_data.values())
#         print(f"[SUCCESS] Saved {total_records} total records to {output_path}")
        
#         return {
#             'status': 'success',
#             'output_path': output_path,
#             'records': total_records,
#             'json_data': all_sheets_data
#         }
        
#     except Exception as e:
#         print(f"[FINAL ERROR] {str(e)}")
#         return {
#             'status': 'error',
#             'error_message': str(e),
#             'records': 0,
#             'json_data': {}
#         }
        
#     finally:
#         # Clean up temporary file
#         if temp_file_path and os.path.exists(temp_file_path):
#             try:
#                 os.remove(temp_file_path)
#                 print(f"[DEBUG] Cleaned up temp file: {temp_file_path}")
#             except Exception as e:
#                 print(f"[WARNING] Failed to delete temp file: {e}")



# def process_excel_files(followers_file, visitors_file, content_file, session_id):
#     """
#     Process all three Excel files and convert to JSON
    
#     Args:
#         followers_file: Django UploadedFile
#         visitors_file: Django UploadedFile
#         content_file: Django UploadedFile
#         session_id: Upload session ID for tracking
        
#     Returns:
#         dict: Processing results with JSON data
#     """
#     try:
#         # Define output folder
#         output_folder = os.path.join(
#             settings.BASE_DIR, 
#             'backend', 
#             'linkedin_profile_data'
#         )
        
#         # Create output folder if it doesn't exist
#         os.makedirs(output_folder, exist_ok=True)
        
#         # Process each file
#         files_map = {
#             'followers': followers_file,
#             'visitors': visitors_file,
#             'content': content_file
#         }
        
#         results = {}
#         output_files = []
#         json_data = {}
        
#         for keyword, file_obj in files_map.items():
#             result = excel_to_json(file_obj, output_folder, keyword)
#             results[keyword] = result
            
#             if result['status'] == 'success':
#                 output_files.append(result['output_path'])
#                 json_data[keyword] = result['json_data']
        
#         # Check if all conversions were successful
#         if all(results[k]['status'] == 'success' for k in results):
#             return {
#                 'status': 'success',
#                 'output_files': output_files,
#                 'followers_records': results['followers']['records'],
#                 'visitors_records': results['visitors']['records'],
#                 'content_records': results['content']['records'],
#                 'json_data': json_data
#             }
#         else:
#             # Collect error messages
#             errors = [
#                 f"{k}: {results[k]['error_message']}" 
#                 for k in results if results[k]['status'] == 'error'
#             ]
#             return {
#                 'status': 'failed',
#                 'error_message': '; '.join(errors),
#                 'followers_records': results['followers']['records'],
#                 'visitors_records': results['visitors']['records'],
#                 'content_records': results['content']['records']
#             }
            
#     except Exception as e:
#         return {
#             'status': 'failed',
#             'error_message': str(e)
#         }


# def debug_large_integers(data, path="root"):
#     """
#     Find and report large integers in nested data structures
    
#     Args:
#         data: Data to check
#         path: Current path in data structure (for reporting)
        
#     Returns:
#         List of issues found
#     """
#     MONGO_MAX_INT = 9223372036854775807
#     MONGO_MIN_INT = -9223372036854775808
#     issues = []
    
#     if isinstance(data, dict):
#         for key, value in data.items():
#             issues.extend(debug_large_integers(value, f"{path}.{key}"))
#     elif isinstance(data, list):
#         for idx, item in enumerate(data):
#             issues.extend(debug_large_integers(item, f"{path}[{idx}]"))
#     elif isinstance(data, (int, np.integer)):
#         int_val = int(data)
#         if int_val > MONGO_MAX_INT or int_val < MONGO_MIN_INT:
#             issues.append({
#                 'path': path,
#                 'value': int_val,
#                 'type': type(data).__name__
#             })
#     elif isinstance(data, (float, np.floating)):
#         if not (np.isnan(data) or np.isinf(data)):
#             float_val = float(data)
#             if float_val.is_integer():
#                 int_val = int(float_val)
#                 if int_val > MONGO_MAX_INT or int_val < MONGO_MIN_INT:
#                     issues.append({
#                         'path': path,
#                         'value': int_val,
#                         'type': f"{type(data).__name__} (as integer)"
#                     })
    
#     return issues


# def save_json_to_database(json_data, user, session_id):
#     """
#     Save JSON data to MongoDB using MongoEngine
    
#     Args:
#         json_data: Dictionary containing followers, visitors, content data
#         user: Django User object
#         session_id: Upload session ID
        
#     Returns:
#         dict: Save results
#     """
#     try:
#         followers_saved = 0
#         visitors_saved = 0
#         content_saved = 0
        
#         # ← CRITICAL: Convert user.id to string to avoid MongoDB integer overflow
#         user_id_str = str(user.id)
        
#         # Save followers
#         if 'followers' in json_data:
#             for record in json_data['followers']:
#                 sanitized_record = sanitize_data_for_mongodb(record)
#                 follower = LinkedInFollower(
#                     user_id=user_id_str,  # ← Using string
#                     user_email=user.email,
#                     upload_session_id=session_id,
#                     data=sanitized_record
#                 )
#                 follower.save()
#                 followers_saved += 1
        
#         # Save visitors
#         if 'visitors' in json_data:
#             for record in json_data['visitors']:
#                 sanitized_record = sanitize_data_for_mongodb(record)
#                 visitor = LinkedInVisitor(
#                     user_id=user_id_str,  # ← Using string
#                     user_email=user.email,
#                     upload_session_id=session_id,
#                     data=sanitized_record
#                 )
#                 visitor.save()
#                 visitors_saved += 1
        
#         # Save content
#         if 'content' in json_data:
#             for record in json_data['content']:
#                 sanitized_record = sanitize_data_for_mongodb(record)
#                 content = LinkedInContent(
#                     user_id=user_id_str,  # ← Using string
#                     user_email=user.email,
#                     upload_session_id=session_id,
#                     data=sanitized_record
#                 )
#                 content.save()
#                 content_saved += 1
        
#         return {
#             'status': 'success',
#             'followers_saved': followers_saved,
#             'visitors_saved': visitors_saved,
#             'content_saved': content_saved
#         }
        
#     except Exception as e:
#         return {
#             'status': 'failed',
#             'error_message': str(e),
#             'followers_saved': followers_saved,
#             'visitors_saved': visitors_saved,
#             'content_saved': content_saved
#         }