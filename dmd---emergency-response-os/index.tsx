
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import ParamedicView from './components/ParamedicView';
import HospitalView from './components/HospitalView';
import { VitalSign } from './types';

const App = () => {
  const [viewMode, setViewMode] = useState<'paramedic' | 'hospital'>('paramedic');
  const [incomingTransfer, setIncomingTransfer] = useState(false);
  
  // Scenario Control: 0(Scan) -> 1(ID) -> 2(Match) -> 3(Connect/Route) -> 4(Transfer)
  const [scenarioStep, setScenarioStep] = useState(0);

  // Fixed Patient Data
  const [patientId] = useState('M00001');
  const [groupType, setGroupType] = useState<'A' | 'B'>('A');

  // Real-time Dynamic Vitals State
  const [vitals, setVitals] = useState<VitalSign[]>([
    { label: 'BP', value: '120', subValue: '80', unit: 'mmHg', status: 'normal' },
    { label: 'HR', value: '80', unit: 'bpm', status: 'normal' },
    { label: 'SpO2', value: '98', unit: '%', status: 'normal' },
    { label: 'BT', value: '36.5', unit: '°C', status: 'normal' },
    { label: 'RR', value: '16', unit: '/min', status: 'normal' },
  ]);

  // Randomize group on load
  useEffect(() => {
    setGroupType(Math.random() < 0.5 ? 'A' : 'B');
  }, []);

  // Vitals Drifting Logic - Only active from Step 3
  useEffect(() => {
    if (scenarioStep < 3) return;

    const drift = (min: number, max: number, current: number) => {
      const change = (Math.random() - 0.5) * 3; 
      let newValue = current + change;
      if (newValue > max) newValue = max;
      if (newValue < min) newValue = min;
      return Math.round(newValue);
    };

    const interval = setInterval(() => {
      setVitals(prevVitals => prevVitals.map(v => {
        if (v.label === 'BP') {
          return {
            ...v,
            value: drift(115, 145, parseInt(v.value)).toString(),
            subValue: drift(75, 95, parseInt(v.subValue || '80')).toString(),
            status: parseInt(v.value) > 140 ? 'warning' : 'normal'
          };
        }
        if (v.label === 'HR') {
          const newVal = drift(75, 115, parseInt(v.value));
          return { ...v, value: newVal.toString(), status: newVal > 100 ? 'warning' : 'normal' };
        }
        if (v.label === 'SpO2') {
          return { ...v, value: drift(94, 99, parseInt(v.value)).toString() };
        }
        if (v.label === 'RR') {
          return { ...v, value: drift(14, 24, parseInt(v.value)).toString() };
        }
        if (v.label === 'BT') {
          const change = (Math.random() - 0.5) * 0.1;
          let newVal = parseFloat(v.value) + change;
          return { ...v, value: newVal.toFixed(1) };
        }
        return v;
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [scenarioStep]);

  const handleTransfer = () => {
    setIncomingTransfer(true);
    setTimeout(() => {
        setViewMode('hospital');
    }, 800);
  };

  const nextScenario = () => {
    if (scenarioStep < 4) setScenarioStep(s => s + 1);
  };

  const resetScenario = () => {
    setScenarioStep(0);
    setViewMode('paramedic');
    setIncomingTransfer(false);
    setGroupType(Math.random() < 0.5 ? 'A' : 'B');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-blue-500/30">
      {/* Dev Reset Button */}
      <button 
        onClick={resetScenario}
        className="fixed bottom-4 right-4 z-[60] bg-slate-800/80 hover:bg-slate-700 p-2 rounded-full border border-slate-700 transition-all text-slate-400 hover:text-white shadow-lg"
        title="Reset Scenario"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
      </button>

      {/* Main View Toggle (Hidden in production feel) */}
      <div className="fixed top-4 right-4 z-50 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-full p-1 flex shadow-xl opacity-20 hover:opacity-100 transition-opacity">
        <button
          onClick={() => setViewMode('paramedic')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
            viewMode === 'paramedic' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          EMS
        </button>
        <button
          onClick={() => setViewMode('hospital')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
            viewMode === 'hospital' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          HOSP
        </button>
      </div>

      {viewMode === 'paramedic' ? (
        <ParamedicView 
          vitals={vitals} 
          onTransfer={handleTransfer} 
          patientId={patientId}
          groupType={groupType}
          scenarioStep={scenarioStep}
          onNextStep={nextScenario}
        />
      ) : (
        <HospitalView 
          vitals={vitals} 
          incomingTransfer={incomingTransfer} 
          patientId={patientId}
          groupType={groupType}
          onTogglePatient={resetScenario}
        />
      )}
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
