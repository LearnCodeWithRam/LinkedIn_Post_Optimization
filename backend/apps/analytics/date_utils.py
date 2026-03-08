"""
Enhanced Date Filtering Utilities for LinkedIn Analytics
Provides robust date parsing, validation, and filtering capabilities
"""
from datetime import datetime, timedelta
from typing import Optional, Tuple, List


class DateFilterUtils:
    """Utility class for date filtering operations"""
    
    # Supported date formats in order of preference
    DATE_FORMATS = [
        '%Y-%m-%d',          # 2024-12-05
        '%m/%d/%Y',          # 12/05/2024
        '%d/%m/%Y',          # 05/12/2024
        '%Y/%m/%d',          # 2024/12/05
        '%d-%m-%Y',          # 05-12-2024
        '%m-%d-%Y',          # 12-05-2024
        '%B %d, %Y',         # December 05, 2024
        '%b %d, %Y',         # Dec 05, 2024
        '%d %B %Y',          # 05 December 2024
        '%d %b %Y',          # 05 Dec 2024
    ]
    
    @staticmethod
    def parse_date(date_str: str) -> Optional[datetime]:
        """
        Parse date string using multiple format attempts
        
        Args:
            date_str: Date string to parse
            
        Returns:
            datetime object or None if parsing fails
        """
        if not date_str or not isinstance(date_str, str):
            return None
        
        date_str = date_str.strip()
        
        # Try each format
        for fmt in DateFilterUtils.DATE_FORMATS:
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:
                continue
        
        # If all formats fail, return None
        return None
    
    @staticmethod
    def validate_date_range(start_date: Optional[datetime], end_date: Optional[datetime]) -> Tuple[bool, str]:
        """
        Validate date range
        
        Args:
            start_date: Start date
            end_date: End date
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        if start_date and end_date:
            if start_date > end_date:
                return False, "Start date must be before or equal to end date"
            
            # Check if range is too large (e.g., more than 2 years)
            if (end_date - start_date).days > 730:
                return False, "Date range cannot exceed 2 years"
        
        # Check if dates are in the future
        today = datetime.now()
        if start_date and start_date > today:
            return False, "Start date cannot be in the future"
        if end_date and end_date > today:
            return False, "End date cannot be in the future"
        
        return True, ""
    
    @staticmethod
    def is_date_in_range(date_str: str, start_date: Optional[datetime], end_date: Optional[datetime]) -> bool:
        """
        Check if a date string falls within the specified range
        
        Args:
            date_str: Date string to check
            start_date: Start of range (inclusive)
            end_date: End of range (inclusive)
            
        Returns:
            True if date is in range, False otherwise
        """
        if not start_date and not end_date:
            return True  # No filter applied
        
        record_date = DateFilterUtils.parse_date(date_str)
        if not record_date:
            return False  # Can't parse date, exclude it
        
        # Normalize to date only (ignore time)
        record_date = record_date.replace(hour=0, minute=0, second=0, microsecond=0)
        
        if start_date:
            start_date_normalized = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
            if record_date < start_date_normalized:
                return False
        
        if end_date:
            end_date_normalized = end_date.replace(hour=23, minute=59, second=59, microsecond=999999)
            if record_date > end_date_normalized:
                return False
        
        return True
    
    @staticmethod
    def get_date_range_stats(dates: List[str]) -> dict:
        """
        Get statistics about a list of dates
        
        Args:
            dates: List of date strings
            
        Returns:
            Dictionary with min_date, max_date, total_days, valid_count
        """
        parsed_dates = []
        for date_str in dates:
            parsed = DateFilterUtils.parse_date(date_str)
            if parsed:
                parsed_dates.append(parsed)
        
        if not parsed_dates:
            return {
                'min_date': None,
                'max_date': None,
                'total_days': 0,
                'valid_count': 0,
                'invalid_count': len(dates)
            }
        
        min_date = min(parsed_dates)
        max_date = max(parsed_dates)
        total_days = (max_date - min_date).days + 1
        
        return {
            'min_date': min_date.strftime('%Y-%m-%d'),
            'max_date': max_date.strftime('%Y-%m-%d'),
            'total_days': total_days,
            'valid_count': len(parsed_dates),
            'invalid_count': len(dates) - len(parsed_dates)
        }
    
    @staticmethod
    def format_date_for_display(date: datetime) -> str:
        """Format date for user-friendly display"""
        return date.strftime('%B %d, %Y')  # e.g., "December 05, 2024"
    
    @staticmethod
    def get_common_date_ranges() -> dict:
        """
        Get common date range presets (for reference/documentation)
        Note: Frontend now uses custom date pickers only
        """
        today = datetime.now()
        return {
            'today': (today, today),
            'yesterday': (today - timedelta(days=1), today - timedelta(days=1)),
            'last_7_days': (today - timedelta(days=7), today),
            'last_30_days': (today - timedelta(days=30), today),
            'last_90_days': (today - timedelta(days=90), today),
            'this_month': (datetime(today.year, today.month, 1), today),
            'last_month': (
                datetime(today.year if today.month > 1 else today.year - 1, 
                        (today.month - 1) if today.month > 1 else 12, 1),
                datetime(today.year, today.month, 1) - timedelta(days=1)
            ),
            'this_year': (datetime(today.year, 1, 1), today),
        }
