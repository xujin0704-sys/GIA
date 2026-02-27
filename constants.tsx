import { Goal, GoalType, GoalStatus, SupportProject, GoalCategory, PRDVersion } from './types';

export const MOCK_PERIOD_SUMMARIES: Record<string, { completion: string; risk: string; special: string }> = {
  '日': {
    completion: '今日整体目标推进平稳。自动化生产平台资料管理模块已完成今日灰度测试用例，台湾地图新北板桥区POI采集进度达80%。',
    risk: '台湾新北地区受天气影响，明日采集进度可能受阻；实时情感分析Kafka堆积问题尚未解决，存在较高风险。',
    special: '【专项】物流事业部武汉样板间今日完成数据清洗，进入入库阶段；【跨事业部】出行事业部接口联调已通过初测。'
  },
  '周': {
    completion: '本周核心战略目标稳步推进。物流特色数据共建闭环已完成武汉/深圳样板间建设方案评审。',
    risk: '商业化变现目标仍有20%缺口，需重点关注；部分偏远地区地图采集难度超预期。',
    special: '【专项】七大专题库本周完成模型初稿；【跨事业部】本地生活室内外一体化导航POC方案已提交评审。'
  },
  '月': {
    completion: '本月自动化生产平台资料管理模块稳定运行，七大专题库建设进度达30%。',
    risk: 'AI系统灰度进度略有延迟，需加派人手；部分历史数据清洗难度较大，可能影响后续专题库建设。',
    special: '【专项】物流特色数据共建已覆盖15个核心城市；【跨事业部】完成与物流事业部冷链运输路线规划的需求首轮对齐。'
  },
  '季': {
    completion: 'Q2季度整体加权达成率72.5%。台湾地图重点城市覆盖预计可达100%，物流样板间建设进入正式交付阶段。',
    risk: '企服商业化变现进度落后，需在Q2最后一个月冲刺；自动化生产降本增效指标距离目标仍有差距。',
    special: '【专项】物流专题地图已完成150城覆盖，下季度目标300城；【跨事业部】三大外部事业部支撑项目均进入交付/POC关键期。'
  },
  '年': {
    completion: '年度战略主线“自动化生产与AI运营体系”初具雏形，物流特色数据共建闭环生态稳步推进。',
    risk: '核心算法迭代速度需加快，以应对不断变化的市场需求；需建立常态化数据更新机制以保证数据鲜活度。',
    special: '【专项】年度物流特色数据生态基本闭环；【跨事业部】全年支撑外部BU价值产出预计超500万。'
  }
};

export const MOCK_GOALS: Goal[] = [
  {
    id: 'strat-1',
    name: '战略主线1：自动化生产与AI运营体系',
    type: GoalType.DEPARTMENT,
    category: GoalCategory.AUTO_PROD,
    period: '季度',
    weight: 1.0,
    status: GoalStatus.STABLE,
    progress: 45,
    upstreamIds: [],
    downstreamIds: ['goal-prod-1', 'goal-prod-2'],
    riskTolerance: '低',
    owner: 'Eric (DH)',
    members: ['Eric', 'Linda', 'Kevin'],
    importance: 'P0',
    difficulty: 1.3,
    quantification: '实现 POI 更新效率提升 50%，人工干预成本降低 30%。',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    productLine: '位置大数据',
    actionItems: [
      { id: 'ai-1', text: '完成自动化生产平台资料管理模块上线', done: true, startDate: '2026-01-05', endDate: '2026-02-15' },
      { id: 'ai-2', text: 'AI 运营系统 V1.0 内部灰度测试', done: false, startDate: '2026-03-01', endDate: '2026-04-30' }
    ],
    tags: ['AI类', '创新类'],
    summary: '自动化生产平台资料管理模块已成功上线，目前正在进行AI运营系统V1.0的内部灰度测试，整体进度符合预期。',
    periodSummaries: {
      '日': {
        currentGoal: '跟进AI运营系统V1.0灰度测试反馈',
        progressAndRisk: '已收集3条用户反馈，暂无重大风险。',
        nextGoal: '修复灰度测试中发现的UI显示问题'
      },
      '周': {
        currentGoal: '完成AI运营系统V1.0内部灰度测试第一阶段',
        progressAndRisk: '测试进度达80%，部分边缘场景测试用例需补充。',
        nextGoal: '启动第二阶段灰度测试，扩大测试范围'
      },
      '月': {
        currentGoal: '自动化生产平台资料管理模块稳定运行，AI系统灰度过半',
        progressAndRisk: '资料管理模块运行稳定，AI系统灰度进度略有延迟，需加派人手。',
        nextGoal: '完成AI运营系统V1.0全量灰度测试'
      },
      '季': {
        currentGoal: '实现 POI 更新效率提升 50%，人工干预成本降低 30%',
        progressAndRisk: '目前效率提升约40%，成本降低25%，距离目标还有差距。',
        nextGoal: '全面上线AI运营系统，优化算法模型'
      },
      '年': {
        currentGoal: '构建行业领先的自动化生产与AI运营体系',
        progressAndRisk: '体系初具雏形，但核心算法仍需持续迭代。',
        nextGoal: '探索大模型在自动化生产中的深度应用'
      }
    }
  },
  {
    id: 'strat-2',
    name: '组织专项：物流特色数据共建闭环',
    type: GoalType.DEPARTMENT,
    category: GoalCategory.ORG_SPECIAL,
    period: '季度',
    weight: 1.0,
    status: GoalStatus.STABLE,
    progress: 55,
    upstreamIds: [],
    downstreamIds: ['goal-map-1', 'goal-bigdata-1'],
    riskTolerance: '中',
    owner: 'Eric (DH)',
    members: ['Eric', 'Sarah', 'Wang', 'Min'],
    importance: 'P1',
    difficulty: 1.0,
    quantification: '构建覆盖全国 300+ 城市的物流专题地图，支持业务实时看板。',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    productLine: '专项',
    actionItems: [
      { id: 'ai-3', text: '七大专题库启动建设', done: true, startDate: '2026-01-10', endDate: '2026-03-20' },
      { id: 'ai-4', text: '样板间建设方案评估', done: true, startDate: '2026-02-01', endDate: '2026-02-28' }
    ],
    tags: ['组织建设'],
    summary: '七大专题库已启动建设，样板间建设方案评估已完成，后续将重点推进样板间落地。',
    periodSummaries: {
      '日': {
        currentGoal: '推进武汉样板间数据接入',
        progressAndRisk: '数据接口已打通，正在进行数据清洗。',
        nextGoal: '完成武汉样板间首批数据入库'
      },
      '周': {
        currentGoal: '完成武汉/深圳样板间建设方案评审',
        progressAndRisk: '方案已通过评审，资源协调存在一定困难。',
        nextGoal: '启动样板间开发工作'
      },
      '月': {
        currentGoal: '七大专题库建设进度达30%',
        progressAndRisk: '进度符合预期，部分历史数据清洗难度较大。',
        nextGoal: '完成专题库核心数据模型设计'
      },
      '季': {
        currentGoal: '构建覆盖全国 300+ 城市的物流专题地图',
        progressAndRisk: '目前覆盖约150个城市，下半季度需加速推进。',
        nextGoal: '完成剩余150+城市的数据覆盖'
      },
      '年': {
        currentGoal: '打造物流特色数据共建闭环生态',
        progressAndRisk: '生态建设稳步推进，需加强与外部合作伙伴的协同。',
        nextGoal: '引入更多物流生态合作伙伴'
      }
    }
  },
  {
    id: 'goal-map-1',
    name: '台湾地图 Q2 重点城市覆盖',
    type: GoalType.INDIVIDUAL,
    category: GoalCategory.MAP,
    period: '季度',
    weight: 0.4,
    status: GoalStatus.STABLE,
    progress: 60,
    upstreamIds: ['strat-2'],
    downstreamIds: [],
    riskTolerance: '中',
    owner: 'Alex',
    members: ['Alex'],
    importance: 'P2',
    difficulty: 0.7,
    quantification: '完成台北、新北核心商圈 POI 100% 采集。',
    productLine: '地图',
    actionItems: [],
    tags: ['常规业务'],
    summary: '目前已完成台北核心商圈POI采集，新北商圈采集正在进行中，预计下周完成。',
    periodSummaries: {
      '日': {
        currentGoal: '完成新北板桥区POI采集',
        progressAndRisk: '已完成80%，天气原因可能影响明日进度。',
        nextGoal: '完成新北中和区POI采集'
      },
      '周': {
        currentGoal: '完成新北核心商圈POI采集',
        progressAndRisk: '整体进度正常，部分偏远地区采集难度较大。',
        nextGoal: '启动桃园核心商圈POI采集'
      },
      '月': {
        currentGoal: '完成台湾北部重点城市POI采集',
        progressAndRisk: '进度达90%，基本可按期完成。',
        nextGoal: '启动台湾中部重点城市POI采集'
      },
      '季': {
        currentGoal: '台湾地图 Q2 重点城市覆盖',
        progressAndRisk: 'Q2目标达成率预计可达100%。',
        nextGoal: '规划Q3台湾南部重点城市覆盖计划'
      },
      '年': {
        currentGoal: '实现台湾全岛高精度地图覆盖',
        progressAndRisk: '整体进度稳健，需关注数据更新频率。',
        nextGoal: '建立台湾地图常态化更新机制'
      }
    }
  }
];

export const MOCK_SUPPORT_PROJECTS: SupportProject[] = [
  {
    id: 's-b1',
    name: 'B1 物流事业部：武汉/深圳样板间建设',
    bu: '物流事业部',
    stage: '正式交付',
    status: '已完成',
    estimatedValue: 150,
    actualValue: 120,
    valueImpact: '验证上门入户配送地图在超大规模节点的稳定性，降低二次派送成本约 15%。',
    date: '2026-04-10',
    initiator: 'Sarah (TL)',
    productLines: ['地图', '位置大数据'],
    timeline: [
      {
        id: 'te-1',
        startTime: '2026-04-10',
        estimatedDeliveryDate: '2026-04-20',
        advancementStatus: 'POC验证',
        requirementItems: '完成武汉节点 50w 数据量压力测试',
        iterationValue: '产研提取高并发下的数据索引优化算法',
        hours: 12,
        productLineTag: '位置大数据'
      },
      {
        id: 'te-2',
        startTime: '2026-05-15',
        estimatedDeliveryDate: '2026-05-30',
        advancementStatus: '正式交付',
        requirementItems: '老旧小区窄道通行能力识别需求',
        iterationValue: '产品演进：新增非机动车道精细化拓扑属性',
        hours: 8,
        productLineTag: '地图'
      }
    ],
    newScenarios: ['老旧小区复杂窄道配送'],
    periodSummaries: {
      '周': {
        currentSummary: '完成武汉节点 50w 数据量压力测试',
        issues: '测试已完成，性能指标达标。',
        nextSummary: '启动深圳节点数据联调'
      },
      '月': {
        currentSummary: '完成武汉/深圳样板间建设并交付',
        issues: '武汉已交付，深圳进度 80%。',
        nextSummary: '样板间全国推广方案制定'
      }
    }
  },
  {
    id: 's-b2',
    name: '出行事业部：网约车接驾点优化',
    bu: '出行事业部',
    stage: '已签单',
    status: '进行中',
    estimatedValue: 200,
    valueImpact: '提升司机接驾效率，预计减少司乘通话率20%。',
    date: '2026-05-01',
    initiator: 'Eric (DH)',
    productLines: ['位置大数据'],
    timeline: [
      {
        id: 'te-3',
        startTime: '2026-05-05',
        estimatedDeliveryDate: '2026-05-10',
        advancementStatus: '已签单',
        requirementItems: '完成接驾点数据接口联调',
        iterationValue: '接口性能优化',
        hours: 16,
        productLineTag: '位置大数据'
      }
    ],
    periodSummaries: {
      '周': {
        currentSummary: '完成接驾点数据接口联调',
        issues: '接口已调通，正在进行压力测试。',
        nextSummary: '上线接驾点优化策略'
      }
    }
  },
  {
    id: 's-b3',
    name: '本地生活：商圈室内外一体化导航',
    bu: '本地生活',
    stage: 'POC验证',
    status: '进行中',
    estimatedValue: 80,
    valueImpact: '提升外卖骑手在复杂商圈的取餐效率。',
    date: '2026-05-15',
    initiator: 'Alex',
    productLines: ['上门入户地图'],
    timeline: [
      {
        id: 'te-4',
        startTime: '2026-05-18',
        estimatedDeliveryDate: '2026-05-25',
        advancementStatus: 'POC验证',
        requirementItems: '北京望京商圈室内地图数据采集与匹配',
        iterationValue: '室内外路网连通性算法验证',
        hours: 24,
        productLineTag: '上门入户地图'
      }
    ]
  },
  {
    id: 's-b4',
    name: '物流事业部：冷链运输路线规划',
    bu: '物流事业部',
    stage: '需求沟通',
    status: '进行中',
    estimatedValue: 120,
    valueImpact: '降低冷链运输损耗，提升路线规划合理性。',
    date: '2026-05-20',
    initiator: 'Sarah (TL)',
    productLines: ['高精度配送索引'],
    timeline: []
  }
];

export const MOCK_REPORTS = [
  {
    id: 'r-1',
    userName: 'Alex',
    role: '员工',
    date: '2026-05-20',
    totalHours: 8,
    status: 'STABLE',
    segments: [
      { goalName: '台湾地图 Q2 重点城市覆盖', hours: 5, content: '完成台北信义区 500 个 POI 的坐标校对，模型匹配度 95%。', summary: '完成台北信义区POI校对，明日继续其他区域。' },
      { goalName: '自动化生产演进', hours: 3, content: '参与自动化流水线灰度测试，反馈了 2 个标注工具的逻辑 Bug。', summary: '参与灰度测试并反馈Bug，明日跟进修复进度。' }
    ]
  },
  {
    id: 'r-2',
    userName: 'Jerry',
    role: '员工',
    date: '2026-05-20',
    totalHours: 8,
    status: 'HIGH_RISK',
    segments: [
      { goalName: '实时情感分析', hours: 8, content: '全天排查分布式计算延迟问题。目前 Kafka 堆积严重，依赖的基础设施组未响应，导致进度完全停滞。', summary: '排查Kafka堆积问题受阻，明日需升级协调基础设施组。' }
    ]
  },
  {
    id: 'r-3',
    userName: 'Sarah',
    role: '小组长',
    date: '2026-05-20',
    totalHours: 9,
    status: 'DEVIATED',
    segments: [
      { goalName: '小组管理与协调', hours: 4, content: '组织双周进度对齐会。发现商业化变现目标在 Q2 尾声仍有 20% 缺口。', summary: '组织双周会，发现商业化目标缺口，明日制定冲刺计划。' },
      { goalName: '企服商业化变现', hours: 5, content: '拜访物流 BU 核心架构师，探讨“上门入户点”API 的阶梯计价方案。', summary: '与物流BU探讨API计价方案，明日输出初步报价单。' }
    ]
  },
  {
    id: 'r-4',
    userName: 'Eric',
    role: '部门负责人',
    date: '2026-05-20',
    totalHours: 8,
    status: 'STABLE',
    segments: [
      { goalName: '部门战略对齐', hours: 4, content: '审核 Q3 核心主线预算分配，对齐事业部价值指标。', summary: '审核Q3预算，明日向高层汇报。' },
      { goalName: '自动化生产与AI运营体系', hours: 4, content: '深度评估标注平台 V2.0 架构方案。', summary: '评估标注平台架构，明日组织技术评审。' }
    ]
  }
];

export const MOCK_PLANS = [
  { id: 'p-1', name: '台湾地图 Q2 发布准备', goalId: 'task-map-12' },
  { id: 'p-2', name: '地址大模型 V1.0 训练', goalId: 'goal-addr-1' }
];

export const MOCK_EXPERIENCES = [
  {
    id: 'e-1',
    type: '踩坑',
    description: '地址匹配模型在处理“口语化地址”时，由于缺乏上下文理解导致召回率仅 45%。',
    reliability: 0.95,
    trigger: '用户输入非标准结构地址。',
    solution: '引入地址大模型与时空知识图谱。'
  }
];

export const MOCK_PRD_VERSIONS: PRDVersion[] = [
  {
    id: 'v1.5',
    version: 'V1.5',
    releaseDate: '2026-02-26',
    title: 'GIA 研发基准版 - 自动化总结与导出重构',
    overview: '本次版本重点优化了支撑项目的自动化总结逻辑，并重构了导出系统的交互体验。',
    changes: [
      { id: 'c1', module: '支撑项目', type: '重构', description: '实现基于 Timeline 的自动化总结截取算法。' },
      { id: 'c2', module: '导出系统', type: '优化', description: '增加固定表头表尾，支持 90vh 高度自适应。' },
      { id: 'c3', module: '系统管理', type: '新增', description: '增加 PRD 导出 Word 功能。' }
    ],
    fullContent: '<h1>GIA V1.5 PRD</h1><p>详细内容已在系统维护模块中定义...</p>'
  },
  {
    id: 'v1.4',
    version: 'V1.4',
    releaseDate: '2026-02-10',
    title: 'GIA 核心看板增强版',
    overview: '增加了 AI 达成预测模型及目标地图可视化功能。',
    changes: [
      { id: 'c4', module: '目标全景', type: '新增', description: '引入 AI 达成预测加权算法。' },
      { id: 'c5', module: '目标地图', type: '新增', description: '支持 OKR 层级拓扑展示。' }
    ],
    fullContent: '<h1>GIA V1.4 PRD</h1><p>历史版本内容...</p>'
  }
];
