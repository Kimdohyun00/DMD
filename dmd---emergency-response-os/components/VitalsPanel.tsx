import React from 'react';
import { VitalSign } from '../types';

interface VitalsPanelProps {
  vitals: VitalSign[];
}

const VitalsPanel: React.FC<VitalsPanelProps> = ({ vitals }) => {
  const getBorderColor = (status: string) => {
    switch (status) {
      case 'critical': return 'border-red-500';
      case 'warning': return 'border-yellow-500';
      case 'normal': return 'border-green-500';
      default: return 'border-blue-500';
    }
  };

  const getTextColor = (status: string) => {
    switch (status) {
      case 'critical': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      case 'normal': return 'text-slate-500';
      default: return 'text-blue-400';
    }
  };

  return (
    <div className="flex flex-col space-y-3">
      {vitals.map((vital, idx) => (
        <div key={idx} className={`bg-slate-900 p-3 rounded-2xl border-l-4 ${getBorderColor(vital.status)} shadow-md`}>
          <div className="text-slate-400 text-[10px] uppercase mb-1">{vital.label}</div>
          <div className="text-4xl font-bold text-white flex items-baseline">
            {vital.value}
            {vital.subValue && <span className="text-xl text-slate-500 ml-1">/{vital.subValue}</span>}
            {vital.unit && <span className="text-sm text-slate-500 font-normal ml-1">{vital.unit}</span>}
          </div>
          {vital.trend && (
            <div className={`${getTextColor(vital.status)} text-[10px] mt-1 font-medium`}>
              {vital.trend}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default VitalsPanel;