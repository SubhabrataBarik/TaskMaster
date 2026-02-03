# Create function: analyze_task_for_breakdown(title, description)

# Responsibilities:
# - Construct a prompt for the LLM
# - Call OpenAI / Anthropic / Hugging Face
# - Parse AI response into structured subtasks
# - Return Python dict in format:
#   {
#     "subtasks": [
#       {"title": "...", "estimated_time": "..."},
#       ...
#     ],
#     "reasoning": "..."
#   }

# Create function: suggest_priority(title, description, due_date)

# Responsibilities:
# - Build a prompt that includes urgency signals
# - Call AI model
# - Return structured dict:
#   {
#     "suggested_priority": "high",
#     "confidence": 0.95,
#     "reasoning": "..."
#   }

# Optional best practice:
# - Wrap AI calls in try/except
# - Add fallback model if primary fails
# - Log request + response to InferenceLog
