from django.contrib import admin
from .models import *
# Register your models here.
admin.site.register(OTPVerification)
admin.site.register(PendingUser)
admin.site.register(PasswordResetToken)