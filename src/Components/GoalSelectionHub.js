import React from 'react';
import {
  LayoutTemplate,
  PenTool,
  Sparkles,
  Clock,
  ArrowRight,
  CheckCircle2,
  HeartHandshake,
  Brain
} from 'lucide-react';

const GoalSelectionHub = ({ partner1, partner2, onSelectPath }) => {
  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundColor: '#FAF7F2',
        fontFamily: "'DM Sans', sans-serif",
        color: '#2D2926'
      }}
    >
      {/* Subtle texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Ambient Background - warm copper glow */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[60%] rounded-full bg-gradient-to-b from-[#C4785A]/10 to-transparent blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[50%] rounded-full bg-gradient-to-t from-[#7d8c75]/8 to-transparent blur-[100px]" />
      </div>

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-16 lg:py-24 flex flex-col items-center">

        {/* Greeting Section */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-wider mb-6 uppercase"
            style={{
              backgroundColor: 'white',
              border: '1px solid #E8E2DA',
              color: '#6B5E54',
              boxShadow: '0 2px 8px -2px rgba(45, 41, 38, 0.08)'
            }}
          >
            <HeartHandshake size={14} style={{ color: '#C4785A' }} />
            Ready to start
          </div>
          <h1
            className="text-4xl md:text-5xl mb-6 font-light italic"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              color: '#2D2926'
            }}
          >
            Welcome, <span style={{ color: '#C4785A', fontWeight: 500 }}>{partner1}</span> & <span style={{ color: '#C4785A', fontWeight: 500 }}>{partner2}</span>
          </h1>
          <p className="text-lg leading-relaxed" style={{ color: '#6B5E54' }}>
            You are aligned and ready to build. How would you like to shape your next chapter together?
          </p>
        </div>

        {/* Cards Container */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">

          {/* OPTION 1: TALK WITH LUNA (Featured Card) */}
          <div
            className="group relative rounded-2xl p-8 flex flex-col transition-all duration-300 hover:-translate-y-1"
            style={{
              backgroundColor: 'white',
              border: '2px solid #C4785A',
              boxShadow: '0 8px 24px -8px rgba(196, 120, 90, 0.15)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 12px 32px -8px rgba(196, 120, 90, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 8px 24px -8px rgba(196, 120, 90, 0.15)';
            }}
          >
            {/* Badge */}
            <div className="absolute top-6 right-6">
              <span
                className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full"
                style={{
                  backgroundColor: '#C4785A',
                  color: 'white',
                  boxShadow: '0 2px 8px rgba(196, 120, 90, 0.3)'
                }}
              >
                Most Personal
              </span>
            </div>

            {/* Icon */}
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300"
              style={{
                background: 'linear-gradient(135deg, #2D2926 0%, #463f3a 100%)',
                boxShadow: '0 4px 12px rgba(45, 41, 38, 0.2)'
              }}
            >
              <Brain size={28} strokeWidth={1.5} style={{ color: 'white' }} />
            </div>

            <h2
              className="text-2xl font-semibold mb-2"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                color: '#2D2926'
              }}
            >
              Talk with Luna
            </h2>
            <p className="text-sm mb-6 leading-relaxed" style={{ color: '#6B5E54' }}>
              Let our AI guide ask the right questions to uncover your shared vision.
            </p>

            {/* Metrics */}
            <div className="flex items-center gap-4 mb-8 text-xs font-medium" style={{ color: '#8B8178' }}>
              <span
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                style={{ backgroundColor: '#FEF7ED', color: '#C4785A' }}
              >
                <Clock size={14} /> 5-10 mins
              </span>
              <span>Best for exploration</span>
            </div>

            {/* Benefits List */}
            <ul className="space-y-3 mb-8 flex-grow">
              {[
                "Deeply personalized roadmap",
                "Uncovers hidden priorities",
                "Guided emotional alignment"
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm" style={{ color: '#6B5E54' }}>
                  <CheckCircle2 className="shrink-0 mt-0.5" size={16} style={{ color: '#7d8c75' }} />
                  {item}
                </li>
              ))}
            </ul>

            {/* Button */}
            <button
              onClick={() => onSelectPath('luna')}
              className="w-full py-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all group-hover:gap-3"
              style={{
                backgroundColor: '#2D2926',
                color: 'white',
                boxShadow: '0 4px 12px rgba(45, 41, 38, 0.2)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#C4785A';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#2D2926';
              }}
            >
              Start Conversation with Luna <ArrowRight size={16} />
            </button>
          </div>

          {/* OPTION 2: TEMPLATES */}
          <div
            className="group rounded-2xl p-8 flex flex-col transition-all duration-300 hover:-translate-y-1"
            style={{
              backgroundColor: 'white',
              border: '1px solid #E8E2DA',
              boxShadow: '0 2px 8px -2px rgba(45, 41, 38, 0.06)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 8px 20px -4px rgba(45, 41, 38, 0.12)';
              e.currentTarget.style.borderColor = '#C4785A';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 8px -2px rgba(45, 41, 38, 0.06)';
              e.currentTarget.style.borderColor = '#E8E2DA';
            }}
          >
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-all duration-300"
              style={{ backgroundColor: '#F5F1EC' }}
            >
              <LayoutTemplate size={28} strokeWidth={1.5} style={{ color: '#6B5E54' }} />
            </div>

            <h2
              className="text-2xl font-semibold mb-2"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                color: '#2D2926'
              }}
            >
              Browse Templates
            </h2>
            <p className="text-sm mb-6 leading-relaxed" style={{ color: '#6B5E54' }}>
              Choose from expert-built roadmaps for common life milestones.
            </p>

            <div className="flex items-center gap-4 mb-8 text-xs font-medium" style={{ color: '#8B8178' }}>
              <span
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                style={{ backgroundColor: '#FAF7F2', color: '#6B5E54' }}
              >
                <Clock size={14} /> 2-3 mins
              </span>
              <span>Fastest setup</span>
            </div>

            <ul className="space-y-3 mb-8 flex-grow">
              {[
                "Wedding, Home, & Travel presets",
                "Industry standard cost estimates",
                "Instant structure"
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm" style={{ color: '#6B5E54' }}>
                  <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ backgroundColor: '#C4785A' }} />
                  {item}
                </li>
              ))}
            </ul>

            <button
              onClick={() => onSelectPath('templates')}
              className="w-full py-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
              style={{
                backgroundColor: 'white',
                border: '1px solid #E8E2DA',
                color: '#2D2926'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#FAF7F2';
                e.currentTarget.style.borderColor = '#C4785A';
                e.currentTarget.style.color = '#C4785A';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.borderColor = '#E8E2DA';
                e.currentTarget.style.color = '#2D2926';
              }}
            >
              Browse Goal Templates <ArrowRight size={16} />
            </button>
          </div>

          {/* OPTION 3: CUSTOM GOAL */}
          <div
            className="group rounded-2xl p-8 flex flex-col transition-all duration-300 hover:-translate-y-1"
            style={{
              backgroundColor: 'white',
              border: '1px solid #E8E2DA',
              boxShadow: '0 2px 8px -2px rgba(45, 41, 38, 0.06)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 8px 20px -4px rgba(45, 41, 38, 0.12)';
              e.currentTarget.style.borderColor = '#C4785A';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 8px -2px rgba(45, 41, 38, 0.06)';
              e.currentTarget.style.borderColor = '#E8E2DA';
            }}
          >
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-all duration-300"
              style={{ backgroundColor: '#F5F1EC' }}
            >
              <PenTool size={28} strokeWidth={1.5} style={{ color: '#6B5E54' }} />
            </div>

            <h2
              className="text-2xl font-semibold mb-2"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                color: '#2D2926'
              }}
            >
              Create Custom
            </h2>
            <p className="text-sm mb-6 leading-relaxed" style={{ color: '#6B5E54' }}>
              Build your own unique vision from scratch for niche or complex goals.
            </p>

            <div className="flex items-center gap-4 mb-8 text-xs font-medium" style={{ color: '#8B8178' }}>
              <span
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                style={{ backgroundColor: '#FAF7F2', color: '#6B5E54' }}
              >
                <Clock size={14} /> 3-5 mins
              </span>
              <span>Most flexible</span>
            </div>

            <ul className="space-y-3 mb-8 flex-grow">
              {[
                "Perfect for 'Move Abroad' etc.",
                "Define your own steps",
                "Full creative control"
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm" style={{ color: '#6B5E54' }}>
                  <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ backgroundColor: '#C4785A' }} />
                  {item}
                </li>
              ))}
            </ul>

            <button
              onClick={() => onSelectPath('custom')}
              className="w-full py-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
              style={{
                backgroundColor: 'white',
                border: '1px solid #E8E2DA',
                color: '#2D2926'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#FAF7F2';
                e.currentTarget.style.borderColor = '#C4785A';
                e.currentTarget.style.color = '#C4785A';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.borderColor = '#E8E2DA';
                e.currentTarget.style.color = '#2D2926';
              }}
            >
              Create Your Own Goal <ArrowRight size={16} />
            </button>
          </div>

        </div>

        {/* Footer / Back Link */}
        <div className="mt-16 text-center">
          <button
            onClick={() => window.history.back()}
            className="text-sm font-medium transition-colors"
            style={{ color: '#8B8178' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#C4785A';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#8B8178';
            }}
          >
            Not ready to plan yet? Go back to Dashboard
          </button>
        </div>

      </main>
    </div>
  );
};

export default GoalSelectionHub;
