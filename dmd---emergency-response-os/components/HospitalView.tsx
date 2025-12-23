
import ctImage from './ct.jpg';   
import mriImage from './mri.jpg'; 
import React, { useState, useEffect, useMemo } from 'react';
import { VitalSign, ChartType } from '../types';
import ChartWidget from './ChartWidget';
import RadarWidget from './RadarWidget';
import { fetchAiAnalysis, logAbTestResult, fetchAiSummary } from '../services/databricksService';
import { 
  TriangleAlert, 
  Activity, 
  Heart, 
  ChartLine, 
  X, 
  Sparkles, 
  Siren,
  Database,
  RefreshCw,
  Timer,
  Zap,
  Stethoscope,
  User,
  Phone,
  ShieldCheck,
  Eye,
  FileText,
  Image as ImageIcon,
  MapPin,
  AlertCircle,
  Fingerprint
} from 'lucide-react';

interface HospitalViewProps {
  vitals: VitalSign[];
  incomingTransfer: boolean;
  patientId: string;
  groupType: 'A' | 'B';
  onTogglePatient: () => void;
}

const HospitalView: React.FC<HospitalViewProps> = ({ 
  vitals, 
  incomingTransfer, 
  patientId, 
  groupType, 
  onTogglePatient 
}) => {
  const [activeChart, setActiveChart] = useState<ChartType>('bp');
  const [showSoapNote, setShowSoapNote] = useState(false);
  const [soapContent, setSoapContent] = useState<string>('');
  const [loadingSoap, setLoadingSoap] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [showPacsModal, setShowPacsModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [actionLogs, setActionLogs] = useState<{time: string, text: string, type: string}[]>([]);

  // [수정] 에러 해결: 브라우저에서 직접 이미지를 import할 수 없으므로 문자열 경로로 변경합니다.
  // 사용자가 components 폴더 안에 파일을 넣었다고 하셨으므로 './components/文件名.jpg' 형식을 사용합니다.
  const pacsImages = useMemo(() => [
    { 
      id: 1, 
      name: 'Body CT (Hematoma)', 
      url: ctImage, 
      info: 'Slice: 14/64 | AXIAL | 2023-12-23 10:42:00'
    },
    { 
      id: 2, 
      name: 'Brain MRI (Tumor)', 
      url: mriImage, 
      info: 'Sequence: T2 | SAGITTAL | 2023-12-23 10:55:10'
    }
  ], []);

  const [actionStatus, setActionStatus] = useState({
    abga: false,
    ct: false,
    iv: false,
    oxygen: false,
    ekg: false,
    xray: false,
    epi: false,
    intubation: false
  });

  const toggleAction = (key: keyof typeof actionStatus) => {
    setActionStatus(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleActionClick = (key: keyof typeof actionStatus, logMessage: string) => {
    const isActivating = !actionStatus[key];
    toggleAction(key);
    
    if (isActivating) {
      const now = new Date();
      const timeString = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`;
      
      const newLog = {
        time: timeString,
        text: logMessage,
        type: 'success'
      };
      
      setActionLogs(prev => [newLog, ...prev]);
    }
  };

  const currentSbp = useMemo(() => parseInt(vitals.find(v => v.label === 'BP')?.value || '120'), [vitals]);
  const currentHr = useMemo(() => parseInt(vitals.find(v => v.label === 'HR')?.value || '80'), [vitals]);
  
  const riskScoreNum = useMemo(() => {
    const shockIndex = currentHr / currentSbp;
    return (shockIndex * 40);
  }, [currentSbp, currentHr]);

  const riskScore = useMemo(() => {
    let score = riskScoreNum;
    if (score > 99.9) score = 99.9;
    if (score < 5) score = 5.0;

    let status = "Stable";
    if (score > 22) status = "Moderate";
    if (score > 32) status = "High Critical";
    
    return { score: score.toFixed(1), status };
  }, [riskScoreNum]);

  const [aiSummarySteps, setAiSummarySteps] = useState<string[]>([]);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  useEffect(() => {
    let interval: any;
    if (startTime && showSoapNote) {
      interval = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(interval);
  }, [startTime, showSoapNote]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (groupType === 'B') {
      const loadSummary = async () => {
        setIsLoadingSummary(true);
        try {
          const data = await fetchAiSummary(patientId);
          if (data?.result?.data_array && data.result.data_array.length > 0) {
            const rawJson = data.result.data_array[0][0];
            try {
              const parsedData = JSON.parse(rawJson);
              if (parsedData.steps && Array.isArray(parsedData.steps)) {
                setAiSummarySteps(parsedData.steps.map((item: any) => item.why));
              } else {
                setAiSummarySteps([rawJson]);
              }
            } catch (e) {
              setAiSummarySteps([rawJson]);
            }
          }
        } catch (e) {
          console.error(e);
        } finally {
          setIsLoadingSummary(false);
        }
      };
      loadSummary();
    }
  }, [groupType, patientId]);

  const handleGenerateSoap = async () => {
    setStartTime(Date.now());
    setLoadingSoap(true);
    setShowSoapNote(true);
    try {
      let report = await fetchAiAnalysis(patientId);
      setSoapContent(report);
    } catch (error) {
      setSoapContent("DB 연동 실패.");
    } finally {
      setLoadingSoap(false);
    }
  };

  const handleCompleteTreatment = async () => {
    if (!startTime) return;
    const duration = Math.floor((Date.now() - startTime) / 1000);
    await logAbTestResult(patientId, groupType, duration);
    alert(`처치 완료: ${duration}초 소요 (Group ${groupType})`);
    setShowSoapNote(false);
    setStartTime(null);
  };

  return (
    <div className="flex-grow p-4 bg-slate-900 overflow-hidden h-screen flex flex-col relative text-slate-200">
       {/* 상단 타이머 및 긴급 알림 */}
       {(startTime && showSoapNote) ? (
         <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[100] animate-fade-in">
            <div className="bg-red-600 border border-red-500 rounded-full px-4 py-1 flex items-center gap-3 shadow-[0_0_20px_rgba(220,38,38,0.4)]">
               <Timer size={14} className="text-white animate-pulse" />
               <span className="text-xl font-mono font-bold text-white tabular-nums">{formatTime(elapsedSeconds)}</span>
               <div className="bg-white/20 px-2 py-0.5 rounded text-[8px] font-bold text-white uppercase">Perf Tracking</div>
            </div>
         </div>
       ) : incomingTransfer && (
         <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-50 animate-bounce-in w-full max-w-lg">
             <div className="bg-slate-900/95 backdrop-blur-md border border-red-500 rounded-2xl shadow-2xl p-4 flex items-center gap-4 ring-4 ring-red-500/20">
                <div className="bg-red-500 p-3 rounded-full animate-pulse shrink-0">
                    <Siren size={24} className="text-white" />
                </div>
                <div>
                     <h3 className="font-bold text-white text-lg tracking-tight">EMERGENCY INBOUND</h3>
                     <p className="text-slate-300 text-sm">AMB-302 In Route with Patient {patientId}</p>
                </div>
            </div>
         </div>
       )}

       <header className="flex justify-between items-center mb-4 px-2 shrink-0">
            <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold text-white tracking-tight">dmd <span className="text-slate-500 font-light">Hospital OS</span></h1>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold border border-blue-500/20">Emergency Dashboard</span>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-800 border border-slate-700">
                    <Database size={12} className="text-orange-400" />
                    <span className="text-[10px] text-slate-400 font-mono">Databricks Active</span>
                  </div>
                </div>
            </div>
            <div className="flex items-center space-x-4">
                <div className="text-right">
                    <div className="text-sm font-bold text-slate-200">Dr. Kim (Cardiac Dept.)</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Active Session</div>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-700 ring-2 ring-slate-800 flex items-center justify-center text-lg">👨‍⚕️</div>
            </div>
        </header>

        <div className="grid grid-cols-12 gap-4 flex-grow overflow-hidden">
            {/* Left Panel: Patient Information Section */}
            <div className="col-span-3 bg-slate-800 rounded-2xl p-4 border border-slate-700 flex flex-col overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-4 shrink-0">
                    <span className="text-blue-400 font-bold text-[10px] flex items-center gap-2 uppercase tracking-widest">
                      <User size={14} /> Patient Information
                    </span>
                    <button onClick={onTogglePatient} className="text-[9px] bg-slate-900 hover:bg-slate-700 text-slate-400 px-2 py-1 rounded border border-slate-700 flex items-center gap-1 transition-colors">
                      <RefreshCw size={10} /> Reset
                    </button>
                </div>

                {/* Patient Profile Card */}
                <div className="bg-slate-900/60 rounded-2xl border border-slate-700 shadow-xl overflow-hidden mb-4 shrink-0">
                    <div className="bg-slate-800/50 p-4 border-b border-slate-700 flex items-center gap-4">
                        <div className="w-16 h-16 bg-slate-700 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-slate-600">👨🏻‍🦳</div>
                        <div className="flex-grow">
                            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                                김철수
                                <span className="text-[10px] font-normal text-slate-400 font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">#{patientId}</span>
                            </h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2 py-0.5 rounded-md text-[8px] font-black border uppercase ${groupType === 'A' ? 'text-indigo-400 border-indigo-500/30 bg-indigo-500/5' : 'text-purple-400 border-purple-500/30 bg-purple-500/5'}`}>
                                    Protocol Group {groupType}
                                </span>
                                <span className="text-[10px] text-slate-400 font-bold">63세 / 남성</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-slate-800/30 p-2 rounded-xl border border-slate-700/50">
                                <div className="text-[8px] text-slate-500 font-bold uppercase mb-0.5">Blood Type</div>
                                <div className="text-sm text-red-400 font-bold flex items-center gap-1.5">
                                    <Heart size={12} className="fill-red-500/20" /> A+ (RH+)
                                </div>
                            </div>
                            <div className="bg-slate-800/30 p-2 rounded-xl border border-slate-700/50">
                                <div className="text-[8px] text-slate-500 font-bold uppercase mb-0.5">Height/Weight</div>
                                <div className="text-sm text-slate-200 font-bold">172cm / 74kg</div>
                            </div>
                        </div>

                        <div className="space-y-3 pt-1">
                            <div className="flex items-center justify-between text-[11px] border-b border-slate-800/80 pb-2">
                                <div className="text-slate-500 flex items-center gap-2"><Fingerprint size={12} /> 주민등록번호</div>
                                <div className="text-slate-200 font-mono tracking-tighter">601219-1******</div>
                            </div>
                            <div className="flex flex-col gap-1 text-[11px] pb-1">
                                <div className="text-slate-500 flex items-center gap-2"><MapPin size={12} /> 환자 거주지</div>
                                <div className="text-slate-300 font-medium leading-relaxed pl-5">서울특별시 강남구 테헤란로 123, 402호</div>
                            </div>
                        </div>

                        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3">
                            <div className="text-blue-400 font-bold text-[9px] uppercase tracking-[0.15em] mb-2 flex items-center gap-2">
                                <ShieldCheck size={12} /> Emergency Contact
                            </div>
                            <div className="flex justify-between items-end">
                                <div>
                                    <div className="text-xs text-white font-bold">이영희 <span className="text-[10px] text-slate-500 font-normal ml-1">(배우자)</span></div>
                                    <div className="text-blue-300 font-mono text-xs mt-1 flex items-center gap-1.5">
                                        <Phone size={10} /> 010-1234-5678
                                    </div>
                                </div>
                                <div className="bg-emerald-500/20 text-emerald-400 text-[8px] font-black px-1.5 py-0.5 rounded border border-emerald-500/30">PRIMARY</div>
                            </div>
                        </div>

                        <div className="space-y-2">
                             <div className="flex items-center gap-2 text-[10px] font-bold text-red-400 uppercase tracking-widest">
                                <AlertCircle size={12} /> Clinical Alerts
                             </div>
                             <div className="flex flex-wrap gap-2">
                                <span className="bg-red-500/10 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded border border-red-500/20">Penicillin Allergy</span>
                                <span className="bg-yellow-500/10 text-yellow-400 text-[10px] font-bold px-2 py-0.5 rounded border border-yellow-500/20">HTN</span>
                                <span className="bg-slate-800 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-700">Diabetes</span>
                             </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-2 flex-grow">
                   <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-1 mb-2">Live Telemetry</h4>
                   {vitals.map((v, i) => (
                     <div key={i} className="flex justify-between p-3 bg-slate-900/40 border border-slate-700/50 rounded-xl transition-all hover:border-slate-600">
                        <span className="text-slate-400 text-[10px] font-bold uppercase">{v.label}</span>
                        <div className="text-right">
                          <span className={`font-bold tabular-nums ${v.status === 'critical' ? 'text-red-400' : 'text-white'}`}>
                            {v.value}{v.subValue ? ` / ${v.subValue}` : ''}
                          </span>
                        </div>
                     </div>
                   ))}
                </div>
            </div>

            {/* Center Panel */}
            <div className="col-span-6 flex flex-col gap-4 overflow-hidden">
                 <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 h-[42%] relative overflow-hidden flex flex-col shadow-lg items-center justify-center text-center">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 animate-pulse"></div>
                    <div className="flex items-center gap-2 mb-4">
                      <TriangleAlert size={18} className="text-red-500" />
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Real-time AI Shock Index</h3>
                    </div>
                    <h1 className={`text-6xl font-bold mb-3 tabular-nums transition-colors duration-500 ${parseFloat(riskScore.score) > 25 ? 'text-red-500' : 'text-white'}`}>
                      {riskScore.score}%
                    </h1>
                    <div className={`px-4 py-1 rounded-lg text-xs font-bold uppercase tracking-widest border transition-all ${parseFloat(riskScore.score) > 25 ? 'bg-red-500/10 text-red-400 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}`}>
                      {riskScore.status} Level
                    </div>
                    <p className="text-[9px] text-slate-500 mt-5 font-medium">
                      Based on Live Vitals & History | Model: <span className="text-indigo-400">Databricks_AutoML_v2.1</span>
                    </p>
                    <Heart className="absolute bottom-[-20%] right-[-5%] text-red-600 opacity-[0.03]" size={160} />
                </div>

                <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 flex-grow relative flex flex-col overflow-hidden shadow-lg">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-[10px] font-bold flex items-center text-slate-400 uppercase tracking-widest">
                            <ChartLine size={16} className="text-blue-400 mr-2" /> Historical Pattern Analysis
                        </h3>
                    </div>
                    <div className="flex gap-4 h-full">
                       <ChartWidget activeTab={activeChart} onTabChange={setActiveChart} currentSbp={currentSbp} />
                       <RadarWidget />
                    </div>

                    {showSoapNote && (
                      <div className="absolute inset-0 z-[110] bg-slate-900/95 backdrop-blur-xl rounded-2xl p-6 flex flex-col animate-fade-in border-2 border-purple-500/50 shadow-2xl overflow-hidden">
                          <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4 shrink-0">
                              <div className="flex items-center gap-3">
                                <div className="bg-purple-600/20 p-2 rounded-lg"><Sparkles size={20} className="text-purple-400" /></div>
                                <h3 className="text-purple-100 font-bold text-lg tracking-tight">AI Clinical Synthesis <span className="text-purple-500/50 font-light text-sm ml-2">(Group {groupType})</span></h3>
                              </div>
                              <button onClick={() => setShowSoapNote(false)} className="text-slate-500 hover:text-white bg-slate-800 p-2 rounded-xl"><X size={20} /></button>
                          </div>
                          <div className="flex-grow overflow-y-auto font-mono text-sm text-slate-300 pr-2 custom-scrollbar space-y-6">
                              {loadingSoap ? (
                                <div className="flex flex-col items-center justify-center h-full space-y-6">
                                  <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
                                  <p className="text-purple-300 font-bold text-xs uppercase tracking-widest">Accessing Unity Catalog...</p>
                                </div>
                              ) : (
                                <>
                                  {groupType === 'B' && aiSummarySteps.length > 0 && (
                                    <div className="p-5 rounded-2xl border bg-indigo-600/10 border-indigo-500/40 shadow-lg animate-fade-in">
                                      <div className="flex items-center gap-2 mb-3">
                                        <Zap size={16} className="text-indigo-400 fill-indigo-400" />
                                        <h4 className="text-indigo-200 font-bold text-xs uppercase tracking-widest">AI Top-Priority Summary</h4>
                                      </div>
                                      <ul className="space-y-2 text-[13px] text-indigo-100 leading-relaxed">
                                        {aiSummarySteps.map((step, idx) => (
                                          <li key={idx} className="flex gap-3"><span className="text-indigo-500 font-bold">•</span><span>{step}</span></li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  <div className="space-y-4 opacity-80">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Full Clinical Record (Source)</h4>
                                    {soapContent.split('\n\n').map((p, i) => (
                                      <div key={i} className="p-4 rounded-xl border bg-slate-950/50 border-slate-800/50 leading-relaxed whitespace-pre-wrap">{p}</div>
                                    ))}
                                  </div>
                                </>
                              )}
                          </div>
                          <div className="mt-6 pt-5 border-t border-slate-800 flex justify-end gap-4 shrink-0">
                              <button onClick={() => setShowSoapNote(false)} className="px-5 py-2.5 bg-slate-800 text-slate-400 rounded-xl text-xs font-bold">CANCEL</button>
                              <button onClick={handleCompleteTreatment} className="px-6 py-2.5 bg-purple-600 text-white rounded-xl text-xs hover:bg-purple-500 shadow-lg shadow-purple-900/40 font-bold">LOG COMPLETE</button>
                          </div>
                      </div>
                    )}
                </div>
            </div>

            {/* Right Panel: Actions and Live Logs */}
            <div className="col-span-3 bg-slate-800 rounded-2xl p-5 border border-slate-700 flex flex-col shadow-xl overflow-hidden">
                <div className="flex justify-between items-center mb-4 shrink-0">
                  <h3 className="text-lg font-bold flex items-center gap-3 text-slate-100 uppercase tracking-tighter">
                    <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
                    Clinical Orders
                  </h3>
                  <button 
                    onClick={() => setShowPacsModal(true)}
                    className="text-[9px] bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg font-bold uppercase flex items-center gap-2 shadow-lg shadow-blue-900/20 transition-all active:scale-95"
                  >
                    <ImageIcon size={12} /> 영상판독 (2)
                  </button>
                </div>
                
                <div className={`p-4 rounded-2xl border transition-all duration-300 mb-4 shrink-0 overflow-y-auto custom-scrollbar ${groupType === 'B' ? 'bg-indigo-600/10 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 'bg-slate-900/60 border-slate-700'}`}>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
                        <Sparkles size={14} className={`mr-2 ${groupType === 'B' ? 'text-indigo-400' : 'text-slate-600'}`} />
                        {groupType === 'B' ? 'AI RECOMMENDED PROTOCOLS' : 'MANUAL ORDER ENTRY'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <ActionButton 
                          label="동맥혈 검사 (ABGA)" sub="LAB" active={actionStatus.abga} 
                          onClick={() => handleActionClick('abga', '검사: 동맥혈 가스 분석(ABGA) 오더 전송됨')} 
                          isRecommended={groupType === 'B'} 
                        />
                        <ActionButton 
                          label="뇌 CT (Brain)" sub="IMG" active={actionStatus.ct} 
                          onClick={() => handleActionClick('ct', '영상: Brain CT (Non-contrast) 촬영 예약')} 
                          isRecommended={groupType === 'B' && riskScoreNum > 22} 
                        />
                        <ActionButton 
                          label="12유도 심전도" sub="EKG" active={actionStatus.ekg} 
                          onClick={() => handleActionClick('ekg', '검사: 12-Lead EKG 심전도 모니터링 시작')} 
                          isRecommended={false} 
                        />
                        <ActionButton 
                          label="흉부 X-ray" sub="X-RAY" active={actionStatus.xray} 
                          onClick={() => handleActionClick('xray', '영상: Portable Chest X-ray (AP) 촬영 요청')} 
                          isRecommended={false} 
                        />
                        <ActionButton 
                          label="수액 (N/S 1L)" sub="FLUID" active={actionStatus.iv} 
                          onClick={() => handleActionClick('iv', '처치: N/S 0.9% 1L IV Line 확보 및 주입')} 
                          isRecommended={groupType === 'B'} 
                        />
                        <ActionButton 
                          label="산소 4L (Nasal)" sub="O2" active={actionStatus.oxygen} 
                          onClick={() => handleActionClick('oxygen', '처치: 산소(O2) 4L/min 비강 캐뉼라 투여')} 
                          isRecommended={false} 
                        />
                        <ActionButton 
                          label="에피네프린" sub="DRUG" active={actionStatus.epi} 
                          onClick={() => handleActionClick('epi', '약물: Epinephrine 1mg IV Bolus 투여 (CODE BLUE)')} 
                          isRecommended={false} 
                        />
                        <ActionButton 
                          label="기관내 삽관" sub="AIRWAY" active={actionStatus.intubation} 
                          onClick={() => handleActionClick('intubation', '시술: Endotracheal Intubation (기관삽관) 세트 준비')} 
                          isRecommended={false} 
                        />
                    </div>
                </div>

                <div className="flex-grow bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col overflow-hidden mb-4 shadow-inner">
                  <div className="text-[10px] text-slate-500 font-bold uppercase mb-2 border-b border-slate-900 pb-1 flex justify-between items-center tracking-widest">
                    <span className="flex items-center gap-2"><FileText size={10} /> 🟢 SYSTEM AUDIT LOG</span>
                    <span className="text-[8px] text-emerald-500 animate-pulse font-mono flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> LIVE
                    </span>
                  </div>
                  <div className="flex-grow overflow-y-auto custom-scrollbar space-y-2.5 pt-1">
                    {actionLogs.length === 0 ? (
                      <div className="text-slate-800 text-[10px] text-center mt-12 font-mono italic">처방 대기 중...</div>
                    ) : (
                      actionLogs.map((log, idx) => (
                        <div key={idx} className="text-[10px] font-mono flex items-start gap-2 animate-fade-in border-l border-emerald-500/30 pl-2">
                          <span className="text-slate-600 shrink-0 tabular-nums">{log.time}</span>
                          <span className="text-slate-200 leading-tight">
                            <span className="text-emerald-400 font-bold">ACK:</span> {log.text}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="shrink-0">
                  <button onClick={handleGenerateSoap} className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-xl ${groupType === 'B' ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/30' : 'bg-slate-700 hover:bg-slate-600 shadow-slate-900/20'}`}>
                    <Stethoscope size={18} />
                    {groupType === 'B' ? 'Review AI Clinical Synthesis' : 'Generate SOAP Summary'}
                  </button>
                </div>
            </div>
        </div>

        {/* 🩻 PACS CT/MRI Viewer Modal */}
        {showPacsModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-fade-in p-6">
            <div className="w-full max-w-6xl h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.9)]">
                <div className="bg-slate-950 px-6 py-4 flex justify-between items-center border-b border-slate-800 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20"><Eye size={22} /></div>
                        <div>
                          <h3 className="font-bold text-white tracking-tight text-lg">PACS Viewer v2.0 <span className="text-slate-600 font-normal text-sm ml-2">Patient: M00001 (Kim, C.)</span></h3>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2 mt-1">
                            <Database size={10} /> Hospital Core Storage Connection Secure
                          </p>
                        </div>
                    </div>
                    <button onClick={() => setShowPacsModal(false)} className="p-2.5 bg-slate-800 text-slate-400 hover:text-white rounded-full transition-all hover:bg-red-500/20"><X size={20} /></button>
                </div>

                <div className="flex-grow flex overflow-hidden bg-black">
                    <div className="w-64 bg-slate-900 border-r border-slate-800 p-4 overflow-y-auto flex flex-col gap-4">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">SERIES LIST</p>
                        {pacsImages.map((img, idx) => (
                          <div 
                            key={img.id}
                            onClick={() => setSelectedImageIndex(idx)}
                            className={`p-3 rounded-xl cursor-pointer border transition-all duration-200 group ${
                              selectedImageIndex === idx 
                                ? 'bg-blue-600/30 border-blue-500 shadow-lg shadow-blue-900/20' 
                                : 'bg-slate-850 border-slate-700 hover:border-slate-500'
                            }`}
                          >
                            <div className="aspect-square bg-black rounded-lg mb-2 overflow-hidden border border-slate-800 group-hover:border-slate-600 transition-colors flex items-center justify-center">
                               <ImageIcon size={28} className={`${selectedImageIndex === idx ? 'text-blue-400' : 'text-slate-700'}`} />
                            </div>
                            <div className={`text-[12px] font-bold truncate ${selectedImageIndex === idx ? 'text-blue-100' : 'text-slate-400'}`}>
                              {img.name}
                            </div>
                            <div className="text-[9px] text-slate-500 font-mono mt-1">Series {img.id} (AXIAL)</div>
                          </div>
                        ))}
                    </div>

                    <div className="flex-grow relative flex items-center justify-center group overflow-hidden bg-slate-950">
                        {/* 
                          [수정] 직접적인 경로를 사용하여 이미지 렌더링. 
                          ES6 import 방식은 브라우저에서 직접 모듈을 로드할 때 .jpg 파일을 지원하지 않아 에러를 발생시킵니다.
                        */}
                        <img 
                          key={pacsImages[selectedImageIndex].url}
                          src={pacsImages[selectedImageIndex].url} 
                          alt="Medical Scan"
                          className="max-h-full max-w-full w-auto h-auto object-contain shadow-[0_0_80px_rgba(0,0,0,1)] ring-1 ring-white/10"
                          style={{ 
                            height: '100%', 
                            width: 'auto', 
                            maxWidth: '100%', 
                            objectFit: 'contain' 
                          }} 
                          onError={(e) => {
                            console.error("Image Load Failed:", pacsImages[selectedImageIndex].url);
                          }}
                        />
                        <div className="absolute top-6 left-6 text-emerald-400 font-mono text-[11px] space-y-1.5 drop-shadow-[0_2px_2px_rgba(0,0,0,1)] opacity-90">
                           <div className="flex gap-4"><span>{pacsImages[selectedImageIndex].info}</span></div>
                           <div className="text-white/60">Zoom: 100% | Window: Brain</div>
                        </div>
                        <div className="absolute bottom-6 right-6 flex items-center gap-3">
                           <div className="flex bg-slate-900/90 backdrop-blur rounded-xl p-1.5 border border-slate-800 shadow-2xl">
                              <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"><Activity size={16}/></button>
                              <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"><ImageIcon size={16}/></button>
                           </div>
                           <div className="text-[10px] bg-red-600 text-white px-3 py-1.5 rounded-lg font-black tracking-widest shadow-lg animate-pulse">LIVE PACS STREAM</div>
                        </div>
                    </div>

                    <div className="w-80 bg-slate-950 border-l border-slate-800 flex flex-col p-6 overflow-y-auto">
                        <div className="flex items-center gap-2 mb-6 border-b border-slate-900 pb-4">
                           <Sparkles size={18} className="text-red-400" />
                           <h4 className="text-xs font-black text-slate-100 uppercase tracking-widest">🚨 AI Findings</h4>
                        </div>
                        <div className="space-y-6">
                            <div className="bg-red-600/5 border border-red-500/20 rounded-2xl p-4 shadow-inner">
                               <div className="flex justify-between items-center mb-1">
                                 <span className="text-[9px] text-red-400 font-black uppercase tracking-widest">Critical Alert</span>
                                 <span className="text-[9px] text-slate-600 font-mono">v2.1_CORE</span>
                               </div>
                               <div className="text-2xl font-bold text-white tracking-tight">Intracranial Hemorrhage</div>
                               <div className="mt-3 w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                                  <div className="h-full bg-red-500 shadow-[0_0_8px_#ef4444]" style={{ width: '98.2%' }}></div>
                               </div>
                            </div>
                            <div className="p-4 bg-red-950/20 border border-red-500/30 rounded-xl relative overflow-hidden">
                               <p className="text-[10px] text-red-300 font-bold flex items-center gap-2 mb-2 uppercase tracking-widest">
                                 <TriangleAlert size={12} className="fill-red-500/20" /> Clinical Recommendation
                               </p>
                               <p className="text-[11px] text-slate-300 leading-relaxed italic border-l-2 border-red-500/50 pl-3">
                                 "Immediate neurosurgical consultation required. Midline shift observed. Manage ICP and vital stability protocols."
                               </p>
                            </div>
                            <div className="space-y-3 pt-2">
                               <h5 className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3">Measurement Data</h5>
                               <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                                  <span className="text-[10px] text-slate-600 font-bold">LESION SIZE</span>
                                  <span className="text-xs font-bold text-white">1.4 cm</span>
                               </div>
                               <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                                  <span className="text-[10px] text-slate-600 font-bold">MIDLINE SHIFT</span>
                                  <span className="text-xs font-bold text-red-400">POSSIBLE (0.4mm)</span>
                               </div>
                               <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                                  <span className="text-[10px] text-slate-600 font-bold">DENSITY (HU)</span>
                                  <span className="text-xs font-bold text-red-400">HIGH (72 HU)</span>
                               </div>
                            </div>
                            <div className="pt-6 mt-auto">
                              <button className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-[10px] font-bold border border-slate-800 transition-all flex items-center justify-center gap-2 uppercase tracking-widest">
                                <FileText size={14} /> Export Findings to EMR
                              </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        )}
    </div>
  );
};

const ActionButton = ({ label, sub, active, onClick, isRecommended }: any) => (
  <button 
    onClick={onClick}
    className={`p-3 rounded-xl border text-left transition-all duration-200 relative overflow-hidden flex flex-col justify-center min-h-[70px] ${
      active 
        ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
        : (isRecommended ? 'bg-indigo-600/10 border-indigo-500/40 text-white shadow-[0_0_10px_rgba(99,102,241,0.15)] hover:bg-indigo-600/20' : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800')
    }`}
  >
    {isRecommended && !active && (
      <div className="absolute top-0 right-0 bg-indigo-500 text-[7px] px-1.5 py-0.5 font-black text-white rounded-bl-lg tracking-tighter uppercase">AI PICK</div>
    )}
    <span className={`text-[8px] uppercase font-bold mb-1 opacity-70 ${active ? 'text-slate-900' : ''}`}>{sub}</span>
    <span className="text-[11px] font-bold leading-tight">{active ? '✅ Ordered' : label}</span>
  </button>
);

export default HospitalView;
