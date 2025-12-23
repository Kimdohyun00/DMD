import React from 'react';
import { ArrowDown } from 'lucide-react';

const RadarWidget: React.FC = () => {
  return (
    <div className="w-1/3 flex flex-col pl-4 border-l border-slate-700/50">
      <div className="flex-grow relative flex items-center justify-center mb-1">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl transform scale-110">
            <polygon points="50,10 90,40 75,90 25,90 10,40" fill="none" stroke="#334155" strokeWidth="0.5"/>
            <polygon points="50,25 75,44 65,75 35,75 25,44" fill="none" stroke="#334155" strokeWidth="0.5"/>
            <polygon points="50,15 85,42 60,70 40,70 15,45" fill="rgba(239, 68, 68, 0.2)" stroke="#EF4444" strokeWidth="2" className="animate-radar origin-center"/>
            <text x="50" y="8" textAnchor="middle" fontSize="8" fill="#94A3B8">CV</text>
            <text x="92" y="38" textAnchor="start" fontSize="8" fill="#94A3B8">Glu</text>
            <text x="78" y="96" textAnchor="start" fontSize="8" fill="#94A3B8">Liv</text>
            <text x="22" y="96" textAnchor="end" fontSize="8" fill="#94A3B8">Kid</text>
            <text x="8" y="38" textAnchor="end" fontSize="8" fill="#94A3B8">Imm</text>
        </svg>
      </div>
      {/* Lab Alerts */}
      <div className="space-y-1.5">
          <div className="flex justify-between items-center bg-slate-900/50 px-2 py-1.5 rounded border border-slate-700">
              <span className="text-[10px] text-slate-400">eGFR</span>
              <span className="text-[10px] font-bold text-yellow-400 flex items-center gap-1">58 <ArrowDown size={8} /></span>
          </div>
          <div className="flex justify-between items-center bg-slate-900/50 px-2 py-1.5 rounded border border-slate-700">
              <span className="text-[10px] text-slate-400">LDL-C</span>
              <span className="text-[10px] font-bold text-white">142</span>
          </div>
      </div>
    </div>
  );
};

export default RadarWidget;