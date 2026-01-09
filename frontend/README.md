# RALPH Frontend

React dashboard for the RALPH coaching platform.

## Components

### AthleteDashboard.jsx

The main athlete-facing dashboard showing:
- Today's session with targets
- Mental skills framework (collapsible)
- Weekly plan overview
- Progress toward goals
- Training load metrics

## Usage

### Option 1: Standalone with Vite

```bash
# Create new Vite React project
npm create vite@latest ralph-frontend -- --template react
cd ralph-frontend

# Install dependencies
npm install recharts lucide-react

# Copy AthleteDashboard.jsx to src/components/
# Update App.jsx to use it

# Run
npm run dev
```

### Option 2: Add to existing React project

```bash
npm install recharts lucide-react
```

Copy `AthleteDashboard.jsx` to your components folder.

## Configuration

Update the API URL in the component:

```javascript
const API_BASE = 'http://localhost:8000';  // Development
// const API_BASE = 'https://api.yoursite.com';  // Production
```

## Styling

Uses Tailwind CSS. Add to your `tailwind.config.js`:

```javascript
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

## Features

- **Responsive** - Works on mobile and desktop
- **Dark theme** - Easy on the eyes for early morning workouts
- **Progressive disclosure** - Mental skills expand on tap
- **Real-time** - Connects to RALPH API for live data
