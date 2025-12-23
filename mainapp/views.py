from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from .models import *
from django.utils.dateparse import parse_date
from django.http import JsonResponse
import json
from django.views.decorators.csrf import csrf_exempt
from django.core.files.base import ContentFile
import base64
from datetime import datetime, date
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from django.utils import timezone
from django.contrib.auth import update_session_auth_hash
from django.utils.crypto import get_random_string
from django.core.mail import send_mail
from django.urls import reverse
from django.utils import timezone
from datetime import timedelta
from django.http import *
import os
import json
import zipfile
import io
from datetime import datetime, date
from django.utils import timezone
from django.template.loader import render_to_string
from django.core.mail import EmailMultiAlternatives
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
import csv
from io import StringIO
from django.conf import settings

# Create your views here.
def home(request):
    return render(request, 'mainapp/index.html')

@login_required
def dashboard(request):
    # Get the user's existing profile
    try:
        profile = UserProfile.objects.get(user=request.user)
        
        # Calculate age
        age = None
        if profile.date_of_birth:
            today = date.today()
            age = today.year - profile.date_of_birth.year
            if (today.month, today.day) < (profile.date_of_birth.month, profile.date_of_birth.day):
                age -= 1
        
        # Calculate BMI if height and weight are available
        bmi = None
        bmi_category = None
        if profile.height and profile.weight:
            height_m = profile.height / 100
            bmi_value = profile.weight / (height_m * height_m)
            bmi = round(bmi_value, 1)
            
            # Determine BMI category
            if bmi < 18.5:
                bmi_category = "underweight"
            elif bmi < 25:
                bmi_category = "normal"
            elif bmi < 30:
                bmi_category = "overweight"
            else:
                bmi_category = "obese"
        
        # Format date of birth for JavaScript
        date_of_birth_iso = None
        if profile.date_of_birth:
            date_of_birth_iso = profile.date_of_birth.strftime('%Y-%m-%d')
        
    except UserProfile.DoesNotExist:
        profile = None
        age = None
        bmi = None
        bmi_category = None
        date_of_birth_iso = None
    
    # Send to template
    context = {
        'user': request.user,
        'profile': profile,
        'age': age,
        'bmi': bmi,
        'bmi_category': bmi_category,
        'date_of_birth_iso': date_of_birth_iso,
    }
    
    return render(request, 'mainapp/dashboard.html', context)

@csrf_exempt
@login_required
def create_profile(request):
    """Create profile for logged-in user"""
    
    # Get current authenticated user
    user = request.user
    
    # Check if profile already exists
    if hasattr(user, 'userprofile'):
        # If it's an AJAX request (POST), return JSON response
        if request.method == 'POST':
            return JsonResponse({
                'success': False,
                'message': 'Profile already exists. Redirecting to dashboard...',
                'redirect_url': '/dashboard/'
            }, status=400)
        # If it's a regular GET request, redirect to dashboard
        else:
            return redirect('/dashboard/')
    
    # Rest of the function remains the same...
    if request.method == 'POST':
        try:
            # Parse JSON data from request
            data = json.loads(request.body)
            
            # Validate required fields
            required_fields = ['firstName', 'lastName', 'dateOfBirth', 'gender']
            for field in required_fields:
                if not data.get(field):
                    return JsonResponse({
                        'success': False,
                        'message': f'{field} is required.'
                    }, status=400)
            
            # Create UserProfile
            profile = UserProfile(
                user=user,
                phone=data.get('phone', ''),
                gender=data.get('gender', ''),
                blood_type=data.get('bloodType', ''),
                allergies=data.get('allergies', ''),
                medications=data.get('medications', ''),
                emergency_name=data.get('emergencyName', ''),
                emergency_relation=data.get('emergencyRelation', ''),
                emergency_phone=data.get('emergencyPhone', '')
            )
            
            # Handle date of birth
            date_of_birth_str = data.get('dateOfBirth')
            if date_of_birth_str:
                try:
                    # Parse date from string (format: YYYY-MM-DD)
                    date_of_birth = parse_date(date_of_birth_str)
                    if date_of_birth:
                        profile.date_of_birth = date_of_birth
                    else:
                        return JsonResponse({
                            'success': False,
                            'message': 'Invalid date format. Use YYYY-MM-DD'
                        }, status=400)
                except Exception as e:
                    return JsonResponse({
                        'success': False,
                        'message': f'Invalid date format: {str(e)}'
                    }, status=400)
            
            # Handle height
            height = data.get('height')
            if height:
                try:
                    profile.height = int(height)
                except (ValueError, TypeError):
                    profile.height = None
            
            # Handle weight
            weight = data.get('weight')
            if weight:
                try:
                    profile.weight = int(weight)
                except (ValueError, TypeError):
                    profile.weight = None
            
            # Handle profile photo (avatar)
            avatar_data = data.get('avatar', None)
            if avatar_data and avatar_data.startswith('data:image'):
                try:
                    # Convert base64 to image file
                    format, imgstr = avatar_data.split(';base64,')
                    ext = format.split('/')[-1]
                    image_data = base64.b64decode(imgstr)
                    
                    # Create file name
                    file_name = f"profile_{user.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{ext}"
                    
                    # Save the image
                    profile.profile_photo.save(
                        file_name,
                        ContentFile(image_data),
                        save=False
                    )
                except Exception as e:
                    print(f"Error saving avatar: {e}")
                    # Continue without avatar if there's an error
            
            profile.save()
                       
            return JsonResponse({
                'success': True,
                'message': 'Profile created successfully!',
                'redirect_url': '/dashboard/',
                'profile_id': profile.id
            })
            
        except json.JSONDecodeError:
            return JsonResponse({
                'success': False,
                'message': 'Invalid JSON data'
            }, status=400)
        except Exception as e:
            print(f"Error creating profile: {str(e)}")
            return JsonResponse({
                'success': False,
                'message': f'Error creating profile: {str(e)}'
            }, status=500)
    
    # For GET request, render the form
    return render(request, 'mainapp/create_profile.html')

@csrf_exempt
@login_required
def edit_profile(request):
    """Edit profile for logged-in user"""
    if request.method == 'POST':
        try:
            # Parse JSON data from request
            data = json.loads(request.body)
            print(f"User {request.user.username} updating profile with data:", data)
            
            # Get current authenticated user
            user = request.user
            
            # Get or create UserProfile
            try:
                profile = UserProfile.objects.get(user=user)
            except UserProfile.DoesNotExist:
                # If profile doesn't exist, create one
                profile = UserProfile(user=user)
            
            # Update user information
            if 'firstName' in data:
                user.first_name = data['firstName']
            if 'lastName' in data:
                user.last_name = data['lastName']
            if 'email' in data:
                user.email = data['email']
            user.save()
            
            # Update personal information
            if 'phone' in data:
                profile.phone = data['phone']
            if 'dateOfBirth' in data:
                date_of_birth_str = data.get('dateOfBirth')
                if date_of_birth_str:
                    date_of_birth = parse_date(date_of_birth_str)
                    if date_of_birth:
                        profile.date_of_birth = date_of_birth
            if 'gender' in data:
                profile.gender = data['gender']
            
            # Update medical information
            if 'bloodType' in data:
                profile.blood_type = data['bloodType']
            if 'height' in data:
                try:
                    profile.height = int(data['height']) if data['height'] else None
                except (ValueError, TypeError):
                    profile.height = None
            if 'weight' in data:
                try:
                    profile.weight = int(data['weight']) if data['weight'] else None
                except (ValueError, TypeError):
                    profile.weight = None
            if 'allergies' in data:
                profile.allergies = data['allergies']
            if 'medications' in data:
                profile.medications = data['medications']
            
            # Update emergency contact
            if 'emergencyName' in data:
                profile.emergency_name = data['emergencyName']
            if 'emergencyRelation' in data:
                profile.emergency_relation = data['emergencyRelation']
            if 'emergencyPhone' in data:
                profile.emergency_phone = data['emergencyPhone']
            
            # Handle profile photo update
            avatar_data = data.get('avatar', None)
            if avatar_data and avatar_data.startswith('data:image'):
                try:
                    # Convert base64 to image file
                    format, imgstr = avatar_data.split(';base64,')
                    ext = format.split('/')[-1]
                    image_data = base64.b64decode(imgstr)
                    
                    # Create file name
                    file_name = f"profile_{user.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{ext}"
                    
                    # Save the image
                    profile.profile_photo.save(
                        file_name,
                        ContentFile(image_data),
                        save=False
                    )
                except Exception as e:
                    print(f"Error saving avatar: {e}")
                    # Continue without avatar if there's an error
            
            profile.save()
            
            return JsonResponse({
                'success': True,
                'message': 'Profile updated successfully!',
                'redirect_url': '/profile/'
            })
            
        except Exception as e:
            print(f"Error updating profile: {str(e)}")
            return JsonResponse({
                'success': False,
                'message': f'Error updating profile: {str(e)}'
            }, status=500)
    
    # For GET request, render the edit form
    return render(request, 'mainapp/edit_profile.html')

@csrf_exempt
@login_required
def get_profile_api(request):
    """API endpoint to fetch existing profile data for logged-in user"""
    if request.method == 'GET':
        try:
            # Get current authenticated user
            user = request.user
            print(f"Fetching profile for user: {user.username}")
            
            # Get profile if exists
            try:
                profile = UserProfile.objects.get(user=user)
                
                # Format date for frontend (YYYY-MM-DD)
                date_of_birth = profile.date_of_birth.strftime('%Y-%m-%d') if profile.date_of_birth else ''
                
                # Build response data
                response_data = {
                    'success': True,
                    'profile': {
                        'firstName': user.first_name or '',
                        'lastName': user.last_name or '',
                        'email': user.email or '',
                        'phone': profile.phone or '',
                        'dateOfBirth': date_of_birth,
                        'gender': profile.gender or '',
                        'bloodType': profile.blood_type or '',
                        'height': profile.height or '',
                        'weight': profile.weight or '',
                        'allergies': profile.allergies or '',
                        'medications': profile.medications or '',
                        'emergencyName': profile.emergency_name or '',
                        'emergencyRelation': profile.emergency_relation or '',
                        'emergencyPhone': profile.emergency_phone or '',
                    }
                }
                
                # If profile has photo, add the URL
                if profile.profile_photo:
                    response_data['profile']['hasPhoto'] = True
                    response_data['profile']['photoUrl'] = profile.profile_photo.url
                else:
                    response_data['profile']['hasPhoto'] = False
                
                return JsonResponse(response_data)
                
            except UserProfile.DoesNotExist:
                # Profile doesn't exist yet
                print(f"No profile found for user: {user.username}")
                return JsonResponse({
                    'success': True,
                    'profile': {
                        'firstName': user.first_name or '',
                        'lastName': user.last_name or '',
                        'email': user.email or '',
                        'phone': '',
                        'dateOfBirth': '',
                        'gender': '',
                        'bloodType': '',
                        'height': '',
                        'weight': '',
                        'allergies': '',
                        'medications': '',
                        'emergencyName': '',
                        'emergencyRelation': '',
                        'emergencyPhone': '',
                        'hasPhoto': False
                    },
                    'message': 'No profile found. Please create one.'
                })
                
        except Exception as e:
            print(f"Error fetching profile for user {request.user.username}: {str(e)}")
            return JsonResponse({
                'success': False,
                'message': f'Error fetching profile: {str(e)}'
            }, status=500)
    
    return JsonResponse({'success': False, 'message': 'Method not allowed'}, status=405)

# views.py - Update the profile function
@login_required
def profile(request):
    try:
        # Get user profile if it exists
        profile = UserProfile.objects.get(user=request.user)
        
        # The request.user is automatically available in template context
        # but let's explicitly pass it to be safe
        user = request.user
        
        # Calculate age from date of birth
        age = None
        if profile.date_of_birth:
            today = date.today()
            age = today.year - profile.date_of_birth.year
            if (today.month, today.day) < (profile.date_of_birth.month, profile.date_of_birth.day):
                age -= 1
        
        # Calculate BMI if height and weight are available
        bmi = None
        bmi_category = None
        if profile.height and profile.weight:
            height_m = profile.height / 100  # Convert cm to meters
            bmi_value = profile.weight / (height_m * height_m)
            bmi = round(bmi_value, 1)
            
            # Determine BMI category
            if bmi < 18.5:
                bmi_category = "underweight"
            elif bmi < 25:
                bmi_category = "normal"
            elif bmi < 30:
                bmi_category = "overweight"
            else:
                bmi_category = "obese"
        
        # Parse allergies and medications from text fields
        allergies_list = []
        if profile.allergies:
            allergies_list = [a.strip() for a in profile.allergies.split(',') if a.strip()]
        
        medications_list = []
        if profile.medications:
            medications_list = [m.strip() for m in profile.medications.split(',') if m.strip()]
        
        context = {
            'profile': profile,
            'user_obj': user,  # Rename to avoid conflict with template's built-in user
            'age': age,
            'bmi': bmi,
            'bmi_category': bmi_category,
            'allergies_list': allergies_list,
            'medications_list': medications_list,
            'date_of_birth_formatted': profile.date_of_birth.strftime('%B %d, %Y') if profile.date_of_birth else '',
        }
        
        return render(request, 'mainapp/profile.html', context)
        
    except UserProfile.DoesNotExist:
        # If profile doesn't exist, create one
        return redirect('create_profile')


@csrf_exempt
@require_POST
def create_chat(request):
    """Create a new chat session"""
    try:
        data = json.loads(request.body)
        user = request.user
        
        # Get session_id from request or generate one
        session_id = data.get('session_id', '')
        if not session_id:
            # Generate a session ID if not provided
            from django.utils.crypto import get_random_string
            session_id = get_random_string(length=32)
        
        # Create initial chat entry
        chat = ChatHistory.objects.create(
            user=user,
            message="",  # Empty for now
            response="",  # Empty for now
            sender="system",  # System message to start chat
            session_id=session_id
        )
        
        return JsonResponse({
            'success': True,
            'chat_id': chat.id,
            'session_id': chat.session_id
        })
    except Exception as e:
        print(f"Error creating chat: {str(e)}")
        import traceback
        traceback.print_exc()
        return JsonResponse({'success': False, 'error': str(e)}, status=400)


@csrf_exempt
@require_POST
def save_message(request):
    """Save a message to chat history - CREATE NEW RECORD for each message"""
    try:
        data = json.loads(request.body)
        user = request.user
        role = data.get('role')  # 'user' or 'assistant'
        content = data.get('content')
        session_id = data.get('session_id', '')
        
        # IMPORTANT: Always create a NEW record for each message
        # This way we preserve the full conversation history
        
        if role == 'user':
            # Create a record for user message
            chat = ChatHistory.objects.create(
                user=user,
                message=content,      # User message goes here
                response="",          # Empty for now (AI will fill this)
                sender='user',
                session_id=session_id
            )
        elif role in ['assistant', 'bot', 'ai']:
            # For AI responses, we need to find the latest user message
            # and update its response field
            
            # Find the latest user message in this session
            latest_user_chat = ChatHistory.objects.filter(
                user=user,
                session_id=session_id,
                sender='user'
            ).order_by('-timestamp').first()
            
            if latest_user_chat:
                # Update the response field of the latest user message
                latest_user_chat.response = content
                latest_user_chat.save()
                chat = latest_user_chat
            else:
                # If no user message found (edge case), create new record
                chat = ChatHistory.objects.create(
                    user=user,
                    message="",          # No user message
                    response=content,    # AI response
                    sender='ai',
                    session_id=session_id
                )
        else:
            return JsonResponse({
                'success': False, 
                'error': 'Invalid role'
            }, status=400)
        
        return JsonResponse({
            'success': True, 
            'chat_id': chat.id,
            'session_id': chat.session_id
        })
        
    except Exception as e:
        print(f"Error saving message: {str(e)}")
        import traceback
        traceback.print_exc()
        return JsonResponse({'success': False, 'error': str(e)}, status=400)


# Add this new function to get chat history
@login_required
def get_chat_messages(request):
    """Get all messages for a specific session - PAIR user messages with AI responses"""
    try:
        session_id = request.GET.get('session_id', '')
        
        if session_id:
            # Get all chat entries for this session, ordered by timestamp
            chats = ChatHistory.objects.filter(
                user=request.user,
                session_id=session_id
            ).order_by('timestamp')
        else:
            # Get all chats for user (group by session)
            sessions = ChatHistory.objects.filter(
                user=request.user
            ).values('session_id').distinct()
            
            # For each session, get the latest chat
            latest_chats = []
            for session in sessions:
                if session['session_id']:  # Skip empty session IDs
                    latest = ChatHistory.objects.filter(
                        user=request.user,
                        session_id=session['session_id']
                    ).order_by('-timestamp').first()
                    if latest:
                        latest_chats.append(latest)
            
            # Sort by timestamp
            latest_chats.sort(key=lambda x: x.timestamp, reverse=True)
            chats = latest_chats
        
        # For display in chat interface
        messages = []
        for chat in chats:
            if chat.message:  # Add user message
                messages.append({
                    'role': 'user',
                    'content': chat.message,
                    'timestamp': chat.timestamp.isoformat()
                })
            if chat.response:  # Add AI response
                messages.append({
                    'role': 'assistant',
                    'content': chat.response,
                    'timestamp': chat.timestamp.isoformat()
                })
        
        return JsonResponse({
            'success': True,
            'messages': messages,
            'session_count': len(chats) if session_id else len(latest_chats)
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False, 
            'error': str(e)
        }, status=400)

def get_user_profile(request):
    """Get user's health profile"""
    try:
        user = request.user
        # Assuming you have a UserProfile model
        profile = user.userprofile
        age = None
        if profile.date_of_birth:
            today = date.today()
            age = today.year - profile.date_of_birth.year
            if (today.month, today.day) < (profile.date_of_birth.month, profile.date_of_birth.day):
                age -= 1

        return JsonResponse({
            'blood_group': profile.blood_group,
            'allergies': [a.name for a in profile.allergies.all()],
            'current_medications': [m.name for m in profile.medications.all()],
            'conditions': [c.name for c in profile.conditions.all()],
            'age': age,
            'gender': profile.gender
        })
        
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)

# Add this function to your views.py
@login_required
def get_user_profile_api(request):
    """API endpoint to get user profile data for editing"""
    try:
        user = request.user
        
        # Get or create user profile
        try:
            profile = UserProfile.objects.get(user=user)
        except UserProfile.DoesNotExist:
            # Create empty profile if doesn't exist
            profile = UserProfile.objects.create(user=user)
        
        # Prepare response data
        profile_data = {
            'success': True,
            'profile': {
                'firstName': user.first_name or '',
                'lastName': user.last_name or '',
                'email': user.email or '',
                'phone': profile.phone or '',
                'dateOfBirth': profile.date_of_birth.strftime('%Y-%m-%d') if profile.date_of_birth else '',
                'gender': profile.gender or '',
                'bloodType': profile.blood_type or '',
                'height': profile.height or '',
                'weight': profile.weight or '',
                'allergies': profile.allergies or '',
                'medications': profile.medications or '',
                'emergencyName': profile.emergency_name or '',
                'emergencyRelation': profile.emergency_relation or '',
                'emergencyPhone': profile.emergency_phone or '',
            }
        }
        
        # Add photo URL if exists
        if profile.profile_photo:
            profile_data['profile']['hasPhoto'] = True
            profile_data['profile']['photoUrl'] = profile.profile_photo.url
        else:
            profile_data['profile']['hasPhoto'] = False
        
        return JsonResponse(profile_data)
        
    except Exception as e:
        print(f"Error in get_user_profile_api: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Error fetching profile: {str(e)}'
        }, status=500)
    
def user_settings(request):
    return render(request, 'mainapp/settings.html')

# Add these view functions to your existing views.py
@csrf_exempt
@login_required
@require_POST
def change_password(request):
    """Change user's password"""
    try:
        data = json.loads(request.body)
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        if not current_password or not new_password:
            return JsonResponse({
                'success': False,
                'message': 'All fields are required'
            }, status=400)
        
        # Verify current password
        if not request.user.check_password(current_password):
            return JsonResponse({
                'success': False,
                'message': 'Current password is incorrect'
            }, status=400)
        
        # Set new password
        request.user.set_password(new_password)
        request.user.save()
        
        # Update session to prevent logout
        update_session_auth_hash(request, request.user)
        
        return JsonResponse({
            'success': True,
            'message': 'Password changed successfully'
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error: {str(e)}'
        }, status=500)

@csrf_exempt
@login_required
@require_POST
def export_data(request):
    """Request data export - creates async task"""
    try:
        # First, validate the JSON data
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({
                'success': False,
                'message': 'Invalid JSON data'
            }, status=400)
        
        user = request.user
        
        # Get export options with defaults
        export_options = {
            'personal_info': data.get('personal_info', True),
            'health_profile': data.get('health_profile', True),
            'chat_history': data.get('chat_history', True),
            'account_settings': data.get('account_settings', True),
        }
        
        print(f"Export options for user {user.username}: {export_options}")
        
        # Check if user has too many pending exports (max 3)
        pending_exports = DataExport.objects.filter(
            user=user,
            status__in=['pending', 'processing'],
            expires_at__gt=timezone.now()
        ).count()
        
        if pending_exports >= 3:
            return JsonResponse({
                'success': False,
                'message': 'You have too many pending exports. Please wait for them to complete.'
            }, status=400)
        
        # Generate export token
        token = get_random_string(length=50)
        
        # Create data export record
        data_export = DataExport.objects.create(
            user=user,
            export_token=token,
            expires_at=timezone.now() + timedelta(days=7),
            status='pending'
        )
        
        # Store export options
        data_export.export_options = json.dumps(export_options)
        data_export.save()
        
        # Start async processing
        import threading
        
        def process_export_async():
            try:
                process_data_export(data_export.id, export_options)
            except Exception as e:
                print(f"Error in async export processing: {str(e)}")
                import traceback
                traceback.print_exc()
        
        thread = threading.Thread(target=process_export_async)
        thread.daemon = True
        thread.start()
        
        # Return success response IMMEDIATELY (don't wait for processing)
        return JsonResponse({
            'success': True,
            'message': 'Data export requested! You will receive an email with download link when ready (usually within 5 minutes).',
            'export_id': data_export.id
        })
        
    except Exception as e:
        print(f"Error in export_data: {str(e)}")
        import traceback
        traceback.print_exc()
        return JsonResponse({
            'success': False,
            'message': f'Error: {str(e)}'
        }, status=500)
    
def process_data_export(export_id, export_options):
    """Process data export in background"""
    try:
        from django.conf import settings
        from django.utils import timezone
        import os

        data_export = DataExport.objects.get(id=export_id)
        data_export.status = 'processing'
        data_export.save()

        user = data_export.user

        # Generate report data
        report_data = generate_health_report_data(user)

        # Apply export options
        filtered_report_data = {
            'export_info': report_data.get('export_info', {}),
            'privacy_note': report_data.get('privacy_note', {}),
        }

        if export_options.get('personal_info', True):
            filtered_report_data['personal_info'] = report_data.get('personal_info', {})

        if export_options.get('health_profile', True):
            filtered_report_data['health_profile'] = report_data.get('health_profile', {})
            filtered_report_data['emergency_contacts'] = report_data.get('emergency_contacts', {})

        if export_options.get('chat_history', True):
            filtered_report_data['chat_history_summary'] = report_data.get('chat_history_summary', {})

        if export_options.get('account_settings', True):
            filtered_report_data['account_settings'] = report_data.get('account_settings', {})

        # Create PDF
        pdf_buffer = create_pdf_report(filtered_report_data)

        # Create CSV
        csv_data = create_csv_data(filtered_report_data)

        # Create ZIP file
        zip_buffer = create_zip_file(filtered_report_data, pdf_buffer, csv_data)

        # Create exports directory if not exists
        exports_dir = os.path.join(settings.MEDIA_ROOT, 'exports')
        os.makedirs(exports_dir, exist_ok=True)

        # Save file
        filename = f"meditrack_export_{user.id}_{int(timezone.now().timestamp())}.zip"
        filepath = os.path.join(exports_dir, filename)

        with open(filepath, 'wb') as f:
            f.write(zip_buffer.getvalue())

        # Update export record
        data_export.status = 'completed'
        data_export.file_path = filepath
        data_export.file_size = os.path.getsize(filepath)
        data_export.processed_at = timezone.now()
        data_export.save()

        # Build download URL
        from django.urls import reverse
        download_url = f"{settings.BASE_URL}{reverse('download_export', kwargs={'token': data_export.export_token})}"

        # Send email
        send_export_email(user, data_export, download_url)

        print(f"Export {export_id} processed successfully")

    except Exception as e:
        print(f"Error processing export {export_id}: {str(e)}")
        import traceback
        traceback.print_exc()
        try:
            data_export = DataExport.objects.get(id=export_id)
            data_export.status = 'failed'
            data_export.save()
        except Exception:
            pass

@csrf_exempt
@login_required
@require_POST
def save_privacy_settings(request):
    """Save privacy and security settings"""
    try:
        data = json.loads(request.body)
        
        # Get or create user settings
        try:
            user_settings = UserSettings.objects.get(user=request.user)
        except UserSettings.DoesNotExist:
            user_settings = UserSettings(user=request.user)
        
        # Update settings
        user_settings.two_factor_auth = data.get('two_factor_auth', False)
        user_settings.session_timeout = int(data.get('session_timeout', 30))
        user_settings.login_notifications = data.get('login_notifications', True)
        user_settings.data_encryption = data.get('data_encryption', True)
        user_settings.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Privacy settings saved successfully'
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error: {str(e)}'
        }, status=500)

@csrf_exempt
@login_required
@require_POST
def save_appearance_settings(request):
    """Save appearance settings"""
    try:
        data = json.loads(request.body)
        
        # Get or create user settings
        try:
            user_settings = UserSettings.objects.get(user=request.user)
        except UserSettings.DoesNotExist:
            user_settings = UserSettings(user=request.user)
        
        # Update appearance settings
        user_settings.dark_mode = data.get('dark_mode', False)
        user_settings.font_size = data.get('font_size', 'medium')
        user_settings.theme_color = data.get('theme_color', 'blue')
        user_settings.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Appearance settings saved successfully'
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error: {str(e)}'
        }, status=500)
    
@csrf_exempt
@login_required
@require_POST
def delete_account(request):
    """Permanently delete user account"""
    try:
        data = json.loads(request.body)
        confirmation = data.get('confirmation', '')
        
        if confirmation != 'DELETE MY ACCOUNT':
            return JsonResponse({
                'success': False,
                'message': 'Invalid confirmation text'
            }, status=400)
        
        user = request.user
        
        # Delete user profile if exists
        try:
            profile = UserProfile.objects.get(user=user)
            profile.delete()
        except UserProfile.DoesNotExist:
            pass
        
        # Delete user settings if exists
        try:
            user_settings = UserSettings.objects.get(user=user)
            user_settings.delete()
        except UserSettings.DoesNotExist:
            pass
        
        # Delete chat history
        ChatHistory.objects.filter(user=user).delete()
        
        # Delete user account
        user.delete()
        
        return JsonResponse({
            'success': True,
            'message': 'Account deleted successfully'
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error: {str(e)}'
        }, status=500)

@login_required
def get_settings(request):
    """Get all user settings"""
    try:
        try:
            user_settings = UserSettings.objects.get(user=request.user)
            settings_data = {
                'two_factor_auth': user_settings.two_factor_auth,
                'session_timeout': user_settings.session_timeout,
                'login_notifications': user_settings.login_notifications,
                'data_encryption': user_settings.data_encryption,
                'dark_mode': user_settings.dark_mode,
                'font_size': user_settings.font_size,
                'theme_color': user_settings.theme_color
            }
        except UserSettings.DoesNotExist:
            # Default settings
            settings_data = {
                'two_factor_auth': False,
                'session_timeout': 30,
                'login_notifications': True,
                'data_encryption': True,
                'dark_mode': False,
                'font_size': 'medium',
                'theme_color': 'blue'
            }
        
        return JsonResponse({
            'success': True,
            'settings': settings_data
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error: {str(e)}'
        }, status=500)

@login_required
def get_privacy_settings(request):
    """Get user's privacy settings"""
    try:
        try:
            user_settings = UserSettings.objects.get(user=request.user)
            settings_data = {
                'two_factor_auth': user_settings.two_factor_auth,
                'session_timeout': user_settings.session_timeout,
                'login_notifications': user_settings.login_notifications,
                'data_encryption': user_settings.data_encryption
            }
        except UserSettings.DoesNotExist:
            # Default settings
            settings_data = {
                'two_factor_auth': False,
                'session_timeout': 30,
                'login_notifications': True,
                'data_encryption': True
            }
        
        return JsonResponse({
            'success': True,
            'settings': settings_data
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error: {str(e)}'
        }, status=500)

@csrf_exempt
@login_required
@require_POST
def change_email(request):
    """Request email change with verification"""
    try:
        data = json.loads(request.body)
        new_email = data.get('new_email')
        current_password = data.get('current_password')
        
        if not new_email or not current_password:
            return JsonResponse({
                'success': False,
                'message': 'All fields are required'
            }, status=400)
        
        # Verify current password
        if not request.user.check_password(current_password):
            return JsonResponse({
                'success': False,
                'message': 'Current password is incorrect'
            }, status=400)
        
        # Check if email is already in use
        from django.contrib.auth.models import User
        if User.objects.filter(email=new_email).exclude(id=request.user.id).exists():
            return JsonResponse({
                'success': False,
                'message': 'This email is already in use'
            }, status=400)
        
        # Check if new email is same as current
        if request.user.email == new_email:
            return JsonResponse({
                'success': False,
                'message': 'New email cannot be same as current email'
            }, status=400)
        
        # Generate verification token
        token = get_random_string(length=50)
        
        # Delete any existing pending requests for this user
        PendingEmailChange.objects.filter(user=request.user).delete()
        
        # Create pending email change request
        pending_change = PendingEmailChange.objects.create(
            user=request.user,
            old_email=request.user.email,
            new_email=new_email,
            verification_token=token,
            expires_at=timezone.now() + timedelta(hours=24)  # 24 hours expiry
        )
        
        # Send verification email to old email
        verification_url = request.build_absolute_uri(
            reverse('verify_email_change', kwargs={'token': token})
        )
        
        # Send verification email
        send_verification_email(
            old_email=request.user.email,
            new_email=new_email,
            verification_url=verification_url
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Verification email sent to your current email address. Please check your inbox.'
        })
        
    except Exception as e:
        print(f"Error in change_email: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Error: {str(e)}'
        }, status=500)

def send_verification_email(old_email, new_email, verification_url):
    """Send email verification for email change"""
    subject = "Verify Your Email Change - MediTrack+"
    
    # HTML email content
    html_message = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; background: #f8faff; }}
            .header {{ background: linear-gradient(135deg, #1976d2, #1565c0); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
            .button {{ display: inline-block; background: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }}
            .warning {{ background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>MediTrack+</h1>
                <h2>Email Change Verification</h2>
            </div>
            <div class="content">
                <h3>Hello,</h3>
                <p>You have requested to change your MediTrack+ email address from:</p>
                <p style="text-align: center; font-size: 18px; font-weight: bold; color: #1976d2;">
                    {old_email} → {new_email}
                </p>
                
                <div class="warning">
                    <p><strong>Important:</strong> If you did not request this change, please ignore this email and contact support immediately.</p>
                </div>
                
                <p>To confirm this email change, please click the button below:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{verification_url}" class="button">Confirm Email Change</a>
                </div>
                
                <p>This link will expire in 24 hours.</p>
                
                <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                <p style="background: #f8f9fa; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px;">
                    {verification_url}
                </p>
                
                <hr style="margin: 30px 0;">
                
                <p><strong>What happens next?</strong></p>
                <ol>
                    <li>Clicking the button will verify your email change</li>
                    <li>Your account email will be updated to: <strong>{new_email}</strong></li>
                    <li>You'll receive a confirmation email at your new address</li>
                    <li>You can now log in with your new email</li>
                </ol>
                
                <p>If you have any questions or concerns, please contact our support team.</p>
                
                <p>Best regards,<br>The MediTrack+ Team</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Plain text version
    plain_message = f"""
    Verify Your Email Change - MediTrack+
    
    Hello,
    
    You have requested to change your MediTrack+ email address from:
    {old_email} to {new_email}
    
    IMPORTANT: If you did not request this change, please ignore this email and contact support immediately.
    
    To confirm this email change, please visit:
    {verification_url}
    
    This link will expire in 24 hours.
    
    What happens next?
    1. Visiting the link will verify your email change
    2. Your account email will be updated to: {new_email}
    3. You'll receive a confirmation email at your new address
    4. You can now log in with your new email
    
    If you have any questions or concerns, please contact our support team.
    
    Best regards,
    The MediTrack+ Team
    """
    
    try:
        from django.core.mail import EmailMultiAlternatives  # Add this import
        
        email = EmailMultiAlternatives(
            subject=subject,
            body=plain_message,
            from_email='MediTrack+ <noreply@meditrackplus.com>',  # Add display name
            to=[old_email],
            reply_to=['support@meditrackplus.com']
        )
        email.attach_alternative(html_message, "text/html")
        email.send()
        
        print(f"Verification email sent to {old_email}")
        return True
    except Exception as e:
        print(f"Error sending verification email: {str(e)}")
        return False

def verify_email_change(request, token):
    """Verify email change from link in email"""
    try:
        # Find the pending email change
        pending_change = PendingEmailChange.objects.get(
            verification_token=token,
            is_verified=False
        )
        
        # Check if token is expired
        if pending_change.is_expired():
            pending_change.delete()
            return render(request, 'mainapp/email_verification_result.html', {
                'success': False,
                'title': 'Link Expired',
                'message': 'This verification link has expired. Please request a new email change.'
            })
        
        # Check if user still exists
        if not pending_change.user:
            pending_change.delete()
            return render(request, 'mainapp/email_verification_result.html', {
                'success': False,
                'title': 'Invalid Request',
                'message': 'User account not found.'
            })
        
        # Check if email is still available
        from django.contrib.auth.models import User
        if User.objects.filter(email=pending_change.new_email).exclude(id=pending_change.user.id).exists():
            pending_change.delete()
            return render(request, 'mainapp/email_verification_result.html', {
                'success': False,
                'title': 'Email Already Taken',
                'message': 'This email address is now in use by another account. Please try a different email.'
            })
        
        # Update user's email
        user = pending_change.user
        old_email = user.email
        user.email = pending_change.new_email
        user.save()
        
        # Mark as verified
        pending_change.is_verified = True
        pending_change.save()
        
        # Send confirmation email to new email
        send_confirmation_email(
            new_email=pending_change.new_email,
            old_email=old_email
        )
        
        return render(request, 'mainapp/email_verification_result.html', {
            'success': True,
            'title': 'Email Changed Successfully!',
            'message': f'Your email has been updated from {old_email} to {pending_change.new_email}. You can now log in with your new email address.'
        })
        
    except PendingEmailChange.DoesNotExist:
        return render(request, 'mainapp/email_verification_result.html', {
            'success': False,
            'title': 'Invalid Link',
            'message': 'This verification link is invalid or has already been used.'
        })
    except Exception as e:
        print(f"Error in verify_email_change: {str(e)}")
        return render(request, 'mainapp/email_verification_result.html', {
            'success': False,
            'title': 'Error',
            'message': 'An error occurred while processing your request.'
        })

def send_confirmation_email(new_email, old_email):
    """Send confirmation email to new email address"""
    subject = "Email Change Confirmed - MediTrack+"
    
    html_message = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; background: #f8faff; }}
            .header {{ background: linear-gradient(135deg, #43a047, #388e3c); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
            .success-icon {{ color: #43a047; font-size: 48px; text-align: center; margin: 20px 0; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>MediTrack+</h1>
                <h2>Email Change Confirmed</h2>
            </div>
            <div class="content">
                <div class="success-icon">
                    <strong>✓</strong>
                </div>
                
                <h3>Hello,</h3>
                <p>Your email address has been successfully updated!</p>
                
                <div style="text-align: center; padding: 20px; background: #f1f8e9; border-radius: 5px; margin: 20px 0;">
                    <p style="font-size: 16px; margin: 0;">
                        <strong>Old email:</strong> {old_email}<br>
                        <strong>New email:</strong> {new_email}
                    </p>
                </div>
                
                <p><strong>Important Information:</strong></p>
                <ul>
                    <li>You can now log in to MediTrack+ using your new email address</li>
                    <li>All future communications will be sent to this email</li>
                    <li>Your account settings and data remain unchanged</li>
                    <li>If you didn't make this change, please contact support immediately</li>
                </ul>
                
                <p>Thank you for keeping your account information up to date!</p>
                
                <p>Best regards,<br>The MediTrack+ Team</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    plain_message = f"""
    Email Change Confirmed - MediTrack+
    
    Hello,
    
    Your email address has been successfully updated!
    
    Old email: {old_email}
    New email: {new_email}
    
    Important Information:
    - You can now log in to MediTrack+ using your new email address
    - All future communications will be sent to this email
    - Your account settings and data remain unchanged
    - If you didn't make this change, please contact support immediately
    
    Thank you for keeping your account information up to date!
    
    Best regards,
    The MediTrack+ Team
    """
    
    try:
        email = EmailMultiAlternatives(
            subject=subject,
            body=plain_message,
            from_email='MediTrack+ <noreply@meditrackplus.com>',  # Add display name
            to=[new_email],
            reply_to=['support@meditrackplus.com']
        )
        email.attach_alternative(html_message, "text/html")
        email.send()
        
        print(f"Confirmation email sent to {new_email}")
        return True
    except Exception as e:
        print(f"Error sending confirmation email: {str(e)}")
        return False

@csrf_exempt
@login_required
@require_POST
def cancel_email_change(request):
    """Cancel pending email change request"""
    try:
        # Delete any pending email change for this user
        deleted_count, _ = PendingEmailChange.objects.filter(
            user=request.user,
            is_verified=False
        ).delete()
        
        if deleted_count > 0:
            return JsonResponse({
                'success': True,
                'message': 'Pending email change request cancelled.'
            })
        else:
            return JsonResponse({
                'success': False,
                'message': 'No pending email change request found.'
            })
            
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error: {str(e)}'
        }, status=500)

@login_required
def check_pending_email(request):
    """Check if user has pending email change"""
    try:
        pending_change = PendingEmailChange.objects.filter(
            user=request.user,
            is_verified=False,
            expires_at__gt=timezone.now()
        ).first()
        
        if pending_change:
            return JsonResponse({
                'success': True,
                'pending_change': {
                    'old_email': pending_change.old_email,
                    'new_email': pending_change.new_email,
                    'expires_at': pending_change.expires_at.isoformat()
                }
            })
        else:
            return JsonResponse({
                'success': True,
                'pending_change': None
            })
            
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error: {str(e)}'
        }, status=500)


def generate_health_report_data(user):
    """Generate comprehensive health data for export"""
    from django.utils import timezone
    from datetime import date
    from django.db.models import Count, Max

    # Profile
    try:
        profile = user.userprofile
    except Exception:
        profile = None

    # Settings
    try:
        user_settings = user.usersettings
    except Exception:
        user_settings = None

    # Messages
    messages = ChatHistory.objects.filter(user=user)

    # Group chats by session_id
    chat_sessions = (
        messages.values('session_id')
        .annotate(
            message_count=Count('id'),
            last_message_time=Max('timestamp')
        )
        .order_by('-last_message_time')
    )

    # Age
    age = None
    if profile and profile.date_of_birth:
        today = date.today()
        age = today.year - profile.date_of_birth.year
        if (today.month, today.day) < (profile.date_of_birth.month, profile.date_of_birth.day):
            age -= 1

    # BMI
    bmi = None
    bmi_category = None
    if profile and profile.height and profile.weight:
        height_m = profile.height / 100
        bmi = round(profile.weight / (height_m * height_m), 1)

        if bmi < 18.5:
            bmi_category = "Underweight"
        elif bmi < 25:
            bmi_category = "Normal"
        elif bmi < 30:
            bmi_category = "Overweight"
        else:
            bmi_category = "Obese"

    allergies_list = []
    if profile and profile.allergies:
        allergies_list = [a.strip() for a in profile.allergies.split(',') if a.strip()]

    medications_list = []
    if profile and profile.medications:
        medications_list = [m.strip() for m in profile.medications.split(',') if m.strip()]

    data_exports = user.data_exports.all()[:10]

    report_data = {
        'export_info': {
            'export_date': timezone.now().strftime('%Y-%m-%d %H:%M:%S'),
            'report_id': f"MEDITRACK-{user.id}-{int(timezone.now().timestamp())}",
            'user_id': user.id,
            'username': user.username,
        },
        'personal_info': {
            'full_name': f"{user.first_name} {user.last_name}".strip() or user.username,
            'email': user.email,
            'date_joined': user.date_joined.strftime('%Y-%m-%d'),
            'last_login': user.last_login.strftime('%Y-%m-%d %H:%M:%S') if user.last_login else 'Never',
        },
        'health_profile': {
            'date_of_birth': profile.date_of_birth.strftime('%Y-%m-%d') if profile and profile.date_of_birth else None,
            'age': age,
            'gender': profile.gender if profile else None,
            'blood_type': profile.blood_type if profile else None,
            'height': f"{profile.height} cm" if profile and profile.height else None,
            'weight': f"{profile.weight} kg" if profile and profile.weight else None,
            'bmi': bmi,
            'bmi_category': bmi_category,
            'allergies': allergies_list,
            'medications': medications_list,
            'phone': profile.phone if profile else None,
        },
        'emergency_contacts': {
            'name': profile.emergency_name if profile else None,
            'relationship': profile.emergency_relation if profile else None,
            'phone': profile.emergency_phone if profile else None,
        },
        'account_settings': {
            'dark_mode_enabled': user_settings.dark_mode if user_settings else False,
            'two_factor_auth': user_settings.two_factor_auth if user_settings else False,
            'session_timeout': f"{user_settings.session_timeout} minutes" if user_settings else "30 minutes",
            'data_encryption': user_settings.data_encryption if user_settings else True,
            'login_notifications': user_settings.login_notifications if user_settings else True,
            'font_size': user_settings.font_size if user_settings else 'medium',
            'theme_color': user_settings.theme_color if user_settings else 'blue',
        },
        'chat_history_summary': {
            'total_chats': chat_sessions.count(),
            'total_messages': messages.count(),
            'recent_chats': [
                {   
                    'title': f"Chat Session {chat['session_id'] or 'Unknown'}",
                    'session_id': chat['session_id'],
                    'message_count': chat['message_count'],
                    'created_date': chat['last_message_time'].strftime('%Y-%m-%d'),
                    'last_message_date': chat['last_message_time'].strftime('%Y-%m-%d')
                }
                for chat in chat_sessions[:10]
            ]
        },
        'export_history': [
            {
                'date': export.created_at.strftime('%Y-%m-%d %H:%M'),
                'status': export.status,
                'format': export.export_format,
                'size': f"{export.file_size / 1024:.1f} KB" if export.file_size else 'N/A'
            }
            for export in data_exports
        ],
        'privacy_note': {
            'message': 'This report contains your personal health information. Please keep it secure.',
            'generated_by': 'MediTrack+ Health Assistant',
            'contact_email': 'support@meditrackplus.com',
            'export_purpose': 'Personal record keeping and health management'
        }
    }

    return report_data


def create_pdf_report(report_data):
    """Create PDF version of health report"""
    buffer = io.BytesIO()
    
    # Create PDF document
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=18
    )
    
    # Get styles
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30,
        textColor=colors.HexColor('#1976d2')
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=16,
        spaceAfter=12,
        spaceBefore=20,
        textColor=colors.HexColor('#2c3e50')
    )
    
    normal_style = ParagraphStyle(
        'Normal',
        parent=styles['Normal'],
        fontSize=10,
        spaceAfter=6
    )
    
    # Build story (content)
    story = []
    
    # Title
    story.append(Paragraph("MediTrack+ Health Report", title_style))
    story.append(Paragraph(f"Generated on: {report_data['export_info']['export_date']}", normal_style))
    story.append(Paragraph(f"Report ID: {report_data['export_info']['report_id']}", normal_style))
    story.append(Spacer(1, 20))
    
    # Personal Information
    story.append(Paragraph("Personal Information", heading_style))
    personal_info = [
        ['Full Name:', report_data['personal_info']['full_name']],
        ['Email:', report_data['personal_info']['email']],
        ['Date Joined:', report_data['personal_info']['date_joined']],
        ['Last Login:', report_data['personal_info']['last_login']],
    ]
    table = Table(personal_info, colWidths=[2*inch, 3*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f8faff')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
    ]))
    story.append(table)
    story.append(Spacer(1, 20))
    
    # Health Profile
    story.append(Paragraph("Health Profile", heading_style))
    health_data = [
        ['Date of Birth:', report_data['health_profile']['date_of_birth'] or 'Not provided'],
        ['Age:', str(report_data['health_profile']['age']) if report_data['health_profile']['age'] else 'Not provided'],
        ['Gender:', report_data['health_profile']['gender'] or 'Not provided'],
        ['Blood Type:', report_data['health_profile']['blood_type'] or 'Not provided'],
        ['Height:', report_data['health_profile']['height'] or 'Not provided'],
        ['Weight:', report_data['health_profile']['weight'] or 'Not provided'],
        ['BMI:', str(report_data['health_profile']['bmi']) if report_data['health_profile']['bmi'] else 'Not provided'],
        ['BMI Category:', report_data['health_profile']['bmi_category'] or 'Not provided'],
    ]
    
    if report_data['health_profile']['allergies']:
        health_data.append(['Allergies:', ', '.join(report_data['health_profile']['allergies'])])
    else:
        health_data.append(['Allergies:', 'None recorded'])
    
    if report_data['health_profile']['medications']:
        health_data.append(['Medications:', ', '.join(report_data['health_profile']['medications'])])
    else:
        health_data.append(['Medications:', 'None recorded'])
    
    health_data.append(['Phone:', report_data['health_profile']['phone'] or 'Not provided'])
    
    table = Table(health_data, colWidths=[2*inch, 3*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f8faff')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
    ]))
    story.append(table)
    story.append(Spacer(1, 20))
    
    # Emergency Contacts
    story.append(Paragraph("Emergency Contacts", heading_style))
    emergency_data = [
        ['Name:', report_data['emergency_contacts']['name'] or 'Not provided'],
        ['Relationship:', report_data['emergency_contacts']['relationship'] or 'Not provided'],
        ['Phone:', report_data['emergency_contacts']['phone'] or 'Not provided'],
    ]
    table = Table(emergency_data, colWidths=[2*inch, 3*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f8faff')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
    ]))
    story.append(table)
    story.append(Spacer(1, 20))
    
    # Account Settings
    story.append(Paragraph("Account Settings", heading_style))
    settings_data = [
        ['Dark Mode:', 'Enabled' if report_data['account_settings']['dark_mode_enabled'] else 'Disabled'],
        ['Two-Factor Auth:', 'Enabled' if report_data['account_settings']['two_factor_auth'] else 'Disabled'],
        ['Session Timeout:', report_data['account_settings']['session_timeout']],
        ['Data Encryption:', 'Enabled' if report_data['account_settings']['data_encryption'] else 'Disabled'],
        ['Login Notifications:', 'Enabled' if report_data['account_settings']['login_notifications'] else 'Disabled'],
        ['Font Size:', report_data['account_settings']['font_size'].title()],
        ['Theme Color:', report_data['account_settings']['theme_color'].title()],
    ]
    table = Table(settings_data, colWidths=[2*inch, 3*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f8faff')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
    ]))
    story.append(table)
    story.append(Spacer(1, 20))
    
    # Chat History Summary
    story.append(Paragraph("Chat History Summary", heading_style))
    chat_summary = [
        ['Total Chats:', str(report_data['chat_history_summary']['total_chats'])],
        ['Total Messages:', str(report_data['chat_history_summary']['total_messages'])],
    ]
    table = Table(chat_summary, colWidths=[2*inch, 3*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f8faff')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
    ]))
    story.append(table)
    
    if report_data['chat_history_summary']['recent_chats']:
        story.append(Spacer(1, 10))
        story.append(Paragraph("Recent Chats:", normal_style))
        for chat in report_data['chat_history_summary']['recent_chats'][:3]:  # Show only 3 recent chats
            story.append(Paragraph(f"• {chat['title']} ({chat['created_date']}) - {chat['message_count']} messages", normal_style))
    
    story.append(Spacer(1, 20))
    
    # Privacy Note
    story.append(Paragraph("Privacy Notice", heading_style))
    privacy_text = """
    <b>Important:</b> This document contains sensitive personal health information. Please:
    <br/><br/>
    1. Store it in a secure location<br/>
    2. Do not share with unauthorized individuals<br/>
    3. Dispose of properly when no longer needed<br/>
    4. Contact support if you suspect unauthorized access<br/>
    <br/>
    <i>Generated for personal health management purposes.</i>
    """
    story.append(Paragraph(privacy_text, normal_style))
    
    # Build PDF
    doc.build(story)
    buffer.seek(0)
    
    return buffer

def create_csv_data(report_data):
    """Create CSV data from report"""
    output = StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow(['MediTrack+ Health Report'])
    writer.writerow(['Generated on:', report_data['export_info']['export_date']])
    writer.writerow(['Report ID:', report_data['export_info']['report_id']])
    writer.writerow([])
    
    # Personal Information
    writer.writerow(['PERSONAL INFORMATION'])
    for key, value in report_data['personal_info'].items():
        writer.writerow([key.replace('_', ' ').title() + ':', value])
    writer.writerow([])
    
    # Health Profile
    writer.writerow(['HEALTH PROFILE'])
    for key, value in report_data['health_profile'].items():
        if isinstance(value, list):
            writer.writerow([key.replace('_', ' ').title() + ':', ', '.join(value)])
        else:
            writer.writerow([key.replace('_', ' ').title() + ':', value or 'Not provided'])
    writer.writerow([])
    
    # Emergency Contacts
    writer.writerow(['EMERGENCY CONTACTS'])
    for key, value in report_data['emergency_contacts'].items():
        writer.writerow([key.replace('_', ' ').title() + ':', value or 'Not provided'])
    writer.writerow([])
    
    # Account Settings
    writer.writerow(['ACCOUNT SETTINGS'])
    for key, value in report_data['account_settings'].items():
        if isinstance(value, bool):
            writer.writerow([key.replace('_', ' ').title() + ':', 'Yes' if value else 'No'])
        else:
            writer.writerow([key.replace('_', ' ').title() + ':', value])
    writer.writerow([])
    
    # Chat Summary
    writer.writerow(['CHAT HISTORY SUMMARY'])
    writer.writerow(['Total Chats:', report_data['chat_history_summary']['total_chats']])
    writer.writerow(['Total Messages:', report_data['chat_history_summary']['total_messages']])
    writer.writerow([])
    
    output.seek(0)
    return output.getvalue()

def create_zip_file(report_data, pdf_buffer, csv_data):
    """Create ZIP file containing all export data"""
    zip_buffer = io.BytesIO()
    
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        # Add PDF
        zip_file.writestr('MediTrack_Health_Report.pdf', pdf_buffer.read())
        
        # Add CSV
        zip_file.writestr('MediTrack_Health_Data.csv', csv_data)
        
        # Add JSON data
        json_data = json.dumps(report_data, indent=2, default=str)
        zip_file.writestr('MediTrack_Complete_Data.json', json_data)
        
        # Add README
        readme_content = """
        MediTrack+ Health Data Export
        =============================
        
        This ZIP file contains your complete health data from MediTrack+.
        
        Files included:
        1. MediTrack_Health_Report.pdf - Comprehensive health report (recommended for reading)
        2. MediTrack_Health_Data.csv - Health data in spreadsheet format
        3. MediTrack_Complete_Data.json - Complete data in JSON format
        
        Privacy Notice:
        ---------------
        This data contains sensitive personal health information. 
        Please handle it with care and store it securely.
        
        For questions or concerns, contact: support@meditrackplus.com
        
        Generated on: {date}
        Report ID: {report_id}
        """.format(
            date=report_data['export_info']['export_date'],
            report_id=report_data['export_info']['report_id']
        )
        zip_file.writestr('README.txt', readme_content.strip())
    
    zip_buffer.seek(0)
    return zip_buffer

def send_export_email(user, data_export, download_url):
    """Send email with export download link"""
    subject = "Your MediTrack+ Health Data Export is Ready"
    
    html_message = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #0f172a;
                    background-color: #f8faff;
                    margin: 0;
                    padding: 0;
                }}

                .container {{
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background: #f8faff;
                }}

                .header {{
                    background: linear-gradient(135deg, #1976d2, #1565c0);
                    color: white;
                    padding: 30px;
                    text-align: center;
                    border-radius: 10px 10px 0 0;
                }}

                .content {{
                    background: #ffffff;
                    padding: 30px;
                    border-radius: 0 0 10px 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }}

                .info-box {{
                    background: #e8f5e9;
                    border-left: 4px solid #43a047;
                    padding: 15px;
                    margin: 20px 0;
                    color: #1b5e20;
                }}

                .download-box {{
                    background: #e3f2fd;
                    border: 2px dashed #1976d2;
                    border-radius: 10px;
                    padding: 20px;
                    text-align: center;
                    margin: 20px 0;
                    color: #0f172a;
                }}

                .download-box h3 {{
                    color: #0d47a1;
                    font-weight: bold;
                    margin-bottom: 10px;
                }}

                .download-box p {{
                    color: #1e293b;
                }}

                .button {{
                    display: inline-block;
                    background: linear-gradient(135deg, #1976d2, #1565c0);
                    color: #ffffff !important;
                    padding: 14px 26px;
                    text-decoration: none;
                    border-radius: 6px;
                    font-weight: bold;
                    margin: 15px 0;
                    font-size: 15px;
                }}

                .button svg {{
                    width: 18px;
                    height: 18px;
                    vertical-align: middle;
                    margin-right: 8px;
                    fill: none;
                    stroke: white;
                    stroke-width: 2.2;
                }}

                .warning {{
                    background: #fff3cd;
                    border-left: 4px solid #ffc107;
                    padding: 15px;
                    margin: 20px 0;
                    color: #856404;
                }}

                .footer {{
                    text-align: center;
                    color: #64748b;
                    font-size: 12px;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #e5e7eb;
                }}

                ul, ol {{
                    padding-left: 20px;
                }}
            </style>
        </head>

        <body>
            <div class="container">
                <div class="header">
                    <h1>MediTrack+</h1>
                    <h2>Health Data Export Ready</h2>
                </div>

                <div class="content">
                    <h3>Hello {user.first_name or user.username},</h3>
                    <p>Your MediTrack+ health data export is ready for download!</p>

                    <div class="info-box">
                        <p><strong>Export Details:</strong></p>
                        <ul>
                            <li>Generated on: {data_export.created_at.strftime('%B %d, %Y at %I:%M %p')}</li>
                            <li>Format: {data_export.export_format.upper()}</li>
                            <li>Expires: {data_export.expires_at.strftime('%B %d, %Y')}</li>
                        </ul>
                    </div>

                    <div class="download-box">
                        <h3>📁 Download Your Health Data</h3>
                        <p>Click the button below to download your complete health report:</p>

                        <a href="{download_url}" class="button">
                            <svg viewBox="0 0 24 24">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="7 10 12 15 17 10"/>
                                <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                            Download Health Report
                        </a>

                        <p style="font-size: 12px; margin-top: 10px; color: #334155;">
                            <em>This link will expire in 7 days for security reasons.</em>
                        </p>
                    </div>

                    <div class="warning">
                        <p><strong>⚠️ Security Notice:</strong></p>
                        <p>Your export contains sensitive health information including:</p>
                        <ul>
                            <li>Personal health profile</li>
                            <li>Medical information</li>
                            <li>Chat history summary</li>
                            <li>Account settings</li>
                        </ul>
                        <p>Please store this file securely and do not share it with unauthorized individuals.</p>
                    </div>

                    <h4>What's included in your export?</h4>
                    <ol>
                        <li><strong>Comprehensive Health Report (PDF)</strong> – Easy-to-read summary</li>
                        <li><strong>Health Data (CSV)</strong> – Spreadsheet-friendly format</li>
                        <li><strong>Complete Data (JSON)</strong> – Machine-readable export</li>
                        <li><strong>Export Summary</strong> – Metadata & history</li>
                    </ol>

                    <p>If you didn't request this export, contact our support team immediately.</p>

                    <div class="footer">
                        <p>MediTrack+ Health Assistant</p>
                        <p>This is an automated message. Please do not reply.</p>
                        <p>Support: support@meditrackplus.com</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
    
    plain_message = f"""
    MediTrack+ Health Data Export Ready
    
    Hello {user.first_name or user.username},
    
    Your MediTrack+ health data export is ready for download!
    
    Export Details:
    - Generated on: {data_export.created_at.strftime('%B %d, %Y at %I:%M %p')}
    - Format: {data_export.export_format.upper()}
    - Expires: {data_export.expires_at.strftime('%B %d, %Y')}
    
    Download Link: {download_url}
    
    IMPORTANT: This link will expire in 7 days for security reasons.
    
    What's included in your export?
    1. Comprehensive Health Report (PDF) - Easy-to-read summary
    2. Health Data (CSV) - Structured data for spreadsheets
    3. Complete Data (JSON) - All data in machine-readable format
    4. Export Summary - Details about this export
    
    SECURITY NOTICE:
    Your export contains sensitive health information. Please store this file securely 
    and do not share it with unauthorized individuals.
    
    If you didn't request this export or have any concerns, please contact our support team immediately.
    
    For support: support@meditrackplus.com
    
    --
    MediTrack+ Health Assistant
    This is an automated message.
    """
    
    try:
        email = EmailMultiAlternatives(
            subject=subject,
            body=plain_message,
            from_email='MediTrack+ <exports@meditrackplus.com>',  # Add display name
            to=[user.email],
            reply_to=['support@meditrackplus.com']
        )
        email.attach_alternative(html_message, "text/html")
        email.send()
        
        print(f"Export email sent to {user.email}")
        return True
    except Exception as e:
        print(f"Error sending export email: {str(e)}")
        return False

@login_required
def download_export(request, token):
    """Download exported data"""
    try:
        data_export = DataExport.objects.get(export_token=token)

        # Check if expired
        if data_export.is_expired():
            return render(request, 'mainapp/export_download.html', {
                'success': False,
                'title': 'Link Expired',
                'message': 'This download link has expired. Please request a new export.'
            })
        
        # Check if not completed
        if data_export.status != 'completed':
            return render(request, 'mainapp/export_download.html', {
                'success': False,
                'title': 'Export Not Ready',
                'message': 'Your export is still being processed. Please check your email for the download link when ready.'
            })
        
        # Check if file exists
        if not data_export.file_path or not os.path.exists(data_export.file_path):
            return render(request, 'mainapp/export_download.html', {
                'success': False,
                'title': 'File Not Found',
                'message': 'The export file could not be found. Please request a new export.'
            })
        
        # Show download page
        return render(request, 'mainapp/export_download.html', {
            'success': True,
            'title': 'Export Ready for Download',
            'message': 'Your health data export is ready. Click the button below to download.',
            'export': data_export
        })
            
    except DataExport.DoesNotExist:
        return render(request, 'mainapp/export_download.html', {
            'success': False,
            'title': 'Invalid Link',
            'message': 'This download link is invalid or has already been used.'
        })
    except Exception as e:
        print(f"Error in download_export: {str(e)}")
        return render(request, 'mainapp/export_download.html', {
            'success': False,
            'title': 'Error',
            'message': 'An error occurred while processing your download.'
        })

@login_required
def download_export_file(request, token):
    """Direct file download endpoint"""
    try:
        data_export = DataExport.objects.get(
            export_token=token,
            user=request.user,
            status='completed'
        )
        
        # Check if expired
        if data_export.is_expired():
            return HttpResponse("Download link expired", status=410)
        
        # Check if file exists
        if not data_export.file_path or not os.path.exists(data_export.file_path):
            return HttpResponse("File not found", status=404)
        
        # Serve file for download
        with open(data_export.file_path, 'rb') as f:
            response = HttpResponse(f.read(), content_type='application/zip')
            response['Content-Disposition'] = f'attachment; filename="MediTrack_Health_Export_{request.user.username}_{data_export.created_at.strftime("%Y%m%d")}.zip"'
            return response
            
    except DataExport.DoesNotExist:
        return HttpResponse("Invalid download link", status=404)
    except Exception as e:
        print(f"Error downloading export file: {str(e)}")
        return HttpResponse("Error downloading file", status=500)

@login_required
def check_exports(request):
    """Check user's recent exports"""
    try:
        recent_exports = DataExport.objects.filter(
            user=request.user
        ).order_by('-created_at')[:3]
        
        exports_data = []
        for export in recent_exports:
            exports_data.append({
                'id': export.id,
                'token': export.export_token,
                'status': export.status,
                'created_at': export.created_at.isoformat(),
                'expires_at': export.expires_at.isoformat() if export.expires_at else None,
                'file_size': export.file_size,
                'format': export.export_format,
            })
        
        return JsonResponse({
            'success': True,
            'recent_exports': exports_data
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error: {str(e)}'
        }, status=500)
    
@csrf_exempt
@login_required
@require_POST
def clear_all_chat(request):
    """Clear all chat history for the current user"""
    try:
        user = request.user
        
        # Get count before deletion
        chat_count = ChatHistory.objects.filter(user=user).count()
        
        # Delete all ChatHistory records (cascade will delete related Messages)
        ChatHistory.objects.filter(user=user).delete()
        
        return JsonResponse({
            'success': True,
            'message': f'Cleared {chat_count} chat sessions successfully.',
            'cleared_count': chat_count,
            'clear_local_storage': True  # Add this flag
        })
        
    except Exception as e:
        print(f"Error clearing chat history: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Error clearing chat history: {str(e)}'
        }, status=500)