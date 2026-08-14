from django.urls import path
from mainapp import views

# views

urlpatterns = [
    path('', views.home, name='home'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('api/reminder/create/', views.create_reminder, name='create_reminder'),
    path('profile/create/', views.create_profile, name='create_profile'),
    
    path('profile/edit/', views.edit_profile, name='edit_profile'),
    path('profile/', views.profile, name='profile'),
    path('api/chat/create/', views.create_chat, name='create_chat'),
    path('api/chat/save/', views.save_message, name='save_message'),
    path('api/chat/get-messages/', views.get_chat_messages, name='get_chat_messages'),
    path('api/user/profile/', views.get_user_profile, name='get_user_profile'),
    path('api/profile/', views.get_user_profile_api, name='get_user_profile_api'),
    path('settings/', views.user_settings, name='settings'),
    path('settings/change-email/', views.change_email, name='change_email'),
    path('settings/change-password/', views.change_password, name='change_password'),
    path('settings/export-data/', views.export_data, name='export_data'),
    path('settings/save-privacy/', views.save_privacy_settings, name='save_privacy_settings'),
    path('settings/delete-account/', views.delete_account, name='delete_account'),
    path('settings/get-privacy-settings/', views.get_privacy_settings, name='get_privacy_settings'),
    path('settings/cancel-email-change/', views.cancel_email_change, name='cancel_email_change'),
    path('settings/check-pending-email/', views.check_pending_email, name='check_pending_email'),
    path('settings/verify-email-change/<str:token>/', views.verify_email_change, name='verify_email_change'),
    path('settings/get-settings/', views.get_settings, name='get_settings'),
    path('settings/download-export/<str:token>/', views.download_export, name='download_export'),
    path('settings/download-export-file/<str:token>/', views.download_export_file, name='download_export_file'),
    path('settings/check-exports/', views.check_exports, name='check_exports'),
    path('settings/save-appearance/', views.save_appearance_settings, name='save_appearance_settings'),
    path('settings/clear-all-chat/', views.clear_all_chat, name='clear_all_chat'),
]