
import { GoogleGenAI, Type } from "@google/genai";
import { RiskAnalysis, Goal } from "../types";

// Initialize with process.env.API_KEY as per the world-class guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeReportRisk = async (
  reportContent: string,
  associatedGoal: Goal,
  associatedPlan: any
): Promise<RiskAnalysis> => {
  const prompt = `
    作为目标管理系统的 AI 风险分析师，请根据以下日报内容针对目标和计划进行分析。
    目标：${associatedGoal.name} (当前进度: ${associatedGoal.progress}%)
    日报内容："${reportContent}"
    请使用中文返回结果，包含风险等级、解释、受影响目标及建议。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            level: { type: Type.STRING, enum: ['低', '中', '高'] },
            explanation: { type: Type.STRING },
            affectedGoals: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestedActions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['level', 'explanation', 'affectedGoals', 'suggestedActions']
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    return { level: '低', explanation: '暂时无法分析。', affectedGoals: [], suggestedActions: [] };
  }
};

export const queryTeamKnowledge = async (query: string, teamContext: string): Promise<string> => {
  const prompt = `
    你是基础产品部（Basic Product Department）的智能助手。
    你有权访问团队的日报、周报和事业部支撑数据。
    
    背景上下文：
    ${teamContext}
    
    用户问题：${query}
    
    请根据上下文提供准确、专业且有见地的回答。如果是查询进度，请给出明确状态；如果是查询价值，请强调对 BU 的贡献。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || '无法获取信息。';
  } catch (error) {
    return '抱歉，机器人目前无法连接知识库。';
  }
};

export const getSmartSuggestions = async (currentTask: string): Promise<string[]> => {
  const prompt = `基于任务 "${currentTask}"，建议 3 个潜在的历史“踩坑”点或最佳实践。请保持简短且专业，并使用中文。`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch {
    return ["检查依赖管理", "复核部署配置"];
  }
};

/**
 * Refines a user-submitted experience into a standardized "Pitfall" or "Success Case" format.
 */
export const refineExperienceInsight = async (rawContent: string, type: string) => {
  const prompt = `
    作为组织知识管理专家，请将以下原始经验描述优化为专业、结构化的【${type}】记录。
    原始描述：${rawContent}
    
    请返回 JSON 格式，包含：
    - title: 简洁有力的标题 (20字以内)
    - description: 核心现象描述
    - trigger: 触发条件/背景
    - solution: 推荐的应对方案/规避措施
    - category: 业务分类 (地图/地址/自动化生产/运营/管理)
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            trigger: { type: Type.STRING },
            solution: { type: Type.STRING },
            category: { type: Type.STRING }
          }
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return null;
  }
};

/**
 * New function: Extract insights directly from daily report content.
 */
export const extractInsightFromDaily = async (dailyContent: string) => {
  const prompt = `
    你是一个经验丰富的项目专家。请分析以下日报内容，提取其中的“踩坑教训”或“最佳实践”。
    
    日报内容：${dailyContent}
    
    请返回一个结构化的 JSON 对象，如果内容中不包含明显的经验值，请返回 null。
    包含：
    - title: 经验标题
    - type: "踩坑" 或 "最佳实践"
    - trigger: 发生背景或触发条件
    - solution: 推荐的改进方案或成功路径
    - reliability: 置信度 (0.0-1.0)
    - category: 业务分类
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            type: { type: Type.STRING, enum: ["踩坑", "最佳实践"] },
            trigger: { type: Type.STRING },
            solution: { type: Type.STRING },
            reliability: { type: Type.NUMBER },
            category: { type: Type.STRING }
          },
          required: ["title", "type", "trigger", "solution", "reliability"]
        }
      }
    });
    return JSON.parse(response.text || 'null');
  } catch (e) {
    return null;
  }
};

/**
 * AI-powered automated evolution engine.
 * Scans daily reports and merges pitfalls into the experience library.
 */
export const evolveLibraryFromReports = async (reports: any[], currentLib: any[]) => {
  const prompt = `
    作为组织进化机器人 (Evolution Bot)，请扫描以下日报数据中的“踩坑”和“教训”。
    
    日报片段：${JSON.stringify(reports.flatMap(r => r.segments.map((s: any) => s.content)))}
    
    当前经验库摘要：${JSON.stringify(currentLib.map(e => ({ id: e.id, desc: e.description })))}
    
    任务：
    1. 识别日报中重复出现的痛点或风险。
    2. 如果痛点已在经验库中，请根据新日报补充其触发背景或解决方案，并标记为“更新”。
    3. 如果是新痛点且具有普遍价值，请创建一个新的结构化条目。
    4. 合并语义相似的记录（例如：“Kafka 延迟”和“消息队列拥堵”应合并）。
    
    请只返回最终需要【新增】或【更新】的列表，使用 JSON 格式。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              action: { type: Type.STRING, enum: ['CREATE', 'UPDATE'] },
              targetId: { type: Type.STRING, description: '如果是UPDATE，提供对应的库条目ID' },
              type: { type: Type.STRING, enum: ['踩坑', '最佳实践'] },
              title: { type: Type.STRING },
              trigger: { type: Type.STRING },
              solution: { type: Type.STRING },
              category: { type: Type.STRING },
              reasoning: { type: Type.STRING, description: '为何要合并或新增的理由' }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (e) {
    return [];
  }
};

/**
 * Intelligent semantic search for experiences.
 */
export const smartSearchKnowledge = async (query: string, experiences: any[]) => {
  const prompt = `
    用户正在搜索经验库。搜索词：${query}
    已知库内容摘要：${JSON.stringify(experiences.map(e => ({ id: e.id, desc: e.description })))}
    
    请根据【语义相关性】对这些记录进行评分，并返回一个排序后的 ID 列表。
    只返回最相关的最多 5 个 ID。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (e) {
    return [];
  }
};

export const generateDailySummary = async (content: string): Promise<string> => {
  const prompt = `
    请根据以下日报内容，生成一句简短精炼的总结（15字以内），仅总结今日的核心进展，不要包含明日计划。
    
    日报内容：
    ${content}
    
    请直接返回总结文本，不要包含任何额外解释或标点符号（如引号）。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text?.trim() || '';
  } catch (error) {
    console.error('Failed to generate summary:', error);
    return '';
  }
};

/**
 * Performs a deep risk assessment for a specific goal.
 */
export const analyzeGoalRisk = async (goal: Goal): Promise<{
  riskAssessment: string;
  suggestedMeasures: string[];
  riskLevel: '低' | '中' | '高';
}> => {
  const prompt = `
    作为目标管理专家，请对以下目标进行深度风险评估。
    目标名称：${goal.name}
    当前进度：${goal.progress}%
    当前状态：${goal.status}
    关键行动项：${JSON.stringify(goal.actionItems)}
    
    请根据当前进度和状态（特别是如果状态为“偏离”或“高风险”），评估其潜在风险，并生成具体的建议措施。
    例如，如果进度滞后且状态偏离，可能需要确认接口变更、制定应急预案等。
    
    请使用中文返回 JSON 格式。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskAssessment: { type: Type.STRING, description: '风险评估描述' },
            suggestedMeasures: { type: Type.ARRAY, items: { type: Type.STRING }, description: '建议措施列表' },
            riskLevel: { type: Type.STRING, enum: ['低', '中', '高'] }
          },
          required: ['riskAssessment', 'suggestedMeasures', 'riskLevel']
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    return {
      riskAssessment: '由于系统原因，暂时无法生成深度评估。',
      suggestedMeasures: ['建议人工复核目标进度', '检查上下游依赖状态'],
      riskLevel: '中'
    };
  }
};
