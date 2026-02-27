
import React, { useState, useMemo } from 'react';
import { UserRoleType, RiskAnalysis, Goal } from '../types';
import { 
  ShieldAlert, Send, Info, Sparkles, Loader2, AlertTriangle, 
  Calendar, Eye, Hash, Layers, CheckCircle2, FileText, 
  Zap, MessageSquare, History, ListChecks, Target, Plus, Trash2, Clock, AlertCircle,
  Search, Filter, ChevronRight, User, Users, X, Share2, Quote, TrendingUp, Lock, Briefcase,
  LayoutGrid, ListFilter, CalendarDays, ChevronLeft, ChevronDown, Timer, ArrowRight, UserCheck, LockKeyhole,
  Rocket, BrainCircuit, Lightbulb, Check
} from 'lucide-react';
import { MOCK_PLANS, MOCK_REPORTS } from '../constants';
import { analyzeReportRisk, getSmartSuggestions, extractInsightFromDaily, generateDailySummary } from '../services/geminiService';
import GitStyleEditor from '../components/GitStyleEditor';

interface DailyReportProps {
  role: UserRoleType;
  goals: Goal[];
}

interface ReportSegment {
  id: string;
  goalId: string;
  timeCodeId: string;
  subItemId: string;
  timeSpent: number;
  progress: number;
  content: string;
  nextPlan: string;
  summary: string;
  suggestions: string[];
  isAnalyzing: boolean;
  analysis: RiskAnalysis | null;
  isExtracting: boolean;
  isSummarizing?: boolean;
}

const MOCK_TIMESHEET_CODES = [
  { id: 'CODE-2026-001', name: 'BP-核心产品研发 (PROJ-01)' },
  { id: 'CODE-2026-002', name: 'BP-自动化演进专项 (PROJ-02)' },
  { id: 'CODE-2026-003', name: 'BP-商业化闭环支撑 (PROJ-03)' },
  { id: 'CODE-2026-004', name: 'BP-日常运维与管理 (ROUTINE)' },
];

const MOCK_TIMESHEET_SUBS = [
  { id: 'SUB-01', name: '需求分析与方案设计' },
  { id: 'SUB-02', name: '核心代码研发/重构' },
  { id: 'SUB-03', name: '测试用例编写与执行' },
  { id: 'SUB-04', name: '部署发布与灰度观测' },
  { id: 'SUB-05', name: '会议/文档/知识沉淀' },
];

const DAILY_TEMPLATE = (projectName: string) => `### 专项：${projectName}攻坚

#### 核心产出
- [任务A]：[目标贡献]，状态：✅完成

**今日认知/踩坑**：
> [现象描述]
> **教训**：[核心认知沉淀]

#### 明日计划
1. [具体行动项]：预计达成[量化结果]
2. [协同/资源]：需要[某部门/人员]支持[某事项]
`;

const DailyReport: React.FC<DailyReportProps> = ({ role, goals }) => {
  const [activeTab, setActiveTab] = useState<'write' | 'browse'>('browse');
  const [browseMode, setBrowseMode] = useState<'individual' | 'project'>('individual');
  
  // Extraction Result Modal State
  const [showExtractionModal, setShowExtractionModal] = useState(false);
  const [extractedResult, setExtractedResult] = useState<any>(null);
  const [isSyncingToLib, setIsSyncingToLib] = useState(false);
  const [syncDone, setSyncDone] = useState(false);

  // Date Range State
  const [startDate, setStartDate] = useState('2026-05-15');
  const [endDate, setEndDate] = useState('2026-05-20');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGoalId, setSelectedGoalId] = useState<string>('all');
  const [filterMode, setFilterMode] = useState<'all' | 'risk_only'>('all');
  const [showOnlyMe, setShowOnlyMe] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);

  const currentUserName = useMemo(() => {
    if (role === UserRoleType.EMPLOYEE) return 'Alex';
    if (role === UserRoleType.TEAM_LEAD) return 'Sarah';
    if (role === UserRoleType.DEPT_HEAD) return 'Eric (DH)';
    return 'Admin';
  }, [role]);

  const isEmployee = role === UserRoleType.EMPLOYEE;

  // Initializing segments for writing
  const createNewSegment = (): ReportSegment => {
    const defaultGoal = goals[0];
    return {
      id: `seg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      goalId: defaultGoal?.id || '',
      timeCodeId: MOCK_TIMESHEET_CODES[0].id,
      subItemId: MOCK_TIMESHEET_SUBS[0].id,
      timeSpent: 2,
      progress: defaultGoal?.progress || 0,
      content: '',
      nextPlan: '',
      summary: '',
      suggestions: [],
      isAnalyzing: false,
      analysis: null,
      isExtracting: false
    };
  };

  const [segments, setSegments] = useState<ReportSegment[]>([createNewSegment()]);

  const totalHours = useMemo(() => {
    return segments.reduce((sum, seg) => sum + (Number(seg.timeSpent) || 0), 0);
  }, [segments]);

  const isOverLimit = totalHours > 8;

  const updateSegment = (id: string, updates: Partial<ReportSegment>) => {
    setSegments(prev => prev.map(seg => {
      if (seg.id === id) {
        if (updates.goalId && updates.goalId !== seg.goalId) {
          const newGoal = goals.find(g => g.id === updates.goalId);
          return { ...seg, ...updates, progress: newGoal?.progress || 0 };
        }
        return { ...seg, ...updates };
      }
      return seg;
    }));
  };

  const addSegment = () => {
    if (isOverLimit) return;
    setSegments(prev => [...prev, createNewSegment()]);
  };

  const removeSegment = (id: string) => {
    if (segments.length <= 1) return;
    setSegments(prev => prev.filter(seg => seg.id !== id));
  };

  const handleTextChange = async (id: string, text: string) => {
    updateSegment(id, { content: text });
  };

  const applyTemplateToSegment = (id: string) => {
    const seg = segments.find(s => s.id === id);
    const goalName = goals.find(g => g.id === (seg?.goalId))?.name || '新项目';
    updateSegment(id, { 
      content: DAILY_TEMPLATE(goalName)
    });
  };

  // AI Extract Insight Logic
  const handleExtractInsight = async (id: string) => {
    const seg = segments.find(s => s.id === id);
    if (!seg || !seg.content.trim()) return;

    updateSegment(id, { isExtracting: true });
    try {
      const result = await extractInsightFromDaily(seg.content);
      if (result) {
        setExtractedResult(result);
        setShowExtractionModal(true);
        setSyncDone(false);
      } else {
        alert("AI 未能从当前文本中识别出明显的经验沉淀，请尝试补充更多细节。");
      }
    } catch (e) {
      console.error(e);
    } finally {
      updateSegment(id, { isExtracting: false });
    }
  };

  const handleGenerateSummary = async (id: string) => {
    const seg = segments.find(s => s.id === id);
    if (!seg || !seg.content.trim()) return;

    updateSegment(id, { isSummarizing: true });
    try {
      const summary = await generateDailySummary(seg.content);
      if (summary) {
        updateSegment(id, { summary });
      } else {
        alert("AI 总结失败，请稍后重试。");
      }
    } catch (e) {
      console.error(e);
    } finally {
      updateSegment(id, { isSummarizing: false });
    }
  };

  const handleSyncToLibrary = async () => {
    setIsSyncingToLib(true);
    // Simulate API call to save to experience library
    await new Promise(r => setTimeout(r, 1200));
    setIsSyncingToLib(false);
    setSyncDone(true);
    setTimeout(() => {
      setShowExtractionModal(false);
    }, 1500);
  };

  const handleSubmit = () => {
    if (isOverLimit) {
      alert(`无法提交：工时已超额。`);
      return;
    }

    const expiredSegments = segments.filter(seg => {
      const goal = goals.find(g => g.id === seg.goalId);
      return goal?.endDate && endDate > goal.endDate;
    });

    if (expiredSegments.length > 0) {
      alert('提交失败：包含已超过结束日期的项目，无法填报。');
      return;
    }

    alert('日报提交成功！目标进度、后续计划与工时流水已同步。');
    setActiveTab('browse');
  };

  // Base filtering for reports
  const baseFilteredReports = useMemo(() => {
    let base = MOCK_REPORTS.filter(r => r.date >= startDate && r.date <= endDate);
    if (role === UserRoleType.EMPLOYEE) base = base.filter(r => r.userName === 'Alex');
    else if (role === UserRoleType.TEAM_LEAD) base = base.filter(r => ['Alex', 'Jerry', 'Sarah'].includes(r.userName));
    if (showOnlyMe) base = base.filter(r => r.userName.includes(currentUserName.split(' ')[0]));
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      base = base.filter(r => 
        r.userName.toLowerCase().includes(searchLower) || 
        r.segments.some(s => s.content.toLowerCase().includes(searchLower))
      );
    }
    if (selectedGoalId !== 'all') {
      const targetGoal = goals.find(g => g.id === selectedGoalId);
      if (targetGoal) {
        base = base.filter(r => r.segments.some(s => s.goalName === targetGoal.name));
      }
    }
    if (filterMode === 'risk_only') base = base.filter(r => r.status === 'HIGH_RISK');
    return base;
  }, [role, searchTerm, filterMode, showOnlyMe, currentUserName, selectedGoalId, goals, startDate, endDate]);

  const projectGroupedReports = useMemo(() => {
    const projectMap: Record<string, any[]> = {};
    baseFilteredReports.forEach(report => {
      report.segments.forEach((seg: any) => {
        const targetGoalName = selectedGoalId !== 'all' ? goals.find(g => g.id === selectedGoalId)?.name : null;
        if (targetGoalName && seg.goalName !== targetGoalName) return;
        if (!projectMap[seg.goalName]) projectMap[seg.goalName] = [];
        projectMap[seg.goalName].push({
          userName: report.userName,
          role: report.role,
          hours: seg.hours,
          content: seg.content,
          nextPlan: seg.nextPlan,
          progress: seg.progress,
          status: report.status,
          reportId: report.id,
          date: report.date
        });
      });
    });
    return Object.entries(projectMap).sort((a, b) => b[1].length - a[1].length);
  }, [baseFilteredReports, selectedGoalId, goals]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 pb-24 h-full flex flex-col">
      {/* Tab Switcher */}
      <div className="flex bg-white p-2 rounded-[2rem] border border-slate-100 shadow-sm w-fit mx-auto sticky top-0 z-40">
        <button 
          onClick={() => setActiveTab('write')}
          className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
            activeTab === 'write' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Plus size={16} /> 填报本日日报
        </button>
        <button 
          onClick={() => setActiveTab('browse')}
          className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
            activeTab === 'browse' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <History size={16} /> 执行大厅
        </button>
      </div>

      {activeTab === 'write' ? (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className={`flex items-center justify-between p-6 px-10 rounded-[2.5rem] border shadow-xl transition-all duration-500 backdrop-blur-md ${
            isOverLimit ? 'bg-rose-50 border-rose-200 shadow-rose-100' : 'bg-white border-slate-100 shadow-slate-100'
          }`}>
            <div className="flex items-center gap-8">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">工时核算进度 ({endDate})</span>
                <div className="flex items-center gap-4 mt-2">
                  <div className="w-56 h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-200">
                    <div className={`h-full transition-all duration-700 ${isOverLimit ? 'bg-rose-500' : 'bg-indigo-600'}`} style={{ width: `${Math.min(100, (totalHours / 8) * 100)}%` }} />
                  </div>
                  <span className={`text-base font-black ${isOverLimit ? 'text-rose-600' : 'text-indigo-600'}`}>{totalHours} / 8.0h</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={addSegment} disabled={isOverLimit} className="px-6 py-3 bg-slate-50 border border-slate-200 text-slate-600 text-xs font-black uppercase rounded-2xl hover:bg-white hover:text-indigo-600 transition-all flex items-center gap-2">
                <Plus size={18} /> 添加片段
              </button>
              <button onClick={handleSubmit} className={`px-10 py-3 text-white text-xs font-black uppercase rounded-2xl flex items-center gap-3 transition-all shadow-xl tracking-widest ${isOverLimit ? 'bg-slate-300' : 'bg-indigo-600 shadow-indigo-100 hover:bg-indigo-700'}`}>
                提交执行记录 <Send size={18} />
              </button>
            </div>
          </div>

          <div className="space-y-10">
            {segments.map((seg, index) => {
              const selectedGoal = goals.find(g => g.id === seg.goalId);
              const isOwner = selectedGoal?.owner.includes(currentUserName.split(' ')[0]);
              const isExpired = selectedGoal?.endDate && endDate > selectedGoal.endDate;

              return (
                <div key={seg.id} className={`bg-white p-10 rounded-[3.5rem] shadow-sm border relative group animate-in slide-in-from-bottom-4 duration-500 ${isExpired ? 'border-rose-200 bg-rose-50/20 shadow-rose-100/30' : 'border-slate-100 shadow-slate-100/10'}`}>
                  {segments.length > 1 && (
                    <button onClick={() => removeSegment(seg.id)} className="absolute top-8 right-8 p-3 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all">
                      <Trash2 size={24} />
                    </button>
                  )}

                  <div className="flex items-center gap-5 mb-10">
                    <div className={`w-14 h-14 rounded-3xl flex items-center justify-center font-black text-xl shadow-inner border ${isExpired ? 'bg-rose-100 text-rose-600 border-rose-200' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 leading-none flex items-center gap-3">
                        执行单元填报
                        {isExpired && <span className="px-3 py-1 bg-rose-500 text-white text-[10px] font-black uppercase rounded-lg shadow-lg shadow-rose-100">已截止</span>}
                      </h3>
                      <p className={`text-[10px] font-bold uppercase tracking-widest mt-2 ${isExpired ? 'text-rose-500' : 'text-slate-400'}`}>
                        {isExpired 
                          ? `⚠️ 该项目已于 ${selectedGoal?.endDate} 结束，无法在 ${endDate} 继续填报` 
                          : (isOwner ? '✨ 您是该目标的负责人，请同步更新计划进度' : '📌 作为项目组成员，请记录您的产出与贡献')}
                      </p>
                    </div>
                  </div>

                  <div className={`space-y-10 ${isExpired ? 'opacity-60 pointer-events-none' : ''}`}>
                    <div className="bg-slate-50/80 p-8 rounded-[2.5rem] border border-slate-100 space-y-8">
                       <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                          <Target size={18} className="text-indigo-600" />
                          <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">战略目标关联 (目标地图同步)</span>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                         <div className="md:col-span-8 space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">选择目标地图中的任务</label>
                            <select 
                              value={seg.goalId}
                              disabled={isExpired}
                              onChange={(e) => updateSegment(seg.id, { goalId: e.target.value })}
                              className={`w-full bg-white border rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 outline-none transition-all shadow-sm cursor-pointer ${isExpired ? 'border-rose-300' : 'border-slate-200 focus:ring-indigo-500/10'}`}
                            >
                              {goals.map(g => (
                                <option key={g.id} value={g.id}>{g.name} {g.endDate ? `(截止: ${g.endDate})` : ''}</option>
                              ))}
                            </select>
                         </div>
                         <div className="md:col-span-4 space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                              目标进度 (%) 
                              {!isOwner && <Lock size={12} className="text-slate-300" />}
                            </label>
                            {isOwner ? (
                              <div className="relative group">
                                <TrendingUp className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
                                <input 
                                  type="number" min="0" max="100"
                                  value={seg.progress}
                                  disabled={isExpired}
                                  onChange={(e) => updateSegment(seg.id, { progress: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
                                  className="w-full bg-white border-2 border-emerald-100 rounded-2xl pl-14 pr-6 py-4 text-sm font-black focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all shadow-lg shadow-emerald-50 text-emerald-700"
                                />
                                <div className="absolute -bottom-1 left-0 w-full h-1 px-1">
                                   <div className="w-full h-full bg-slate-100 rounded-full overflow-hidden">
                                      <div className="h-full bg-emerald-500" style={{ width: `${seg.progress}%` }} />
                                   </div>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-slate-100 border border-slate-200 rounded-2xl px-6 py-4 flex items-center justify-between text-slate-400">
                                <span className="text-sm font-bold">当前进度: {seg.progress}%</span>
                                <span className="text-[8px] font-black uppercase bg-white px-2 py-0.5 rounded border border-slate-200">无权修改</span>
                              </div>
                            )}
                         </div>
                       </div>
                    </div>

                    <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
                       <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                          <Clock size={18} className="text-slate-400" />
                          <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">工时核算明细 (财务系统同步)</span>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">工时代码</label>
                            <select 
                              value={seg.timeCodeId}
                              disabled={isExpired}
                              onChange={(e) => updateSegment(seg.id, { timeCodeId: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500/10 outline-none"
                            >
                              {MOCK_TIMESHEET_CODES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                          </div>
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">填报子项</label>
                            <select 
                              value={seg.subItemId}
                              disabled={isExpired}
                              onChange={(e) => updateSegment(seg.id, { subItemId: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500/10 outline-none"
                            >
                              {MOCK_TIMESHEET_SUBS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                          </div>
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center justify-between">
                              耗时 (h) <span className="text-[8px] opacity-40">STEP: 0.5</span>
                            </label>
                            <input 
                              type="number" step="0.5" min="0.5"
                              value={seg.timeSpent}
                              disabled={isExpired}
                              onChange={(e) => updateSegment(seg.id, { timeSpent: parseFloat(e.target.value) || 0 })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-xs font-black focus:ring-2 focus:ring-indigo-500/10 outline-none"
                            />
                          </div>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <div className="flex items-center justify-between">
                         <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">1. 本日执行情况与认知沉淀</label>
                         {!isExpired && (
                           <div className="flex gap-2">
                             <button 
                               onClick={() => handleExtractInsight(seg.id)}
                               disabled={!seg.content || seg.isExtracting}
                               className={`text-[10px] font-black uppercase px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                                 !seg.content ? 'text-slate-300 bg-slate-50 cursor-not-allowed' : 'text-amber-600 bg-amber-50 hover:bg-amber-100 shadow-sm border border-amber-100'
                               }`}
                             >
                               {seg.isExtracting ? <Loader2 size={14} className="animate-spin" /> : <BrainCircuit size={14} />}
                               AI 提炼经验值
                             </button>
                             <button onClick={() => applyTemplateToSegment(seg.id)} className="text-[10px] font-black text-indigo-500 uppercase px-4 py-2 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-all flex items-center gap-2 shadow-sm border border-indigo-100">
                               <ListChecks size={14} /> 载入结构化模版
                             </button>
                           </div>
                         )}
                       </div>
                       <GitStyleEditor
                         value={seg.content}
                         disabled={isExpired}
                         onChange={(val) => handleTextChange(seg.id, val)}
                         placeholder={isExpired ? "该项目已截止，无法填报。" : "记录具体的交付细节、关键产出、认知升级，以及明日计划..."}
                         className={`w-full bg-slate-50 border rounded-[2.5rem] shadow-inner ${isExpired ? 'border-rose-100 cursor-not-allowed' : 'border-slate-200 focus-within:ring-4 focus-within:ring-indigo-500/10'}`}
                         minHeight="300px"
                       />
                    </div>

                    {/* 一句话总结 */}
                    <div className="space-y-4">
                       <div className="flex items-center justify-between">
                          <label className="text-[11px] font-black text-emerald-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <CheckCircle2 size={14} /> 2. 一句话总结 (用于工时导出)
                          </label>
                          <div className="flex items-center gap-3">
                            <div className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">高度概括本日进展</div>
                            {!isExpired && (
                              <button 
                                onClick={() => handleGenerateSummary(seg.id)}
                                disabled={!seg.content || seg.isSummarizing}
                                className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                                  !seg.content ? 'text-slate-300 bg-slate-50 cursor-not-allowed' : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 shadow-sm border border-emerald-100'
                                }`}
                              >
                                {seg.isSummarizing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                AI 一键总结
                              </button>
                            )}
                          </div>
                       </div>
                       <input
                         type="text"
                         value={seg.summary}
                         disabled={isExpired}
                         onChange={(e) => updateSegment(seg.id, { summary: e.target.value })}
                         placeholder={isExpired ? "该项目已截止。" : "例如：完成核心模块开发，模型匹配度达到 95%。"}
                         className={`w-full bg-white border-2 rounded-2xl px-6 py-4 text-sm font-bold outline-none transition-all ${isExpired ? 'border-rose-50 cursor-not-allowed opacity-50' : 'border-emerald-100 focus:ring-4 focus:ring-emerald-500/10 shadow-sm text-emerald-900 placeholder:text-emerald-200'}`}
                       />
                    </div>
                  </div>

                  {isExpired && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                       <div className="bg-white/80 backdrop-blur-md p-6 rounded-[2rem] border-2 border-rose-500 shadow-2xl flex flex-col items-center gap-4 transform rotate-[-2deg]">
                          <LockKeyhole size={48} className="text-rose-600" />
                          <div className="text-center">
                             <p className="text-lg font-black text-slate-900">填报已锁定</p>
                             <p className="text-xs font-bold text-rose-600 uppercase tracking-widest">截止日期: {selectedGoal?.endDate}</p>
                          </div>
                       </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* BROWSE VIEW */
        <div className="space-y-8 animate-in fade-in duration-700 h-full flex flex-col">
           {/* Enhanced Top Navigation & Period Selector */}
           <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
             <div className="flex flex-col md:flex-row items-center justify-between gap-6">
               {/* View Switcher: Individual vs Project */}
               <div className="bg-slate-100 p-1 rounded-2xl flex gap-1 border border-slate-200 w-full md:w-auto">
                 <button 
                   onClick={() => setBrowseMode('individual')}
                   className={`flex-1 md:flex-none px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                     browseMode === 'individual' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'
                   }`}
                 >
                   <User size={16} /> 个人视图
                 </button>
                 <button 
                   onClick={() => setBrowseMode('project')}
                   className={`flex-1 md:flex-none px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                     browseMode === 'project' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'
                   }`}
                 >
                   <Briefcase size={16} /> 项目视图
                 </button>
               </div>

               {/* Custom Date Range Picker */}
               <div className="flex items-center gap-3 bg-indigo-50/50 p-2 rounded-2xl border border-indigo-100/50">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-white border border-indigo-100 rounded-xl shadow-sm">
                     <CalendarDays size={16} className="text-indigo-500" />
                     <div className="flex items-center gap-2">
                        <input 
                          type="date" 
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="text-[11px] font-black uppercase outline-none cursor-pointer bg-transparent text-indigo-900 w-[110px]"
                        />
                        <ArrowRight size={12} className="text-indigo-300" />
                        <input 
                          type="date" 
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="text-[11px] font-black uppercase outline-none cursor-pointer bg-transparent text-indigo-900 w-[110px]"
                        />
                     </div>
                  </div>
                  <div className="hidden sm:block text-[10px] font-black text-indigo-400 uppercase tracking-widest px-2">
                    自定义时段
                  </div>
               </div>
             </div>

             <div className="h-px bg-slate-50" />

             {/* Search & Secondary Filters */}
             <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1 relative w-full">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="按姓名或填报内容全局搜索..."
                    className="w-full pl-14 pr-6 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
                  />
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                  <div className="relative w-full md:w-48">
                    <Target className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" size={16} />
                    <select 
                      value={selectedGoalId}
                      onChange={(e) => setSelectedGoalId(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer"
                    >
                      <option value="all">全量目标筛选</option>
                      {goals.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  </div>
                  
                  {!isEmployee && (
                    <button 
                      onClick={() => setShowOnlyMe(!showOnlyMe)}
                      className={`px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                        showOnlyMe ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <User size={14} />
                    </button>
                  )}
                  
                  <button 
                    onClick={() => setFilterMode(filterMode === 'all' ? 'risk_only' : 'all')}
                    className={`px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                      filterMode === 'risk_only' ? 'bg-rose-600 text-white border-rose-600 shadow-lg shadow-indigo-100' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <AlertTriangle size={14} />
                  </button>
                </div>
             </div>
           </div>

           {/* View Grid: Individual View */}
           {browseMode === 'individual' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 duration-500">
               {baseFilteredReports.map(report => (
                 <div key={report.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 group relative flex flex-col overflow-hidden">
                   <div className={`absolute top-0 right-0 w-2 h-full ${report.status === 'STABLE' ? 'bg-emerald-500' : report.status === 'DEVIATED' ? 'bg-amber-500' : report.status === 'HIGH_RISK' ? 'bg-rose-500' : 'bg-rose-500'}`} />
                   <div className="flex items-center justify-between mb-8">
                     <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-black text-xl shadow-inner group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                         {report.userName[0]}
                       </div>
                       <div>
                         <h4 className="text-base font-black text-slate-900 leading-none mb-1.5">{report.userName}</h4>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{report.role} • {report.date}</p>
                       </div>
                     </div>
                     <div className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border ${report.status === 'STABLE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{report.status}</div>
                   </div>
                   <div className="flex-1 space-y-4 mb-8">
                     {report.segments.map((seg: any, i: number) => {
                       const isTargetMatch = selectedGoalId !== 'all' && seg.goalName === goals.find(g => g.id === selectedGoalId)?.name;
                       return (
                         <div key={i} className={`p-5 rounded-[2rem] transition-all shadow-sm border ${
                           isTargetMatch 
                             ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-50 scale-[1.02] shadow-indigo-100/50' 
                             : 'bg-slate-50/80 border-slate-100 hover:bg-white'
                         }`}>
                           <div className="flex items-center justify-between mb-2">
                             <span className={`text-[10px] font-black uppercase tracking-widest truncate max-w-[140px] ${isTargetMatch ? 'text-indigo-600' : 'text-indigo-500'}`}>
                               {seg.goalName}
                             </span>
                             <div className="flex items-center gap-2">
                                <span className={`text-[9px] font-black uppercase ${isTargetMatch ? 'text-indigo-600' : 'text-emerald-500'}`}>{seg.progress || 0}%</span>
                                <span className="text-[9px] font-black text-slate-300 uppercase">{seg.hours}h</span>
                             </div>
                           </div>
                           <p className={`text-xs font-medium leading-relaxed line-clamp-2 italic ${isTargetMatch ? 'text-indigo-900' : 'text-slate-600'}`}>{seg.content}</p>
                           {seg.nextPlan && (
                              <div className="mt-2 pt-2 border-t border-slate-200/50">
                                 <div className="flex items-center gap-1 text-[8px] font-black text-indigo-400 uppercase"><Rocket size={8}/> 下步计划</div>
                                 <p className="text-[10px] text-indigo-900/60 line-clamp-1 italic">{seg.nextPlan}</p>
                              </div>
                           )}
                         </div>
                       );
                     })}
                   </div>
                   <div className="flex items-center justify-between pt-6 border-t border-slate-50 mt-auto">
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase"><Clock size={14} /> 累计 {report.totalHours}h</div>
                      <button onClick={() => setSelectedReport(report)} className="px-5 py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-600 transition-all shadow-lg">查看详情</button>
                   </div>
                 </div>
               ))}
               {baseFilteredReports.length === 0 && (
                 <div className="col-span-full py-32 flex flex-col items-center justify-center text-slate-300 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                   <History size={64} className="mb-4 opacity-20" />
                   <p className="font-black uppercase tracking-widest">所选时段暂无填报数据</p>
                 </div>
               )}
             </div>
           )}

           {/* View Grid: Project View */}
           {browseMode === 'project' && (
             <div className="space-y-12 animate-in slide-in-from-right-4 duration-500">
               {projectGroupedReports.length > 0 ? projectGroupedReports.map(([projectName, members]) => {
                 const targetGoal = goals.find(g => g.name === projectName);
                 
                 return (
                   <div key={projectName} className="space-y-6">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-6 px-8 py-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-12 opacity-[0.02] text-indigo-600 pointer-events-none group-hover:scale-110 transition-transform">
                          <Briefcase size={120} />
                        </div>
                        
                        <div className="flex items-start gap-5 flex-1 relative z-10">
                          <div className="w-16 h-16 bg-indigo-600 text-white rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-100 shrink-0">
                            <Briefcase size={32} />
                          </div>
                          <div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">{projectName}</h3>
                            <div className="flex flex-wrap items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                              <span className="flex items-center gap-1.5"><Users size={14} className="text-slate-300" /> 参与人：{new Set(members.map(m => m.userName)).size} 位</span>
                              <span className="w-1 h-1 bg-slate-200 rounded-full" />
                              <span className="flex items-center gap-1.5"><FileText size={14} className="text-slate-300" /> 累计填报：{members.length} 条</span>
                              <span className="w-1 h-1 bg-slate-200 rounded-full" />
                              <span className="flex items-center gap-1.5 text-indigo-600 font-black"><Calendar size={14} className="text-indigo-400" /> {targetGoal?.startDate || '??'} ~ {targetGoal?.endDate || '??'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Owner and Members Display */}
                        <div className="flex items-center gap-8 px-6 py-4 bg-slate-50/80 rounded-3xl border border-slate-100 relative z-10">
                           <div className="flex flex-col gap-1">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                <UserCheck size={10} className="text-indigo-500"/> 项目负责人
                              </span>
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-[10px] font-black text-white uppercase shadow-sm">
                                  {targetGoal?.owner?.[0] || '?'}
                                </div>
                                <span className="text-sm font-black text-slate-700">{targetGoal?.owner || '未指派'}</span>
                              </div>
                           </div>
                           
                           <div className="w-px h-8 bg-slate-200" />

                           <div className="flex flex-col gap-1">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">参与团队成员</span>
                              <div className="flex items-center -space-x-2">
                                {targetGoal?.members?.slice(0, 5).map((m, idx) => (
                                  <div key={idx} className="w-8 h-8 rounded-full bg-white border-2 border-slate-50 flex items-center justify-center text-[10px] font-black text-slate-500 uppercase shadow-sm hover:z-20 hover:-translate-y-1 transition-all cursor-help" title={m}>
                                    {m[0]}
                                  </div>
                                ))}
                                {(targetGoal?.members?.length || 0) > 5 && (
                                  <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[9px] font-black text-slate-400 uppercase shadow-sm z-10">
                                    +{(targetGoal?.members?.length || 0) - 5}
                                  </div>
                                )}
                              </div>
                           </div>
                        </div>

                        <div className="w-px h-12 bg-slate-200 mx-4 hidden lg:block" />
                        
                        <div className="text-right shrink-0 relative z-10">
                           <div className="text-3xl font-black text-indigo-600 tracking-tighter">{members.reduce((acc, m)=>acc+m.hours, 0).toFixed(1)}h</div>
                           <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">周期累计投入</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {members.map((m, idx) => (
                          <div key={idx} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:shadow-xl transition-all flex flex-col h-full hover:border-indigo-100">
                             <div className="flex items-center justify-between mb-6">
                               <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-xs font-black text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors shadow-inner">{m.userName[0]}</div>
                                  <div>
                                     <div className="text-xs font-black text-slate-800">{m.userName}</div>
                                     <div className="text-[9px] font-bold text-slate-400 uppercase">{m.date}</div>
                                  </div>
                               </div>
                               <div className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase border ${m.status === 'STABLE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{m.status}</div>
                             </div>
                             <div className="flex-1 space-y-4 mb-6">
                                <div className="bg-slate-50 rounded-[1.5rem] p-4 border border-slate-100 group-hover:bg-white group-hover:border-indigo-100 transition-all relative overflow-hidden">
                                   <div className="flex items-center gap-1.5 mb-2 text-[9px] font-black text-slate-400 uppercase tracking-widest"><FileText size={10}/> 产出沉淀</div>
                                   <p className="text-xs font-medium text-slate-600 leading-relaxed italic line-clamp-3 group-hover:text-indigo-900 z-10 relative">{m.content}</p>
                                   <Quote size={32} className="absolute -right-2 -bottom-2 text-slate-200/40 group-hover:text-indigo-200/20 pointer-events-none" />
                                </div>
                                {m.nextPlan && (
                                  <div className="bg-indigo-50/30 rounded-[1.5rem] p-4 border border-indigo-100/30 group-hover:bg-indigo-50 transition-all">
                                    <div className="flex items-center gap-1.5 mb-2 text-[9px] font-black text-indigo-500 uppercase tracking-widest"><Rocket size={10}/> 后续计划</div>
                                    <p className="text-xs font-bold text-indigo-900/80 leading-relaxed line-clamp-2">{m.nextPlan}</p>
                                  </div>
                                )}
                             </div>
                             <div className="flex items-center justify-between text-[10px] font-black uppercase pt-4 border-t border-slate-50">
                                <div className="flex items-center gap-2 text-slate-400">
                                  <TrendingUp size={14} className="text-emerald-500" /> {m.progress}% 进度
                                </div>
                                <div className="flex items-center gap-1.5 text-indigo-600/60">
                                  <Clock size={12}/> {m.hours}.0h
                                </div>
                             </div>
                          </div>
                        ))}
                      </div>
                   </div>
                 );
               }) : (
                 <div className="py-32 bg-white rounded-[3.5rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-300">
                    <History size={64} className="mb-4 opacity-20" />
                    <p className="font-black uppercase tracking-[0.2em]">当前所选时段暂无项目视角产出</p>
                 </div>
               )}
            </div>
          )}
        </div>
      )}

      {/* AI Extraction Modal */}
      {showExtractionModal && extractedResult && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => !isSyncingToLib && setShowExtractionModal(false)} />
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20 flex flex-col max-h-[90vh]">
             <div className="bg-amber-600 p-8 text-white flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-tight">AI 经验提炼结果</h3>
                    <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest mt-0.5">从填报内容中精准识别组织资产</p>
                  </div>
                </div>
                {!isSyncingToLib && <button onClick={() => setShowExtractionModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X size={20}/></button>}
             </div>
             <div className="p-10 space-y-8 overflow-y-auto flex-1 scrollbar-thin">
                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">提炼结论预览</span>
                      <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border ${extractedResult.type === '踩坑' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                         {extractedResult.type}
                      </div>
                   </div>
                   <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                      <div className="space-y-1">
                         <p className="text-[10px] font-black text-slate-400 uppercase">经验标题</p>
                         <h4 className="text-lg font-black text-slate-900">{extractedResult.title}</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-1">
                            <p className="text-[10px] font-black text-amber-600 uppercase flex items-center gap-1"><Zap size={10}/> 触发场景</p>
                            <p className="text-xs font-medium text-slate-600 leading-relaxed italic">{extractedResult.trigger}</p>
                         </div>
                         <div className="space-y-1">
                            <p className="text-[10px] font-black text-indigo-600 uppercase flex items-center gap-1"><Lightbulb size={10}/> 沉淀方案</p>
                            <p className="text-xs font-bold text-slate-800 leading-relaxed">{extractedResult.solution}</p>
                         </div>
                      </div>
                      <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                         <div className="flex items-center gap-2">
                           <span className="text-[10px] font-black text-slate-400 uppercase">语义置信度</span>
                           <div className="w-20 h-1 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-500" style={{ width: `${extractedResult.reliability * 100}%` }} />
                           </div>
                           <span className="text-[10px] font-black text-amber-600">{(extractedResult.reliability * 100).toFixed(0)}%</span>
                         </div>
                         <span className="text-[10px] font-bold text-slate-400 uppercase">{extractedResult.category}</span>
                      </div>
                   </div>
                </div>
                
                <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 flex items-start gap-4">
                   <div className="p-2 bg-white rounded-xl text-indigo-600 shadow-sm"><Info size={18}/></div>
                   <div className="text-xs text-indigo-800 font-medium leading-relaxed">
                      确认后，该经验将同步至“经验库”模块，并关联到当前战略目标。系统会自动通知相关项目组成员进行学习。
                   </div>
                </div>
             </div>
             <div className="p-10 pt-0 flex gap-4">
                <button 
                  onClick={() => setShowExtractionModal(false)}
                  disabled={isSyncingToLib}
                  className="flex-1 py-4 bg-slate-100 text-slate-500 font-black text-xs uppercase rounded-3xl hover:bg-slate-200 transition-all disabled:opacity-50"
                >
                  放弃提炼
                </button>
                <button 
                  onClick={handleSyncToLibrary}
                  disabled={isSyncingToLib || syncDone}
                  className={`flex-[2] py-4 text-white font-black text-xs uppercase rounded-3xl shadow-xl transition-all flex items-center justify-center gap-3 ${
                    syncDone ? 'bg-emerald-500' : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {isSyncingToLib ? <Loader2 size={18} className="animate-spin" /> : syncDone ? <Check size={18}/> : <Plus size={18}/>}
                  {isSyncingToLib ? '同步中...' : syncDone ? '已成功同步至经验库' : '确认并同步至经验库'}
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setSelectedReport(null)} />
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20 flex flex-col max-h-[90vh]">
            <div className={`p-8 flex items-center justify-between text-white ${selectedReport.status === 'STABLE' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
              <div className="flex items-center gap-6">
                 <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md text-2xl font-black">{selectedReport.userName[0]}</div>
                 <div>
                   <h3 className="text-2xl font-black tracking-tight">{selectedReport.userName} 的执行明细</h3>
                   <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest mt-1">{selectedReport.role} | {selectedReport.date}</p>
                 </div>
              </div>
              <button onClick={() => setSelectedReport(null)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"><X size={20}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 space-y-10">
              <div className="space-y-8">
                {selectedReport.segments.map((seg: any, i: number) => {
                  const isTargetMatch = selectedGoalId !== 'all' && seg.goalName === goals.find(g => g.id === selectedGoalId)?.name;
                  return (
                    <div key={i} className={`p-8 rounded-[2.5rem] border relative transition-all ${
                      isTargetMatch 
                        ? 'bg-indigo-50/50 border-indigo-200 ring-4 ring-indigo-50' 
                        : 'bg-slate-50/50 border-slate-100'
                    }`}>
                      <div className="absolute top-8 right-8 flex items-center gap-4">
                         {isTargetMatch && (
                           <div className="flex items-center gap-1.5 px-3 py-1 bg-white text-indigo-600 rounded-lg font-black text-[10px] uppercase shadow-sm border border-indigo-100">
                             <Sparkles size={12} /> 筛选项目
                           </div>
                         )}
                         <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-500 text-white rounded-lg font-black text-[10px] uppercase">
                            <TrendingUp size={12} /> {seg.progress || 0}% 进度
                         </div>
                         <div className="text-[10px] font-black text-slate-400 uppercase">{seg.hours}h</div>
                      </div>
                      <div className="flex items-center gap-2 mb-6">
                         <Target size={14} className="text-indigo-600" />
                         <span className="text-sm font-black text-slate-800">{seg.goalName}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-4">
                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"><FileText size={12}/> 本日产出沉淀</div>
                            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm min-h-[140px]">
                               <p className="text-sm font-medium text-slate-600 leading-relaxed whitespace-pre-wrap">{seg.content}</p>
                            </div>
                         </div>
                         <div className="space-y-4">
                            <div className="flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-widest"><Rocket size={12}/> 后续执行计划</div>
                            <div className="bg-indigo-50/30 p-6 rounded-[2rem] border border-indigo-100/30 shadow-sm min-h-[140px]">
                               <p className="text-sm font-bold text-indigo-900/80 leading-relaxed whitespace-pre-wrap italic">{seg.nextPlan || '暂无明确下步计划'}</p>
                            </div>
                         </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyReport;
