# TaskMaster AI

AI-powered task management system with intelligent prioritization, RAG-based search, and productivity analytics.

## Tech Stack
- Backend: Django, Django REST Framework
- Auth: JWT, OAuth (Google/GitHub)
- Database: PostgreSQL
- Async Tasks: Celery + Redis
- AI: LangChain, OpenAI API, FAISS, Hugging Face (DistilBERT)
- DevOps: Docker, GitHub Actions

## Features
- User authentication & authorization
- Task CRUD with dependencies
- AI-powered task prioritization
- RAG-based semantic task search
- Background embedding generation
- Analytics dashboard APIs

## Setup (Backend)

```bash
git clone https://github.com/<username>/taskmaster-ai.git
cd taskmaster-ai
python -m venv venv
source venv/bin/activate
pip install -r requirements/base.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver
