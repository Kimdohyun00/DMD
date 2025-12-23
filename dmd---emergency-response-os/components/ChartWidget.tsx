
import React, { useState, useEffect } from 'react';
import { ChartData, ChartType } from '../types';
// Add missing import for TriangleAlert icon
import { TriangleAlert } from 'lucide-react';

interface ChartWidgetProps {
  activeTab: ChartType;
  onTabChange: (tab: ChartType) => void;
  currentSbp: number;
}

const ChartWidget: React.FC<ChartWidgetProps> = ({ activeTab, onTabChange, currentSbp }) => {
  const [data, setData] = useState<ChartData[]>([]);
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (activeTab === 'bp') {
      setTitle("Systolic BP Trend (mmHg)");
      setData([
        { year: '2021', value: 45, color: 'bg-slate-700' },
        { year: '2022', value: 55, color: 'bg-slate-700' },
        { year: '2023', value: 65, color: 'bg-slate-600' },
        { year: 'AVG', value: 60, color: 'bg-blue-600/40' },
      ]);
    } else if (activeTab === 'bs') {
      setTitle("Fasting Blood Sugar (mg/dL)");
      setData([
        { year: '2021', value: 35, color: 'bg-slate-700' },
        { year: '2022', value: 40, color: 'bg-slate-700' },
        { year: '2023', value: 50, color: 'bg-slate-700' },
        { year: 'AVG', value: 42, color: 'bg-blue-600/40' },
      ]);
    } else {
      setTitle("Total Cholesterol (mg/dL)");
      setData([
        { year: '2021', value: 45, color: 'bg-slate-700' },
        { year: '2022', value: 48, color: 'bg-slate-700' },
        { year: '2023', value: 52, color: 'bg-slate-700' },
        { year: 'AVG', value: 48, color: 'bg-blue-600/40' },
      ]);
    }
  }, [activeTab]);

  // 'NOW' 막대의 높이를 현재 혈압(currentSbp)에 연동 (정규화: 180mmHg를 100%로 가정)
  const normalizedNowHeight = Math.min((currentSbp / 180) * 100, 100);

  return (
    <div className="w-2/3 flex flex-col h-full">
      <div className="text-[10px] text-slate-500 mb-2 font-bold uppercase tracking-widest">{title}</div>
      <div className="flex-grow flex items-end space-x-3 px-2 pb-2 border-b border-slate-700 relative h-32">
        {data.map((item, idx) => (
          <div key={idx} className="flex-1 flex flex-col justify-end group h-full">
            <div 
              className={`chart-bar rounded-t w-full relative transition-all duration-700 group-hover:bg-blue-500/50 ${item.color}`} 
              style={{ height: `${item.value}%` }}
            />
            <span className="text-[8px] text-center mt-2 text-slate-500 font-bold">
              {item.year}
            </span>
          </div>
        ))}

        {/* [NOW] 실시간 연동 막대 */}
        <div className="flex-1 flex flex-col justify-end h-full">
          <div 
            className="rounded-t w-full relative transition-all duration-300 ease-out bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]" 
            style={{ height: `${normalizedNowHeight}%` }}
          >
             <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 text-[10px] text-white font-bold bg-red-600 px-1.5 py-0.5 rounded border border-red-400 shadow-xl z-10 tabular-nums">
               {currentSbp}
             </div>
          </div>
          <span className="text-[8px] text-center mt-2 text-red-400 font-black animate-pulse">NOW</span>
        </div>
      </div>
      
      {/* Insight Box */}
      <div className="mt-3 bg-red-500/5 p-2.5 rounded-xl border border-red-500/20 flex items-start space-x-3">
        <TriangleAlert size={14} className="text-red-500 mt-0.5 shrink-0" />
        <div>
            <div className="text-[9px] font-black text-red-400 flex items-center gap-2 tracking-tighter uppercase">
              Anomaly Detected (AutoML Engine)
            </div>
            <div className="text-[10px] text-slate-400 leading-tight mt-1">
              Current SBP ({currentSbp}) deviates <strong className="text-red-300">+{currentSbp - 120}mmHg</strong> from patient's 3-year historical average baseline.
            </div>
        </div>
      </div>
    </div>
  );
};

export default ChartWidget;
