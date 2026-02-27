
import React, { useState } from 'react';
import { Goal, GoalStatus, GoalType, ActionItem, GoalCategory, UserRoleType } from '../types';
import { MOCK_REPORTS } from '../constants';
import { 
  ChevronRight, 
  ArrowRight, 
  Target, 
  Plus, 
  Edit3, 
  Trash2, 
  X,
  Calendar,
  ClipboardList,
  CheckCircle2,
  Circle,
  Link2,
  Flag,
  ChevronDown,
  FolderOpen,
  Network,
  List,
  Settings2,
  Check,
  Users as UsersIcon,
  ArrowLeft,
  Loader2,
  Download,
  FileSpreadsheet,
  Clock,
  FileText,
  RotateCcw,
  Filter,
  AlertTriangle,
  ArrowUpRight,
  BrainCircuit,
  Settings
} from 'lucide-react';

interface GoalGraphProps {
  role: UserRoleType;
  goals: Goal[];
  setGoals: (goals: Goal[]) => void;
  allGoals: Goal[];
  activeCycle: string;
}

const COLUMN_CONFIG = [
  { id: 'name', label: '目标名称' },
  { id: 'category', label: '业务分类' },
  { id: 'tags', label: '目标标签' },
  { id: 'type', label: '组织层级' },
  { id: 'importance', label: '重要度' },
  { id: 'difficulty', label: '难度系数' },
  { id: 'personnel', label: '负责人 / 团队' },
  { id: 'progress', label: '进度' },
  { id: 'status', label: '健康状态' },
  { id: 'actions', label: '操作' },
];

const MEETING_FIELDS = [
  { id: 'name', label: '目标名称', default: true },
  { id: 'type', label: '组织层级', default: true },
  { id: 'owner', label: '责任人', default: true },
  { id: 'progress', label: '当前进度', default: true },
  { id: 'status', label: '健康状态', default: true },
  { id: 'aiProb', label: 'AI达成预测', default: true },
  { id: 'risk', label: '关键风险点', default: true },
  { id: 'category', label: '业务分类', default: false },
  { id: 'startDate', label: '开始日期', default: false },
  { id: 'endDate', label: '结束日期', default: false },
];

const TIMESHEET_FIELDS = [
  { id: 'date', label: '日期', default: true },
  { id: 'name', label: '目标项目', default: true },
  { id: 'category', label: '业务分类', default: true },
  { id: 'action', label: '执行动作', default: true },
  { id: 'owner', label: '负责人', default: true },
  { id: 'hours', label: '工时(h)', default: true },
];

const EXPORT_FIELDS = [
  { id: 'date', label: '日期', default: true },
  { id: 'userName', label: '填报人', default: true },
  { id: 'role', label: '角色', default: true },
  { id: 'goalName', label: '关联目标', default: true },
  { id: 'hours', label: '投入工时(h)', default: true },
  { id: 'content', label: '执行内容', default: false },
  { id: 'summary', label: '一句话总结', default: true },
];

const GoalGraph: React.FC<GoalGraphProps> = ({ role, goals, setGoals, allGoals, activeCycle }) => {
  const isManager = role === UserRoleType.TEAM_LEAD || role === UserRoleType.DEPT_HEAD || role === UserRoleType.SUPER_ADMIN;
  
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set(['name', 'category', 'tags', 'type', 'importance', 'difficulty', 'personnel', 'progress', 'status', 'actions']));
  const [showColumnConfig, setShowColumnConfig] = useState(false);

  // 导出相关状态
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStartDate, setExportStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [exportEndDate, setExportEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [exportFields, setExportFields] = useState<Set<string>>(new Set(EXPORT_FIELDS.filter(f => f.default).map(f => f.id)));

  const filteredGoals = goals.filter(g => {
    if (role === UserRoleType.EMPLOYEE) return g.type === GoalType.INDIVIDUAL || g.id === 'goal-map-1';
    if (role === UserRoleType.TEAM_LEAD) return g.type !== GoalType.DEPARTMENT;
    return true;
  });

  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(filteredGoals[0] || null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Partial<Goal> | null>(null);
  
  const [newActionText, setNewActionText] = useState('');
  const [newActionStart, setNewActionStart] = useState('');
  const [newActionEnd, setNewActionEnd] = useState('');
  const [newTagText, setNewTagText] = useState('');
  
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const SUGGESTED_MEMBERS = ['Eric', 'Sarah', 'Alex', 'Jerry', 'Linda', 'Kevin', 'Wang', 'Min', 'Chen', 'Liu'];

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(Object.values(GoalCategory)));
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());

  const getStatusColor = (status: GoalStatus) => {
    switch (status) {
      case GoalStatus.STABLE: return 'bg-emerald-500';
      case GoalStatus.DEVIATED: return 'bg-amber-500';
      case GoalStatus.HIGH_RISK: return 'bg-rose-500';
    }
  };

  const getStatusBadge = (status: GoalStatus) => {
    switch (status) {
      case GoalStatus.STABLE: return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case GoalStatus.DEVIATED: return 'bg-amber-50 text-amber-700 border-amber-100';
      case GoalStatus.HIGH_RISK: return 'bg-rose-50 text-rose-700 border-rose-100';
    }
  };

  const getAIProbability = (goal: Goal) => {
    if (goal.status === GoalStatus.STABLE) return Math.min(100, goal.progress + 40);
    if (goal.status === GoalStatus.DEVIATED) return Math.min(80, goal.progress + 20);
    return Math.min(50, goal.progress + 5);
  };

  const toggleColumn = (id: string) => {
    setVisibleColumns(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const toggleType = (typeKey: string) => {
    setExpandedTypes(prev => {
      const next = new Set(prev);
      if (next.has(typeKey)) next.delete(typeKey);
      else next.add(typeKey);
      return next;
    });
  };

  const handleGoalClick = (goal: Goal) => {
    setSelectedGoal(goal);
    setViewMode('detail');
  };

  const handleAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    setEditingGoal({
      id: `goal-new-${Date.now()}`,
      name: '',
      type: GoalType.INDIVIDUAL,
      category: GoalCategory.MAP,
      period: activeCycle,
      weight: 0.5,
      status: GoalStatus.STABLE,
      progress: 0,
      upstreamIds: [],
      downstreamIds: [],
      riskTolerance: '中',
      importance: 'P1',
      difficulty: 1.0,
      owner: role === UserRoleType.EMPLOYEE ? 'Alex' : role === UserRoleType.TEAM_LEAD ? 'Sarah' : role === UserRoleType.DEPT_HEAD ? 'Eric' : 'Admin',
      members: [role === UserRoleType.EMPLOYEE ? 'Alex' : role === UserRoleType.TEAM_LEAD ? 'Sarah' : role === UserRoleType.DEPT_HEAD ? 'Eric' : 'Admin'],
      quantification: '',
      startDate: today,
      endDate: today,
      actionItems: []
    });
    setNewActionStart(today);
    setNewActionEnd(today);
    setIsModalOpen(true);
  };

  const handleEdit = (goal: Goal) => {
    const today = new Date().toISOString().split('T')[0];
    setEditingGoal({
      ...goal,
      actionItems: [...(goal.actionItems || [])]
    });
    setNewActionStart(today);
    setNewActionEnd(today);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('确定要从全局空间删除此战略目标吗？')) {
      const nextGoals = allGoals.filter(g => g.id !== id);
      setGoals(nextGoals);
      if (selectedGoal?.id === id) {
        setSelectedGoal(nextGoals.filter(g => g.period === activeCycle)[0] || null);
        if (viewMode === 'detail') setViewMode('list');
      }
    }
  };

  const handleSave = async () => {
    if (!editingGoal?.name) {
      alert('请输入目标名称');
      return;
    }
    
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    const updatedGoal = editingGoal as Goal;
    if (allGoals.some(g => g.id === updatedGoal.id)) {
      setGoals(allGoals.map(g => g.id === updatedGoal.id ? updatedGoal : g));
    } else {
      setGoals([updatedGoal, ...allGoals]);
    }

    setSelectedGoal(updatedGoal);
    setIsModalOpen(false);
    setEditingGoal(null);
    setIsSaving(false);
  };

  // 导出逻辑
  const csvEscape = (val: string) => `"${(val || '').replace(/"/g, '""')}"`;

  const handleExportExecute = () => {
    let content = "\uFEFF"; // BOM for Excel
    
    // Header
    const activeFields = EXPORT_FIELDS.filter(f => exportFields.has(f.id));
    content += activeFields.map(f => f.label).join(",") + "\n";

    // Filter Data
    const dataToExport = MOCK_REPORTS.filter(r => r.date >= exportStartDate && r.date <= exportEndDate);

    // Rows
    dataToExport.forEach(report => {
      report.segments.forEach(segment => {
        const row = activeFields.map(field => {
          switch (field.id) {
            case 'date': return csvEscape(report.date);
            case 'userName': return csvEscape(report.userName);
            case 'role': return csvEscape(report.role);
            case 'goalName': return csvEscape(segment.goalName);
            case 'hours': return csvEscape(segment.hours.toString());
            case 'content': return csvEscape(segment.content);
            case 'summary': return csvEscape(segment.summary || segment.content);
            default: return '""';
          }
        });
        content += row.join(",") + "\n";
      });
    });

    const filename = `GIA_工时明细_${exportStartDate}_至_${exportEndDate}.csv`;
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Close Modal
    setShowExportModal(false);
  };

  const addActionItem = () => {
    if (!newActionText.trim() || !editingGoal) return;
    const newItem: ActionItem = {
      id: `ai-${Date.now()}`,
      text: newActionText.trim(),
      done: false,
      startDate: newActionStart,
      endDate: newActionEnd
    };
    setEditingGoal({
      ...editingGoal,
      actionItems: [...(editingGoal.actionItems || []), newItem]
    });
    setNewActionText('');
  };

  const toggleActionItem = (id: string) => {
    if (!editingGoal || !editingGoal.actionItems) return;
    setEditingGoal({
      ...editingGoal,
      actionItems: editingGoal.actionItems.map(ai => ai.id === id ? { ...ai, done: !ai.done } : ai)
    });
  };

  const removeActionItem = (id: string) => {
    if (!editingGoal || !editingGoal.actionItems) return;
    setEditingGoal({
      ...editingGoal,
      actionItems: editingGoal.actionItems.filter(ai => ai.id !== id)
    });
  };

  const toggleDetailAction = (id: string) => {
    if (!selectedGoal) return;
    const nextGoal = {
      ...selectedGoal,
      actionItems: selectedGoal.actionItems.map(ai => ai.id === id ? { ...ai, done: !ai.done } : ai)
    };
    setGoals(allGoals.map(g => g.id === nextGoal.id ? nextGoal : g));
    setSelectedGoal(nextGoal);
  };

  const addMember = (name?: string) => {
    const targetName = name || newMemberName;
    if (targetName && targetName.trim()) {
      if (editingGoal?.members?.includes(targetName.trim())) {
        alert('该成员已在项目中');
        return;
      }
      setEditingGoal({
        ...editingGoal,
        members: [...(editingGoal?.members || []), targetName.trim()]
      });
      setNewMemberName('');
      setIsAddingMember(false);
    }
  };

  const removeMember = (name: string) => {
    setEditingGoal({
      ...editingGoal,
      members: editingGoal?.members?.filter(m => m !== name) || []
    });
  };

  const addTag = () => {
    if (newTagText.trim() && !editingGoal?.tags?.includes(newTagText.trim())) {
      setEditingGoal({
        ...editingGoal,
        tags: [...(editingGoal?.tags || []), newTagText.trim()]
      });
      setNewTagText('');
    }
  };

  const removeTag = (tag: string) => {
    setEditingGoal({
      ...editingGoal,
      tags: editingGoal?.tags?.filter(t => t !== tag) || []
    });
  };

  return (
    <div className="flex flex-col h-full gap-6 animate-in fade-in duration-700">
      {/* 顶部标题栏 */}
      <div className="flex items-center justify-between bg-white p-4 px-6 rounded-3xl border border-slate-100 shadow-sm relative z-20">
        <div className="flex items-center gap-4">
          {viewMode === 'detail' ? (
            <button 
              onClick={() => setViewMode('list')}
              className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center text-slate-600 transition-all"
            >
              <ArrowLeft size={20} />
            </button>
          ) : (
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
              <Target size={22} />
            </div>
          )}
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {viewMode === 'list' ? '目标看板管理 (全局空间)' : '战略目标深度解读'}
            </h2>
            <p className="text-xs text-slate-400 font-medium">周期: {activeCycle} | 数据自动实时同步</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-xs font-black uppercase rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 tracking-wider"
          >
            <Download size={14} /> 一键导出工时
          </button>
          {viewMode === 'list' && (
            <div className="relative">
              <button 
                onClick={() => setShowColumnConfig(!showColumnConfig)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${showColumnConfig ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}
              >
                <Settings2 size={14} /> 展示字段配置
              </button>
              
              {showColumnConfig && (
                <div className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 p-3 animate-in fade-in zoom-in-95 duration-200 z-50">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-2">选择展示字段</p>
                  <div className="space-y-1">
                    {COLUMN_CONFIG.map(col => (
                      <button 
                        key={col.id}
                        onClick={() => toggleColumn(col.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-colors ${visibleColumns.has(col.id) ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
                      >
                        {col.label}
                        {visibleColumns.has(col.id) && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {viewMode === 'detail' && (
            <button 
              onClick={() => setViewMode('list')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold border border-slate-200 hover:bg-slate-100 transition-all"
            >
              <List size={14} /> 返回列表
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-full relative">
          {/* 左侧组织管理层级 (常驻) */}
          <div className="lg:col-span-1 flex flex-col h-full bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">组织管理层级</h3>
              {isManager && (
                <button 
                  onClick={handleAdd}
                  className="w-8 h-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  <Plus size={16} />
                </button>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-hide">
              {Object.values(GoalCategory).map((cat) => {
                const catGoals = filteredGoals.filter(g => g.category === cat);
                const isCatExpanded = expandedCategories.has(cat);
                if (catGoals.length === 0 && role === UserRoleType.EMPLOYEE) return null;

                return (
                  <div key={cat} className="space-y-0.5">
                    <button 
                      onClick={() => toggleCategory(cat)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all group ${isCatExpanded ? 'bg-slate-50/80' : 'hover:bg-slate-50'}`}
                    >
                      <div className="flex items-center gap-2">
                        <FolderOpen size={14} className={catGoals.length > 0 ? 'text-indigo-500' : 'text-slate-300'} />
                        <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider">{cat}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold text-slate-300 bg-white border border-slate-100 px-1.5 py-0.5 rounded-md">{catGoals.length}</span>
                        {isCatExpanded ? <ChevronDown size={12} className="text-slate-400" /> : <ChevronRight size={12} className="text-slate-400" />}
                      </div>
                    </button>
                    
                    {isCatExpanded && (
                      <div className="ml-3 border-l border-slate-100 pl-2 py-1 space-y-1">
                        {[GoalType.DEPARTMENT, GoalType.TEAM, GoalType.INDIVIDUAL].map(type => {
                          const typeGoals = catGoals.filter(g => g.type === type);
                          if (typeGoals.length === 0) return null;
                          const typeKey = `${cat}-${type}`;
                          const isTypeExpanded = expandedTypes.has(typeKey);

                          return (
                            <div key={typeKey} className="space-y-1">
                              <button 
                                onClick={() => toggleType(typeKey)}
                                className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-indigo-50/30 transition-colors group"
                              >
                                <div className="flex items-center gap-2">
                                  <Network size={12} className="text-indigo-300" />
                                  <span className="text-[10px] font-bold text-slate-400 uppercase">{type}目标</span>
                                </div>
                                {isTypeExpanded ? <ChevronDown size={10} className="text-slate-300" /> : <ChevronRight size={10} className="text-slate-300" />}
                              </button>

                              {isTypeExpanded && typeGoals.map(goal => (
                                <button
                                  key={goal.id}
                                  onClick={() => handleGoalClick(goal)}
                                  className={`w-full text-left px-3 py-2.5 rounded-xl transition-all group border ${
                                    selectedGoal?.id === goal.id && viewMode === 'detail'
                                      ? 'bg-indigo-50 border-indigo-100 shadow-sm' 
                                      : 'hover:bg-white border-transparent text-slate-500'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(goal.status)} shadow-sm flex-shrink-0`} />
                                    <span className={`text-[12px] font-bold truncate leading-none ${selectedGoal?.id === goal.id && viewMode === 'detail' ? 'text-indigo-900' : 'text-slate-700'}`}>
                                      {goal.name.includes('：') ? goal.name.split('：')[1] : goal.name}
                                    </span>
                                  </div>
                                  <div className="mt-1 flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase ml-3.5">
                                    <span>{goal.owner}</span>
                                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">{goal.progress}%</span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 右侧主内容区域 */}
          <div className="lg:col-span-3 min-h-0">
            {viewMode === 'detail' ? (
              <div className="bg-white rounded-3xl border border-slate-100 p-8 h-full flex flex-col relative overflow-y-auto scrollbar-thin shadow-sm animate-in fade-in zoom-in-95 duration-300">
                {selectedGoal ? (
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-6 text-indigo-600 cursor-pointer hover:underline" onClick={() => setViewMode('list')}>
                      <ArrowLeft size={16} /> <span className="text-sm font-bold">返回目标列表</span>
                    </div>
                    <div className="relative p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 mb-10 group overflow-hidden">
                      <div className="absolute top-0 right-0 p-10 opacity-5 text-indigo-900 pointer-events-none group-hover:scale-110 transition-transform duration-700"><Target size={140} /></div>
                      <div className="flex items-start justify-between relative z-10">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-4">
                            <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-bold uppercase rounded-lg shadow-md shadow-indigo-100">{selectedGoal.type}级别</span>
                            <span className="px-3 py-1 bg-white border border-slate-100 text-[10px] font-bold text-slate-500 uppercase rounded-lg shadow-sm">{selectedGoal.category}</span>
                            <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase border shadow-sm ${
                              selectedGoal.importance === 'P0' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                              selectedGoal.importance === 'P1' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                              'bg-indigo-50 text-indigo-600 border-indigo-100'
                            }`}>
                              重要度: {selectedGoal.importance}
                            </span>
                            <span className="px-3 py-1 bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-600 uppercase rounded-lg shadow-sm">
                              难度: ×{selectedGoal.difficulty}
                            </span>
                            <span className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-white/80 backdrop-blur px-3 py-1 rounded-lg border border-slate-100 shadow-sm">
                              <Calendar size={14} className="text-indigo-400" />
                              {selectedGoal.startDate || '--'} <ArrowRight size={10} className="mx-1 opacity-40" /> {selectedGoal.endDate || '--'}
                            </span>
                          </div>
                          <h2 className="text-3xl font-extrabold text-slate-900 mb-6 leading-tight max-w-2xl">{selectedGoal.name}</h2>
                          <div className="flex flex-wrap items-center gap-6">
                            <div className="flex flex-col gap-0.5 text-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">进度</span>
                                <span className="text-sm font-bold text-slate-700">{selectedGoal.progress}%</span>
                            </div>
                            <div className="w-px h-8 bg-slate-200 hidden sm:block" />
                            <div className="flex flex-col gap-0.5 text-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">责任人员</span>
                                <div className="flex items-center -space-x-2 mt-1">
                                  {selectedGoal.members?.slice(0, 3).map((m, idx) => (
                                    <div key={idx} className="w-7 h-7 rounded-full bg-indigo-500 border-2 border-white flex items-center justify-center text-[9px] text-white font-bold uppercase shadow-sm">
                                      {m[0]}
                                    </div>
                                  ))}
                                  {(selectedGoal.members?.length || 0) > 3 && (
                                    <div className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[9px] text-slate-500 font-bold uppercase shadow-sm">
                                      +{(selectedGoal.members?.length || 0) - 3}
                                    </div>
                                  )}
                                  <span className="text-sm font-bold text-slate-700 ml-4">{selectedGoal.owner}</span>
                                </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-4 ml-4">
                          <div className={`px-5 py-2.5 rounded-2xl text-white font-bold text-xs ${getStatusColor(selectedGoal.status)} shadow-lg shadow-black/5 ring-4 ring-white`}>
                            {selectedGoal.status}
                          </div>
                          {isManager && (
                            <div className="flex gap-2">
                              <button onClick={() => handleEdit(selectedGoal)} className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50/30 rounded-2xl transition-all shadow-sm">
                                <Edit3 size={18} />
                              </button>
                              <button onClick={() => handleDelete(selectedGoal.id)} className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-100 hover:bg-rose-50/30 rounded-2xl transition-all shadow-sm">
                                <Trash2 size={18} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                      <div className="xl:col-span-7 space-y-12">
                        <section>
                          <div className="flex items-center gap-3 mb-5">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shadow-sm"><Flag size={18} /></div>
                            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest">成功量化定义 (ROI)</h4>
                          </div>
                          <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-100 to-slate-100 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                            <div className="relative p-6 bg-white border border-slate-100 rounded-3xl shadow-sm text-sm text-slate-600 leading-relaxed font-semibold italic">
                              {selectedGoal.quantification || '暂无量化指标说明。'}
                            </div>
                          </div>
                        </section>

                        <section>
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl shadow-sm"><ClipboardList size={18} /></div>
                              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest">执行里程碑计划</h4>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 px-3 py-1 bg-slate-50 rounded-lg">共 {selectedGoal.actionItems?.length || 0} 个阶段</span>
                          </div>
                          <div className="space-y-4 pl-2 border-l-2 border-slate-50 ml-4">
                            {selectedGoal.actionItems?.map((ai, index) => (
                              <div 
                                key={ai.id} 
                                onClick={() => toggleDetailAction(ai.id)}
                                className={`relative flex items-start gap-4 p-5 rounded-3xl cursor-pointer transition-all border ${
                                  ai.done ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-200 hover:border-indigo-300'
                                }`}
                              >
                                <div className={`absolute -left-[27px] top-7 w-5 h-5 rounded-full border-4 border-white shadow-sm ${ai.done ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                                <div className={`mt-1 flex-shrink-0 ${ai.done ? 'text-emerald-500' : 'text-slate-300'}`}>
                                  {ai.done ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className={`text-sm font-bold truncate ${ai.done ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                                    {ai.text}
                                  </div>
                                  <div className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                                    {ai.startDate} ~ {ai.endDate}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </section>
                      </div>

                      <div className="xl:col-span-5 space-y-10">
                        <section>
                          <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shadow-sm"><Link2 size={18} /></div>
                            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest">战略依存关系</h4>
                          </div>
                          <div className="space-y-6">
                            <div className="space-y-2">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">上游依赖项</p>
                              {selectedGoal.upstreamIds.length > 0 ? selectedGoal.upstreamIds.map(id => {
                                const g = allGoals.find(x => x.id === id);
                                return g ? (
                                  <div key={id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-600 truncate">{g.name}</span>
                                    <div className={`w-2 h-2 rounded-full ${getStatusColor(g.status)}`} />
                                  </div>
                                ) : null;
                              }) : <p className="text-[10px] text-slate-400 italic pl-1">暂无</p>}
                            </div>
                          </div>
                        </section>
                        
                        <section>
                           <div className="flex items-center gap-3 mb-6">
                             <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shadow-sm"><UsersIcon size={18} /></div>
                             <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest">项目负责团队</h4>
                           </div>
                           <div className="grid grid-cols-2 gap-3">
                             {selectedGoal.members?.map((m, idx) => (
                               <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-white hover:border-indigo-100 transition-all">
                                 <div className="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center text-xs text-white font-bold uppercase shadow-sm">{m[0]}</div>
                                 <span className="text-xs font-bold text-slate-700">{m}</span>
                               </div>
                             ))}
                           </div>
                        </section>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                    <Target size={40} className="opacity-20 mb-4" />
                    <p className="font-bold text-sm uppercase tracking-widest">目标数据加载中...</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full animate-in slide-in-from-bottom-2 duration-300">
                <div className="overflow-x-auto h-full scrollbar-thin">
                  <table className="w-full text-left border-collapse min-w-full">
                    <thead>
                      <tr className="bg-slate-50/80 sticky top-0 z-10">
                        {visibleColumns.has('name') && (
                          <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">目标名称</th>
                        )}
                        {visibleColumns.has('category') && (
                          <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">业务分类</th>
                        )}
                        {visibleColumns.has('tags') && (
                          <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">目标标签</th>
                        )}
                        {visibleColumns.has('type') && (
                          <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">组织层级</th>
                        )}
                        {visibleColumns.has('importance') && (
                          <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">重要度</th>
                        )}
                        {visibleColumns.has('difficulty') && (
                          <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">难度系数</th>
                        )}
                        {visibleColumns.has('personnel') && (
                          <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">负责人 / 团队</th>
                        )}
                        {visibleColumns.has('progress') && (
                          <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">进度</th>
                        )}
                        {visibleColumns.has('status') && (
                          <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">健康状态</th>
                        )}
                        {visibleColumns.has('period') && (
                          <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">周期</th>
                        )}
                        {visibleColumns.has('actions') && (
                          <th className="px-6 py-4 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">操作</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredGoals.map((goal) => (
                        <tr 
                          key={goal.id} 
                          className="group hover:bg-slate-50/50 transition-colors"
                        >
                          {visibleColumns.has('name') && (
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                <div className={`w-1 h-8 rounded-full ${getStatusColor(goal.status)} shadow-sm flex-shrink-0`} />
                                <div 
                                  className="text-[13px] font-bold text-slate-900 group-hover:text-indigo-600 transition-colors cursor-pointer hover:underline"
                                  onClick={() => handleGoalClick(goal)}
                                >
                                  {goal.name}
                                </div>
                              </div>
                            </td>
                          )}
                          {visibleColumns.has('category') && (
                            <td className="px-6 py-5">
                              <span className="text-[10px] font-bold text-indigo-500/80 uppercase tracking-tighter bg-indigo-50 px-2 py-0.5 rounded-md">
                                {goal.category}
                              </span>
                            </td>
                          )}
                          {visibleColumns.has('tags') && (
                            <td className="px-6 py-5">
                              <div className="flex flex-wrap gap-1">
                                {goal.tags?.map(tag => (
                                  <span key={tag} className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md uppercase tracking-widest">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </td>
                          )}
                          {visibleColumns.has('type') && (
                            <td className="px-6 py-5">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-black uppercase border border-slate-200">
                                {goal.type}
                              </span>
                            </td>
                          )}
                          {visibleColumns.has('importance') && (
                            <td className="px-6 py-5">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                                goal.importance === 'P0' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                goal.importance === 'P1' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                'bg-indigo-50 text-indigo-600 border-indigo-100'
                              }`}>
                                {goal.importance}
                              </span>
                            </td>
                          )}
                          {visibleColumns.has('difficulty') && (
                            <td className="px-6 py-5">
                              <span className="text-[11px] font-bold text-slate-600">
                                ×{goal.difficulty}
                              </span>
                            </td>
                          )}
                          {visibleColumns.has('personnel') && (
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                <div className="flex -space-x-1.5 overflow-hidden">
                                  {goal.members?.slice(0, 2).map((m, idx) => (
                                    <div key={idx} className="inline-block w-6 h-6 rounded-full ring-2 ring-white bg-indigo-500 flex items-center justify-center text-[8px] text-white font-bold uppercase">
                                      {m[0]}
                                    </div>
                                  ))}
                                  {(goal.members?.length || 0) > 2 && (
                                    <div className="inline-block w-6 h-6 rounded-full ring-2 ring-white bg-slate-200 flex items-center justify-center text-[8px] text-slate-500 font-bold uppercase">
                                      +{(goal.members?.length || 0) - 2}
                                    </div>
                                  )}
                                </div>
                                <span className="text-xs font-bold text-slate-700 whitespace-nowrap">{goal.owner}</span>
                              </div>
                            </td>
                          )}
                          {visibleColumns.has('progress') && (
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3 min-w-[80px]">
                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${getStatusColor(goal.status)}`} style={{ width: `${goal.progress}%` }} />
                                </div>
                                <span className="text-[10px] font-black text-slate-700">{goal.progress}%</span>
                              </div>
                            </td>
                          )}
                          {visibleColumns.has('status') && (
                            <td className="px-6 py-5">
                              <span className={`px-2.5 py-1 rounded-full text-[9px] font-black border uppercase whitespace-nowrap ${getStatusBadge(goal.status)}`}>
                                {goal.status}
                              </span>
                            </td>
                          )}
                          {visibleColumns.has('period') && (
                            <td className="px-6 py-5">
                              <span className="text-[10px] font-bold text-slate-400 tracking-tighter">{goal.period}</span>
                            </td>
                          )}
                          {visibleColumns.has('actions') && (
                            <td className="px-6 py-5 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleEdit(goal); }} 
                                  className="p-2 text-slate-400 hover:text-indigo-600 bg-white border border-slate-100 rounded-xl shadow-sm"
                                >
                                  <Edit3 size={14} />
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleDelete(goal.id); }} 
                                  className="p-2 text-slate-400 hover:text-rose-600 bg-white border border-slate-100 rounded-xl shadow-sm"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 报表导出高级弹窗 */}
      {showExportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowExportModal(false)} />
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20">
            <div className="bg-indigo-600 p-8 text-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                  <Clock size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight">
                    导出工时明细
                  </h3>
                  <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest mt-0.5">
                    导出智能执行中填写的日报工时数据
                  </p>
                </div>
              </div>
              <button onClick={() => setShowExportModal(false)} className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-2xl transition-all"><X size={24} /></button>
            </div>
            
            <div className="p-8 space-y-6">
              <section>
                <div className="flex items-center gap-2 mb-4 text-slate-400">
                  <Calendar size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">选择时间区间</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">开始日期</label>
                    <input 
                      type="date" 
                      value={exportStartDate}
                      onChange={(e) => setExportStartDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
                    />
                  </div>
                  <div className="text-slate-300 mt-6"><ArrowRight size={16} /></div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">结束日期</label>
                    <input 
                      type="date" 
                      value={exportEndDate}
                      onChange={(e) => setExportEndDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
                    />
                  </div>
                </div>
              </section>
              
              <section>
                <div className="flex items-center gap-2 mb-4 text-slate-400">
                  <List size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">选择导出字段</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {EXPORT_FIELDS.map(field => (
                    <label key={field.id} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${exportFields.has(field.id) ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                      <div className={`w-4 h-4 rounded flex items-center justify-center border ${exportFields.has(field.id) ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-white border-slate-300'}`}>
                        {exportFields.has(field.id) && <Check size={12} strokeWidth={3} />}
                      </div>
                      <span className="text-xs font-bold">{field.label}</span>
                      <input 
                        type="checkbox" 
                        className="hidden"
                        checked={exportFields.has(field.id)}
                        onChange={() => {
                          setExportFields(prev => {
                            const next = new Set(prev);
                            if (next.has(field.id)) next.delete(field.id);
                            else next.add(field.id);
                            return next;
                          });
                        }}
                      />
                    </label>
                  ))}
                </div>
              </section>
              
              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-start gap-3">
                <div className="mt-0.5 text-indigo-500"><FileText size={16} /></div>
                <div>
                  <p className="text-xs font-bold text-indigo-900 mb-1">导出内容说明</p>
                  <p className="text-[10px] font-medium text-indigo-700/80 leading-relaxed">
                    将导出指定日期范围内，团队成员在“智能执行”模块中填写的日报数据，包含您选择的字段。
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button 
                onClick={handleExportExecute}
                className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white text-xs font-black uppercase rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
              >
                <Download size={16} /> 确认导出 CSV
              </button>
            </div>
          </div>
        </div>
      )}


      {/* 弹窗部分 */}
      {isModalOpen && editingGoal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh] border border-white/20">
            <div className="bg-indigo-600 px-10 py-8 flex items-center justify-between text-white flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                  <Target size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight">{editingGoal.id?.includes('goal-new') ? '新增项目战略' : '战略深度修正'}</h3>
                  <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest mt-0.5">{activeCycle} 周期 | 全局空间同步</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-2xl transition-all"><X size={24} /></button>
            </div>
            
            <div className="p-10 space-y-8 overflow-y-auto flex-1 scrollbar-thin">
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-slate-400 uppercase ml-1 tracking-widest">目标/项目名称</label>
                <div className="relative">
                  <Edit3 className="absolute left-5 top-4 text-indigo-400" size={18} />
                  <input 
                    type="text" 
                    value={editingGoal.name}
                    onChange={(e) => setEditingGoal({...editingGoal, name: e.target.value})}
                    placeholder="输入战略目标名称..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] pl-14 pr-6 py-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-3">
                  <label className="text-[11px] font-bold text-slate-400 uppercase ml-1 tracking-widest">目标分类</label>
                  <select 
                    value={editingGoal.type}
                    onChange={(e) => setEditingGoal({...editingGoal, type: e.target.value as GoalType})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all cursor-pointer"
                  >
                    {Object.values(GoalType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-bold text-slate-400 uppercase ml-1 tracking-widest">业务分类</label>
                  <select 
                    value={editingGoal.category}
                    onChange={(e) => setEditingGoal({...editingGoal, category: e.target.value as GoalCategory})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all cursor-pointer"
                  >
                    {Object.values(GoalCategory).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-bold text-slate-400 uppercase ml-1 tracking-widest">负责人姓名</label>
                  <input 
                    type="text" 
                    value={editingGoal.owner}
                    onChange={(e) => setEditingGoal({...editingGoal, owner: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[11px] font-bold text-slate-400 uppercase ml-1 tracking-widest">重要度 (IMPORTANCE)</label>
                  <div className="flex gap-2">
                    {(['P0', 'P1', 'P2'] as const).map(p => (
                      <button
                        key={p}
                        onClick={() => setEditingGoal({...editingGoal, importance: p})}
                        className={`flex-1 py-3 rounded-2xl text-xs font-black transition-all border ${
                          editingGoal.importance === p 
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' 
                            : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-indigo-200'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-bold text-slate-400 uppercase ml-1 tracking-widest">难度系数 (DIFFICULTY)</label>
                  <div className="flex gap-2">
                    {([1.3, 1.0, 0.7] as const).map(d => (
                      <button
                        key={d}
                        onClick={() => setEditingGoal({...editingGoal, difficulty: d})}
                        className={`flex-1 py-3 rounded-2xl text-xs font-black transition-all border ${
                          editingGoal.difficulty === d 
                            ? 'bg-slate-900 text-white border-slate-900 shadow-lg' 
                            : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        ×{d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                 <label className="text-[11px] font-bold text-slate-400 uppercase ml-1 tracking-widest flex items-center justify-between">
                   <div className="flex items-center gap-2">
                    <UsersIcon size={14} className="text-indigo-500" /> 项目人员 (MEMBERS)
                   </div>
                   {isAddingMember && (
                     <button 
                       onClick={() => setIsAddingMember(false)}
                       className="text-[10px] text-slate-400 hover:text-slate-600 font-black uppercase"
                     >
                       取消
                     </button>
                   )}
                 </label>
                 <div className="p-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] flex flex-wrap gap-2 items-center min-h-[60px]">
                    {editingGoal.members?.map((m, idx) => (
                      <span key={idx} className="px-3 py-1 bg-white border border-slate-200 text-xs font-bold text-slate-600 rounded-lg flex items-center gap-2 animate-in fade-in zoom-in-75 shadow-sm">
                        <div className="w-4 h-4 rounded-full bg-indigo-100 flex items-center justify-center text-[8px] text-indigo-600">{m[0]}</div>
                        {m}
                        <button onClick={() => removeMember(m)} className="text-slate-300 hover:text-rose-500 transition-colors"><X size={12} /></button>
                      </span>
                    ))}
                    
                    {isAddingMember ? (
                      <div className="flex flex-col gap-3 w-full animate-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center gap-2">
                          <input 
                            autoFocus
                            type="text"
                            value={newMemberName}
                            onChange={(e) => setNewMemberName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addMember()}
                            placeholder="输入姓名..."
                            className="flex-1 bg-white border border-indigo-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                          <button 
                            onClick={() => addMember()}
                            className="px-4 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-indigo-700 transition-all"
                          >
                            确认
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <span className="text-[9px] font-black text-slate-400 uppercase mr-1 mt-1">推荐:</span>
                          {SUGGESTED_MEMBERS.filter(m => !editingGoal.members?.includes(m)).slice(0, 6).map(m => (
                            <button
                              key={m}
                              onClick={() => addMember(m)}
                              className="px-2 py-1 bg-white border border-slate-200 text-[9px] font-bold text-slate-500 rounded-md hover:border-indigo-300 hover:text-indigo-600 transition-all"
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setIsAddingMember(true)} 
                        className="px-3 py-1.5 bg-white border border-dashed border-indigo-200 text-[11px] font-bold text-indigo-600 rounded-xl hover:bg-indigo-50 hover:border-indigo-300 transition-all flex items-center gap-1.5"
                      >
                        <Plus size={14} /> 添加人员
                      </button>
                    )}
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[11px] font-bold text-slate-500 uppercase ml-1 tracking-widest flex items-center gap-2"><Calendar size={14} className="text-indigo-500" /> 开始日期</label>
                  <input 
                    type="date" 
                    value={editingGoal.startDate}
                    onChange={(e) => setEditingGoal({...editingGoal, startDate: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none cursor-pointer"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-bold text-slate-500 uppercase ml-1 tracking-widest flex items-center gap-2"><Calendar size={14} className="text-rose-500" /> 截止日期</label>
                  <input 
                    type="date" 
                    value={editingGoal.endDate}
                    onChange={(e) => setEditingGoal({...editingGoal, endDate: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-bold text-slate-400 uppercase ml-1 tracking-widest">目标标签</label>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] flex flex-wrap gap-2 items-center min-h-[60px]">
                  {editingGoal.tags?.map((tag, idx) => (
                    <span key={idx} className="px-3 py-1 bg-white border border-slate-200 text-xs font-bold text-slate-600 rounded-lg flex items-center gap-2 shadow-sm">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="text-slate-300 hover:text-rose-500 transition-colors"><X size={12} /></button>
                    </span>
                  ))}
                  <div className="flex items-center gap-2 ml-2">
                    <input 
                      type="text"
                      value={newTagText}
                      onChange={(e) => setNewTagText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addTag()}
                      placeholder="输入标签..."
                      className="w-32 bg-white border border-indigo-200 rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <button 
                      onClick={addTag}
                      disabled={!newTagText.trim()}
                      className="px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50"
                    >
                      添加
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-bold text-slate-400 uppercase ml-1 tracking-widest">量化成功标准 (ROI)</label>
                <textarea 
                  value={editingGoal.quantification}
                  onChange={(e) => setEditingGoal({...editingGoal, quantification: e.target.value})}
                  placeholder="定义里程碑达成的客观证据..."
                  className="w-full h-28 bg-slate-50 border border-slate-200 rounded-[1.5rem] px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all resize-none placeholder:text-slate-300"
                />
              </div>

              <div className="space-y-5">
                <label className="text-[11px] font-bold text-slate-400 uppercase ml-1 tracking-widest">里程碑拆解</label>
                <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-200 space-y-4">
                  <input 
                    type="text"
                    value={newActionText}
                    onChange={(e) => setNewActionText(e.target.value)}
                    placeholder="输入关键节点描述..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-sm font-bold outline-none"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input type="date" value={newActionStart} onChange={(e) => setNewActionStart(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold" />
                    <input type="date" value={newActionEnd} onChange={(e) => setNewActionEnd(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold" />
                  </div>
                  <button onClick={addActionItem} disabled={!newActionText} className="w-full py-3 bg-indigo-600 text-white text-xs font-black rounded-2xl hover:bg-indigo-700 transition-all uppercase tracking-widest disabled:opacity-50">
                    添加至计划
                  </button>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-3 scrollbar-thin">
                  {editingGoal.actionItems?.length === 0 ? (
                    <div className="py-10 text-center text-slate-300 text-xs font-bold italic">暂无计划里程碑</div>
                  ) : editingGoal.actionItems?.map(ai => (
                    <div key={ai.id} className="flex flex-col p-4 bg-white rounded-2xl border border-slate-100 shadow-sm group animate-in slide-in-from-top-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <input type="checkbox" checked={ai.done} onChange={() => toggleActionItem(ai.id)} className="w-5 h-5 rounded-lg accent-indigo-600 cursor-pointer" />
                          <span className={`text-sm font-bold ${ai.done ? 'text-slate-300 line-through' : 'text-slate-700'}`}>{ai.text}</span>
                        </div>
                        <button onClick={() => removeActionItem(ai.id)} className="p-2 text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="ml-8 text-[10px] font-bold text-slate-400 flex items-center gap-2">
                        <Calendar size={12} /> {ai.startDate} ~ {ai.endDate}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-10 pt-0 flex gap-4 flex-shrink-0">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-black text-xs uppercase rounded-3xl hover:bg-slate-200 transition-all">
                  取消
                </button>
                <button onClick={handleSave} disabled={isSaving} className="flex-[2] py-4 bg-indigo-600 text-white font-black text-xs uppercase rounded-3xl hover:bg-indigo-700 shadow-xl transition-all flex items-center justify-center gap-3">
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                  保存并全局刷新
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalGraph;
