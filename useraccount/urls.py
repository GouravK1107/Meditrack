from django.urls import path, include
from useraccount import views
from django.views.generic import TemplateView
# urls
urlpatterns = [
    path('login/', views.user_login, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('verify-otp/', views.verify_otp, name='verify_otp'),
    path('api/verify-otp/', views.verify_otp_api, name='verify_otp_api'),
    path('api/resend-otp/', views.resend_otp, name='resend_otp'),
    # Password reset URLs
    path('forgot-password/', views.forgot_password, name='forgot_password'),
    path('reset-password/', views.reset_password, name='reset_password'),
    path('reset-password/<str:token>/', views.reset_password, name='reset_password_token'),
    path('api/reset-password/', views.reset_password_api, name='reset_password_api'),

    # Legal
    path('terms/', TemplateView.as_view(template_name='account/terms_condition.html'), name='terms'),
    path('privacy/', TemplateView.as_view(template_name='account/privacy_policy.html'), name='privacy'),
]