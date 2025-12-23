from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.urls import reverse

# Create your models here.
# mainapp/models.py
from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
        ('prefer-not-to-say', 'Prefer not to say'),
    ]

    BLOOD_CHOICES = [
        ('A+', 'A+'), ('A-', 'A-'),
        ('B+', 'B+'), ('B-', 'B-'),
        ('AB+', 'AB+'), ('AB-', 'AB-'),
        ('O+', 'O+'), ('O-', 'O-'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    profile_photo = models.ImageField(upload_to='profiles/', blank=True, null=True)

    # Personal Info
    phone = models.CharField(max_length=20, blank=True)
    date_of_birth = models.DateField(blank=True, null=True)
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES)
    
    # Medical Info
    blood_type = models.CharField(max_length=5, choices=BLOOD_CHOICES, blank=True)
    height = models.PositiveIntegerField(blank=True, null=True)
    weight = models.PositiveIntegerField(blank=True, null=True)
    allergies = models.TextField(blank=True)
    medications = models.TextField(blank=True)

    # Emergency Contact
    emergency_name = models.CharField(max_length=100, blank=True)
    emergency_relation = models.CharField(max_length=50, blank=True)
    emergency_phone = models.CharField(max_length=20, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} Profile"

class ChatHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chats')
    title = models.CharField(max_length=200, default='New Chat')
    message = models.TextField(blank=True)  # Make blank=True
    response = models.TextField(blank=True)  # Make blank=True
    sender = models.CharField(max_length=10, choices=[('user', 'User'), ('ai', 'AI')])
    session_id = models.CharField(max_length=100, blank=True, default='')  # Add this field
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.user.username} - {self.sender} - {self.timestamp}"
    
class Message(models.Model):
    """Model to store individual messages in a chat"""
    ROLE_CHOICES = [
        ('user', 'User'),
        ('assistant', 'Assistant'),
        ('system', 'System'),
    ]
    
    chat_history = models.ForeignKey(ChatHistory, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    content = models.TextField()
    timestamp = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ['timestamp']
    
    def __str__(self):
        return f"{self.role}: {self.content[:50]}..."
    
# Complete UserSettings model with appearance fields
class UserSettings(models.Model):
    """User preferences and settings"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='settings')
    
    # Privacy & Security Settings
    two_factor_auth = models.BooleanField(default=False)
    session_timeout = models.IntegerField(default=30)  # in minutes
    login_notifications = models.BooleanField(default=True)
    data_encryption = models.BooleanField(default=True)
    
    # Appearance Settings
    dark_mode = models.BooleanField(default=False)
    font_size = models.CharField(max_length=20, default='medium', choices=[
        ('small', 'Small'),
        ('medium', 'Medium'),
        ('large', 'Large'),
        ('x-large', 'Extra Large')
    ])
    theme_color = models.CharField(max_length=20, default='blue', choices=[
        ('blue', 'Blue'),
        ('green', 'Green'),
        ('purple', 'Purple'),
        ('orange', 'Orange')
    ])
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = "User Settings"
    
    def __str__(self):
        return f"Settings for {self.user.username}"

# Add to your models.py
class PendingEmailChange(models.Model):
    """Track pending email change requests"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='pending_email_changes')
    old_email = models.EmailField()
    new_email = models.EmailField()
    verification_token = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_verified = models.BooleanField(default=False)
    
    class Meta:
        verbose_name_plural = "Pending Email Changes"
    
    def __str__(self):
        return f"{self.user.username}: {self.old_email} → {self.new_email}"
    
    def is_expired(self):
        return timezone.now() > self.expires_at
    
# Add to models.py
class DataExport(models.Model):
    """Track data exports for users"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='data_exports')
    export_token = models.CharField(max_length=100, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    file_path = models.CharField(max_length=500, blank=True, null=True)
    file_size = models.IntegerField(null=True, blank=True)  # Size in bytes
    export_format = models.CharField(max_length=20, default='zip', choices=[('zip', 'ZIP'), ('pdf', 'PDF')])
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField()
    
    class Meta:
        verbose_name_plural = "Data Exports"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Data Export for {self.user.username} - {self.status}"
    
    def is_expired(self):
        return timezone.now() > self.expires_at
    
    def get_download_url(self, request):
        return request.build_absolute_uri(
            reverse('download_export', kwargs={'token': self.export_token})
        )