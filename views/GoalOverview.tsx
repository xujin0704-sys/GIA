
import React, { useState } from 'react';
import { Goal, UserRoleType, GoalStatus, GoalType, GoalCategory } from '../types';
import { MOCK_SUPPORT_PROJECTS, MOCK_PERIOD_SUMMARIES } from '../constants';
import GoalDeepReportModal from '../components/GoalDeepReportModal';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { 
  TrendingUp, 
  ShieldAlert, 
  Target, 
  LayoutDashboard, 
  Layers, 
  Users, 
  BrainCircuit, 
  ArrowUpRight, 
  Download, 
  X, 
  FileSpreadsheet, 
  Clock, 
  FileText,
  CheckCircle2,
  Settings,
  Filter,
  Check,
  RotateCcw,
  AlertTriangle,
  Sparkles,
  Briefcase,
  Zap
} from 'lucide-react';

const MEETING_FIELDS = [
  { id: 'name', label: '目标名称', default: true },
  { id: 'type', label: '组织层级', default: true },
  { id: 'owner', label: '责任人', default: true },
  { id: 'progress', label: '当前进度', default: true },
  { id: 'status', label: '健康状态', default: true },
  { id: 'aiProb', label: 'AI达成预测', default: true },
  { id: 'risk', label: '关键风险点', default: true },
  { id: 'category', label: '业务分类', default: false },
  { id: 'currentGoal', label: '本次目标', default: true },
  { id: 'progressAndRisk', label: '完成情况', default: true },
  { id: 'nextGoal', label: '下次目标', default: true },
];

const TIMESHEET_FIELDS = [
  { id: 'date', label: '日期', default: true },
  { id: 'name', label: '目标项目', default: true },
  { id: 'category', label: '业务分类', default: true },
  { id: 'action', label: '执行动作', default: true },
  { id: 'owner', label: '负责人', default: true },
  { id: 'hours', label: '工时(h)', default: true },
];

const SUPPORT_FIELDS = [
  { id: 'name', label: '项目名称', default: true },
  { id: 'bu', label: '支撑事业部', default: true },
  { id: 'stage', label: '阶段状态', default: true },
  { id: 'estimatedValue', label: '预估价值(万)', default: true },
  { id: 'valueImpact', label: '价值影响力', default: true },
  { id: 'initiator', label: '发起人', default: false },
  { id: 'date', label: '日期', default: false },
  { id: 'currentSummary', label: '本次支撑总结', default: true },
  { id: 'issues', label: '存在问题', default: true },
  { id: 'nextSummary', label: '下次支撑总结', default: true },
];

const GoalOverview: React.FC<{role: UserRoleType, goals: Goal[], activeCycle: string}> = ({ role, goals, activeCycle }) => {
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStep, setExportStep] = useState<'mode' | 'config'>('mode');
  const [selectedMode, setSelectedMode] = useState<'meeting' | 'timesheet' | null>(null);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [selectedSupportFields, setSelectedSupportFields] = useState<string[]>([]);
  const [filterMode, setFilterMode] = useState<'all' | 'risk_only'>('all');
  const [filterProductLine, setFilterProductLine] = useState<string>('全部');
  const [filterCategory, setFilterCategory] = useState<string>('全部');
  const [filterImportance, setFilterImportance] = useState<string>('全部');
  const [filterGoalType, setFilterGoalType] = useState<string>('全部');
  
  // Support Project Filters
  const [filterSupportBU, setFilterSupportBU] = useState<string>('全部');
  const [filterSupportStage, setFilterSupportStage] = useState<string>('全部');
  
  const [selectedGoalForReport, setSelectedGoalForReport] = useState<Goal | null>(null);
  const [viewPeriod, setViewPeriod] = useState<'日' | '周' | '月' | '季' | '年'>('季');

  const goalsToShow = goals.filter(g => {
    let roleMatch = false;
    if (role === UserRoleType.DEPT_HEAD) roleMatch = true;
    else if (role === UserRoleType.TEAM_LEAD) roleMatch = g.type === GoalType.TEAM || g.type === GoalType.INDIVIDUAL;
    else roleMatch = g.type === GoalType.INDIVIDUAL;

    if (!roleMatch) return false;

    if (filterProductLine !== '全部' && g.productLine !== filterProductLine) return false;
    if (filterCategory !== '全部' && g.category !== filterCategory) return false;
    if (filterImportance !== '全部' && g.importance !== filterImportance) return false;
    if (filterGoalType !== '全部' && g.type !== filterGoalType) return false;

    return true;
  });

  const stats = [
    { name: '稳定', value: goalsToShow.filter(g => g.status === GoalStatus.STABLE).length, color: '#10b981' },
    { name: '偏离', value: goalsToShow.filter(g => g.status === GoalStatus.DEVIATED).length, color: '#f59e0b' },
    { name: '高风险', value: goalsToShow.filter(g => g.status === GoalStatus.HIGH_RISK).length, color: '#f43f5e' },
  ];

  const supportProjectsToShow = MOCK_SUPPORT_PROJECTS.filter(p => {
    if (filterSupportBU !== '全部' && p.bu !== filterSupportBU) return false;
    if (filterSupportStage !== '全部' && p.stage !== filterSupportStage) return false;
    return true;
  });

  const supportStats = {
    total: supportProjectsToShow.length,
    communication: supportProjectsToShow.filter(p => p.stage === '需求沟通').length,
    poc: supportProjectsToShow.filter(p => p.stage === 'POC验证').length,
    signed: supportProjectsToShow.filter(p => p.stage === '已签单').length,
    delivered: supportProjectsToShow.filter(p => p.stage === '正式交付').length,
  };

  const getAIProbability = (goal: Goal) => {
    if (goal.status === GoalStatus.STABLE) return Math.min(100, goal.progress + 40);
    if (goal.status === GoalStatus.DEVIATED) return Math.min(80, goal.progress + 20);
    return Math.min(50, goal.progress + 5);
  };

  const getStatusBadgeClass = (status: GoalStatus) => {
    switch (status) {
      case GoalStatus.STABLE: return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case GoalStatus.DEVIATED: return 'bg-amber-50 text-amber-700 border-amber-100';
      case GoalStatus.HIGH_RISK: return 'bg-rose-50 text-rose-700 border-rose-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const openConfig = (mode: 'meeting' | 'timesheet') => {
    setSelectedMode(mode);
    const defaults = mode === 'meeting' 
      ? MEETING_FIELDS.filter(f => f.default).map(f => f.id)
      : TIMESHEET_FIELDS.filter(f => f.default).map(f => f.id);
    setSelectedFields(defaults);
    
    if (mode === 'meeting') {
      setSelectedSupportFields(SUPPORT_FIELDS.filter(f => f.default).map(f => f.id));
    }
    
    setExportStep('config');
  };

  const resetFields = () => {
    if (!selectedMode) return;
    const defaults = selectedMode === 'meeting' 
      ? MEETING_FIELDS.filter(f => f.default).map(f => f.id)
      : TIMESHEET_FIELDS.filter(f => f.default).map(f => f.id);
    setSelectedFields(defaults);
    
    if (selectedMode === 'meeting') {
      setSelectedSupportFields(SUPPORT_FIELDS.filter(f => f.default).map(f => f.id));
    }
  };

  const toggleField = (fieldId: string) => {
    setSelectedFields(prev => 
      prev.includes(fieldId) ? prev.filter(id => id !== fieldId) : [...prev, fieldId]
    );
  };

  const toggleSupportField = (fieldId: string) => {
    setSelectedSupportFields(prev => 
      prev.includes(fieldId) ? prev.filter(id => id !== fieldId) : [...prev, fieldId]
    );
  };

  const csvEscape = (val: string) => `"${val.replace(/"/g, '""')}"`;

  const handleExport = () => {
    if (!selectedMode) return;
    
    let content = "";
    const fields = selectedMode === 'meeting' ? MEETING_FIELDS : TIMESHEET_FIELDS;
    const activeFields = fields.filter(f => selectedFields.includes(f.id)).map(f => {
      if (f.id === 'currentGoal') return { ...f, label: `本${viewPeriod}目标` };
      if (f.id === 'nextGoal') return { ...f, label: `下${viewPeriod}目标` };
      return f;
    });

    const activeSupportFields = SUPPORT_FIELDS.filter(f => selectedSupportFields.includes(f.id)).map(f => {
      if (f.id === 'currentSummary') return { ...f, label: `本${viewPeriod}支撑总结` };
      if (f.id === 'nextSummary') return { ...f, label: `下${viewPeriod}支撑总结` };
      return f;
    });
    
    // Filter Data
    const dataToExport = filterMode === 'risk_only' 
      ? goalsToShow.filter(g => g.status !== GoalStatus.STABLE) 
      : goalsToShow;

    // Rows
    if (selectedMode === 'meeting') {
      // 1. 总体目标概览
      content += `一、总体目标概览 (${viewPeriod}度)\n`;
      content += `完成情况: ${MOCK_PERIOD_SUMMARIES[viewPeriod]?.completion || ''}\n`;
      content += `风险说明: ${MOCK_PERIOD_SUMMARIES[viewPeriod]?.risk || ''}\n`;
      content += `重点专项总结: ${MOCK_PERIOD_SUMMARIES[viewPeriod]?.special || ''}\n\n`;

      // 2. 目标执行明细
      content += `二、目标执行明细\n`;
      
      const groupedGoals: Record<string, Goal[]> = {};
      dataToExport.forEach(g => {
        const pl = g.productLine || '其他';
        if (!groupedGoals[pl]) groupedGoals[pl] = [];
        groupedGoals[pl].push(g);
      });

      Object.entries(groupedGoals).forEach(([pl, plGoals]) => {
        content += `【产线：${pl}】\n`;
        content += activeFields.map(f => csvEscape(f.label)).join(",") + "\n";
        plGoals.forEach(g => {
          const row = activeFields.map(f => {
            if (f.id === 'name') return csvEscape(g.name);
            if (f.id === 'type') return csvEscape(g.type);
            if (f.id === 'owner') return csvEscape(g.owner);
            if (f.id === 'progress') return csvEscape(`${g.progress}%`);
            if (f.id === 'status') return csvEscape(g.status);
            if (f.id === 'aiProb') return csvEscape(`${getAIProbability(g)}%`);
            if (f.id === 'risk') return csvEscape(g.status === GoalStatus.HIGH_RISK ? '资源依赖阻塞' : '正常');
            if (f.id === 'category') return csvEscape(g.category);
            if (f.id === 'currentGoal') return csvEscape(g.periodSummaries?.[viewPeriod]?.currentGoal || '');
            if (f.id === 'progressAndRisk') return csvEscape(g.periodSummaries?.[viewPeriod]?.progressAndRisk || '');
            if (f.id === 'nextGoal') return csvEscape(g.periodSummaries?.[viewPeriod]?.nextGoal || '');
            return '""';
          });
          content += row.join(",") + "\n";
        });
        content += "\n";
      });

      // 3. 支撑项目说明
      content += `三、支撑项目说明\n`;
      content += activeSupportFields.map(f => csvEscape(f.label)).join(",") + "\n";
      
      supportProjectsToShow.forEach(p => {
        const derived = getDerivedSupportSummaries(p, viewPeriod);
        const row = activeSupportFields.map(f => {
          if (f.id === 'name') return csvEscape(p.name);
          if (f.id === 'bu') return csvEscape(p.bu);
          if (f.id === 'stage') return csvEscape(p.stage);
          if (f.id === 'estimatedValue') return p.estimatedValue.toString();
          if (f.id === 'valueImpact') return csvEscape(p.valueImpact || '');
          if (f.id === 'initiator') return csvEscape(p.initiator || '');
          if (f.id === 'date') return csvEscape(p.date || '');
          if (f.id === 'currentSummary') return csvEscape(derived.currentSummary);
          if (f.id === 'issues') return csvEscape(derived.issues);
          if (f.id === 'nextSummary') return csvEscape(derived.nextSummary);
          return '""';
        });
        content += row.join(",") + "\n";
      });
      content += "\n";

      // 4. 重点专项与跨事业部支撑明细
      content += `四、重点专项与跨事业部支撑明细 (专项标签/跨BU)\n`;
      const specialGoals = goalsToShow.filter(g => 
        g.productLine === '专项' || 
        g.category === GoalCategory.ORG_SPECIAL || 
        (g.tags && g.tags.includes('专项'))
      );
      
      if (specialGoals.length > 0) {
        content += `模块,目标名称,负责人,当前进度,本${viewPeriod}进展,下${viewPeriod}计划\n`;
        specialGoals.forEach(g => {
          const row = [
            csvEscape(g.productLine || ''),
            csvEscape(g.name),
            csvEscape(g.owner),
            csvEscape(`${g.progress}%`),
            csvEscape(g.periodSummaries?.[viewPeriod]?.progressAndRisk || ''),
            csvEscape(g.periodSummaries?.[viewPeriod]?.nextGoal || '')
          ];
          content += row.join(",") + "\n";
        });
      } else {
        content += "暂无符合条件的重点专项数据\n";
      }
    } else {
      // Header
      content += activeFields.map(f => csvEscape(f.label)).join(",") + "\n";
      dataToExport.forEach(g => {
        g.actionItems.forEach(ai => {
          const row = activeFields.map(f => {
            if (f.id === 'date') return csvEscape(ai.startDate || '2026-05-20');
            if (f.id === 'name') return csvEscape(g.name);
            if (f.id === 'category') return csvEscape(g.category);
            if (f.id === 'action') return csvEscape(ai.text);
            if (f.id === 'owner') return csvEscape(g.owner);
            if (f.id === 'hours') return csvEscape('8');
            return '""';
          });
          content += row.join(",") + "\n";
        });
      });
    }

    const filename = `GIA_${selectedMode === 'meeting' ? '经分会汇报' : '工时系统对齐'}_${viewPeriod}报_${new Date().toISOString().slice(0,10)}.csv`;
    const blob = new Blob(["\uFEFF" + content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Reset UI
    setShowExportModal(false);
    setExportStep('mode');
    setSelectedMode(null);
  };

  const currentDataToExport = filterMode === 'risk_only' 
    ? goalsToShow.filter(g => g.status !== GoalStatus.STABLE) 
    : goalsToShow;

  const getDerivedSupportSummaries = (project: any, period: string) => {
    const today = new Date('2026-02-26');
    
    const getRange = (p: string, offset: number) => {
      const d = new Date(today);
      if (p === '日') {
        d.setDate(d.getDate() + offset);
        const s = d.toISOString().split('T')[0];
        return [s, s];
      }
      if (p === '周') {
        const day = d.getDay() || 7;
        d.setDate(d.getDate() - day + 1 + (offset * 7));
        const start = d.toISOString().split('T')[0];
        d.setDate(d.getDate() + 6);
        const end = d.toISOString().split('T')[0];
        return [start, end];
      }
      if (p === '月') {
        d.setMonth(d.getMonth() + offset, 1);
        const start = d.toISOString().split('T')[0];
        const nextD = new Date(d);
        nextD.setMonth(nextD.getMonth() + 1, 0);
        const end = nextD.toISOString().split('T')[0];
        return [start, end];
      }
      if (p === '季') {
        const q = Math.floor(d.getMonth() / 3);
        const targetQ = q + offset;
        const yearOffset = Math.floor(targetQ / 4);
        const finalQ = ((targetQ % 4) + 4) % 4;
        d.setFullYear(d.getFullYear() + yearOffset);
        d.setMonth(finalQ * 3, 1);
        const start = d.toISOString().split('T')[0];
        const nextD = new Date(d);
        nextD.setMonth(nextD.getMonth() + 3, 0);
        const end = nextD.toISOString().split('T')[0];
        return [start, end];
      }
      if (p === '年') {
        d.setFullYear(d.getFullYear() + offset, 0, 1);
        const start = d.toISOString().split('T')[0];
        d.setFullYear(d.getFullYear(), 11, 31);
        const end = d.toISOString().split('T')[0];
        return [start, end];
      }
      return ['', ''];
    };

    const [currStart, currEnd] = getRange(period, 0);
    const [nextStart, nextEnd] = getRange(period, 1);

    const timeline = project.timeline || [];
    
    const currEntries = timeline.filter((e: any) => e.startTime >= currStart && e.startTime <= currEnd);
    const nextEntries = timeline.filter((e: any) => e.startTime >= nextStart && e.startTime <= nextEnd);

    const currentSummary = currEntries.length > 0 
      ? currEntries.map((e: any) => `[${e.advancementStatus}] ${e.requirementItems}`).join('; ')
      : (project.periodSummaries?.[period]?.currentSummary || "本期暂无计划动作");
      
    const issues = currEntries.some((e: any) => e.advancementStatus.includes('阻塞') || e.advancementStatus.includes('风险'))
      ? currEntries.filter((e: any) => e.advancementStatus.includes('阻塞') || e.advancementStatus.includes('风险')).map((e: any) => e.requirementItems).join('; ')
      : (project.periodSummaries?.[period]?.issues || "进度正常，暂无重大风险");

    const nextSummary = nextEntries.length > 0
      ? nextEntries.map((e: any) => `[${e.advancementStatus}] ${e.requirementItems}`).join('; ')
      : (project.periodSummaries?.[period]?.nextSummary || "下期计划待同步");

    return { currentSummary, issues, nextSummary };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {selectedGoalForReport && (
        <GoalDeepReportModal 
          goal={selectedGoalForReport} 
          onClose={() => setSelectedGoalForReport(null)} 
        />
      )}
      {/* 顶部总览卡片 */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
            <LayoutDashboard size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 leading-tight">
              {role}视角：管理总览
            </h2>
            <p className="text-slate-400 text-sm font-medium mt-1">
              全局聚合分析 2026 {viewPeriod} 周期内负责的所有目标。
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            {(['日', '周', '月', '季', '年'] as const).map(p => (
              <button
                key={p}
                onClick={() => setViewPeriod(p)}
                className={`px-4 py-1.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${
                  viewPeriod === p ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <button 
            onClick={() => { setShowExportModal(true); setExportStep('mode'); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-xs font-black uppercase rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 tracking-wider"
          >
            <Download size={14} /> 一键导出报表
          </button>
        </div>
      </div>

      {/* AI 总结模块 */}
      <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-3xl border border-indigo-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
          <BrainCircuit size={120} className="text-indigo-600" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><Sparkles size={16} /></div>
            <h3 className="text-base font-black text-slate-900">AI 智能总结 ({viewPeriod}度)</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-indigo-50 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span className="text-xs font-black text-slate-700 uppercase tracking-widest">目标完成情况</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                {MOCK_PERIOD_SUMMARIES[viewPeriod]?.completion}
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-rose-50 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-rose-500" />
                <span className="text-xs font-black text-slate-700 uppercase tracking-widest">潜在风险预警</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                {MOCK_PERIOD_SUMMARIES[viewPeriod]?.risk}
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-amber-50 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={16} className="text-amber-500" />
                <span className="text-xs font-black text-slate-700 uppercase tracking-widest">重点专项总结</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                {MOCK_PERIOD_SUMMARIES[viewPeriod]?.special}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 核心统计指标 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col h-full">
          <h3 className="text-sm font-black text-slate-800 mb-6 flex items-center gap-2">
            <Target size={18} className="text-indigo-600" />
            目标健康分布
          </h3>
          <div className="flex-1 flex items-center justify-center relative min-h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={stats} 
                  innerRadius={55} 
                  outerRadius={75} 
                  paddingAngle={5} 
                  dataKey="value"
                  stroke="none"
                >
                  {stats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-around mt-4 pt-4 border-t border-slate-50">
            {stats.map(d => (
              <div key={d.name} className="flex flex-col items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{d.name}</span>
                <span className="text-lg font-black" style={{color: d.color}}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><TrendingUp size={16} /></div>
              <span className="text-sm font-black text-slate-800">整体加权达成率 ({viewPeriod}度)</span>
            </div>
            <div className="flex items-baseline gap-2 mt-4">
              <h4 className="text-6xl font-black text-slate-900 tracking-tighter">72.5%</h4>
            </div>
          </div>
          <div className="mt-8">
            <div className="flex justify-between text-xs font-black mb-3">
              <span className="text-slate-400 uppercase">较上周</span>
              <span className="text-emerald-500 flex items-center gap-1">+4.2% <ArrowUpRight size={12} /></span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600 rounded-full shadow-lg shadow-indigo-200" style={{width: '72%'}} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-rose-50 rounded-lg text-rose-600"><ShieldAlert size={16} /></div>
              <span className="text-sm font-black text-slate-800">重点风险阻碍</span>
            </div>
            <h4 className="text-6xl font-black text-slate-900 tracking-tighter mt-4">
              {goalsToShow.filter(g => g.status === GoalStatus.HIGH_RISK).length} <span className="text-2xl text-slate-300 font-bold uppercase ml-1">项</span>
            </h4>
          </div>
          <div className="mt-8 p-4 bg-rose-50/50 rounded-2xl border border-rose-100">
            <p className="text-xs text-rose-700 font-bold leading-relaxed italic">
              AI 扫描发现本周期内存在 {goalsToShow.filter(g => g.status === GoalStatus.HIGH_RISK).length} 个高风险项目，请及时关注。
            </p>
          </div>
        </div>
      </div>

      {/* 产线维度概览 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {['地图', '地址', '位置大数据', '专项'].map(pl => {
          const plGoals = goalsToShow.filter(g => g.productLine === pl);
          const stableCount = plGoals.filter(g => g.status === GoalStatus.STABLE).length;
          const riskCount = plGoals.filter(g => g.status === GoalStatus.HIGH_RISK).length;
          
          return (
            <div key={pl} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:border-indigo-200 transition-all group cursor-pointer" onClick={() => setFilterProductLine(pl)}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{pl} 产线</span>
                <div className={`w-2 h-2 rounded-full ${riskCount > 0 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-900">{plGoals.length}</span>
                <span className="text-[10px] font-black text-slate-300 uppercase">个目标</span>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 rounded-full" 
                    style={{ width: plGoals.length ? `${(stableCount / plGoals.length) * 100}%` : '0%' }} 
                  />
                </div>
                <span className="text-[10px] font-black text-slate-400">{stableCount}/{plGoals.length} 稳定</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 执行明细看板 */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="px-8 py-6 border-b border-slate-50 flex flex-col gap-4 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Layers size={22} className="text-indigo-600" />
              <h3 className="text-lg font-black text-slate-900">执行明细看板 ({viewPeriod}度)</h3>
            </div>
            <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
              <Users size={14} className="text-slate-500" /> {goalsToShow.length} 个目标正在跟进
            </div>
          </div>
          
          {/* 筛选栏 */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">产线</span>
              <select 
                value={filterProductLine}
                onChange={(e) => setFilterProductLine(e.target.value)}
                className="text-xs font-bold text-slate-700 bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="全部">全部产线</option>
                <option value="地图">地图</option>
                <option value="地址">地址</option>
                <option value="位置大数据">位置大数据</option>
                <option value="专项">专项</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">目标分类</span>
              <select 
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="text-xs font-bold text-slate-700 bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="全部">全部分类</option>
                {Object.values(GoalCategory).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">优先级</span>
              <select 
                value={filterImportance}
                onChange={(e) => setFilterImportance(e.target.value)}
                className="text-xs font-bold text-slate-700 bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="全部">全部优先级</option>
                <option value="P0">P0</option>
                <option value="P1">P1</option>
                <option value="P2">P2</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">组织层级</span>
              <select 
                value={filterGoalType}
                onChange={(e) => setFilterGoalType(e.target.value)}
                className="text-xs font-bold text-slate-700 bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="全部">全部层级</option>
                {Object.values(GoalType).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            
            {(filterProductLine !== '全部' || filterCategory !== '全部' || filterImportance !== '全部' || filterGoalType !== '全部') && (
              <button 
                onClick={() => {
                  setFilterProductLine('全部');
                  setFilterCategory('全部');
                  setFilterImportance('全部');
                  setFilterGoalType('全部');
                }}
                className="text-[10px] font-black text-indigo-500 hover:text-indigo-700 uppercase tracking-widest flex items-center gap-1 ml-2 transition-colors"
              >
                <X size={12} /> 清除筛选
              </button>
            )}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] bg-slate-50/30">
                <th className="px-8 py-4">目标详情 / 负责人</th>
                <th className="px-8 py-4">状态</th>
                <th className="px-8 py-4">AI 达成概率</th>
                <th className="px-8 py-4">执行进度</th>
                <th className="px-8 py-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50">
              {goalsToShow.length > 0 ? goalsToShow.map((goal) => {
                const aiProb = getAIProbability(goal);
                return (
                  <tr key={goal.id} className="group hover:bg-indigo-50/30 transition-all duration-300 cursor-pointer flex flex-col lg:table-row">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-sm flex-shrink-0 ${
                          goal.type === GoalType.DEPARTMENT ? 'bg-indigo-500' : goal.type === GoalType.TEAM ? 'bg-blue-500' : 'bg-slate-500'
                        }`}>
                          {goal.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-black text-slate-900 leading-none mb-2 truncate">{goal.name}</div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{goal.type}级别</span>
                            <span className="text-slate-200 text-xs">•</span>
                            <span className="text-[10px] text-indigo-500 font-black uppercase bg-indigo-50 px-1.5 py-0.5 rounded">{goal.productLine}</span>
                            <span className="text-slate-200 text-xs">•</span>
                            <span className="text-[10px] text-slate-500 font-black uppercase">负责人: {goal.owner}</span>
                          </div>
                          {goal.periodSummaries && goal.periodSummaries[viewPeriod] ? (
                            <div className="mt-4 flex flex-col gap-3">
                              <div className="flex items-center gap-2">
                                <div className="px-2 py-1 bg-indigo-50 border border-indigo-100 rounded-md flex items-center gap-1.5">
                                  <Sparkles size={12} className="text-indigo-500" />
                                  <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">智能执行联动</span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-medium">AI 已自动聚合该目标下的执行报告</span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col gap-1.5 hover:border-indigo-200 transition-colors">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                    <Target size={12} className="text-slate-400" /> 本{viewPeriod}目标
                                  </span>
                                  <span className="text-xs text-slate-700 font-medium leading-relaxed">{goal.periodSummaries[viewPeriod]?.currentGoal}</span>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col gap-1.5 hover:border-indigo-200 transition-colors">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                    <CheckCircle2 size={12} className="text-slate-400" /> 完成情况 & 风险
                                  </span>
                                  <span className="text-xs text-slate-700 font-medium leading-relaxed">{goal.periodSummaries[viewPeriod]?.progressAndRisk}</span>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col gap-1.5 hover:border-indigo-200 transition-colors">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                    <ArrowUpRight size={12} className="text-slate-400" /> 下{viewPeriod}目标
                                  </span>
                                  <span className="text-xs text-slate-700 font-medium leading-relaxed">{goal.periodSummaries[viewPeriod]?.nextGoal}</span>
                                </div>
                              </div>
                            </div>
                          ) : goal.summary && (
                            <div className="mt-3 text-xs text-slate-500 font-medium leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 line-clamp-2">
                              <span className="font-bold text-slate-700 mr-2">总结说明:</span>
                              {goal.summary}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${getStatusBadgeClass(goal.status)}`}>
                        {goal.status}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <BrainCircuit size={16} className={aiProb > 70 ? 'text-emerald-500' : aiProb > 40 ? 'text-amber-500' : 'text-rose-500'} />
                        <span className={`text-sm font-black ${aiProb > 70 ? 'text-emerald-600' : aiProb > 40 ? 'text-amber-600' : 'text-rose-600'}`}>
                          {aiProb}%
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4 min-w-[160px]">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${
                              goal.status === GoalStatus.STABLE ? 'bg-emerald-500' : goal.status === GoalStatus.DEVIATED ? 'bg-amber-500' : 'bg-rose-500'
                            }`} 
                            style={{ width: `${goal.progress}%` }} 
                          />
                        </div>
                        <span className="text-xs font-black text-slate-700 w-8">{goal.progress}%</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button 
                        onClick={() => setSelectedGoalForReport(goal)}
                        className="text-[11px] font-black text-indigo-600 hover:text-white hover:bg-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl transition-all shadow-sm"
                      >
                        查看报告
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-black uppercase tracking-widest italic">
                    暂无执行数据。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 支撑项目看板 */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="px-8 py-6 border-b border-slate-50 flex flex-col gap-4 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Briefcase size={22} className="text-indigo-600" />
              <h3 className="text-lg font-black text-slate-900">支撑项目看板 ({viewPeriod}度)</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest">
                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                  <span className="text-slate-400">总项目数</span>
                  <span className="text-indigo-600 text-sm">{supportStats.total}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                  <span className="text-slate-400">需求沟通</span>
                  <span className="text-slate-700 text-sm">{supportStats.communication}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                  <span className="text-blue-500">POC验证</span>
                  <span className="text-blue-700 text-sm">{supportStats.poc}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                  <span className="text-amber-500">已签单</span>
                  <span className="text-amber-700 text-sm">{supportStats.signed}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                  <span className="text-emerald-500">正式交付</span>
                  <span className="text-emerald-700 text-sm">{supportStats.delivered}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 支撑项目筛选栏 */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">支撑事业部</span>
              <select 
                value={filterSupportBU}
                onChange={(e) => setFilterSupportBU(e.target.value)}
                className="text-xs font-bold text-slate-700 bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="全部">全部事业部</option>
                <option value="物流事业部">物流事业部</option>
                <option value="出行事业部">出行事业部</option>
                <option value="本地生活">本地生活</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">支撑阶段</span>
              <select 
                value={filterSupportStage}
                onChange={(e) => setFilterSupportStage(e.target.value)}
                className="text-xs font-bold text-slate-700 bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="全部">全部阶段</option>
                <option value="需求沟通">需求沟通</option>
                <option value="POC验证">POC验证</option>
                <option value="已签单">已签单</option>
                <option value="正式交付">正式交付</option>
              </select>
            </div>

            {(filterSupportBU !== '全部' || filterSupportStage !== '全部') && (
              <button 
                onClick={() => {
                  setFilterSupportBU('全部');
                  setFilterSupportStage('全部');
                }}
                className="text-[10px] font-black text-indigo-500 hover:text-indigo-700 uppercase tracking-widest flex items-center gap-1 ml-2 transition-colors"
              >
                <X size={12} /> 清除筛选
              </button>
            )}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] bg-slate-50/30">
                <th className="px-8 py-4">项目名称 / 业务方</th>
                <th className="px-8 py-4">阶段状态</th>
                <th className="px-8 py-4">预估价值</th>
                <th className="px-8 py-4">支撑总结 ({viewPeriod}度)</th>
                <th className="px-8 py-4">项目需求情况</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50">
              {supportProjectsToShow.length > 0 ? supportProjectsToShow.map((project) => (
                <tr key={project.id} className="group hover:bg-indigo-50/30 transition-all duration-300">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-sm flex-shrink-0 bg-blue-500">
                        {project.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-black text-slate-900 leading-none mb-2 truncate">{project.name}</div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{project.bu}</span>
                          <span className="text-slate-200 text-xs">•</span>
                          <span className="text-[10px] text-slate-500 font-black uppercase">发起人: {project.initiator}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col gap-1.5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider w-fit ${
                        project.status === '已完成' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        project.status === '进行中' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                        'bg-rose-50 text-rose-700 border-rose-100'
                      }`}>
                        {project.status}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{project.stage}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-black text-slate-900">{project.estimatedValue} <span className="text-[10px] text-slate-400 uppercase">万</span></span>
                      {project.actualValue && (
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                          实际: {project.actualValue} 万
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col gap-3 min-w-[200px]">
                      {(() => {
                        const derived = getDerivedSupportSummaries(project, viewPeriod);
                        return (
                          <>
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">本{viewPeriod}支撑总结</span>
                              <p className="text-xs text-slate-700 font-medium leading-relaxed">{derived.currentSummary}</p>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">存在问题</span>
                              <p className="text-xs text-slate-700 font-medium leading-relaxed">{derived.issues}</p>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">下{viewPeriod}支撑总结</span>
                              <p className="text-xs text-slate-700 font-medium leading-relaxed">{derived.nextSummary}</p>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col gap-2">
                      {project.timeline && project.timeline.length > 0 ? (
                        project.timeline.map((entry, idx) => (
                          <div key={entry.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{entry.advancementStatus}</span>
                              <span className="text-[10px] font-bold text-slate-400">{entry.startTime}</span>
                            </div>
                            <span className="text-xs text-slate-700 font-medium leading-relaxed">{entry.requirementItems}</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-white px-2 py-0.5 rounded-md border border-slate-100">
                                {entry.productLineTag}
                              </span>
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-white px-2 py-0.5 rounded-md border border-slate-100">
                                {entry.hours}h
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">暂无需求记录</span>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-black uppercase tracking-widest italic">
                    暂无支撑项目数据。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 导出配置弹窗 */}
      {showExportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowExportModal(false)} />
          <div className="bg-white w-full max-w-xl max-h-[90vh] rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20 flex flex-col">
            <div className="p-8 pb-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                  {exportStep === 'mode' ? <Download size={24} /> : <Settings size={24} />}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 leading-none">
                    {exportStep === 'mode' ? '选择报表导出模式' : '配置导出字段与内容'}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">
                    {exportStep === 'mode' ? '第一步：选择导出场景' : `第二步：细化 ${selectedMode === 'meeting' ? '经分会' : '工时'} 数据内容`}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowExportModal(false)} className="text-slate-400 hover:text-slate-600 p-2 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 pt-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
              {exportStep === 'mode' ? (
                <div className="space-y-4">
                  <button 
                    onClick={() => openConfig('meeting')}
                    className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[2rem] flex items-center gap-6 hover:border-indigo-300 hover:bg-indigo-50/50 hover:shadow-lg hover:shadow-indigo-50 transition-all group text-left"
                  >
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm group-hover:scale-110 transition-transform">
                      <FileText size={32} />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-base font-black text-slate-900 mb-1">公司级经分会汇报模版</h4>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed italic">
                        聚合目标状态、AI达成概率及风险说明，直接适配周/月度会议。
                      </p>
                    </div>
                    <ArrowUpRight size={20} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                  </button>

                  <button 
                    onClick={() => openConfig('timesheet')}
                    className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[2rem] flex items-center gap-6 hover:border-emerald-300 hover:bg-emerald-50/50 hover:shadow-lg hover:shadow-emerald-50 transition-all group text-left"
                  >
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm group-hover:scale-110 transition-transform">
                      <Clock size={32} />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-base font-black text-slate-900 mb-1">工时系统对齐 (数据映射)</h4>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed italic">
                        将里程碑执行动作自动转化为工时日志，省去手动重复录入。
                      </p>
                    </div>
                    <ArrowUpRight size={20} className="text-slate-300 group-hover:text-emerald-600 transition-colors" />
                  </button>
                </div>
              ) : (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  {/* Field Select */}
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Layers size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">选择导出字段</span>
                      </div>
                      <button onClick={resetFields} className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600 uppercase hover:underline">
                        <RotateCcw size={12} /> 重置默认
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {(selectedMode === 'meeting' ? MEETING_FIELDS : TIMESHEET_FIELDS).map(f => (
                        <button
                          key={f.id}
                          onClick={() => toggleField(f.id)}
                          className={`flex items-center justify-between p-4 rounded-2xl border text-xs font-bold transition-all ${
                            selectedFields.includes(f.id) 
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100' 
                              : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-200'
                          }`}
                        >
                          {f.label}
                          {selectedFields.includes(f.id) && <Check size={14} />}
                        </button>
                      ))}
                    </div>
                  </section>

                  {selectedMode === 'meeting' && (
                    <section>
                      <div className="flex items-center gap-2 mb-4 text-slate-400">
                        <Briefcase size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">支撑项目导出字段</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {SUPPORT_FIELDS.map(f => (
                          <button
                            key={f.id}
                            onClick={() => toggleSupportField(f.id)}
                            className={`flex items-center justify-between p-4 rounded-2xl border text-xs font-bold transition-all ${
                              selectedSupportFields.includes(f.id) 
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100' 
                                : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-200'
                            }`}
                          >
                            {f.label}
                            {selectedSupportFields.includes(f.id) && <Check size={14} />}
                          </button>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Filter Select */}
                  <section>
                    <div className="flex items-center gap-2 mb-4 text-slate-400">
                      <Filter size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">数据过滤范围 (已同步页面筛选)</span>
                    </div>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => setFilterMode('all')}
                        className={`flex-1 py-4 px-4 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                          filterMode === 'all' 
                            ? 'bg-slate-900 text-white border-slate-900 shadow-lg' 
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <Layers size={14} /> 全量目标进度 ({goalsToShow.length})
                      </button>
                      <button 
                        onClick={() => setFilterMode('risk_only')}
                        className={`flex-1 py-4 px-4 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                          filterMode === 'risk_only' 
                            ? 'bg-rose-600 text-white border-rose-600 shadow-lg' 
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-rose-50'
                        }`}
                      >
                        <AlertTriangle size={14} /> 仅异常/风险目标 ({goalsToShow.filter(g => g.status !== GoalStatus.STABLE).length})
                      </button>
                    </div>
                  </section>
                </div>
              )}
            </div>

            <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
              {exportStep === 'config' ? (
                <button 
                  onClick={() => setExportStep('mode')}
                  className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
                >
                  返回上一步
                </button>
              ) : (
                <div className="flex-1" />
              )}
              
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setShowExportModal(false)}
                  className="px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all"
                >
                  取消
                </button>
                {exportStep === 'config' && (
                  <button 
                    onClick={handleExport}
                    className="px-10 py-3 bg-indigo-600 text-white shadow-xl shadow-indigo-100 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-2"
                  >
                    <Download size={14} /> 导出 {currentDataToExport.length} 项数据
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalOverview;
