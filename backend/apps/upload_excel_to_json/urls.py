# ============================================================================
# urls.py
# ============================================================================
from django.urls import path
from .views import (
    ExcelUploadView, 
    ExcelUploadLogListView, 
    ExcelUploadLogDetailView,
    LinkedInDataView
)
from .incremental_upload_views import (
    IncrementalExcelUploadView,
    ExistingDateRangesView
)

app_name = 'upload_excel_to_json'

urlpatterns = [
    path('upload/', ExcelUploadView.as_view(), name='upload-excel'),
    path('upload-incremental/', IncrementalExcelUploadView.as_view(), name='upload-incremental'),
    path('existing-date-ranges/', ExistingDateRangesView.as_view(), name='existing-date-ranges'),
    path('logs/', ExcelUploadLogListView.as_view(), name='upload-logs'),
    path('logs/<int:log_id>/', ExcelUploadLogDetailView.as_view(), name='upload-log-detail'),
    path('data/', LinkedInDataView.as_view(), name='linkedin-data-all'),
    path('data/<str:session_id>/', LinkedInDataView.as_view(), name='linkedin-data-session'),
]
