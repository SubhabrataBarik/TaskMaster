# Create class BreakdownTaskRequestSerializer(serializers.Serializer):

# Fields:
# - title (CharField, required=True, max_length=255)
# - description (CharField, required=False, allow_blank=True)

# Validation rules:
# - title must not be empty
# - strip whitespace
# - optionally: enforce minimum length (e.g., 5 characters)

# Create class SubtaskSuggestionSerializer(serializers.Serializer):
# Fields:
# - title (CharField)
# - estimated_time (CharField)  # e.g., "2h"

# Create class BreakdownTaskResponseSerializer(serializers.Serializer):
# Fields:
# - subtasks (ListField of SubtaskSuggestionSerializer)
# - reasoning (CharField)

# Create class SuggestPriorityRequestSerializer(serializers.Serializer):

# Fields:
# - title (CharField, required=True)
# - description (CharField, required=False)
# - due_date (DateField, required=False)

# Validation:
# - Ensure due_date is not in the past (optional but good)

# Create class SuggestPriorityResponseSerializer(serializers.Serializer):

# Fields:
# - suggested_priority (ChoiceField: "low", "medium", "high")
# - confidence (FloatField between 0 and 1)
# - reasoning (CharField)
