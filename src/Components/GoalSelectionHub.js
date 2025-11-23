import React from 'react';
import {
  MessageCircle,
  LayoutTemplate,
  PenTool,
  Sparkles,
  Clock,
  ArrowRight,
  CheckCircle2,
  Zap,
  HeartHandshake
} from 'lucide-react';

const GoalSelectionHub = ({ partner1, partner2, onSelectPath }) => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 relative overflow-hidden">

      {/* Ambient Background Elements - subtle and high quality */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[80%] h-[60%] rounded-full bg-gradient-to-b from-indigo-50/80 to-transparent blur-[120px]" />
      </div>

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-16 lg:py-24 flex flex-col items-center">

        {/* 1. The Greeting Section */}
        <div className="text-center max-w-2xl mx-auto mb-16 animate-[fadeIn_0.8s_ease-out]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-sm text-xs font-semibold tracking-wide text-slate-500 mb-6 uppercase">
            <HeartHandshake size={14} className="text-indigo-500" />
            Ready to start
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
            Welcome, {partner1} & {partner2}! 🎉
          </h1>
          <p className="text-lg text-slate-500 leading-relaxed">
            You are aligned and ready to build. How would you like to shape your next chapter together?
          </p>
        </div>

        {/* 2. The Cards Container */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full animate-[fadeIn_1s_ease-out_0.2s]">

          {/* --- OPTION 1: TALK WITH LUNA (Hero Card) --- */}
          <div className="group relative bg-white rounded-3xl p-1 shadow-xl shadow-indigo-100/50 hover:shadow-2xl hover:shadow-indigo-200/50 transition-all duration-500 hover:-translate-y-1">
            {/* Gradient Border/Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 via-white to-purple-50 rounded-3xl opacity-100" />

            <div className="relative h-full bg-white/60 backdrop-blur-xl rounded-[20px] p-8 flex flex-col border border-indigo-50">
              {/* Badge */}
              <div className="absolute top-6 right-6">
                 <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-md shadow-indigo-200">
                   Most Personal
                 </span>
              </div>

              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 mb-6 group-hover:scale-110 transition-transform duration-500">
                <Sparkles size={28} strokeWidth={1.5} />
              </div>

              <h2 className="text-2xl font-bold text-slate-900 mb-2">Talk with Luna</h2>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                Let our AI guide ask the right questions to uncover your shared vision.
              </p>

              {/* Metrics */}
              <div className="flex items-center gap-4 mb-8 text-xs font-medium text-slate-500">
                <span className="flex items-center gap-1.5 bg-indigo-50 px-2.5 py-1 rounded-md text-indigo-700">
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
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                    <CheckCircle2 className="text-indigo-500 shrink-0 mt-0.5" size={16} />
                    {item}
                  </li>
                ))}
              </ul>

              {/* Button */}
              <button
                onClick={() => onSelectPath('luna')}
                className="w-full py-4 rounded-xl bg-slate-900 text-white font-medium text-sm hover:bg-indigo-600 transition-colors shadow-lg shadow-slate-200 flex items-center justify-center gap-2 group-hover:gap-3"
              >
                Start Conversation with Luna <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* --- OPTION 2: TEMPLATES --- */}
          <div className="group bg-white rounded-3xl p-8 border border-slate-100 shadow-lg shadow-slate-100 hover:shadow-xl hover:border-slate-200 transition-all duration-300 hover:-translate-y-1 flex flex-col">
            <div className="absolute top-8 right-8 text-slate-300 group-hover:text-indigo-400 transition-colors">
              <Zap size={20} />
            </div>

            <div className="w-14 h-14 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-600 mb-6 group-hover:bg-sky-100 transition-colors">
              <LayoutTemplate size={28} strokeWidth={1.5} />
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mb-2">Browse Templates</h2>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              Choose from 12 expert-built roadmaps for common life milestones.
            </p>

             <div className="flex items-center gap-4 mb-8 text-xs font-medium text-slate-500">
                <span className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md text-slate-600">
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
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-2 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => onSelectPath('templates')}
                className="w-full py-4 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium text-sm hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700 transition-all flex items-center justify-center gap-2"
              >
                Browse 12 Goal Templates <ArrowRight size={16} />
              </button>
          </div>

          {/* --- OPTION 3: CUSTOM GOAL --- */}
          <div className="group bg-white rounded-3xl p-8 border border-slate-100 shadow-lg shadow-slate-100 hover:shadow-xl hover:border-slate-200 transition-all duration-300 hover:-translate-y-1 flex flex-col">
             <div className="absolute top-8 right-8 text-slate-300 group-hover:text-emerald-400 transition-colors">
              <PenTool size={20} />
            </div>

            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-6 group-hover:bg-emerald-100 transition-colors">
              <Sparkles size={28} strokeWidth={1.5} />
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mb-2">Create Custom</h2>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              Build your own unique vision from scratch for niche or complex goals.
            </p>

             <div className="flex items-center gap-4 mb-8 text-xs font-medium text-slate-500">
                <span className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md text-slate-600">
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
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => onSelectPath('custom')}
                className="w-full py-4 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium text-sm hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 transition-all flex items-center justify-center gap-2"
              >
                Create Your Own Goal <ArrowRight size={16} />
              </button>
          </div>

        </div>

        {/* 3. Footer / Back Link */}
        <div className="mt-16 text-center animate-[fadeIn_1s_ease-out_0.4s]">
          <button
            onClick={() => window.history.back()}
            className="text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors"
          >
            Not ready to plan yet? Go back to Dashboard
          </button>
        </div>

      </main>
    </div>
  );
};

export default GoalSelectionHub;
