# RALPH Backend

FastAPI server for the RALPH coaching platform.

## Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Environment Variables

Create a `.env` file:

```env
DATABASE_URL=sqlite:///./ralph.db  # or PostgreSQL URL for production
SECRET_KEY=your-secret-key-here
```

## Project Structure

```
backend/
├── main.py              # FastAPI app and routes
├── requirements.txt     # Python dependencies
├── core/                # Training logic
│   ├── auto_evaluator.py      # Workout analysis
│   ├── plan_engine.py         # Dynamic adjustments
│   ├── training_plan.py       # Periodization
│   ├── emotional_skills_v2.py # Mental frameworks
│   └── visualizer.py          # Progress charts
├── models/              # Database
│   ├── database.py      # SQLAlchemy models
│   └── schemas.py       # Pydantic schemas
└── services/            # Business logic
    ├── dashboard_service.py   # Dashboard generation
    └── workout_service.py     # Workout processing
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Deployment

For production, use PostgreSQL and a proper web server:

```bash
# Install production dependencies
pip install gunicorn psycopg2-binary

# Run with Gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
```
