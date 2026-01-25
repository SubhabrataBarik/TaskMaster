from django.contrib import admin
from .models import Task, SubTask, Tag, TaskDependency, TaskTag


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "user",
        "priority",
        "status",
        "due_date",
        "is_active",
        "created_at",
    )
    list_filter = ("status", "priority", "is_active")
    search_fields = ("title", "description")
    ordering = ("-created_at",)


@admin.register(SubTask)
class SubTaskAdmin(admin.ModelAdmin):
    list_display = ("title", "parent_task", "status", "order_index")
    list_filter = ("status",)
    ordering = ("order_index",)


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ("name", "user", "color")
    search_fields = ("name",)


admin.site.register(TaskDependency)
admin.site.register(TaskTag)
