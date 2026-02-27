export const FULL_SYSTEM_PRD_HTML = `
  <h2>1. 系统菜单与功能架构</h2>
  <p>GIA 系统采用模块化设计，核心功能通过左侧导航菜单进行组织。以下是各菜单模块的详细功能说明：</p>

  <h3>1.1 控制中心 (Dashboard)</h3>
  <p><strong>功能定位：</strong> 提供全域目标的宏观视图与核心指标监控。</p>
  <ul>
    <li><strong>目标健康度统计</strong>：通过环形图展示“稳定”、“偏离”、“高风险”目标的数量及占比。支持点击下钻至对应列表。</li>
    <li><strong>支撑项目阶段分布</strong>：展示支撑项目在不同生命周期（如：需求沟通、POC、交付中）的漏斗分布。</li>
    <li><strong>AI 达成概率趋势</strong>：展示全域目标平均达成概率随时间的变化曲线，帮助识别组织层面的执行风险。</li>
    <li><strong>风险 Top 5 预警</strong>：自动识别并置顶显示达成概率最低的 5 个核心目标及其风险原因。</li>
  </ul>

  <h3>1.2 目标全景 (Goal Overview)</h3>
  <p><strong>功能定位：</strong> 目标管理的核心看板，支持多维筛选与周期性执行对齐。</p>
  <ul>
    <li><strong>多维筛选</strong>：支持按 BU、产线、重要性（P0/P1/P2）、目标类型（个人/小组/部门）进行组合过滤。</li>
    <li><strong>周期视图切换</strong>：支持“日、周、月、季、年”五种视图。系统自动根据当前日期计算周期边界，并展示对应的目标内容。</li>
    <li><strong>AI 智能总结</strong>：AI 自动聚合当前周期内的执行数据，产出“目标完成情况”、“潜在风险预警”及“重点专项总结”（侧重专项标签与跨事业部支撑进展）。</li>
    <li><strong>AI 达成预测</strong>：基于目标进度与当前状态，通过加权算法实时计算预测达成率。</li>
    <li><strong>一键导出</strong>：支持“经分会模式”（侧重风险与总结）和“工时模式”（侧重执行明细）的 CSV 导出。</li>
  </ul>

  <h3>1.3 团队健康 (Team Health)</h3>
  <p><strong>功能定位：</strong> 监控团队资源投入与执行饱和度。</p>
  <ul>
    <li><strong>工时投入分布</strong>：分析团队成员在不同目标、不同产线上的工时投入占比。</li>
    <li><strong>执行饱和度监控</strong>：基于目标数量与实际产出，评估团队是否存在资源过载或闲置。</li>
  </ul>

  <h3>1.4 报表监控 (Report Monitor)</h3>
  <p><strong>功能定位：</strong> 自动化报表生成与执行质量监控。</p>
  <ul>
    <li><strong>自动化周报/月报</strong>：基于 Daily Report 自动聚合生成周期性总结报表。</li>
    <li><strong>执行质量评分</strong>：通过 AI 评估 Timeline 填写的规范性与价值产出。</li>
  </ul>

  <h3>1.5 目标地图 (Goal Graph)</h3>
  <p><strong>功能定位：</strong> 可视化展示目标间的对齐关系与依赖路径。</p>
  <ul>
    <li><strong>拓扑视图</strong>：展示 OKR 的层级拆解路径（战略目标 -> 部门目标 -> 小组目标）。</li>
    <li><strong>风险传导分析</strong>：当底层依赖目标出现风险时，通过红色连线自动向上层目标传导预警。</li>
  </ul>

  <h3>1.6 智能执行 (Daily Report)</h3>
  <p><strong>功能定位：</strong> 员工日常执行记录与经验沉淀入口。</p>
  <ul>
    <li><strong>Timeline 录入</strong>：支持快速录入执行动作、投入工时及关联目标。</li>
    <li><strong>经验自动识别</strong>：AI 自动识别执行过程中的“踩坑”或“最佳实践”，并提示存入经验库。</li>
  </ul>

  <h3>1.7 支撑项目看板 (Support Tracking)</h3>
  <p><strong>功能定位：</strong> 管理技术支撑业务的全生命周期。</p>
  <ul>
    <li><strong>自动化总结</strong>：基于 Timeline 自动截取“本期总结”、“存在问题”、“下期计划”。</li>
    <li><strong>价值影响力评估</strong>：记录支撑项目的业务价值（如：降本增效金额、覆盖用户数）。</li>
  </ul>

  <h3>1.8 经验库 (Experience Lib)</h3>
  <p><strong>功能定位：</strong> 组织资产沉淀与知识共享。</p>
  <ul>
    <li><strong>经验检索</strong>：支持按关键词、标签、产线检索历史经验。</li>
    <li><strong>可靠性评分</strong>：基于经验的复用次数与效果，自动计算可靠性权重。</li>
  </ul>

  <h3>1.9 AI 资讯 (AI News)</h3>
  <p><strong>功能定位：</strong> 聚合行业动态，辅助战略决策。</p>
  <ul>
    <li><strong>行业简报</strong>：每日自动推送与公司产线相关的 AI 行业动态。</li>
  </ul>

  <h3>1.10 系统设置 (System Settings)</h3>
  <p><strong>功能定位：</strong> 系统元数据管理与 PRD 自动化维护。</p>
  <ul>
    <li><strong>字典管理</strong>：配置 BU、阶段、产线、目标分类等基础元数据。</li>
    <li><strong>团队管理</strong>：配置小组架构、组长权限及成员名单。</li>
    <li><strong>PRD 自动化</strong>：基于系统版本发布，自动生成并维护需求文档，支持版本追溯与导出。</li>
  </ul>

  <h2>2. 核心业务逻辑说明</h2>
  <h3>2.1 AI 达成预测逻辑</h3>
  <p>预测值 = (当前进度 * 权重A) + (状态系数 * 权重B) + (剩余时间系数 * 权重C)。</p>
  <h3>2.2 支撑总结自动化逻辑</h3>
  <p>系统通过匹配 Timeline 条目的 <span style="font-family: monospace;">startTime</span> 是否落在当前 <span style="font-family: monospace;">viewPeriod</span> 的日期区间内，实现内容的自动聚合。</p>
`;
