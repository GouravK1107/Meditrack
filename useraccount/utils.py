import random
import string
from django.template.loader import render_to_string
from django.core.mail import EmailMultiAlternatives
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from datetime import timedelta

def generate_otp(length=6):
    """Generate a random OTP"""
    return ''.join(random.choices(string.digits, k=length))

def send_otp_email(email, otp, name="User"):
    """Send HTML OTP email using Django templates"""
    
    subject = 'MediTrack+ - Verify Your Email'
    
    # Context for template
    context = {
        'name': name,
        'otp': otp,
        'verification_url': f"{settings.SITE_URL}/verify-otp/",  # Add SITE_URL to settings
        'site_url': settings.SITE_URL,
    }
    
    # Render HTML content
    html_content = render_to_string('account/emails/otp_verification.html', context)
    
    # Render plain text content
    text_content = render_to_string('account/emails/otp_verification.txt', context)
    
    try:
        # Create email message with both HTML and text versions
        email_msg = EmailMultiAlternatives(
            subject=subject,
            body=text_content,  # This is the plain text version
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[email],
            reply_to=[settings.DEFAULT_FROM_EMAIL]
        )
        
        # Attach HTML version
        email_msg.attach_alternative(html_content, "text/html")
        
        # Send email
        email_msg.send()
        
        print(f"HTML template email sent to {email}")
        return True
        
    except Exception as e:
        print(f"Error sending template email: {e}")
        
        # Fallback to simple email
        try:
            email_msg = EmailMultiAlternatives(
                subject=subject,
                body=f"Your OTP is: {otp}",
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[email]
            )
            email_msg.send()
            print(f"Simple fallback email sent to {email}")
            return True
        except Exception as e2:
            print(f"Error sending fallback email: {e2}")
            return False
        
def send_password_reset_email(email, reset_url, name="User"):
    """Send HTML password reset email"""
    
    subject = 'MediTrack+ - Password Reset Request'
    
    # Context for template
    context = {
        'name': name,
        'reset_url': reset_url,
        'site_url': settings.SITE_URL,
        'expiry_hours': 24,  # Token expires in 24 hours
    }
    
    # Render HTML content
    html_content = render_to_string('account/emails/password_reset.html', context)
    
    # Render plain text content
    text_content = render_to_string('account/emails/password_reset.txt', context)
    
    try:
        # Create email message with both HTML and text versions
        email_msg = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[email],
            reply_to=[settings.DEFAULT_FROM_EMAIL]
        )
        
        # Attach HTML version
        email_msg.attach_alternative(html_content, "text/html")
        
        # Send email
        email_msg.send()
        
        print(f"Password reset email sent to {email}")
        return True
        
    except Exception as e:
        print(f"Error sending password reset email: {e}")
        
        # Fallback to simple email
        try:
            email_msg = EmailMultiAlternatives(
                subject=subject,
                body=f"Click here to reset your password: {reset_url}",
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[email]
            )
            email_msg.send()
            print(f"Simple password reset email sent to {email}")
            return True
        except Exception as e2:
            print(f"Error sending fallback password reset email: {e2}")
            return False