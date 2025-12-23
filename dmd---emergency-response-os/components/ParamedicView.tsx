
import React, { useState, useEffect } from 'react';
import { VitalSign } from '../types';
import VitalsPanel from './VitalsPanel';
import { fetchAiAnalysis, logAbTestResult } from '../services/databricksService';
import { 
  Wifi, 
  Map, 
  Bot, 
  BriefcaseMedical, 
  Wind, 
  ShieldAlert, 
  HeartPulse, 
  Syringe, 
  Activity, 
  X,
  TriangleAlert,
  Database,
  Sparkles,
  Search,
  Fingerprint,
  Navigation
} from 'lucide-react';

interface ParamedicViewProps {
  vitals: VitalSign[];
  onTransfer: () => void;
  patientId: string;
  groupType: 'A' | 'B';
  scenarioStep: number;
  onNextStep: () => void;
}

const ParamedicView: React.FC<ParamedicViewProps> = ({ 
  vitals, 
  onTransfer, 
  patientId, 
  groupType, 
  scenarioStep,
  onNextStep
}) => {
  const [selectedTreatments, setSelectedTreatments] = useState<Set<string>>(new Set());
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [isMatching, setIsMatching] = useState(false);

  const toggleTreatment = (id: string) => {
    const next = new Set(selectedTreatments);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedTreatments(next);
  };

  const handleMatchHospital = () => {
    setIsMatching(true);
    setTimeout(() => {
      setIsMatching(false);
      onNextStep(); // Move to Step 2 (Match Completed)
    }, 2500);
  };

  const handleDepart = async () => {
    setIsTransferring(true);
    // Log arrival logic could go here
    setTimeout(onTransfer, 1200);
  };

  return (
    <div className="flex-grow flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-slate-950 border-4 border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative h-[700px] flex flex-col">
        
        {/* Status Bar */}
        <div className="bg-slate-900 px-6 py-3 flex justify-between items-center border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <span className="text-blue-500 font-bold text-lg tracking-tight">dmd</span>
            <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-xs font-bold animate-pulse">EMERGENCY</span>
            <div className="flex items-center gap-1 text-[10px] text-slate-600 font-mono">
              <Database size={10} /> 
              {scenarioStep >= 1 ? 'DB Connected' : 'Waiting for ID'}
            </div>
          </div>
          <div className="text-slate-400 text-sm flex items-center gap-4">
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${groupType === 'A' ? 'text-indigo-400 border-indigo-500/30' : 'text-purple-400 border-purple-500/30'}`}>
              GROUP: {groupType}
            </span>
            <div className="flex items-center">
              <Wifi size={16} className={`${scenarioStep >= 3 ? 'text-green-500' : 'text-slate-700'} mr-2`} />
              {scenarioStep >= 3 ? '5G Stable' : 'Offline'}
            </div>
          </div>
        </div>

        <div className="flex flex-grow overflow-hidden pb-4">
          {/* Left Panel: Patient & Vitals */}
          <div className="w-1/3 p-6 border-r border-slate-800 flex flex-col space-y-3 overflow-y-auto custom-scrollbar">
            <div className="relative">
              <div className={`${scenarioStep < 3 ? 'grayscale opacity-50 blur-[2px]' : ''} transition-all duration-700`}>
                <VitalsPanel vitals={vitals} />
              </div>
              {scenarioStep < 3 && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/20 backdrop-blur-[1px] rounded-2xl">
                   <div className="bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-full text-[10px] font-bold text-slate-400 flex items-center gap-2">
                     <Activity size={12} className="animate-pulse" /> DEVICE CONNECTING...
                   </div>
                </div>
              )}
            </div>
            
            <div className="mt-2 pt-4 border-t border-slate-800">
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-3">Identified Patient</div>
              
              <div className={`transition-all duration-700 ${scenarioStep >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <div className="flex items-center space-x-3 bg-slate-900/60 p-3 rounded-2xl mb-3 border border-slate-800 shadow-inner">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-xl ring-2 ring-slate-700">
                    👨🏻‍🦳
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-100">김철수 ({patientId})</div>
                    <div className="text-[10px] text-slate-500 font-bold">63세 / 남성 / A+</div>
                  </div>
                </div>
                
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start space-x-3">
                  <TriangleAlert size={16} className="text-red-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-red-300 text-xs font-bold uppercase tracking-tight">Genomic Precaution</p>
                    <p className="text-slate-400 text-[10px] leading-tight mt-1">유전적 마그네슘 대사 취약성.</p>
                  </div>
                </div>
              </div>

              {scenarioStep === 0 && (
                <button 
                  onClick={onNextStep}
                  className="w-full bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 py-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all active:scale-95 group shadow-lg"
                >
                  <Fingerprint size={28} className="group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold">SIMULATE ID SCAN</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Panel: Map & Protocols */}
          <div className="w-2/3 p-4 flex flex-col relative">
             <div className="absolute inset-0 bg-slate-900 opacity-50 z-0"></div>
             <div className="absolute inset-0 flex items-center justify-center z-0 opacity-20">
                <Map size={160} className="text-slate-700" />
             </div>

             <div className="z-10 relative flex flex-col h-full space-y-3 overflow-y-auto pr-1 custom-scrollbar">
                {/* Hospital Matching UI */}
                <div className="bg-slate-800/90 backdrop-blur-md p-4 rounded-3xl border border-blue-500/30 shadow-2xl shrink-0">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-blue-400 font-bold text-[10px] uppercase tracking-[0.2em] flex items-center">
                      <Bot size={14} className="mr-2" /> AI Hospital Dispatch
                    </h3>
                  </div>

                  {scenarioStep < 2 ? (
                    <button 
                      onClick={handleMatchHospital}
                      disabled={isMatching || scenarioStep < 1}
                      className={`w-full py-6 rounded-2xl border flex flex-col items-center justify-center gap-3 transition-all ${isMatching ? 'bg-slate-900 border-slate-700' : 'bg-slate-900/60 border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/80'}`}
                    >
                      {isMatching ? (
                        <>
                          <Search size={24} className="text-blue-400 animate-spin" />
                          <span className="text-xs font-bold text-blue-400">주변 응급실 실시간 가용성 확인 중...</span>
                        </>
                      ) : (
                        <>
                          <Navigation size={24} className={scenarioStep >= 1 ? 'text-blue-500' : 'text-slate-700'} />
                          <span className={`text-xs font-bold ${scenarioStep >= 1 ? 'text-slate-300' : 'text-slate-700'}`}>병원 자동 매칭 시스템 가동</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="bg-slate-900/60 p-4 rounded-2xl border-l-4 border-green-500 relative animate-fade-in">
                      <div className="absolute top-4 right-4 bg-green-500/20 text-green-400 text-[10px] px-2 py-1 rounded-md font-bold border border-green-500/30">BEST MATCH</div>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-xl font-bold text-slate-100">한국대학교병원</div>
                          <div className="text-[10px] text-slate-500 font-bold mt-1 uppercase">거리: 2.3km | 교통: 원활</div>
                        </div>
                        <div className="text-3xl font-bold text-green-400 mr-20">7분</div>
                      </div>
                      {scenarioStep === 2 && (
                        <button 
                          onClick={onNextStep}
                          className="mt-4 w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                        >
                          장비 연결 및 이송 시작 <Activity size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Protocol UI */}
                <div className={`bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-800 shadow-2xl flex-grow flex flex-col overflow-hidden transition-all duration-700 ${scenarioStep < 3 ? 'opacity-30' : 'opacity-100'}`}>
                   <div className="px-5 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
                        <BriefcaseMedical size={16} className="mr-2 text-green-500" /> Protocol: Cardiac / HTN
                      </h3>
                   </div>
                   
                   <div className="p-5 overflow-y-auto space-y-6 custom-scrollbar">
                      <div className="grid grid-cols-3 gap-3">
                         <TreatmentButton id="o2" label="산소 투여" icon={<Wind size={18} className="text-blue-400"/>} selected={selectedTreatments.has('o2')} onClick={() => toggleTreatment('o2')} />
                         <TreatmentButton id="airway" label="기도 유지" icon={<ShieldAlert size={18} className="text-green-400"/>} selected={selectedTreatments.has('airway')} onClick={() => toggleTreatment('airway')} />
                         <TreatmentButton id="cpr" label="심폐소생술" icon={<HeartPulse size={18} className="text-red-500"/>} selected={selectedTreatments.has('cpr')} onClick={() => toggleTreatment('cpr')} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                         <TreatmentButton id="iv" label="정맥로 (IV)" subText="N/S 0.9%" icon={<Syringe size={18} className="text-purple-400"/>} selected={selectedTreatments.has('iv')} onClick={() => toggleTreatment('iv')} isWide />
                         <TreatmentButton id="ekg" label="12유도 심전도" subText="Continuous" icon={<Activity size={18} className="text-pink-500"/>} selected={selectedTreatments.has('ekg')} onClick={() => toggleTreatment('ekg')} isWide />
                      </div>
                   </div>
                </div>
             </div>

             {/* Final Departure Button */}
             {scenarioStep >= 3 && (
               <div className="mt-4 z-10 shrink-0 animate-fade-in-up">
                  <button 
                    onClick={handleDepart}
                    disabled={isTransferring}
                    className={`group w-full text-white font-bold py-5 rounded-2xl text-lg shadow-xl flex items-center justify-center gap-4 transition-all transform active:scale-[0.98] ${isTransferring ? 'bg-green-600 shadow-green-900/30' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/40'}`}
                  >
                      <span className="text-2xl transition-transform group-hover:scale-125 group-hover:rotate-6">{isTransferring ? '✅' : '🚑'}</span>
                      <span className="tracking-tight">{isTransferring ? `전송 완료 (Group ${groupType})` : '기록 전송 및 병원 출발'}</span>
                  </button>
              </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

const TreatmentButton: React.FC<{
  id: string, 
  label: string, 
  icon: React.ReactNode, 
  subText?: string, 
  isWide?: boolean, 
  selected: boolean, 
  onClick: () => void 
}> = ({ label, icon, subText, isWide, selected, onClick }) => (
  <button 
    onClick={onClick}
    className={`p-3 rounded-2xl border text-xs transition-all duration-200 shadow-sm
      ${isWide ? 'justify-between px-4' : 'flex-col justify-center gap-2 min-h-[85px]'}
      ${selected 
        ? 'bg-blue-600/20 border-blue-500/60 text-blue-200 ring-2 ring-blue-500/10' 
        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800 hover:border-slate-700'}
      flex items-center 
    `}
  >
    <div className={`flex items-center gap-3 ${!isWide && 'flex-col'}`}>
      <div className={`${selected ? 'scale-110' : 'scale-100'} transition-transform`}>{icon}</div>
      <span className="font-bold tracking-tight">{label}</span>
    </div>
    {subText && <span className="text-[9px] text-slate-500 font-bold uppercase mt-1">{subText}</span>}
  </button>
);

export default ParamedicView;
