from django_filters import rest_framework as filters
from .models import Task
from django.utils import timezone


class TaskFilter(filters.FilterSet):

    # single-value filters
    status = filters.CharFilter(field_name="status", lookup_expr="iexact")
    priority = filters.CharFilter(field_name="priority", lookup_expr="iexact")

    # multi-value filters (IMPORTANT)
    status__in = filters.CharFilter(method="filter_status_in")
    priority__in = filters.CharFilter(method="filter_priority_in")

    # date filters
    due_date__lte = filters.DateFilter(field_name="due_date", lookup_expr="lte")
    due_date__gte = filters.DateFilter(field_name="due_date", lookup_expr="gte")

    # tags
    tags = filters.CharFilter(method="filter_tags")

    # timeline
    timeline = filters.CharFilter(method="filter_timeline")

    class Meta:
        model = Task
        fields = [
            "status",
            "priority",
            "status__in",
            "priority__in",
            "due_date__lte",
            "due_date__gte",
            "tags",
            "timeline",
        ]

    def filter_status_in(self, queryset, name, value):
        values = [v.strip() for v in value.split(",")]
        return queryset.filter(status__in=values)

    def filter_priority_in(self, queryset, name, value):
        values = [v.strip() for v in value.split(",")]
        return queryset.filter(priority__in=values)

    def filter_tags(self, queryset, name, value):
        tag_names = [v.strip() for v in value.split(",")]
        return queryset.filter(tags__name__in=tag_names).distinct()

    def filter_timeline(self, queryset, name, value):
        today = timezone.localdate()

        if value == "today":
            return queryset.filter(due_date=today)

        if value == "overdue":
            return queryset.filter(
                due_date__lt=today
            ).exclude(status="completed")

        if value == "upcoming":
            return queryset.filter(due_date__gt=today)

        return queryset
