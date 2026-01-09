# RALPH - Real-time Athlete Learning & Performance Handler

An intelligent coaching platform that combines **data-driven training plans** with **elite athlete mental frameworks**.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## 🎯 What It Does

RALPH transforms raw workout data into personalized coaching:

```
Workout Files → Analysis → Gap Assessment → Training Plan → Daily Actions + Mental Skills
     (.fit)                   (vs goal)        (periodized)    (Grover, Kobe, Jackson)
```

### Core Features

- **Automatic Workout Evaluation** - Parse FIT files, extract physiological signals
- **Gap Analysis** - Quantify distance between current fitness and race goals
- **Periodized Plans** - BASE → BUILD → PEAK → TAPER with progressive overload
- **Dynamic Adjustments** - Modify training based on recovery and performance
- **Mental Skills Integration** - Elite athlete frameworks (Grover, Kobe, Dauwalter, Jackson)

## 🏗️ Architecture

```
ralph/
├── backend/                 # Python FastAPI server
│   ├── main.py             # API endpoints
│   ├── core/               # Training logic
│   │   ├── auto_evaluator.py
│   │   ├── plan_engine.py
│   │   ├── training_plan.py
│   │   └── emotional_skills_v2.py
│   ├── models/             # Database models
│   ├── services/           # Business logic
│   └── requirements.txt
│
└── frontend/               # React dashboard
    └── AthleteDashboard.jsx
```

## 🚀 Quick Start

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn main:app --reload
```

API will be available at `http://localhost:8000`

### Frontend

```bash
cd frontend

# If using with a React project
npm install recharts lucide-react
# Copy AthleteDashboard.jsx to your components folder
```

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/athletes/{id}/dashboard` | GET | Full athlete dashboard with today's session |
| `/athletes/{id}/workouts` | POST | Upload workout file (.fit) |
| `/athletes/{id}/plan` | GET | Current training plan |
| `/athletes/{id}/recovery` | POST | Log recovery metrics |
| `/coaches/{id}/athletes` | GET | List coach's athletes |

### Example Response: Dashboard

```json
{
  "athlete_name": "Alex Chen",
  "today_session": {
    "title": "Threshold Intervals",
    "description": "4×10min @ 245-255W",
    "why_it_matters": "This is where you get faster...",
    "mindset": {
      "key_phrase": "This is information, not suffering",
      "source": "Courtney Dauwalter",
      "mantras": ["Earn it.", "One more.", "I've done this before."],
      "attention_strategy": "Use Grover's 'don't think' approach..."
    }
  },
  "gap_analysis": {
    "ftp_current": 258,
    "ftp_target": 280,
    "feasibility_pct": 85
  }
}
```

## 🧠 Mental Skills Framework

RALPH integrates wisdom from elite athletes:

| Source | Key Concept | Applied To |
|--------|-------------|------------|
| **Tim Grover** | "Don't think. Execute." | VO2max intervals |
| **Courtney Dauwalter** | Pain as information | Threshold work |
| **Phil Jackson** | Present moment focus | Long sessions |
| **Kobe Bryant** | Obsessive detail | Skill refinement |
| **Curt Cignetti** | One-game season | Race day |

## 📊 Physiological Models

- **TSS/IF/NP** - Training Stress Score, Intensity Factor, Normalized Power
- **CTL/ATL/TSB** - Chronic/Acute Training Load, Training Stress Balance
- **Decoupling** - Aerobic efficiency drift
- **ACWR** - Acute:Chronic Workload Ratio (injury risk)

## 🗺️ Roadmap

- [x] Core training plan engine
- [x] Workout file parsing (FIT)
- [x] Mental skills integration
- [x] REST API
- [x] React dashboard
- [ ] Garmin Connect OAuth sync
- [ ] WHOOP integration
- [ ] Push notifications
- [ ] Coach multi-athlete view
- [ ] Mobile app

## 📄 License

MIT - Use freely for your coaching practice.

## 🙏 Acknowledgments

- Training metrics based on Coggan/Allen power methodology
- Mental frameworks inspired by Tim Grover's "Relentless", Phil Jackson's Zen coaching
- Built for endurance coaches who want to deliver elite-level guidance
