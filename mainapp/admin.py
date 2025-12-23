from django.contrib import admin
from .models import *

# Register your models here.
admin.site.register(UserProfile)
admin.site.register(ChatHistory)
admin.site.register(Message)
admin.site.register(UserSettings)
admin.site.register(PendingEmailChange)
admin.site.register(DataExport)