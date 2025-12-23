from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.contrib.auth.models import User
from django.contrib import messages
from django.http import JsonResponse
from .models import *
from .utils import *
import json
from django.views.decorators.csrf import csrf_exempt
import secrets
from datetime import timedelta
from django.utils import timezone


def user_login(request):
    if request.user.is_authenticated:
        return redirect('dashboard')  # Redirect to dashboard if already logged in
    
    if request.method == 'POST':
        data = json.loads(request.body)
        action = data.get('action')
        
        if action == 'signin':
            # Handle login
            email = data.get('email')
            password = data.get('password')
            remember_me = data.get('remember_me', False)

            try:
                user = User.objects.get(email=email)
                user = authenticate(request, username=user.username, password=password)
                
                if user is not None:
                    auth_login(request, user)

                    # Handle "Remember Me"
                    if remember_me:
                        request.session.set_expiry(1209600)  # 2 weeks
                    else:
                        request.session.set_expiry(0)  # Close browser = logout
                        
                    return JsonResponse({
                        'success': True,
                        'message': 'Login successful!',
                        'redirect': '/profile/create/'
                    })
                else:
                    return JsonResponse({
                        'success': False,
                        'message': 'Invalid credentials'
                    }, status=400)
            
            except User.DoesNotExist:
                return JsonResponse({
                    'success': False,
                    'message': 'User not found'
                }, status=400)
        
        elif action == 'signup':
            name = data.get('name')
            email = data.get('email')
            password = data.get('password')
            confirm_password = data.get('confirm_password')

            if not all([name, email, password, confirm_password]):
                return JsonResponse({'success': False, 'message': 'All fields are required'}, status=400)

            if password != confirm_password:
                return JsonResponse({'success': False, 'message': 'Passwords do not match'}, status=400)

            # Check both User & PendingUser
            if User.objects.filter(email=email).exists():
                return JsonResponse({'success': False, 'message': 'Email already registered'}, status=400)

            try:
                # Create pending user
                pending = PendingUser.objects.create(
                    name=name,
                    email=email,
                    password=password
                )

                # Generate OTP
                otp = generate_otp()
                OTPVerification.objects.create(
                    email=email,
                    otp=otp
                )

                send_otp_email(email, otp)

                request.session['pending_verification_email'] = email
                request.session['pending_user_id'] = pending.id

                return JsonResponse({
                    'success': True,
                    'message': 'OTP sent please verify it!',
                    'redirect': '/user/verify-otp'
                })

            except Exception as e:
                return JsonResponse({
                    'success': False,
                    'message': f'Error creating account: {str(e)}'
                }, status=400)

    return render(request, 'account/login.html')


def logout_view(request):
    auth_logout(request)
    return redirect('login')

def verify_otp(request):
    """Render OTP verification page"""
    # Check if user has pending verification
    pending_email = request.session.get('pending_verification_email')
    pending_user_id = request.session.get('pending_user_id')
    
    if not pending_email or not pending_user_id:
        return redirect('login')
    
    return render(request, 'account/verify_otp.html', {
        'email': pending_email
    })

@csrf_exempt
def verify_otp_api(request):
    """API endpoint to verify OTP"""
    if request.method == 'POST':
        data = json.loads(request.body)
        otp = data.get('otp')
        email = data.get('email')
        
        # Check if OTP exists and not expired
        try:
            otp_obj = OTPVerification.objects.filter(
                email=email,
                is_verified=False
            ).latest('created_at')
            
            if otp_obj.is_expired():
                return JsonResponse({
                    'success': False,
                    'message': 'OTP has expired. Please request a new one.'
                })
            
            if otp_obj.otp == otp:
                otp_obj.is_verified = True
                otp_obj.save()

                # Get pending user data
                pending = PendingUser.objects.get(email=email)

                # Create username
                username = email.split("@")[0]
                counter = 1
                while User.objects.filter(username=username).exists():
                    username = f"{username}{counter}"
                    counter += 1

                # **CORRECT WAY 1: Using create_user() properly**
                user = User.objects.create_user(
                    username=username,
                    email=email,  # Email is included here
                    password=pending.password
                )
                
                # Set name fields separately
                name_parts = pending.name.strip().split()
                if name_parts:
                    user.first_name = name_parts[0]
                    if len(name_parts) > 1:
                        user.last_name = ' '.join(name_parts[1:])
                
                # **IMPORTANT: Save after setting names**
                user.save()

                # Cleanup pending
                pending.delete()

                auth_login(request, user, backend='django.contrib.auth.backends.ModelBackend')

                return JsonResponse({
                    'success': True,
                    'message': 'Email verified successfully!',
                    'redirect': '/profile/create/'
                })
            else:
                return JsonResponse({
                    'success': False,
                    'message': 'Invalid OTP. Please try again.'
                })
                
        except OTPVerification.DoesNotExist:
            return JsonResponse({
                'success': False,
                'message': 'No pending OTP verification found.'
            })
    
    return JsonResponse({
        'success': False,
        'message': 'Invalid request'
    })

@csrf_exempt
def resend_otp(request):
    """Resend OTP"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            email = data.get('email')
            
            if not email:
                return JsonResponse({
                    'success': False,
                    'message': 'Email is required'
                }, status=400)
            
            try:
                user = User.objects.get(email=email, is_active=False)
                
                # Get user's full name
                name = f"{user.first_name} {user.last_name}".strip()
                if not name:  # If name is empty, use email username
                    name = email.split('@')[0]
                
                # Generate new OTP
                otp = generate_otp()
                
                # Update session with new OTP
                request.session['pending_otp'] = otp
                
                # Send OTP email with name
                email_sent = send_otp_email(email, otp, name=name)
                
                if email_sent:
                    return JsonResponse({
                        'success': True,
                        'message': 'New OTP sent to your email!'
                    })
                else:
                    return JsonResponse({
                        'success': False,
                        'message': 'Failed to send OTP. Please try again.'
                    })
                    
            except User.DoesNotExist:
                return JsonResponse({
                    'success': False,
                    'message': 'User not found or already activated.'
                })
                
        except json.JSONDecodeError:
            return JsonResponse({
                'success': False,
                'message': 'Invalid JSON data'
            }, status=400)
        except Exception as e:
            print(f"Error in resend_otp: {e}")
            return JsonResponse({
                'success': False,
                'message': 'An error occurred. Please try again.'
            })
@csrf_exempt
def forgot_password(request):
    """Handle forgot password request"""
    if request.method == 'POST':
        try:
            # Get email from JSON POST data
            data = json.loads(request.body.decode('utf-8'))
            email = data.get('email', '')  # Changed from request.GET to data.get()
            
            if not email:
                return JsonResponse({
                    'success': False,
                    'message': 'Email is required'
                }, status=400)
            
            try:
                # Check if user exists
                user = User.objects.get(email=email)
                
                # Generate secure token
                token = secrets.token_urlsafe(32)
                
                # Calculate expiry (24 hours from now)
                expires_at = timezone.now() + timedelta(hours=24)
                
                # Create or update reset token
                reset_token, created = PasswordResetToken.objects.update_or_create(
                    user=user,
                    defaults={
                        'token': token,
                        'expires_at': expires_at,
                        'is_used': False
                    }
                )
                
                # Build reset URL - FIXED
                reset_url = f"{request.scheme}://{request.get_host()}/user/reset-password/{token}/"
                
                # Debug output
                print(f"\n=== DEBUG: Password Reset ===")
                print(f"User: {user.email}")
                print(f"Token: {token}")
                print(f"Reset URL: {reset_url}")
                print("=============================\n")
                
                # Send reset email
                name = f"{user.first_name} {user.last_name}".strip()
                if not name:
                    name = user.email.split('@')[0]
                
                email_sent = send_password_reset_email(email, reset_url, name)
                
                if email_sent:
                    return JsonResponse({
                        'success': True,
                        'message': 'Password reset link sent to your email! Check your inbox (and spam folder).'
                    })
                else:
                    return JsonResponse({
                        'success': False,
                        'message': 'Failed to send reset email. Please try again.'
                    })
                    
            except User.DoesNotExist:
                # For security, don't reveal if user exists or not
                return JsonResponse({
                    'success': True,
                    'message': 'If an account exists with this email, you will receive a reset link.'
                })
                
        except json.JSONDecodeError:
            return JsonResponse({
                'success': False,
                'message': 'Invalid JSON data'
            }, status=400)
        except Exception as e:
            print(f"Error in forgot_password: {e}")
            import traceback
            traceback.print_exc()
            return JsonResponse({
                'success': False,
                'message': f'An error occurred: {str(e)}'
            })
    
    # For GET requests - render the form
    email = request.GET.get('email', '')
    return render(request, 'account/forgot_password.html', {
        'prefilled_email': email
    })

def reset_password(request, token=None):
    """Render password reset page"""
    if token:
        # Verify token
        try:
            reset_token = PasswordResetToken.objects.get(token=token)
            
            if not reset_token.is_valid():
                messages.error(request, 'This reset link has expired or has already been used.')
                return redirect('forgot_password')
            
            return render(request, 'account/reset_password.html', {
                'token': token,
                'email': reset_token.user.email
            })
            
        except PasswordResetToken.DoesNotExist:
            messages.error(request, 'Invalid reset link.')
            return redirect('forgot_password')
    
    return render(request, 'account/reset_password.html')

@csrf_exempt
def reset_password_api(request):
    """Handle password reset API"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            token = data.get('token')
            password = data.get('password')
            confirm_password = data.get('confirm_password')
            
            if not all([token, password, confirm_password]):
                return JsonResponse({
                    'success': False,
                    'message': 'All fields are required'
                }, status=400)
            
            if password != confirm_password:
                return JsonResponse({
                    'success': False,
                    'message': 'Passwords do not match'
                })
            
            if len(password) < 8:
                return JsonResponse({
                    'success': False,
                    'message': 'Password must be at least 8 characters'
                })
            
            try:
                reset_token = PasswordResetToken.objects.get(token=token)
                
                if not reset_token.is_valid():
                    return JsonResponse({
                        'success': False,
                        'message': 'This reset link has expired or has already been used.'
                    })
                
                # Update user's password
                user = reset_token.user
                user.set_password(password)
                user.save()
                
                # Mark token as used
                reset_token.is_used = True
                reset_token.save()
                
                # Auto login the user
                auth_login(request, user, backend='django.contrib.auth.backends.ModelBackend')
                
                # Send confirmation email (optional)
                send_password_changed_email(user.email, user.first_name)
                
                return JsonResponse({
                    'success': True,
                    'message': 'Password reset successfully!Login again with new password!',
                    'redirect': '/user/login',
                })
                
            except PasswordResetToken.DoesNotExist:
                return JsonResponse({
                    'success': False,
                    'message': 'Invalid reset link.'
                })
                
        except json.JSONDecodeError:
            return JsonResponse({
                'success': False,
                'message': 'Invalid JSON data'
            }, status=400)
        except Exception as e:
            print(f"Error in reset_password_api: {e}")
            return JsonResponse({
                'success': False,
                'message': 'An error occurred. Please try again.'
            })
    
    return JsonResponse({
        'success': False,
        'message': 'Invalid request method'
    })

# Optional: Add password changed email function
def send_password_changed_email(email, name):
    """Send password changed notification email"""
    subject = 'MediTrack+ - Password Changed Successfully'
    
    context = {
        'name': name,
        'site_url': settings.SITE_URL,
    }
    
    html_content = render_to_string('account/emails/password_changed.html', context)
    text_content = render_to_string('account/emails/password_changed.txt', context)
    
    try:
        email_msg = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[email]
        )
        email_msg.attach_alternative(html_content, "text/html")
        email_msg.send()
        print(f"Password changed notification sent to {email}")
    except Exception as e:
        print(f"Error sending password changed email: {e}")