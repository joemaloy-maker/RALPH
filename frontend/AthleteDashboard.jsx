import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

// API Configuration
const API_BASE = "http://localhost:8000";

// Utility functions
const formatPace = (seconds) => {
  if (!seconds) return "--:--";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const getTypeColor = (type) => {
  const colors = {
    threshold: "from-rose-500 to-orange-500",
    vo2max: "from-red-500 to-pink-500",
    tempo: "from-amber-500 to-yellow-500",
    long: "from-violet-500 to-purple-500",
    endurance: "from-blue-500 to-cyan-500",
    recovery: "from-emerald-500 to-green-500",
    easy: "from-teal-500 to-emerald-500",
    rest: "from-slate-500 to-slate-600",
  };
  return colors[type] || "from-slate-500 to-slate-600";
};

const getTypeBg = (type) => {
  const colors = {
    threshold: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    vo2max: "bg-red-500/20 text-red-300 border-red-500/30",
    tempo: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    long: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    endurance: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    recovery: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    easy: "bg-teal-500/20 text-teal-300 border-teal-500/30",
    rest: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  };
  return colors[type] || "bg-slate-500/20 text-slate-400";
};

// Components
const GlowCard = ({ children, className = "", glow = false }) => (
  <div className={`relative rounded-2xl bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 ${className}`}>
    {glow && <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-violet-500/10 blur-xl" />}
    <div className="relative">{children}</div>
  </div>
);

const StatRing = ({ value, max, label, color = "cyan", size = 120 }) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="absolute inset-0" viewBox="0 0 100 100">
          <defs>
            <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color === "cyan" ? "#06b6d4" : color === "emerald" ? "#10b981" : "#8b5cf6"} />
              <stop offset="100%" stopColor={color === "cyan" ? "#3b82f6" : color === "emerald" ? "#34d399" : "#a78bfa"} />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="42" fill="none" stroke="#1e293b" strokeWidth="8" />
          <circle 
            cx="50" cy="50" r="42" fill="none" 
            stroke={`url(#gradient-${color})`}
            strokeWidth="8" 
            strokeLinecap="round"
            strokeDasharray={`${percentage * 2.64} 264`}
            transform="rotate(-90 50 50)"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white">{value}</span>
          <span className="text-xs text-slate-400">/ {max}</span>
        </div>
      </div>
      <span className="mt-2 text-sm text-slate-400">{label}</span>
    </div>
  );
};

// NEW: Mindset Panel Component - Shows emotional skills content
const MindsetPanel = ({ mindset, isExpanded, onToggle }) => {
  if (!mindset) return null;
  
  return (
    <div className="mt-4">
      <button 
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/30 hover:border-violet-500/50 transition-all"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🧠</span>
          <div className="text-left">
            <div className="text-sm font-medium text-violet-300">Mental Skills Framework</div>
            <div className="text-xs text-slate-400">
              {mindset.source_attribution ? `Powered by ${mindset.source_attribution}'s approach` : 'Elite athlete mindset'}
            </div>
          </div>
        </div>
        <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      
      {isExpanded && (
        <div className="mt-4 space-y-4 animate-fadeIn">
          {/* Reframe Section */}
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-medium text-rose-400 uppercase tracking-wider mb-2">
                  ❌ Amateur Thinking
                </div>
                <p className="text-sm text-slate-400 italic">"{mindset.amateur_narrative}"</p>
              </div>
              <div>
                <div className="text-xs font-medium text-emerald-400 uppercase tracking-wider mb-2">
                  ✓ Elite Reframe
                </div>
                <p className="text-sm text-slate-200">"{mindset.elite_narrative}"</p>
              </div>
            </div>
            
            {mindset.source_quote && (
              <div className="mt-4 p-3 rounded-lg bg-slate-900/50 border-l-2 border-cyan-500">
                <p className="text-sm text-slate-300 italic">"{mindset.source_quote}"</p>
                <p className="text-xs text-cyan-400 mt-1">— {mindset.source_attribution}</p>
              </div>
            )}
          </div>
          
          {/* Attention Strategy */}
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🎯</span>
              <div className="text-sm font-medium text-white">Attention Strategy</div>
            </div>
            <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
              {mindset.attention_strategy}
            </pre>
          </div>
          
          {/* Chunking Strategy */}
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">📦</span>
              <div className="text-sm font-medium text-white">Mental Chunking</div>
            </div>
            <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
              {mindset.chunk_strategy}
            </pre>
          </div>
          
          {/* Mantras */}
          {mindset.mantras && mindset.mantras.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">💬</span>
                <div className="text-sm font-medium text-white">Mantras</div>
              </div>
              <div className="flex flex-wrap gap-2">
                {mindset.mantras.map((mantra, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-full bg-cyan-500/20 text-cyan-300 text-sm border border-cyan-500/30">
                    {mantra}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Micro Goals */}
          {mindset.micro_goals && mindset.micro_goals.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">✅</span>
                <div className="text-sm font-medium text-white">Micro-Goals for This Session</div>
              </div>
              <ul className="space-y-2">
                {mindset.micro_goals.map((goal, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="text-emerald-400 mt-0.5">○</span>
                    {goal}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Skill to Practice */}
          {mindset.skill_to_practice && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🏆</span>
                <div>
                  <div className="text-sm font-medium text-white">{mindset.skill_to_practice.skill_name}</div>
                  <div className="text-xs text-amber-400">{mindset.skill_to_practice.source_inspiration}</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-slate-900/50">
                  <div className="text-xs text-slate-500 uppercase mb-1">Key Phrase</div>
                  <div className="text-lg font-medium text-amber-300">"{mindset.skill_to_practice.key_phrase}"</div>
                </div>
                
                <div>
                  <div className="text-xs text-slate-500 uppercase mb-1">How to Practice</div>
                  <p className="text-sm text-slate-300">{mindset.skill_to_practice.how_to_practice}</p>
                </div>
                
                <div>
                  <div className="text-xs text-slate-500 uppercase mb-1">Success Indicator</div>
                  <p className="text-sm text-emerald-400">{mindset.skill_to_practice.success_indicator}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Today's Session Hero - Now with Mindset Panel
const TodayHero = ({ session, recoveryStatus }) => {
  const [mindsetExpanded, setMindsetExpanded] = useState(false);
  
  if (!session) {
    return (
      <GlowCard className="p-8 mb-6" glow>
        <div className="text-center">
          <span className="text-4xl mb-4 block">😴</span>
          <h2 className="text-2xl font-bold text-white mb-2">Rest Day</h2>
          <p className="text-slate-400">Recovery is training. Your body adapts during rest.</p>
        </div>
      </GlowCard>
    );
  }
  
  const sessionType = session.session_type || 'threshold';
  
  return (
    <GlowCard className="p-8 mb-6" glow>
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${getTypeColor(sessionType)} animate-pulse`} />
            <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">Today's Focus</span>
            {session.is_key_session && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
                ⭐ KEY SESSION
              </span>
            )}
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">{session.title}</h2>
          <p className="text-lg text-slate-300">{session.description}</p>
          {session.target_display && (
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-cyan-400 text-sm">
              <span>🎯</span> {session.target_display}
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            {session.duration_minutes}<span className="text-xl ml-1">min</span>
          </div>
          <div className="flex items-center justify-end gap-1 mt-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full ${i < session.priority ? 'bg-amber-400' : 'bg-slate-700'}`} />
            ))}
            <span className="text-xs text-slate-500 ml-2">Priority</span>
          </div>
        </div>
      </div>
      
      {/* Why It Matters */}
      <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm">💡</span>
          </div>
          <div>
            <div className="text-sm font-medium text-cyan-400 mb-1">Why This Matters</div>
            <p className="text-sm text-slate-300 leading-relaxed">{session.why_it_matters}</p>
          </div>
        </div>
      </div>
      
      {/* Recovery Adjustments */}
      {(session.if_recovery_yellow || session.if_recovery_red) && (
        <div className="mt-4 grid md:grid-cols-2 gap-3">
          {session.if_recovery_yellow && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <div className="text-xs font-medium text-amber-400 mb-1">🟡 If Recovery Yellow</div>
              <p className="text-sm text-slate-300">{session.if_recovery_yellow}</p>
            </div>
          )}
          {session.if_recovery_red && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30">
              <div className="text-xs font-medium text-rose-400 mb-1">🔴 If Recovery Red</div>
              <p className="text-sm text-slate-300">{session.if_recovery_red}</p>
            </div>
          )}
        </div>
      )}
      
      {/* Mindset Panel - The Emotional Skills Integration */}
      <MindsetPanel 
        mindset={session.mindset} 
        isExpanded={mindsetExpanded}
        onToggle={() => setMindsetExpanded(!mindsetExpanded)}
      />
    </GlowCard>
  );
};

// Weekly Plan Component
const WeeklyPlan = ({ weekSessions }) => {
  if (!weekSessions || weekSessions.length === 0) return null;
  
  return (
    <GlowCard className="p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <span className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-xs">📅</span>
        This Week
      </h3>
      <div className="space-y-2">
        {weekSessions.map((day, i) => (
          <div 
            key={i}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
              day.is_today ? 'bg-slate-800 ring-1 ring-cyan-500/50' : 'hover:bg-slate-800/50'
            }`}
          >
            <div className={`w-10 text-center ${day.is_today ? 'text-cyan-400 font-bold' : 'text-slate-500'}`}>
              {day.day_name}
            </div>
            {day.session ? (
              <>
                <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${getTypeColor(day.session.session_type)}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${day.is_done ? 'text-slate-500 line-through' : 'text-white'}`}>
                      {day.session.title}
                    </span>
                    {day.session.is_key_session && <span className="text-amber-400 text-xs">⭐</span>}
                  </div>
                </div>
                <div className="text-sm text-slate-500">
                  {day.session.duration_minutes > 0 ? `${day.session.duration_minutes}m` : '—'}
                </div>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-slate-600" />
                <div className="flex-1 text-sm text-slate-500">Rest</div>
                <div className="text-sm text-slate-600">—</div>
              </>
            )}
            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
              day.is_done ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-600'
            }`}>
              {day.is_done ? '✓' : '○'}
            </div>
          </div>
        ))}
      </div>
    </GlowCard>
  );
};

// Gap Analysis Component
const GapAnalysis = ({ gap }) => {
  if (!gap) return null;
  
  return (
    <GlowCard className="p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <span className="w-6 h-6 rounded-md bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xs">📊</span>
        Gap Analysis
      </h3>
      
      <div className="space-y-4">
        {/* FTP */}
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-sm text-slate-400">FTP</span>
            <span className="text-xs text-slate-500">
              {gap.ftp_current?.toFixed(0)}W → {gap.ftp_target?.toFixed(0)}W
            </span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-1000"
              style={{ width: `${gap.ftp_target > 0 ? (gap.ftp_current / gap.ftp_target) * 100 : 0}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className={`text-xs ${gap.ftp_achievable ? 'text-emerald-400' : 'text-amber-400'}`}>
              {gap.ftp_achievable ? '✓ Achievable' : '⚠ Aggressive'}
            </span>
            <span className="text-xs text-cyan-400">-{gap.ftp_gap?.toFixed(0)}W to go</span>
          </div>
        </div>
        
        {/* Pace */}
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-sm text-slate-400">Threshold Pace</span>
            <span className="text-xs text-slate-500">
              {formatPace(gap.pace_current)} → {formatPace(gap.pace_target)}/mi
            </span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full transition-all duration-1000"
              style={{ width: `${gap.pace_current > 0 ? (gap.pace_target / gap.pace_current) * 100 : 0}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className={`text-xs ${gap.pace_achievable ? 'text-emerald-400' : 'text-amber-400'}`}>
              {gap.pace_achievable ? '✓ Achievable' : '⚠ Aggressive'}
            </span>
            <span className="text-xs text-emerald-400">-{gap.pace_gap?.toFixed(0)}s to go</span>
          </div>
        </div>
        
        {/* Feasibility */}
        <div className="p-4 rounded-xl bg-slate-800/50 text-center">
          <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
            {gap.feasibility_pct?.toFixed(0)}%
          </div>
          <div className="text-xs text-slate-500">Goal Feasibility</div>
        </div>
      </div>
    </GlowCard>
  );
};

// Load Metrics Component
const LoadMetrics = ({ load }) => {
  if (!load) return null;
  
  const formColors = {
    'FRESH': 'text-emerald-400 bg-emerald-500/10',
    'RECOVERED': 'text-cyan-400 bg-cyan-500/10',
    'NEUTRAL': 'text-slate-400 bg-slate-500/10',
    'TIRED': 'text-amber-400 bg-amber-500/10',
    'OVERREACHED': 'text-rose-400 bg-rose-500/10',
  };
  
  return (
    <GlowCard className="p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <span className="w-6 h-6 rounded-md bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-xs">⚡</span>
        Training Load
      </h3>
      
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center p-3 rounded-lg bg-slate-800/50">
          <div className="text-2xl font-bold text-cyan-400">{load.ctl?.toFixed(0) || 0}</div>
          <div className="text-xs text-slate-500">CTL</div>
          <div className="text-xs text-slate-600">Fitness</div>
        </div>
        <div className="text-center p-3 rounded-lg bg-slate-800/50 border-x border-slate-700">
          <div className="text-2xl font-bold text-amber-400">{load.atl?.toFixed(0) || 0}</div>
          <div className="text-xs text-slate-500">ATL</div>
          <div className="text-xs text-slate-600">Fatigue</div>
        </div>
        <div className="text-center p-3 rounded-lg bg-slate-800/50">
          <div className={`text-2xl font-bold ${load.tsb >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {load.tsb >= 0 ? '+' : ''}{load.tsb?.toFixed(0) || 0}
          </div>
          <div className="text-xs text-slate-500">TSB</div>
          <div className="text-xs text-slate-600">Form</div>
        </div>
      </div>
      
      <div className={`p-3 rounded-xl text-center ${formColors[load.form] || formColors['NEUTRAL']}`}>
        <div className="text-sm font-medium">{load.form || 'NEUTRAL'}</div>
      </div>
    </GlowCard>
  );
};

// Phase Timeline Component
const PhaseTimeline = ({ phases, currentPhase }) => {
  if (!phases || phases.length === 0) return null;
  
  return (
    <GlowCard className="p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <span className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs">🗓️</span>
        Training Phases
      </h3>
      <div className="flex items-center gap-2">
        {phases.map((phase, i) => (
          <React.Fragment key={phase.name}>
            <div className={`flex-1 p-3 rounded-xl text-center transition-all ${
              phase.status === 'current' ? 'bg-cyan-500/20 border border-cyan-500/50 scale-105' :
              phase.status === 'completed' ? 'bg-slate-800/50 border border-slate-700/50' :
              'bg-slate-800/30 border border-slate-700/30'
            }`}>
              <div className={`text-sm font-bold ${
                phase.status === 'current' ? 'text-cyan-400' :
                phase.status === 'completed' ? 'text-slate-400' : 'text-slate-500'
              }`}>
                {phase.name}
              </div>
              <div className="text-xs text-slate-500">{phase.weeks}wk</div>
            </div>
            {i < phases.length - 1 && (
              <div className={`w-4 h-0.5 ${
                phase.status === 'completed' ? 'bg-slate-600' : 'bg-slate-700'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </GlowCard>
  );
};

// Recovery Status Component
const RecoveryStatus = ({ status, score, sleep, bodyBattery }) => {
  const statusColors = {
    'green': 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    'yellow': 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    'red': 'bg-rose-500/10 border-rose-500/30 text-rose-400',
  };
  
  const statusEmoji = {
    'green': '🟢',
    'yellow': '🟡',
    'red': '🔴',
  };
  
  return (
    <GlowCard className="p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <span className="w-6 h-6 rounded-md bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-xs">💚</span>
        Recovery
      </h3>
      
      <div className={`text-center p-6 rounded-xl mb-4 border ${statusColors[status] || statusColors['green']}`}>
        <div className="text-4xl mb-2">{statusEmoji[status] || '🟢'}</div>
        <div className="text-2xl font-bold">
          {score ? `${score}%` : status?.toUpperCase() || 'GREEN'}
        </div>
        <div className="text-xs text-slate-500 mt-1">Recovery Status</div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {sleep && (
          <div className="text-center p-3 rounded-lg bg-slate-800/50">
            <div className="text-xl font-bold text-white">{sleep}h</div>
            <div className="text-xs text-slate-500">Sleep</div>
          </div>
        )}
        {bodyBattery && (
          <div className="text-center p-3 rounded-lg bg-slate-800/50">
            <div className="text-xl font-bold text-white">{bodyBattery}</div>
            <div className="text-xs text-slate-500">Body Battery</div>
          </div>
        )}
      </div>
    </GlowCard>
  );
};

// Main Dashboard Component
export default function AthleteDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // For demo: Use athleteId 1
  const athleteId = 1;
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  
  useEffect(() => {
    fetchDashboard();
  }, [athleteId]);
  
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/athletes/${athleteId}/dashboard`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const dashboardData = await response.json();
      setData(dashboardData);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
      setError(err.message);
      // Use sample data as fallback
      setData(SAMPLE_DATA_FALLBACK);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-slate-400">Loading dashboard...</div>
        </div>
      </div>
    );
  }
  
  if (!data) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center text-rose-400">
          <div className="text-4xl mb-4">⚠️</div>
          <div>Failed to load dashboard</div>
          {error && <div className="text-sm text-slate-500 mt-2">{error}</div>}
          <button 
            onClick={fetchDashboard}
            className="mt-4 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  const currentPhase = data.current_phase?.toUpperCase?.() || 
                       (typeof data.current_phase === 'object' ? 'BASE' : data.current_phase) || 
                       'BASE';
  
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-violet-900/20 via-transparent to-transparent" />
      
      <div className="relative max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-lg font-bold">
              {data.avatar_initials || 'AC'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{data.athlete_name}</h1>
              <p className="text-sm text-slate-400">{data.goal_race_name}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-400">
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
            <div className="flex items-center justify-end gap-2 mt-1">
              <span className="text-2xl font-bold text-cyan-400">{data.days_remaining}</span>
              <span className="text-sm text-slate-500">days to race</span>
            </div>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm mt-1 ${getTypeBg(currentPhase.toLowerCase())}`}>
              {currentPhase} Phase
            </div>
          </div>
        </header>
        
        {/* Today's Session Hero */}
        <TodayHero 
          session={data.today_session} 
          recoveryStatus={data.recovery_status}
        />
        
        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <WeeklyPlan weekSessions={data.week_sessions} />
            <RecoveryStatus 
              status={data.recovery_status}
              score={data.recovery_score}
              sleep={data.sleep_hours}
              bodyBattery={data.body_battery}
            />
          </div>
          
          {/* Middle Column */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <GapAnalysis gap={data.gap_analysis} />
            <LoadMetrics load={data.load_metrics} />
          </div>
          
          {/* Right Column */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <GlowCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-xs">🎯</span>
                Goal Progress
              </h3>
              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500">
                  {data.days_remaining}
                </div>
                <div className="text-slate-400 mt-1">days to {data.goal_race_name}</div>
              </div>
              <div className="flex justify-center gap-8">
                <StatRing 
                  value={data.gap_analysis?.ftp_current?.toFixed(0) || 0} 
                  max={data.gap_analysis?.ftp_target?.toFixed(0) || 280} 
                  label="FTP (W)" 
                  color="cyan" 
                />
                <StatRing 
                  value={data.gap_analysis?.feasibility_pct?.toFixed(0) || 0} 
                  max={100} 
                  label="Feasibility" 
                  color="emerald" 
                />
              </div>
            </GlowCard>
            <PhaseTimeline 
              phases={data.phases} 
              currentPhase={currentPhase}
            />
          </div>
        </div>
        
        {/* Footer */}
        <footer className="mt-12 text-center text-slate-600 text-sm">
          Powered by RALPH • Real-time Athlete Learning & Performance Handler
        </footer>
      </div>
    </div>
  );
}

// Fallback sample data if API is not available
const SAMPLE_DATA_FALLBACK = {
  athlete_name: "Alex Chen",
  avatar_initials: "AC",
  goal_race_name: "Ironman 70.3 Santa Cruz",
  goal_race_date: "2026-06-15",
  days_remaining: 158,
  current_phase: "BUILD",
  recovery_status: "green",
  recovery_score: 72,
  sleep_hours: 7.5,
  body_battery: 68,
  today_session: {
    id: 1,
    title: "Threshold Intervals",
    description: "4×10min @ 245-255W with 3min recovery",
    purpose: "This is where you get faster. The discomfort is the adaptation signal.",
    duration_minutes: 70,
    session_type: "threshold",
    sport: "bike",
    is_key_session: true,
    priority: 5,
    target_display: "245-255W",
    why_it_matters: "⭐ KEY SESSION: This is where you get faster. The discomfort is the adaptation signal.",
    if_recovery_yellow: "Reduce to 235-245W",
    if_recovery_red: "Convert to Z2 endurance",
    mindset: {
      amateur_narrative: "This is going to hurt. I hate threshold work. I hope I can survive it.",
      elite_narrative: "This discomfort is information telling me I'm working hard—which is exactly what I came to do. The burn is the adaptation signal. I'm purchasing fitness.",
      source_quote: "I don't view pain as suffering. I see it as information. Sometimes that information is just telling me I'm working hard, which is exactly what I came to do.",
      source_attribution: "Courtney Dauwalter",
      attention_strategy: "Use Grover's 'don't think' approach:\n  - This interval is the ONLY interval\n  - Don't count total remaining—that creates dread\n  - When it ends, the next one becomes the only one\n  - 'Don't think. You already know what to do.'",
      chunk_strategy: "THIRDS APPROACH (JACKSON'S ZEN):\n  First third: Chop wood. Just settle into the task.\n  Middle third: Carry water. Find the craft within.\n  Final third: The task remains the same. Your presence deepens.",
      mantras: ["This is where I get better.", "Earn it.", "One more. Just one more."],
      micro_goals: [
        "Return to breath anchor at least 5 times (Jackson meditation)",
        "Use 'pain as information' reframe at least once (Dauwalter)",
        "Hold target power without mental negotiation for 3+ intervals (Grover)"
      ],
      skill_to_practice: {
        skill_name: "Pain as Information",
        source_inspiration: "Courtney Dauwalter",
        key_phrase: "This is information, not suffering",
        how_to_practice: "When you feel 'pain,' get specific: Where exactly? Sharp or dull? Constant or pulsing?",
        success_indicator: "You can describe the sensation in detail without using the word 'pain'"
      }
    }
  },
  week_sessions: [
    { date: "2026-01-05", day_name: "Mon", is_today: false, session: null, is_done: true },
    { date: "2026-01-06", day_name: "Tue", is_today: false, session: { title: "Threshold Intervals", session_type: "threshold", duration_minutes: 70, is_key_session: true }, is_done: true },
    { date: "2026-01-07", day_name: "Wed", is_today: false, session: { title: "Easy Spin", session_type: "recovery", duration_minutes: 45, is_key_session: false }, is_done: false },
    { date: "2026-01-08", day_name: "Thu", is_today: true, session: { title: "Tempo Run", session_type: "tempo", duration_minutes: 50, is_key_session: true }, is_done: false },
    { date: "2026-01-09", day_name: "Fri", is_today: false, session: { title: "Recovery", session_type: "recovery", duration_minutes: 30, is_key_session: false }, is_done: false },
    { date: "2026-01-10", day_name: "Sat", is_today: false, session: { title: "Long Ride", session_type: "long", duration_minutes: 150, is_key_session: true }, is_done: false },
    { date: "2026-01-11", day_name: "Sun", is_today: false, session: { title: "Long Run", session_type: "endurance", duration_minutes: 75, is_key_session: false }, is_done: false },
  ],
  gap_analysis: {
    ftp_current: 258,
    ftp_target: 280,
    ftp_gap: 22,
    ftp_achievable: true,
    pace_current: 388,
    pace_target: 360,
    pace_gap: 28,
    pace_achievable: true,
    feasibility_pct: 85
  },
  load_metrics: {
    ctl: 68,
    atl: 62,
    tsb: 6,
    form: "RECOVERED"
  },
  phases: [
    { name: "BASE", status: "completed", weeks: 4 },
    { name: "BUILD", status: "current", weeks: 6 },
    { name: "PEAK", status: "upcoming", weeks: 4 },
    { name: "TAPER", status: "upcoming", weeks: 2 },
    { name: "RACE", status: "upcoming", weeks: 0 }
  ]
};
