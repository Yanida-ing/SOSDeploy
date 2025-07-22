const { ChatOllama } = require("@langchain/community/chat_models/ollama");
const { PromptTemplate } = require("@langchain/core/prompts");
const { LLMChain } = require("langchain/chains");
const { createOpenAIFunctionsAgent } = require("langchain/agents");
const fetch = require('node-fetch');
const DisasterReport = require('../../report/models/report.model');
const { searchDisasterReports } = require('../../report/service/aiservice');

const model = new ChatOllama({
  baseUrl: process.env.OLLAMA_API_URL || "http://localhost:11434",
  model: "gemma3",
  temperature: 0.3,
  maxTokens: 1000,
});

// Classifier Agent - ตัวแรกที่วิเคราะห์ประเภทคำถาม
const classifierAgent = {
  name: "classifier_agent",
  description: "วิเคราะห์และจำแนกประเภทคำถามของผู้ใช้",
  func: async (message) => {
    const prompt = new PromptTemplate({
      template: `คุณเป็น AI ที่ทำหน้าที่จำแนกประเภทคำถามของผู้ใช้

คำถาม: {message}

กรุณาวิเคราะห์และตอบกลับในรูปแบบ JSON เท่านั้น:
{{
  "type": "disaster" หรือ "general",
  "confidence": 0.0-1.0,
  "reasoning": "เหตุผลในการจำแนก"
}}

ประเภทคำถาม:
- "disaster": คำถามเกี่ยวกับภัยพิบัติ, รายงาน, สถานการณ์, ข้อมูลภัยพิบัติ, การวิเคราะห์ภัยพิบัติ, สถิติภัยพิบัติ
- "general": คำถามทั่วไป, การทักทาย, คำถามทั่วไปที่ไม่เกี่ยวกับภัยพิบัติ, การสนทนาทั่วไป

ตัวอย่าง:
- "มีรายงานภัยพิบัติอะไรบ้าง" → disaster
- "สวัสดีครับ" → general
- "สถานการณ์น้ำท่วมเป็นอย่างไร" → disaster
- "อากาศวันนี้เป็นอย่างไร" → general
- "ขอบคุณครับ" → general
- "คุณช่วยอะไรได้บ้าง" → general
- "สถิติภัยพิบัติในเดือนนี้" → disaster`,
      inputVariables: ["message"]
    });

    const chain = new LLMChain({ llm: model, prompt });
    const result = await chain.call({ message });
    
    try {
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('ไม่สามารถแยกข้อมูลได้');
      const parsedData = JSON.parse(jsonMatch[0]);
      return parsedData;
    } catch (error) {
      console.error('Error parsing classifier result:', error);
      // Fallback: ใช้ keyword matching
      const disasterKeywords = [
        'ภัย', 'disaster', 'report', 'รายงาน', 'สถานการณ์',
        'น้ำท่วม', 'flood', 'ไฟไหม้', 'fire', 'ดินถล่ม', 'landslide',
        'พายุ', 'storm', 'แผ่นดินไหว', 'earthquake', 'ภัยแล้ง', 'drought',
        'ภัยหนาว', 'cold', 'ภัยจากสารเคมี', 'chemical', 'ภัยจากสัตว์', 'animal',
        'อุบัติเหตุ', 'accident', 'วิเคราะห์', 'สถิติ', 'ข้อมูล'
      ];
      
      const isDisasterQuestion = disasterKeywords.some(keyword =>
        message.toLowerCase().includes(keyword.toLowerCase())
      );
      
      return {
        type: isDisasterQuestion ? "disaster" : "general",
        confidence: 0.8,
        reasoning: "ใช้ keyword matching เป็น fallback"
      };
    }
  }
};

// Multi-Agent สำหรับคำถามเกี่ยวกับภัยพิบัติ
const disasterAgents = {
  reader: {
    name: "reader_agent",
    description: "อ่านและสรุปข้อมูลรายงานภัยพิบัติ",
    func: async (reports, question) => {
      if (!reports || reports.length === 0) {
        return "ไม่พบรายงานภัยพิบัติในช่วงเวลาที่ระบุครับ";
      }
      
      const prompt = new PromptTemplate({
        template: `คุณเป็นผู้เชี่ยวชาญในการอ่านและสรุปข้อมูลภัยพิบัติ

คำถามของผู้ใช้: {question}

ข้อมูลรายงานภัยพิบัติ:
{reports}

กรุณาอ่านและสรุปข้อมูลรายงานภัยพิบัติตามคำถามของผู้ใช้ ให้กระชับ ตรงประเด็น และเป็นประโยชน์
ใช้ภาษาไทยที่เข้าใจง่าย และเป็นมิตร

คำตอบ:`,
        inputVariables: ["reports", "question"]
      });
      
      const chain = new LLMChain({ llm: model, prompt });
      const result = await chain.call({ 
        reports: formatReportsForLLM(reports), 
        question 
      });
      
      return result.text.trim();
    }
  },
  location: {
    name: "location_agent", 
    description: "วิเคราะห์ข้อมูลตามพื้นที่",
    func: async (reports, question) => {
      if (!reports || reports.length === 0) {
        return "ไม่พบรายงานภัยพิบัติในพื้นที่ที่ระบุครับ";
      }
      
      const prompt = new PromptTemplate({
        template: `คุณเป็นผู้เชี่ยวชาญในการวิเคราะห์ข้อมูลภัยพิบัติตามพื้นที่

คำถามของผู้ใช้: {question}

ข้อมูลรายงานภัยพิบัติ:
{reports}

กรุณาวิเคราะห์และสรุปข้อมูลภัยพิบัติตามพื้นที่ต่างๆ ให้กระชับ ตรงประเด็น และเป็นประโยชน์
ใช้ภาษาไทยที่เข้าใจง่าย และเป็นมิตร

คำตอบ:`,
        inputVariables: ["reports", "question"]
      });
      
      const chain = new LLMChain({ llm: model, prompt });
      const result = await chain.call({ 
        reports: formatReportsForLLM(reports), 
        question 
      });
      
      return result.text.trim();
    }
  },
  severity: {
    name: "severity_agent",
    description: "วิเคราะห์ระดับความรุนแรง",
    func: async (reports, question) => {
      if (!reports || reports.length === 0) {
        return "ไม่พบรายงานภัยพิบัติในช่วงเวลาที่ระบุครับ";
      }
      
      const prompt = new PromptTemplate({
        template: `คุณเป็นผู้เชี่ยวชาญในการวิเคราะห์ระดับความรุนแรงของภัยพิบัติ

คำถามของผู้ใช้: {question}

ข้อมูลรายงานภัยพิบัติ:
{reports}

กรุณาวิเคราะห์และสรุปข้อมูลระดับความรุนแรงของภัยพิบัติ ให้กระชับ ตรงประเด็น และเป็นประโยชน์
ใช้ภาษาไทยที่เข้าใจง่าย และเป็นมิตร

คำตอบ:`,
        inputVariables: ["reports", "question"]
      });
      
      const chain = new LLMChain({ llm: model, prompt });
      const result = await chain.call({ 
        reports: formatReportsForLLM(reports), 
        question 
      });
      
      return result.text.trim();
    }
  },
  type: {
    name: "type_agent",
    description: "วิเคราะห์ประเภทภัยพิบัติ",
    func: async (reports, question) => {
      if (!reports || reports.length === 0) {
        return "ไม่พบรายงานภัยพิบัติในช่วงเวลาที่ระบุครับ";
      }
      
      const prompt = new PromptTemplate({
        template: `คุณเป็นผู้เชี่ยวชาญในการวิเคราะห์ประเภทของภัยพิบัติ

คำถามของผู้ใช้: {question}

ข้อมูลรายงานภัยพิบัติ:
{reports}

กรุณาวิเคราะห์และสรุปข้อมูลประเภทของภัยพิบัติ ให้กระชับ ตรงประเด็น และเป็นประโยชน์
ใช้ภาษาไทยที่เข้าใจง่าย และเป็นมิตร

คำตอบ:`,
        inputVariables: ["reports", "question"]
      });
      
      const chain = new LLMChain({ llm: model, prompt });
      const result = await chain.call({ 
        reports: formatReportsForLLM(reports), 
        question 
      });
      
      return result.text.trim();
    }
  },
  summary: {
    name: "summary_agent",
    description: "สรุปข้อมูลจากทุก agent",
    func: async (results, question) => {
      const prompt = new PromptTemplate({
        template: `คุณเป็นผู้ประสานงานในการสรุปข้อมูลภัยพิบัติ

คำถามของผู้ใช้: {question}

ผลการวิเคราะห์จากผู้เชี่ยวชาญแต่ละด้าน:
{results}

กรุณาสรุปข้อมูลจากผู้เชี่ยวชาญทุกด้านให้กระชับ ตรงประเด็น และเป็นประโยชน์
ใช้ภาษาไทยที่เข้าใจง่าย เป็นมิตร และมีโครงสร้างที่ชัดเจน
เพิ่มข้อความแนะนำการใช้งานในท้ายสุด

คำตอบ:`,
        inputVariables: ["results", "question"]
      });
      
      const chain = new LLMChain({ llm: model, prompt });
      const result = await chain.call({ 
        results: formatResultsForLLM(results), 
        question 
      });
      
      return result.text.trim();
    }
  }
};

// ฟังก์ชันช่วยจัดรูปแบบข้อมูลรายงานสำหรับ LLM
function formatReportsForLLM(reports) {
  return reports.map((report, index) => {
    const type = report.type?.title?.[0]?.value || 'ไม่ระบุประเภท';
    const level = report.level?.title?.[0]?.value || 'ไม่ระบุระดับ';
    const status = report.status?.title?.[0]?.value || 'ไม่ระบุสถานะ';
    const location = report.location?.address || 'ไม่ระบุสถานที่';
    const time = report.timeStamps ? new Date(report.timeStamps).toLocaleString('th-TH') : 'ไม่ระบุเวลา';
    const description = report.description || 'ไม่มีรายละเอียด';
    
    return `รายงานที่ ${index + 1}:
- ประเภท: ${type}
- ระดับ: ${level}
- สถานะ: ${status}
- สถานที่: ${location}
- เวลา: ${time}
- รายละเอียด: ${description}
---`;
  }).join('\n\n');
}

// ฟังก์ชันช่วยจัดรูปแบบผลลัพธ์จาก agents สำหรับ LLM
function formatResultsForLLM(results) {
  let formatted = '';
  
  if (results.reader) {
    formatted += `📊 รายงานสรุป:\n${results.reader}\n\n`;
  }
  if (results.location) {
    formatted += `📍 วิเคราะห์พื้นที่:\n${results.location}\n\n`;
  }
  if (results.severity) {
    formatted += `⚠️ วิเคราะห์ระดับความรุนแรง:\n${results.severity}\n\n`;
  }
  if (results.type) {
    formatted += `🏷️ วิเคราะห์ประเภท:\n${results.type}\n\n`;
  }
  
  return formatted.trim();
}

// ฟังก์ชันหลักสำหรับประมวลผลข้อความ
async function processUserMessage(message) {
  try {
    console.log('🔍 เริ่มวิเคราะห์ประเภทคำถาม...');
    
    // ขั้นตอนที่ 1: ใช้ Classifier Agent วิเคราะห์ประเภทคำถาม
    const classification = await classifierAgent.func(message);
    console.log('📊 ผลการจำแนก:', classification);
    
    // ขั้นตอนที่ 2: ส่งต่อไปยัง handler ที่เหมาะสม
    if (classification.type === 'disaster') {
      console.log('🚨 คำถามเกี่ยวกับภัยพิบัติ - ใช้ Multi-Agent');
      return await processDisasterQuestion(message);
    } else {
      console.log('💬 คำถามทั่วไป - ใช้ LLM ปกติ');
      return await processGeneralQuestion(message);
    }
    
  } catch (error) {
    console.error('❌ ข้อผิดพลาดในการประมวลผล:', error);
    return "ขออภัยครับ เกิดข้อผิดพลาดในการประมวลผลข้อความ กรุณาลองใหม่อีกครั้งครับ";
  }
}

// ฟังก์ชันสำหรับคำถามเกี่ยวกับภัยพิบัติ (ใช้ Multi-Agent)
async function processDisasterQuestion(message) {
  try {
    console.log('📋 ดึงข้อมูลรายงานภัยพิบัติ...');
    let reports = await DisasterReport.find({})
      .populate('type')
      .populate('level')
      .populate('status')
      .sort({ timeStamps: -1 })
      .limit(20);
    
    if (!reports || reports.length === 0) {
      return "ไม่พบรายงานภัยพิบัติในระบบครับ กรุณาลองใหม่อีกครั้ง หรือถามคำถามอื่นๆ ได้ครับ";
    }
    
    console.log(`📊 พบรายงาน ${reports.length} รายการ`);
    
    // เรียกใช้ agents ทั้งหมด
    const results = {
      reader: await disasterAgents.reader.func(reports, message),
      location: await disasterAgents.location.func(reports, message),
      severity: await disasterAgents.severity.func(reports, message),
      type: await disasterAgents.type.func(reports, message)
    };
    
    // สรุปผลลัพธ์
    const finalResponse = await disasterAgents.summary.func(results, message);
    console.log('✅ สรุปผลลัพธ์สำเร็จ');
    
    return finalResponse;
    
  } catch (error) {
    console.error('❌ ข้อผิดพลาดในการประมวลผลคำถามภัยพิบัติ:', error);
    return "ขออภัยครับ เกิดข้อผิดพลาดในการวิเคราะห์ข้อมูลภัยพิบัติ กรุณาลองใหม่อีกครั้งครับ";
  }
}

// ฟังก์ชันสำหรับคำถามทั่วไป (ใช้ LLM ปกติ)
async function processGeneralQuestion(message) {
  try {
    console.log('🤖 ใช้ LLM ปกติสำหรับคำถามทั่วไป...');
    
    const prompt = new PromptTemplate({
      template: `คุณเป็น AI Assistant ที่เป็นมิตรและให้ความช่วยเหลือ

คำถามของผู้ใช้: {message}

กรุณาตอบคำถามอย่างเป็นมิตร อบอุ่น และเป็นประโยชน์ โดยใช้ภาษาไทยที่เข้าใจง่าย

หากเป็นคำทักทาย ให้ตอบกลับอย่างเป็นมิตรและอบอุ่น
หากเป็นคำถามทั่วไป ให้ให้คำแนะนำหรือข้อมูลที่เป็นประโยชน์
หากไม่สามารถตอบได้ ให้บอกอย่างสุภาพและแนะนำให้ถามเกี่ยวกับภัยพิบัติแทน

คำตอบ:`,
      inputVariables: ["message"]
    });
    
    const chain = new LLMChain({ llm: model, prompt });
    const result = await chain.call({ message });
    
    console.log('✅ ตอบคำถามทั่วไปสำเร็จ');
    return result.text.trim();
    
  } catch (error) {
    console.error('❌ ข้อผิดพลาดในการประมวลผลคำถามทั่วไป:', error);
    return "ขออภัยครับ เกิดข้อผิดพลาดในการประมวลผล กรุณาลองใหม่อีกครั้งครับ";
  }
}

// ฟังก์ชันเก่า (สำหรับ backward compatibility)
async function processReportOnlyMessage(message) {
  // ใช้ populate เช่นเดียวกับ processDisasterQuestion
  let reports = await DisasterReport.find({})
    .populate('type')
    .populate('level')
    .populate('status');
  return await disasterAgents.reader.func(reports, message);
}

module.exports = {
  classifierAgent,
  disasterAgents,
  model,
  processUserMessage,
  processReportOnlyMessage,
  processDisasterQuestion,
  processGeneralQuestion
}; 