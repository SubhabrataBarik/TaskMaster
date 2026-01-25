from django_filters import rest_framework as filters
from .models import Task


class TaskFilter(filters.FilterSet):
    status = filters.CharFilter(field_name="status", lookup_expr="iexact")
    priority = filters.CharFilter(field_name="priority", lookup_expr="iexact")

    due_date__lte = filters.DateFilter(field_name="due_date", lookup_expr="lte")
    due_date__gte = filters.DateFilter(field_name="due_date", lookup_expr="gte")

    tags = filters.CharFilter(method="filter_tags")

    class Meta:
        model = Task
        fields = [
            "status",
            "priority",
            "due_date__lte",
            "due_date__gte",
            "tags",
        ]

    def filter_tags(self, queryset, name, value):
        tag_names = [v.strip() for v in value.split(",")]
        return queryset.filter(tags__name__in=tag_names).distinct()
