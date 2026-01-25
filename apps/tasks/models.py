import uuid
from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError


class Task(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tasks"
    )

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    priority = models.CharField(
        max_length=20,
        choices=[
            ("low", "Low"),
            ("medium", "Medium"),
            ("high", "High")
        ],
        default="medium"
    )

    status = models.CharField(
        max_length=20,
        choices=[
            ("pending", "Pending"),
            ("in_progress", "In Progress"),
            ("completed", "Completed"),
            ("cancelled", "Cancelled")
        ],
        default="pending"
    )
    completed_at = models.DateTimeField(null=True, blank=True)

    due_date = models.DateField(null=True, blank=True)
    due_time = models.TimeField(null=True, blank=True)

    is_active = models.BooleanField(default=True)

    tags = models.ManyToManyField(
        "tasks.Tag",
        through="tasks.TaskTag",
        related_name="tasks",
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class SubTask(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    parent_task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name="subtasks"
    )

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    status = models.CharField(
        max_length=20,
        choices=[
            ("pending", "Pending"),
            ("completed", "Completed")
        ],
        default="pending"
    )
    completed_at = models.DateTimeField(null=True, blank=True)
    order_index = models.PositiveIntegerField(default=0)

    estimated_hours = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True
    )

    

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order_index"]

    def __str__(self):
        return self.title


class Tag(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tags"
    )

    name = models.CharField(max_length=50)
    color = models.CharField(max_length=7, default="#3B82F6")

    # usage_count = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "name")
        ordering = ["name"]

    def __str__(self):
        return self.name


class TaskTag(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, db_index=True)
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE, db_index=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("task", "tag")


class TaskDependency(models.Model):
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name="dependencies"
    )

    depends_on = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name="dependents"
    )

    dependency_type = models.CharField(
        max_length=20,
        choices=[
            ("blocks", "Blocks"),
            ("related_to", "Related To")
        ],
        default="blocks"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("task", "depends_on")

    def clean(self):
        if self.task_id == self.depends_on_id:
            raise ValidationError("Task cannot depend on itself")