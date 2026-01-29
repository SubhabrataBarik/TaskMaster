# Base
FROM python:3.11-slim

# Working Dir
WORKDIR /app

# Copy & Run <-> Each instruction = one layer
# if nothing changed in this step, reuse cache
COPY COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
RUN python manage.py collectstatic --noinput

# Port


# Command
CMD ["gunicorn", "TaskMaster.wsgi:application"]