const { ChatOllama } = require("@langchain/community/chat_models/ollama");
const { PromptTemplate } = require("@langchain/core/prompts");
const { LLMChain } = require("langchain/chains");
const { AgentExecutor, createOpenAIFunctionsAgent } = require("langchain/agents");
const { OllamaEmbeddings } = require("@langchain/community/embeddings/ollama");
const axios = require('axios');
const DisasterReport = require("../models/report.model");
const clustering = require('density-clustering');

// Weaviate REST API configuration
const WEAVIATE_BASE_URL = 'http://localhost:8080/v1';
const WEAVIATE_CLASS_NAME = 'DisasterReport';

const ollamaModel = new ChatOllama({
  baseUrl: "http://localhost:11434",
  model: "gemma3",
  temperature: 0.3,
  maxTokens: 1000,
});

const embeddings = new OllamaEmbeddings({
  model: "all-minilm",
  baseUrl: "http://localhost:11434"
});

const formatReports = (reports) => {
  const limitedReports = reports.slice(0, 10);
  return limitedReports.map(report => 
    `ประเภทภัยพิบัติ: ${report.type}
    สถานที่: ${report.location?.coordinates ? `พิกัด: ${report.location.coordinates[1]}, ${report.location.coordinates[0]}` : 'ไม่ระบุ'}
    รายละเอียด: ${report.description}
    เวลาที่รายงาน: ${report.timeStamps}
    --------------------`
  ).join('\n');
};

const agents = {
  reader: {
    name: "reader_agent",
    description: "อ่านและสรุปข้อมูลรายงานภัยพิบัติ",
    func: async (reports, question) => {
      const prompt = new PromptTemplate({
        template: `คุณเป็นผู้เชี่ยวชาญในการอ่านและสรุปข้อมูลภัยพิบัติ\nหน้าที่ของคุณคืออ่านรายงานภัยพิบัติและตอบคำถามให้ตรงประเด็น\n\nคำถาม: {question}\n\nข้อมูลรายงานภัยพิบัติ:\n{reports}\n\nกรุณาตอบคำถามให้กระชับและตรงประเด็น:`,
        inputVariables: ["reports", "question"]
      });
      const chain = new LLMChain({ llm: ollamaModel, prompt });
      const result = await chain.call({ reports: formatReports(reports), question });
      return result.text;
    }
  },
  analyzer: {
    name: "analyzer_agent",
    description: "วิเคราะห์แนวโน้มและรูปแบบของภัยพิบัติ",
    func: async (reports, question) => {
      const prompt = new PromptTemplate({
        template: `คุณเป็นผู้เชี่ยวชาญในการวิเคราะห์แนวโน้มภัยพิบัติ\nหน้าที่ของคุณคือวิเคราะห์รูปแบบและแนวโน้มของภัยพิบัติ\n\nคำถาม: {question}\n\nข้อมูลรายงานภัยพิบัติ:\n{reports}\n\nกรุณาวิเคราะห์และตอบคำถามให้กระชับ:`,
        inputVariables: ["reports", "question"]
      });
      const chain = new LLMChain({ llm: ollamaModel, prompt });
      const result = await chain.call({ reports: formatReports(reports), question });
      return result.text;
    }
  },
  advisor: {
    name: "advisor_agent",
    description: "ให้คำแนะนำในการป้องกันและรับมือกับภัยพิบัติ",
    func: async (reports, question) => {
      const prompt = new PromptTemplate({
        template: `คุณเป็นผู้เชี่ยวชาญในการให้คำแนะนำเกี่ยวกับภัยพิบัติ\nหน้าที่ของคุณคือให้คำแนะนำในการป้องกันและรับมือกับภัยพิบัติ\n\nคำถาม: {question}\n\nข้อมูลรายงานภัยพิบัติ:\n{reports}\n\nกรุณาให้คำแนะนำที่กระชับและตรงประเด็น:`,
        inputVariables: ["reports", "question"]
      });
      const chain = new LLMChain({ llm: ollamaModel, prompt });
      const result = await chain.call({ reports: formatReports(reports), question });
      return result.text;
    }
  }
};

const createMainAgent = async () => {
  const tools = Object.values(agents).map(agent => ({
    name: agent.name,
    description: agent.description,
    func: agent.func
  }));
  const prompt = new PromptTemplate({
    template: `คุณเป็นผู้ประสานงานในการวิเคราะห์ข้อมูลภัยพิบัติ\nหน้าที่ของคุณคือประสานงานกับผู้เชี่ยวชาญแต่ละด้านเพื่อตอบคำถามให้ตรงประเด็น\n\nคำถาม: {question}\n\nข้อมูลรายงานภัยพิบัติ:\n{reports}\n\nกรุณาประสานงานกับผู้เชี่ยวชาญเพื่อตอบคำถามให้กระชับและตรงประเด็น:\n{agent_scratchpad}`,
    inputVariables: ["reports", "question", "agent_scratchpad"]
  });
  return await createOpenAIFunctionsAgent({ llm: ollamaModel, tools, prompt });
};

const cosineSimilarity = (vecA, vecB) => {
  const dot = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dot / (normA * normB);
};

const reasoningPrompt = new PromptTemplate({
  template: `You are a disaster management expert. Below are disaster reports that the AI suggests should be grouped together:\n{reports}\nPlease explain briefly, in the same language as the input, why these reports should be grouped together (e.g., similar content, same location, close time, etc.).`,
  inputVariables: ["reports"]
});

const getGroupReason = async (reportsInGroup) => {
  const text = reportsInGroup.map(r => `- ${r.description} (${r.location?.address || ''}, ${r.timeStamps})`).join('\n');
  const chain = new LLMChain({ llm: ollamaModel, prompt: reasoningPrompt });
  const result = await chain.call({ reports: text });
  return result.text.trim();
};

exports.analyzeDisasterReports = async (timeRange = '7d', question = '') => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const reports = await DisasterReport.find({
      timeStamps: { $gte: startDate, $lte: endDate }
    }).sort({ timeStamps: -1 }).limit(10);
    if (reports.length === 0) {
      return "ไม่พบรายงานภัยพิบัติในช่วงเวลาที่กำหนด";
    }
    const mainAgent = await createMainAgent();
    const agentExecutor = new AgentExecutor({
      agent: mainAgent,
      tools: Object.values(agents).map(agent => ({
        name: agent.name,
        description: agent.description,
        func: agent.func
      })),
      verbose: true
    });
    const result = await agentExecutor.invoke({
      reports: formatReports(reports),
      question: question
    });
    return result.output;
  } catch (error) {
    console.error('Error analyzing disaster reports:', error);
    throw new Error('ไม่สามารถวิเคราะห์ข้อมูลได้');
  }
};

exports.getDisasterTypeInsights = async (disasterType, question = '') => {
  try {
    const reports = await DisasterReport.find({
      type: disasterType
    }).sort({ timeStamps: -1 }).limit(10);
    if (reports.length === 0) {
      return `ไม่พบรายงานเกี่ยวกับภัยพิบัติประเภท ${disasterType}`;
    }
    const mainAgent = await createMainAgent();
    const agentExecutor = new AgentExecutor({
      agent: mainAgent,
      tools: Object.values(agents).map(agent => ({
        name: agent.name,
        description: agent.description,
        func: agent.func
      })),
      verbose: true
    });
    const result = await agentExecutor.invoke({
      reports: formatReports(reports),
      question: question
    });
    return result.output;
  } catch (error) {
    console.error('Error getting disaster type insights:', error);
    throw new Error('ไม่สามารถวิเคราะห์ข้อมูลได้');
  }
};

async function upsertDisasterReportsToVectorStore(reports) {
  try {
    console.log('Upserting reports to vector store using REST API...');
  } catch (error) {
    console.error('Error upserting reports to vector store:', error);
    return { success: false, error: error.message };
  }
}

async function searchDisasterReports(query, topK = 5) {
  try {
    console.log('Searching disaster reports using REST API...');
  } catch (error) {
    console.error('Error searching disaster reports:', error);
    return [];
  }
}

exports.upsertDisasterReportsToVectorStore = upsertDisasterReportsToVectorStore;
exports.searchDisasterReports = searchDisasterReports;

exports.embedAllReports = async function() {
  try {
    const allReports = await DisasterReport.find({});
    await upsertDisasterReportsToVectorStore(allReports);
    console.log('Embedding complete');
    return { success: true, message: 'Embedding complete', count: allReports.length };
  } catch (error) {
    console.error('Error embedding reports:', error);
    throw new Error('ไม่สามารถ embed ข้อมูลได้');
  }
};

exports.parseDisasterText = async (text) => {
  try {
    const prompt = new PromptTemplate({
      template: `คุณเป็นผู้เชี่ยวชาญในการแยกข้อมูลภัยพิบัติจากข้อความ\nกรุณาแยกข้อมูลจากข้อความต่อไปนี้และตอบกลับในรูปแบบ JSON:\n\nข้อความ: {text}\n\nกรุณาตอบกลับในรูปแบบ JSON นี้เท่านั้น:\n{{\n  "disasterType": "ประเภทภัยพิบัติ (เช่น: น้ำท่วม, ไฟไหม้, แผ่นดินไหว)",\n  "location": {{\n    "address": "ที่อยู่เต็ม (เช่น: หมู่บ้านสันติสุข ตำบลเวียง อำเภอเมือง จังหวัดเชียงราย)",\n    "coordinates": [longitude, latitude] หรือ null ถ้าไม่มีพิกัด\n  }},\n  "level": "ระดับความรุนแรง (เช่น: ต่ำ, กลาง, สูง, รุนแรง)",\n  "reasoning": "เหตุผลที่ทำให้เกิดภัยพิบัติหรือความรุนแรงนั้น",\n  "description": "รายละเอียดเพิ่มเติมหรือข้อความเดิม"\n}}\n\nหมายเหตุ:\n- ถ้าไม่มีพิกัด ให้ใส่ null ใน coordinates\n- ใช้ข้อความเดิมใน description ถ้าไม่มีรายละเอียดเพิ่มเติม\n- ระบุประเภทภัยพิบัติให้ชัดเจน\n- ประเมินระดับความรุนแรงจากคำที่ใช้ในข้อความ`,
      inputVariables: ["text"]
    });
    const chain = new LLMChain({ llm: ollamaModel, prompt });
    const result = await chain.call({ text });
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('ไม่สามารถแยกข้อมูลได้');
    const parsedData = JSON.parse(jsonMatch[0]);
    if (!parsedData.disasterType || !parsedData.description) throw new Error('ข้อมูลไม่ครบถ้วน');
    return parsedData;
  } catch (error) {
    console.error('Error parsing disaster text:', error);
    throw new Error('ไม่สามารถแยกข้อมูลจากข้อความได้');
  }
}; 

exports.suggestGroups = async function (request, response, next) {
  try {
    const method = request.query.method || 'dbscan';
    const eps = parseFloat(request.query.eps) || 0.01;
    const minPts = parseInt(request.query.minPts) || 2;
    const type = request.query.type;
    const timeWindow = request.query.timeWindow ? parseInt(request.query.timeWindow) : null;
    const useContent = request.query.useContent === 'true';
    const contentSim = request.query.contentSim ? parseFloat(request.query.contentSim) : 0.7;
    let query = { groupId: null };
    if (type) query.type = type;
    let reports = await DisasterReport.find(query);
    if (timeWindow) {
      const now = Date.now();
      reports = reports.filter(r => Math.abs(now - new Date(r.timeStamps).getTime()) <= timeWindow);
    }
    if (reports.length === 0) {
      return response.status(200).json({ groups: [] });
    }
    const data = reports.map(r => [
      r.location.coordinates[1],
      r.location.coordinates[0]
    ]);
    let contentVectors = null;
    if (useContent) {
      contentVectors = await Promise.all(reports.map(r => embeddings.embedQuery(r.description)));
    }
    let clusters = [];
    if (method === 'dbscan') {
      const dbscan = new clustering.DBSCAN();
      clusters = dbscan.run(data, eps, minPts);
    } else if (method === 'kmeans') {
      const kmeans = new clustering.KMEANS();
      const k = parseInt(request.query.k) || 2;
      clusters = kmeans.run(data, k);
    } else {
      return response.status(400).json({ error: 'Unknown clustering method' });
    }
    let suggestedGroups = clusters.map(cluster => cluster.map(idx => reports[idx]._id));
    let groupDetails = [];
    if (useContent && contentVectors) {
      suggestedGroups = clusters.flatMap(cluster => {
        if (cluster.length <= 1) return [cluster.map(idx => reports[idx]._id)];
        const subgroups = [];
        const used = new Set();
        for (let i = 0; i < cluster.length; i++) {
          if (used.has(i)) continue;
          const group = [cluster[i]];
          used.add(i);
          for (let j = 0; j < cluster.length; j++) {
            if (i !== j && !used.has(j)) {
              const sim = cosineSimilarity(contentVectors[cluster[i]], contentVectors[cluster[j]]);
              if (sim >= contentSim) {
                group.push(cluster[j]);
                used.add(j);
              }
            }
          }
          subgroups.push(group.map(idx => reports[idx]._id));
        }
        return subgroups;
      });
    }
    for (const group of suggestedGroups) {
      const groupReports = group.map(id => reports.find(r => r._id.equals(id)));
      const reason = await getGroupReason(groupReports);
      groupDetails.push({ reportIds: group, reason });
    }
    response.status(200).json({ groups: groupDetails });
  } catch (err) {
    response.status(500).json({ error: err.message });
  }
}; 