import React, { useState } from "react";

// Sample data representing what comes from RALPH API
const DASHBOARD_DATA = {
  athlete_name: "Alex Chen",
  avatar_initials: "AC",
  goal_race_name: "Ironman 70.3 Santa Cruz",
  days_remaining: 158,
  current_phase: "BUILD",
  recovery_status: "green",
  recovery_score: 72,
  today_session: {
    title: "Threshold Intervals",
    description: "4Ã—10min @ 245-255W with 3min recovery",
    duration_minutes: 70,
    session_type: "threshold",
    is_key_session: true,
    priority: 5,
    target_display: "245-255W",
    why_it_matters: "This is where you get faster. The burn is the adaptation signal.",
    if_recovery_yellow: "Reduce to 235-245W",
    if_recovery_red: "Convert to Z2 endurance",
    mindset: {
      // Simplified - just the essentials
      key_phrase: "This is information, not suffering",
      source: "Courtney Dauwalter",
      elite_reframe: "The discomfort tells me I'm working hardâ€”exactly what I came to do.",
      mantras: ["Earn it.", "One more.", "I've done this before."],
      // Detailed content for expanded view
      full: {
        amateur_narrative: "This is going to hurt. I hate threshold work. I hope I can survive it.",
        attention_strategy: `â€¢ This interval is the ONLY interval
â€¢ Don't count remainingâ€”that creates dread  
â€¢ When it ends, the next becomes the only one
â€¢ "Don't think. You already know what to do."`,
        skill_description: "When you feel 'pain,' get specific: Where exactly? Sharp or dull? You're a scientist collecting data, not a victim.",
        success_indicator: "You can describe the sensation without using the word 'pain'"
      }
    }
  },
  week_sessions: [
    { day_name: "Mon", is_today: false, session: null, is_done: true },
    { day_name: "Tue", is_today: false, session: { title: "Threshold", session_type: "threshold", duration_minutes: 70, is_key_session: true }, is_done: true },
    { day_name: "Wed", is_today: false, session: { title: "Easy Spin", session_type: "recovery", duration_minutes: 45 }, is_done: false },
    { day_name: "Thu", is_today: true, session: { title: "Tempo Run", session_type: "tempo", duration_minutes: 50, is_key_session: true }, is_done: false },
    { day_name: "Fri", is_today: false, session: { title: "Recovery", session_type: "recovery", duration_minutes: 30 }, is_done: false },
    { day_name: "Sat", is_today: false, session: { title: "Long Ride", session_type: "long", duration_minutes: 150, is_key_session: true }, is_done: false },
    { day_name: "Sun", is_today: false, session: { title: "Long Run", session_type: "endurance", duration_minutes: 75 }, is_done: false },
  ],
  gap_analysis: { ftp_current: 258, ftp_target: 280, pace_current: 388, pace_target: 360, feasibility_pct: 85 },
  load_metrics: { ctl: 68, atl: 62, tsb: 6, form: "RECOVERED" },
  phases: [
    { name: "BASE", status: "completed", weeks: 4 },
    { name: "BUILD", status: "current", weeks: 6 },
    { name: "PEAK", status: "upcoming", weeks: 4 },
    { name: "TAPER", status: "upcoming", weeks: 2 }
  ]
};

const formatPace = (s) => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;

const getTypeColor = (type) => ({
  threshold: "from-rose-500 to-orange-500",
  tempo: "from-amber-500 to-yellow-500",
  long: "from-violet-500 to-purple-500",
  endurance: "from-blue-500 to-cyan-500",
  recovery: "from-emerald-500 to-green-500",
})[type] || "from-slate-500 to-slate-600";

const GlowCard = ({ children, className = "", glow = false }) => (
  <div className={`relative rounded-2xl bg-slate-900/80 border border-slate-700/50 ${className}`}>
    {glow && <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-violet-500/10 blur-xl" />}
    <div className="relative">{children}</div>
  </div>
);

// SIMPLIFIED Mindset Component - Clean, minimal, expandable
const MindsetCard = ({ mindset }) => {
  const [expanded, setExpanded] = useState(false);
  
  if (!mindset) return null;
  
  return (
    <div className="mt-4">
      {/* Collapsed: Just key phrase and source */}
      <div 
        onClick={() => setExpanded(!expanded)}
        className="p-4 rounded-xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/30 cursor-pointer hover:border-violet-500/50 transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">ðŸ§ </span>
            <div>
              <div className="text-base font-medium text-violet-200">"{mindset.key_phrase}"</div>
              <div className="text-xs text-slate-400">â€” {mindset.source}</div>
            </div>
          </div>
          <svg className={`w-5 h-5 text-violet-400 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        
        {/* Quick mantras - always visible */}
        <div className="flex gap-2 mt-3 flex-wrap">
          {mindset.mantras.map((m, i) => (
            <span key={i} className="px-2 py-1 rounded-full bg-slate-800/50 text-cyan-400 text-xs">
              {m}
            </span>
          ))}
        </div>
      </div>
      
      {/* Expanded: More detail */}
      {expanded && (
        <div className="mt-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 space-y-4">
          {/* Reframe */}
          <div>
            <div className="text-xs text-slate-500 uppercase mb-1">Elite Reframe</div>
            <p className="text-sm text-slate-200">{mindset.elite_reframe}</p>
          </div>
          
          {/* Attention Strategy */}
          <div>
            <div className="text-xs text-slate-500 uppercase mb-1">Attention Strategy</div>
            <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans">{mindset.full.attention_strategy}</pre>
          </div>
          
          {/* How to Practice */}
          <div>
            <div className="text-xs text-slate-500 uppercase mb-1">Practice This</div>
            <p className="text-sm text-slate-300">{mindset.full.skill_description}</p>
          </div>
          
          {/* Success */}
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
            <div className="text-xs text-emerald-400 uppercase mb-1">âœ“ Success Indicator</div>
            <p className="text-sm text-emerald-300">{mindset.full.success_indicator}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Today's Session
const TodayHero = ({ session }) => {
  if (!session) {
    return (
      <GlowCard className="p-6 mb-6" glow>
        <div className="text-center py-4">
          <span className="text-4xl">ðŸ˜´</span>
          <h2 className="text-xl font-bold text-white mt-2">Rest Day</h2>
          <p className="text-slate-400 text-sm">Recovery is training.</p>
        </div>
      </GlowCard>
    );
  }
  
  return (
    <GlowCard className="p-6 mb-6" glow>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${getTypeColor(session.session_type)} animate-pulse`} />
            <span className="text-xs text-slate-400 uppercase">Today's Focus</span>
            {session.is_key_session && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs">â­ KEY</span>
            )}
          </div>
          <h2 className="text-2xl font-bold text-white">{session.title}</h2>
          <p className="text-slate-300 mt-1">{session.description}</p>
          {session.target_display && (
            <span className="inline-block mt-2 px-3 py-1 rounded-full bg-slate-800 text-cyan-400 text-sm">
              ðŸŽ¯ {session.target_display}
            </span>
          )}
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-cyan-400">{session.duration_minutes}<span className="text-lg">m</span></div>
          <div className="flex gap-0.5 justify-end mt-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < session.priority ? 'bg-amber-400' : 'bg-slate-700'}`} />
            ))}
          </div>
        </div>
      </div>
      
      {/* Why It Matters - Simple */}
      <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
        <span className="text-cyan-400 text-sm">ðŸ’¡ </span>
        <span className="text-sm text-slate-300">{session.why_it_matters}</span>
      </div>
      
      {/* Recovery Adjustments - Compact */}
      {(session.if_recovery_yellow || session.if_recovery_red) && (
        <div className="flex gap-2 mt-3 text-xs">
          {session.if_recovery_yellow && (
            <div className="flex-1 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <span className="text-amber-400">ðŸŸ¡ Yellow:</span> <span className="text-slate-300">{session.if_recovery_yellow}</span>
            </div>
          )}
          {session.if_recovery_red && (
            <div className="flex-1 p-2 rounded-lg bg-rose-500/10 border border-rose-500/30">
              <span className="text-rose-400">ðŸ”´ Red:</span> <span className="text-slate-300">{session.if_recovery_red}</span>
            </div>
          )}
        </div>
      )}
      
      {/* Mindset - Simplified */}
      <MindsetCard mindset={session.mindset} />
    </GlowCard>
  );
};

// Compact Weekly Plan
const WeeklyPlan = ({ sessions }) => (
  <GlowCard className="p-4">
    <h3 className="text-sm font-semibold text-white mb-3">ðŸ“… This Week</h3>
    <div className="space-y-1">
      {sessions.map((day, i) => (
        <div key={i} className={`flex items-center gap-2 p-2 rounded-lg ${day.is_today ? 'bg-slate-800 ring-1 ring-cyan-500/50' : ''}`}>
          <span className={`w-8 text-xs ${day.is_today ? 'text-cyan-400 font-bold' : 'text-slate-500'}`}>{day.day_name}</span>
          {day.session ? (
            <>
              <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${getTypeColor(day.session.session_type)}`} />
              <span className="flex-1 text-xs text-white truncate">{day.session.title}</span>
              {day.session.is_key_session && <span className="text-amber-400 text-xs">â­</span>}
              <span className="text-xs text-slate-500">{day.session.duration_minutes}m</span>
            </>
          ) : (
            <span className="text-xs text-slate-500">Rest</span>
          )}
          <span className={`text-xs ${day.is_done ? 'text-emerald-400' : 'text-slate-600'}`}>{day.is_done ? 'âœ“' : 'â—‹'}</span>
        </div>
      ))}
    </div>
  </GlowCard>
);

// Main Dashboard
export default function AthleteDashboard() {
  const data = DASHBOARD_DATA;
  
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent" />
      
      <div className="relative max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold">
              {data.avatar_initials}
            </div>
            <div>
              <h1 className="text-lg font-bold">{data.athlete_name}</h1>
              <p className="text-xs text-slate-400">{data.goal_race_name}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-cyan-400">{data.days_remaining}<span className="text-sm text-slate-500 ml-1">days</span></div>
            <div className="text-xs text-amber-400">{data.current_phase} Phase</div>
          </div>
        </header>
        
        {/* Today's Session */}
        <TodayHero session={data.today_session} />
        
        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Weekly Plan */}
          <div className="col-span-2">
            <WeeklyPlan sessions={data.week_sessions} />
          </div>
          
          {/* Stats */}
          <GlowCard className="p-4">
            <h3 className="text-sm font-semibold text-white mb-3">ðŸ“Š Progress</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">FTP</span>
                  <span className="text-cyan-400">{data.gap_analysis.ftp_current}â†’{data.gap_analysis.ftp_target}W</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full">
                  <div className="h-full bg-cyan-500 rounded-full" style={{width: `${(data.gap_analysis.ftp_current/data.gap_analysis.ftp_target)*100}%`}} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Pace</span>
                  <span className="text-emerald-400">{formatPace(data.gap_analysis.pace_current)}â†’{formatPace(data.gap_analysis.pace_target)}</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full">
                  <div className="h-full bg-emerald-500 rounded-full" style={{width: `${(data.gap_analysis.pace_target/data.gap_analysis.pace_current)*100}%`}} />
                </div>
              </div>
              <div className="text-center pt-2">
                <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">{data.gap_analysis.feasibility_pct}%</div>
                <div className="text-xs text-slate-500">Feasibility</div>
              </div>
            </div>
          </GlowCard>
          
          {/* Load & Recovery */}
          <GlowCard className="p-4">
            <h3 className="text-sm font-semibold text-white mb-3">âš¡ Form</h3>
            <div className="grid grid-cols-3 gap-1 text-center mb-3">
              <div>
                <div className="text-lg font-bold text-cyan-400">{data.load_metrics.ctl}</div>
                <div className="text-xs text-slate-500">CTL</div>
              </div>
              <div>
                <div className="text-lg font-bold text-amber-400">{data.load_metrics.atl}</div>
                <div className="text-xs text-slate-500">ATL</div>
              </div>
              <div>
                <div className={`text-lg font-bold ${data.load_metrics.tsb >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {data.load_metrics.tsb > 0 ? '+' : ''}{data.load_metrics.tsb}
                </div>
                <div className="text-xs text-slate-500">TSB</div>
              </div>
            </div>
            <div className="text-center p-2 rounded-lg bg-cyan-500/10 text-cyan-400 text-sm">{data.load_metrics.form}</div>
            <div className="mt-3 text-center">
              <div className="text-2xl">ðŸŸ¢</div>
              <div className="text-lg font-bold text-emerald-400">{data.recovery_score}%</div>
              <div className="text-xs text-slate-500">Recovery</div>
            </div>
          </GlowCard>
        </div>
        
        {/* Phase Timeline */}
        <div className="mt-4">
          <GlowCard className="p-4">
            <div className="flex items-center gap-2">
              {data.phases.map((phase, i) => (
                <React.Fragment key={phase.name}>
                  <div className={`flex-1 p-2 rounded-lg text-center ${
                    phase.status === 'current' ? 'bg-cyan-500/20 border border-cyan-500/50' :
                    phase.status === 'completed' ? 'bg-slate-800/50' : 'bg-slate-800/30'
                  }`}>
                    <div className={`text-xs font-bold ${phase.status === 'current' ? 'text-cyan-400' : 'text-slate-500'}`}>{phase.name}</div>
                    <div className="text-xs text-slate-600">{phase.weeks}wk</div>
                  </div>
                  {i < data.phases.length - 1 && <div className="w-3 h-px bg-slate-700" />}
                </React.Fragment>
              ))}
            </div>
          </GlowCard>
        </div>
        
        <footer className="mt-6 text-center text-slate-600 text-xs">
          Powered by RALPH
        </footer>
      </div>
    </div>
  );
}
