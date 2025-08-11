var mongo = require('mongodb');
const Report = require('../controller/report');
const resMsg = require("../../settings/service/message");
const {  LLMChain } = require("langchain/chains");
const { ChatOllama } = require("@langchain/community/chat_models/ollama");
const { PromptTemplate } = require("@langchain/core/prompts");

const DisasterReport = require("../models/report.model");
const DisasterReportGroup = require('../models/DisasterReportGroup.model');
const UserTypeModel = require('../models/userType.model');
// Vector Store Service 
const axios = require('axios');
const { OllamaEmbeddings } = require("@langchain/community/embeddings/ollama");


const multer = require('multer');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, 
    files: 10 
  }
});

// Weaviate configuration
const WEAVIATE_ENABLED = process.env.WEAVIATE_ENABLED === 'true';
const WEAVIATE_BASE_URL = process.env.WEAVIATE_URL || 'http://localhost:8080/v1';
const WEAVIATE_CLASS_NAME = process.env.WEAVIATE_CLASS_NAME || 'DisasterReport';

// Amazon Bedrock LLM 
const useBedrock = process.env.LLM_PROVIDER === 'bedrock';
const bedrockApiUrl = process.env.BEDROCK_API_URL || '';
const bedrockBearerToken = process.env.BEDROCK_BEARER_TOKEN || '';

async function bedrockLLM(prompt, options = {}) {
  const payload = {
    modelId: process.env.BEDROCK_MODEL_ID || "anthropic.claude-3-5-sonnet-20240620-v1:0",
    messages: [
      {
        role: "user",
        content: [
          { text: prompt }
        ]
      }
    ],
    max_tokens: options.maxTokens || 1000,
    temperature: options.temperature || 0.3
  };
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${bedrockBearerToken}`
  };
  const response = await axios.post(bedrockApiUrl, payload, { headers });
  return response.data?.output?.message?.content?.[0]?.text || response.data;
}





// Ollama model (for LLMChain use)
const ollamaModel = new ChatOllama({
  baseUrl: process.env.OLLAMA_API_URL || "http://localhost:11434",
  model: "gemma3",
  temperature: 0.3,
  maxTokens: 1000,
});

// Unified LLM call function
async function callLLM(prompt, options = {}) {
  if (useBedrock) {
    return await bedrockLLM(prompt, options);
  } else {
    const chain = new LLMChain({
      llm: ollamaModel,
      prompt: new PromptTemplate({ template: prompt, inputVariables: options.inputVariables || [] })
    });
    const result = await chain.call(options.inputValues || {});
    return result.text;
  }
}
//Ollama embedding model
const embeddings = new OllamaEmbeddings({
  model: "all-minilm",
});

exports.onQuery = async function (request, response, next) {
    try {
        var querys = {};
        if (request.params && request.params.id) {
            querys._id = request.params.id;
        }
        const doc = await Report.onQuery(querys);
        var resData = await resMsg.onMessage_Response(0,20000)
        resData.data = doc;
        response.status(200).json(resData);
    } catch (err) {
        var resData = await resMsg.onMessage_Response(0,40400)
        response.status(404).json(resData);
    }
};

exports.onQuerys = async function (request, response, next) {
    try {
        var querys = {}

        const doc = await Report.onQuerys(querys);
        var resData = await resMsg.onMessage_Response(0,20000)
        resData.data = doc;
        response.status(200).json(resData);
    } catch (err) {
        var resData = await resMsg.onMessage_Response(0,40400)
        response.status(404).json(resData);
    }
};

exports.onCreate = async function (request, response, next) {
    try {
        if (Array.isArray(request.body)) {
            const doc = await Report.onCreateMany(request.body);
            var resData = await resMsg.onMessage_Response(0,20000)
            resData.data = doc;
            response.status(200).json(resData);
        } else {
            const doc = await Report.onCreate(request.body);
            var resData = await resMsg.onMessage_Response(0,20000)
            resData.data = doc;
            response.status(200).json(resData);
        }
    } catch (err) {
        var resData = await resMsg.onMessage_Response(0,40400)
        response.status(404).json(resData);
    }
};

exports.onUpdate = async function (request, response, next) {
    try {
        let resData;
        if (Array.isArray(request.body)) {
            const doc = await Report.onUpdateMany(request.body);  
            resData = await resMsg.onMessage_Response(0, 20000);
            resData.data = doc;
        } else {
            const query = { _id: new mongo.ObjectId(request.body._id) };
            const doc = await Report.onUpdate(query, request.body);
            resData = await resMsg.onMessage_Response(0, 20000);
            resData.data = doc;
        }

        return response.status(200).json(resData);
    } catch (err) {
        const resData = await resMsg.onMessage_Response(0, 40400);
        return response.status(404).json(resData);
    }
};

exports.onDelete = async function (request, response, next) {
    try {
    if (Array.isArray(request.body.id)) {
        const doc = await Report.onDeleteMany(request.body.id);
        const resData = await resMsg.onMessage_Response(0, 20000);
            resData.data = doc;
                return response.status(200).json(resData);
    } else {
        const id = request.body.id;
        if (!mongo.ObjectId.isValid(id)) {
            const resData = await resMsg.onMessage_Response(0, 40000); 
                 return response.status(400).json(resData);
    }
        const query = { _id: new mongo.ObjectId(id) };
        const doc = await Report.onDelete(query);
        const resData = await resMsg.onMessage_Response(0, 20000);
            resData.data = doc;
                return response.status(200).json(resData);
    }
    } catch (err) {
        const resData = await resMsg.onMessage_Response(0, 40400);
            return response.status(404).json(resData);
    }
    };



// Function to find matching disaster type from database
exports.findMatchingDisasterType = async (disasterTypeText) => {
  try {
    const DisasterType = require('../models/disasterType.model');
    const disasterTypes = await DisasterType.find({});
    const normalizedText = disasterTypeText.toLowerCase().trim();

    // 1. Exact match
    for (const type of disasterTypes) {
      for (const title of type.title) {
        if (title.value && title.value.toLowerCase().trim() === normalizedText) {
          return type._id;
        }
      }
    }

    // 2. Contains match
    for (const type of disasterTypes) {
      for (const title of type.title) {
        if (title.value && title.value.toLowerCase().includes(normalizedText)) {
          return type._id;
        }
      }
    }

    // 3. Not found
    console.error('ไม่พบประเภทภัยพิบัติที่ตรงกัน:', disasterTypeText);
    return null;
  } catch (error) {
    console.error('Error finding disaster type:', error);
    throw error;
  }
};

exports.findMatchingDisasterLevel = async (levelText) => {
  try {
    const DisasterLevel = require('../models/disasterLevel.model');
    
    const disasterLevels = await DisasterLevel.find({});
    
    const normalizedText = levelText.toLowerCase().trim();
    
    for (const level of disasterLevels) {
      for (const title of level.title) {
        if (title.value && title.value.toLowerCase().includes(normalizedText)) {
          return level._id;
        }
      }
    }
    
    if (disasterLevels.length > 0) {
      return disasterLevels[0]._id;
    }
    
    throw new Error('ไม่พบระดับภัยพิบัติที่ตรงกัน');
  } catch (error) {
    console.error('Error finding disaster level:', error);
    throw error;
  }
};

exports.findMatchingUserType = async function (userTypeName) {
  if (!userTypeName || typeof userTypeName !== 'string') return null;

  // ค้นหาแบบ case-insensitive
  const userType = await UserTypeModel.findOne({
    'title.value': { $regex: new RegExp('^' + userTypeName + '$', 'i') }
  }).exec();

  if (userType) return userType._id;

  // ถ้าไม่เจอ ให้ fallback เป็น 'ประชาชนทั่วไป' (หรือแก้ไขชื่อ default ตาม DB)
  const defaultUserType = await UserTypeModel.findOne({
    'title.value': { $regex: /^ประชาชนทั่วไป$/i }
  }).exec();
  if (defaultUserType) return defaultUserType._id;

  // ถ้าไม่มีใน DB เลย ให้ log error
  console.error('ไม่พบ userType ที่ตรงกัน และไม่มี default userType ในฐานข้อมูล');
  return null;
};

exports.getDefaultStatus = async () => {
  try {
    const Status = require('../models/status.model');
    // ดึง status ที่ชื่อ 'รอดำเนินการ' (ภาษาไทย) หรือ 'pending'/'awaiting' (ภาษาอังกฤษ)
    const status = await Status.findOne({
      $or: [
        { 'title.value': 'รอดำเนินการ' },
        { 'title.value': 'pending' },
        { 'title.value': 'awaiting' }
      ]
    });
    if (status) {
      return status._id;
    }
    // fallback: ถ้าไม่เจอ ให้ใช้ตัวแรก
    const statuses = await Status.find({});
    if (statuses.length > 0) {
      return statuses[0]._id;
    }
    throw new Error('ไม่พบสถานะเริ่มต้น');
  } catch (error) {
    console.error('Error getting default status:', error);
    throw error;
  }
};


exports.classifyIntent = async function(text, chatHistory = []) {
  let contextStr = '';
  if (Array.isArray(chatHistory) && chatHistory.length > 0) {
    contextStr = 'ประวัติสนทนา:\n' +
      chatHistory.slice(-10).map(msg => `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.text}`).join('\n') +
      '\n';
  }
  const prompt = `
    คุณคือผู้ช่วยอัจฉริยะที่มีหน้าที่ **จำแนก Intent ของข้อความ** ที่ผู้ใช้ส่งเข้ามาในระบบ **แจ้งเหตุฉุกเฉินและภัยพิบัติ**

    จงวิเคราะห์ข้อความ โดยใช้ทั้งข้อความล่าสุดและประวัติสนทนา (ถ้ามี) และตอบกลับด้วย **Intent ที่ตรงที่สุดเพียงหนึ่งคำ** เท่านั้น:
    - แจ้งเหตุ
    - ถามข้อมูล
    - พูดคุย

    **คำจำกัดความของ Intent:**
    1. **แจ้งเหตุ** – ข้อความที่ระบุถึงเหตุการณ์ฉุกเฉิน เช่น การแจ้งไฟไหม้, น้ำท่วม, อุบัติเหตุ หรือกรณีที่ผู้ใช้กำลังให้ข้อมูลที่ AI ขอ เช่น ชื่อ, เบอร์โทร, สถานที่, รายละเอียด
    2. **ถามข้อมูล** – ข้อความที่สอบถามข้อมูล เช่น สถานการณ์ปัจจุบัน, วิธีรับมือ, คำแนะนำ หรือสถิติ เช่น "ควรทำอย่างไรเมื่อเกิดน้ำท่วม"
    3. **พูดคุย** – ข้อความทั่วไปที่ไม่เกี่ยวข้องกับการแจ้งเหตุหรือการสอบถาม เช่น "สวัสดี", "ขอบคุณ", "คุณชื่ออะไร"

    **หลักการจำแนก Intent:**
    - หากผู้ใช้กำลังตอบคำถามของ AI เกี่ยวกับข้อมูลเหตุการณ์ (ชื่อ, เบอร์, สถานที่ ฯลฯ) → ถือเป็น "แจ้งเหตุ"
    - หากข้อความเริ่มต้นด้วยคำถาม หรือมีคำว่า "ควรทำอย่างไร", "ขอคำแนะนำ", "จะเอาตัวรอดอย่างไร" → ถือเป็น "ถามข้อมูล"
    - หากเป็นข้อความทักทาย, ขอบคุณ, หรือคุยเล่น → ถือเป็น "พูดคุย"

    ---
    ตัวอย่าง:

    [กรณี 1]  
    ประวัติสนทนา:  
    AI: กรุณาระบุรายละเอียดเหตุการณ์  
    User: มีไฟไหม้ที่บ้าน  
    Intent: แจ้งเหตุ

    [กรณี 2]  
    ประวัติสนทนา:  
    AI: กรุณาระบุชื่อ  
    User: บอย  
    Intent: แจ้งเหตุ

    [กรณี 3]  
    ข้อความ: "วันนี้มีเหตุอะไรไหม"  
    Intent: ถามข้อมูล

    [กรณี 4]  
    ข้อความ: "ขอบคุณมากครับ"  
    Intent: พูดคุย

    [กรณี 5]  
    ข้อความ: "ไฟไหม้ที่ห้องพักเบอร์ 5 ชั้น 3 เบอร์ติดต่อ 0891234567"  
    Intent: แจ้งเหตุ

    ---
    ${contextStr}ข้อความ: "${text}"

    **ตอบกลับด้วยคำใดคำหนึ่งเท่านั้น:** แจ้งเหตุ, ถามข้อมูล, พูดคุย  
    Intent:`;
  const result = await callLLM(prompt);
  if (result.includes('แจ้งเหตุ')) return 'report';
  if (result.includes('ถามข้อมูล')) return 'query';
  if (result.includes('พูดคุย')) return 'chat';
  return 'unknown';
};

exports.parseDisasterText = async (text, location, media) => {
  try {
    const DisasterType = require('../models/disasterType.model');
    const DisasterLevel = require('../models/disasterLevel.model');
    const disasterTypes = await DisasterType.find({});
    const disasterLevels = await DisasterLevel.find({});
    const userType = await UserTypeModel.find({});
    const Status = require('../models/status.model');
    const statuses = await Status.find({});
    const typeList = disasterTypes
      .map(t => t.title.find(tt => tt.key === 'th')?.value)
      .filter(Boolean);
    const typeListStr = typeList.map(t => `- ${t}`).join('\n');

    const levelList = disasterLevels
      .map(l => l.title.find(tt => tt.key === 'th')?.value)
      .filter(Boolean);
    const levelListStr = levelList.map(l => `- ${l}`).join('\n');

    const userTypeList = userType
      .map(t => t.title.find(tt => tt.key === 'th')?.value)
      .filter(Boolean);
    const userTypeListStr = userTypeList.map(t => `- ${t}`).join('\n');

    const statusList = statuses
      .map(s => s.title.find(tt => tt.key === 'th')?.value)
      .filter(Boolean);
    const statusListStr = statusList.map(s => `- ${s}`).join('\n');

    // Build location string for LLM prompt
    let userCoordinatesStr = '';
    if (location && Array.isArray(location.coordinates) && location.coordinates.length === 2) {
      userCoordinatesStr = `---\nพิกัดที่ผู้ใช้ส่งมา: [${location.coordinates[0]}, ${location.coordinates[1]}]\n---`;
    }
    // Build media string for LLM prompt
    let userMediaStr = '';
    if (Array.isArray(media) && media.length > 0) {
      const mediaList = media.map((m, idx) => `ไฟล์ที่ ${idx+1}: ${m.name || m.src || '[unknown]'}`).join('\n');
      userMediaStr = `---\nไฟล์รูปภาพที่ผู้ใช้แนบมา (${media.length} ไฟล์):\n${mediaList}\n---`;
    }

    const promptTemplate = `
        🎯 คุณคือ LLM สำหรับแยกข้อมูลแจ้งเหตุฉุกเฉินในไทย
        📝 งาน:
        1. รับข้อความจากผู้ใช้
        2. แยกข้อมูลเป็นฟิลด์ด้านล่าง
        3. disasterType และ level ต้องเลือกจากรายการเท่านั้น ห้ามว่าง
        4. status ต้องเป็น "รอดำเนินการ" เสมอ
        5. หากไม่มีพิกัด → ใส่ [99.893572, 20.045000]
        6. reasoning ต้องวิเคราะห์สาเหตุเองเสมอ ห้ามว่าง
        7. ถ้าขาดข้อมูล → ใส่ "" หรือ null และเพิ่มชื่อฟิลด์ใน missingFields
        8. ตอบกลับเป็น JSON ที่มีทุกฟิลด์

        📋 รายการที่อนุญาต:
        - disasterType: ${typeListStr}
        - level: ${levelListStr}
        - userType: ${userTypeListStr}
        - status: ${statusListStr}

        🧩 ฟิลด์:
        - disasterType
        - userType
        - location (address, coordinates)
        - level
        - reasoning
        - description
        - contact (name, phone)
        - status
        - missingFields
        - note (optional)

        ❗ข้อจำกัด:
        - ห้ามสร้างค่าใหม่
        - missingFields ต้องตรงกับฟิลด์ที่ไม่มีข้อมูล (ยกเว้น 4 ฟิลด์บังคับด้านบน)

        📦 ตอบเป็น JSON เท่านั้น เช่น:
        {
          "disasterType": "ไฟไหม้",
          "userType": "เจ้าหน้าที่กู้ภัย",
          "location": {"address": "", "coordinates": null},
          "level": "สูง",
          "reasoning": "เกิดจากการใช้เครื่องไฟฟ้าผิดวิธี",
          "description": "ไฟไหม้หอพักแถวหน้ามอ",
          "contact": {"name": "", "phone": ""},
          "status": "รอดำเนินการ",
          "missingFields": ["location.address", "contact.name", "contact.phone"],
          "note": "กรุณาระบุที่อยู่และเบอร์โทร"
        }

        📨 ข้อความที่ต้องแยก: "${text}"
        `;
    let llmResponse;
    if (useBedrock) {
      const prompt = promptTemplate;
      llmResponse = await bedrockLLM(prompt, { maxTokens: 1000, temperature: 0.3 });
      console.log('Bedrock AI raw response:', llmResponse);
    } else {
      const prompt = new PromptTemplate({
        template: promptTemplate,
        inputVariables: []
      });
      const chain = new LLMChain({
        llm: ollamaModel,
        prompt: prompt
      });
      const result = await chain.call({});
      llmResponse = result.text;
      console.log('Ollama AI raw response:', llmResponse);
    }
    // ถ้า AI ตอบกลับเป็น JSON ให้ parse, ถ้าไม่ใช่ JSON ให้ return เป็นข้อความแจ้งเตือน
    const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      // ตอบกลับเป็นข้อความแจ้งเตือน (AI ตัดสินใจเอง)
      return { aiMessage: llmResponse.trim() };
    }
    const parsedData = JSON.parse(jsonMatch[0]);
    return parsedData;
  } catch (error) {
    console.error('Error parsing disaster text:', error);
    throw new Error('ไม่สามารถแยกข้อมูลจากข้อความได้');
  }
};

exports.onCreateReport = [upload.array('media', 5), async function (request, response, next) {
  console.log('==== onCreateReport CALLED ====');
  console.log('RAW req.body:', request.body);
  console.log('RAW req.files:', request.files);
  try {
    const text = request.body.text;
    const location = request.body.location ? (typeof request.body.location === 'string' ? JSON.parse(request.body.location) : request.body.location) : undefined;
    const chatHistory = request.body.chatHistory ? (typeof request.body.chatHistory === 'string' ? JSON.parse(request.body.chatHistory) : request.body.chatHistory) : [];
    let media = [];
    if (request.files && request.files.length > 0) {
      media = request.files.map(f => ({
        type: f.mimetype,
        src: f.path,
        name: f.originalname
      }));
    }
    let reportData = {
      text,
      media,
      location,
      chatHistory
    };
    let intent = request.body.intent || 'query';
    console.log('intent from request:', intent);
    // ... (logic เดิมต่อไป) ...
    if (intent === 'report') {
      if (typeof reportData.media === 'string') {
        try {
          reportData.media = JSON.parse(reportData.media);
        } catch (e) {
          reportData.media = [];
        }
      }
      let mergedText = '';
      if (request.body.description || request.body.contact || (request.body.location && request.body.location.address)) {
        // กรณีมาจากฟอร์ม
        let desc = request.body.description || '';
        let loc = '';
        let contact = '';
        try {
          const locObj = request.body.location ? (typeof request.body.location === 'string' ? JSON.parse(request.body.location) : request.body.location) : undefined;
          if (locObj && locObj.address) loc = `สถานที่: ${locObj.address}`;
        } catch (e) {}
        try {
          const contactObj = request.body.contact ? (typeof request.body.contact === 'string' ? JSON.parse(request.body.contact) : request.body.contact) : undefined;
          if (contactObj && (contactObj.name || contactObj.phone)) {
            contact = `ผู้แจ้ง: ${contactObj.name || ''}, เบอร์: ${contactObj.phone || ''}`;
          }
        } catch (e) {}
        mergedText = [desc, loc, contact].filter(Boolean).join(' | ');
      } else {
        // logic เดิม (chat)
        let contextStr = '';
        if (Array.isArray(chatHistory) && chatHistory.length > 0) {
          contextStr = 'ต่อไปนี้คือประวัติการสนทนาระหว่าง User กับ AI (ล่าสุดอยู่ล่างสุด):\n' +
            chatHistory.map(msg => `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.text}`).join('\n') +
            '\n---';
        }
        mergedText = [contextStr, text].filter(Boolean).join('\n');
      }
      // Fallback: ถ้า mergedText ยังว่าง ให้ใช้ text
      if (!mergedText || mergedText.trim() === '') {
        mergedText = text || '';
      }
      console.log('DEBUG mergedText:', mergedText);
      const parsedData = await exports.parseDisasterText(mergedText, location, media);
      parsedData.media = media;

      // กรณี LLM แจ้งข้อมูลไม่ครบ
      if (parsedData.aiMessage) {
        const errorPrompt = `คุณเป็นผู้ช่วยแจ้งเตือน user เมื่อข้อมูลแจ้งเหตุไม่ครบถ้วน
        ข้อความจาก AI: ${parsedData.aiMessage} กรุณาตอบกลับ user อย่างสุภาพและชัดเจน (1-2 ประโยค):`;
        const aiErrorMsg = await callLLM(errorPrompt);
        return response.status(400).json({
          code: 40010,
          data: null,
          intent: 'report',
          message: aiErrorMsg
        });
      }
      // กรณี missingFields
      if (parsedData.missingFields && Array.isArray(parsedData.missingFields) && parsedData.missingFields.length > 0) {
        const errorPrompt = `คุณเป็นผู้ช่วยแจ้งเตือน user เมื่อข้อมูลแจ้งเหตุไม่ครบถ้วน\nข้อมูลที่ขาด: ${parsedData.missingFields.join(', ')}\nหมายเหตุ: ${parsedData.note || ''}\nกรุณาตอบกลับ user อย่างสุภาพและชัดเจน (1-2 ประโยค):`;
        const aiErrorMsg = await callLLM(errorPrompt);
        return response.status(400).json({
          code: 40010,
          data: null,
          intent: 'report',
          message: aiErrorMsg
        });
      }

      const disasterTypeId = await exports.findMatchingDisasterType(parsedData.disasterType);
      const disasterLevelId = await exports.findMatchingDisasterLevel(parsedData.level);
      let userTypeId = await exports.findMatchingUserType(parsedData.userType);
      const defaultStatusId = await exports.getDefaultStatus();

      if (!userTypeId) {
        const UserTypeModel = require('../models/userType.model');
        const defaultUserType = await UserTypeModel.findOne({
          'title.value': { $regex: /^ประชาชนทั่วไป$/i }
        }).exec();
        if (defaultUserType) {
          userTypeId = defaultUserType._id;
          console.log('Fallback to default userTypeId:', userTypeId);
        } else {
          console.error('ไม่พบ userType ที่ตรงกัน และไม่มี default userType ในฐานข้อมูล');
          throw new Error('ไม่พบ userType ที่ตรงกัน และไม่มี default userType ในฐานข้อมูล');
        }
      }

      let coordinates = undefined;
      let address = '';
      if (
        request.body.location &&
        Array.isArray(request.body.location.coordinates) &&
        request.body.location.coordinates.length === 2
      ) {
        coordinates = request.body.location.coordinates;
      } else if (
        parsedData.location &&
        Array.isArray(parsedData.location.coordinates) &&
        parsedData.location.coordinates.length === 2
      ) {
        coordinates = parsedData.location.coordinates;
      } else {
        coordinates = [99.893572, 20.045000]; // ค่า default
      }

      if (parsedData.location && typeof parsedData.location.address === 'string') {
        address = parsedData.location.address;
      } else if (request.body.location && typeof request.body.location.address === 'string') {
        address = request.body.location.address;
      } else {
        address = '';
      }

      reportData = {
        type: disasterTypeId,
        user: userTypeId, 
        level: disasterLevelId,
        description: parsedData.description,
        reasoning: parsedData.reasoning,
        location: {
          type: 'Point',
          coordinates: coordinates,
          address: address,
        },
        status: defaultStatusId,
        timeStamps: new Date(),
        tracking: [
          {
            status: defaultStatusId,
            timeStamps: new Date(),
            by: request.body.by || undefined,
          },
        ],
        media: parsedData.media, 
        contact: parsedData.contact || {},
        assets: [],
      };
      console.log('Final reportData.user:', reportData.user);
      console.log('Parsed report data:', reportData);

      const result = await Report.onCreateReport(reportData);

      // ====== สร้างข้อความสรุป case ด้วย LLM ======
      let caseSummary = '';
      try {
        const summaryPrompt = `คุณเป็นผู้ช่วยสรุปรายงานเหตุฉุกเฉิน/ภัยพิบัติให้ user ฟังอย่างกระชับและเข้าใจง่าย
        โปรดขึ้นต้นด้วย รายงานของคุณถูกส่งให้เจ้าหน้าที่เรียบร้อยแล้วแล้วตามด้วยสรุปข้อมูลเหตุการณ์นี้ (1-2 ประโยค)
        ข้อมูลรายงาน:
        - ประเภท: ${parsedData.disasterType}
        - สถานที่: ${address}
        - รายละเอียด: ${parsedData.description}
        - ผู้แจ้ง: ${(parsedData.contact && parsedData.contact.name) ? parsedData.contact.name : 'ไม่ระบุ'}
        ตัวอย่าง:
        รายงานของคุณถูกส่งให้เจ้าหน้าที่เรียบร้อยแล้ว เจ้าหน้าที่จะเร่งดำเนินการและติดต่อกลับโดยเร็วที่สุด สรุปเหตุการณ์ได้ดังนี้: 
        เหตุการณ์นี้เป็นเหตุการณ์${parsedData.disasterType}ที่${address} รายละเอียด: ${parsedData.description}
        กรุณาสรุป case นี้ให้ user ฟังเป็นภาษาไทย (1-2 ประโยค):`;
        caseSummary = await callLLM(summaryPrompt);
      } catch (e) {
        caseSummary = 'รายงานของคุณถูกส่งให้เจ้าหน้าที่เรียบร้อยแล้ว';
      }

      response.status(200).json({
        code: 20000,
        data: result,
        message: caseSummary,
        intent: 'report'
      });
      return;
    } else if (intent === 'query') {
      // ใช้ agent system แทนการเรียก LLM เดียว
      const agentAnswer = await exports.queryWithAgents(text);
      return response.status(200).json({
        code: 20000,
        data: { answer: agentAnswer },
        intent: 'query',
        message: agentAnswer
      });
    } else if (intent === 'chat') {
      const prompt = `คุณเป็นผู้ช่วย AI ที่เป็นมิตรและตอบคำถามเกี่ยวกับภัยพิบัติและความปลอดภัย
      คำแนะนำในการตอบ:
      - ตอบสั้นๆ กระชับ (1-3 ประโยค)
      - ใช้ภาษาที่เป็นมิตรและเข้าใจง่าย
      - หากเป็นคำถามทั่วไป ให้ตอบอย่างสุภาพ
      - หากเกี่ยวกับภัยพิบัติ ให้ให้คำแนะนำที่เป็นประโยชน์
      - อย่าใช้คำพูดที่ซับซ้อนหรือเป็นทางการเกินไป

      คำถาม: ${text}
      คำตอบ:`;
      const answer = await callLLM(prompt);
      return response.status(200).json({
        code: 20000,
        data: { answer },
        intent: 'chat',
        message: answer
      });
    } else {
      // intent unknown
      const fallbackPrompt = `คุณเป็นผู้ช่วยแจ้ง user เมื่อระบบไม่เข้าใจข้อความ กรุณาตอบกลับ user อย่างสุภาพ (1-2 ประโยค): \"${text}\"`;
      const fallbackMsg = await callLLM(fallbackPrompt);
      return response.status(200).json({
        code: 40000,
        data: null,
        intent: 'unknown',
        message: fallbackMsg
      });
    }
  } catch (err) {
    console.error('ERROR in onCreateReport:', err);
    const errorPrompt = `คุณเป็นผู้ช่วยแจ้ง user เมื่อเกิดข้อผิดพลาดในระบบ กรุณาตอบกลับ user อย่างสุภาพ (1-2 ประโยค): "${err.message}"`;
    let aiErrorMsg = 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
    try {
      aiErrorMsg = await callLLM(errorPrompt);
    } catch {}
    var resData = await resMsg.onMessage_Response(0, 40400);
    resData.message = aiErrorMsg;
    response.status(500).json(resData);
  }
}];

exports.onQueryReport = async function (request, response, next) {
    try {
        const reports = await Report.onQueryReport();
        var resData = await resMsg.onMessage_Response(0,20000);
        resData.data = reports;
        resData.message = 'ดึงข้อมูลรายงานภัยพิบัติสำเร็จ';
        response.status(200).json(resData);
    } catch (err) {
        console.error('Error fetching disaster reports:', err);
        var resData = await resMsg.onMessage_Response(0,40400);
        resData.message = 'ไม่สามารถดึงข้อมูลรายงานได้';
        response.status(500).json(resData);
    }
};

const formatReports = (reports) => {
  const limitedReports = reports.slice(0, 10);
  return limitedReports.map(report => 
    `ประเภทภัยพิบัติ: ${report.type}
    ประเภทผู้ใช้: ${report.userType}
    สถานที่: ${report.location?.coordinates ? `พิกัด: ${report.location.coordinates[1]}, ${report.location.coordinates[0]}` : 'ไม่ระบุ'}
    รายละเอียด: ${report.description}
    เวลาที่รายงาน: ${report.timeStamps}
    --------------------`
  ).join('\n');
};





// ฟังก์ชันดึงรายงานล่าสุด
async function getRecentReports(timeRange = '7d') {
  try {
    const DisasterReport = require('../models/report.model');
    const now = new Date();
    let startDate;
    switch (timeRange) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    
    // ดึงรายงานพร้อม populate ข้อมูลที่เกี่ยวข้อง
    const reports = await DisasterReport.find({
      timeStamps: { $gte: startDate }
    })
    .populate('type', 'title')
    .populate('level', 'title')
    .populate('userType', 'title')
    .populate('status', 'title')
    .sort({ timeStamps: -1 })
    .limit(10)
    .lean();
    
    // แปลงข้อมูลให้อยู่ในรูปแบบที่ต้องการ
    return reports.map(report => ({
      type: report.type?.title?.find(t => t.key === 'th')?.value || report.type?.title?.[0]?.value || 'ไม่ระบุ',
      level: report.level?.title?.find(t => t.key === 'th')?.value || report.level?.title?.[0]?.value || 'ไม่ระบุ',
      userType: report.userType?.title?.find(t => t.key === 'th')?.value || report.userType?.title?.[0]?.value || 'ไม่ระบุ',
      description: report.description || 'ไม่ระบุ',
      location: report.location || {},
      timeStamps: report.timeStamps,
      status: report.status?.title?.find(t => t.key === 'th')?.value || report.status?.title?.[0]?.value || 'ไม่ระบุ'
    }));
    
  } catch (error) {
    console.error('Error getting recent reports:', error);
    return [];
  }
}

// ฟังก์ชันหลักสำหรับ query ด้วย LLM เดียว
exports.queryWithAgents = async function(question) {
  try {
    console.log('Query with single LLM:', question);
    
    // ดึงข้อมูลรายงานล่าสุด 7 วัน
    const timeRange = '7d';
    const reports = await getRecentReports(timeRange);
    
    if (!reports || reports.length === 0) {
      return 'ไม่พบรายงานภัยพิบัติในช่วง 7 วันที่ผ่านมา';
    }
    
    // สร้างข้อมูลสำหรับ LLM พร้อมวันที่ปัจจุบัน
    const currentDate = new Date().toLocaleDateString('th-TH');
    const reportsData = reports.map((report, index) => {
      const timeStr = new Date(report.timeStamps).toLocaleString('th-TH');
      const reportDate = new Date(report.timeStamps).toLocaleDateString('th-TH');
      const isToday = reportDate === currentDate;
      const dateLabel = isToday ? 'วันนี้' : reportDate;
      
      return `${index + 1}. ประเภท: ${report.type} | ระดับ: ${report.level} | สถานที่: ${report.location?.address || 'ไม่ระบุ'} | รายละเอียด: ${report.description} | วันที่: ${dateLabel} | เวลา: ${timeStr}`;
    }).join('\n');
    
    // สร้าง prompt สำหรับ LLM เดียว
    const prompt = `คุณเป็นผู้เชี่ยวชาญในการตอบคำถามเกี่ยวกับรายงานภัยพิบัติ

      วันที่ปัจจุบัน: ${currentDate}

      ข้อมูลรายงานภัยพิบัติล่าสุด 10 รายการ:
      ${reportsData}

      คำถาม: ${question}

      กรุณาตอบคำถามให้กระชับ สุภาพ และตรงประเด็น โดย:
      1. วิเคราะห์คำถามและเลือกข้อมูลที่เกี่ยวข้อง
      2. จัดกลุ่มข้อมูลตามประเภทภัยพิบัติ (ถ้าจำเป็น)
      3. เน้นย้ำเหตุการณ์ระดับสูงหรือสำคัญ
      4. ให้สถิติที่เกี่ยวข้อง (ถ้ามี)
      5. ตอบกลับเป็นภาษาไทยที่เข้าใจง่าย
      6. ระบุวันที่ให้ชัดเจน (วันนี้, เมื่อวาน, หรือวันที่เฉพาะ)
      7. อย่าขัดแย้งกันเองในการอธิบายวันที่

      คำตอบ:`;
    
    const answer = await callLLM(prompt);
    return answer;
    
  } catch (error) {
    console.error('Error in queryWithAgents:', error);
    return 'ขออภัย เกิดข้อผิดพลาดในการค้นหาข้อมูล';
  }
};

exports.getReportsByType = async function (request, response, next) {
    try {
        const { type } = request.params;
        const querys = { type: type };
        // เรียกผ่าน controller ที่ populate user
        const doc = await Report.onQuerys(querys);
        var resData = await resMsg.onMessage_Response(0,20000);
        resData.data = doc;
        response.status(200).json(resData);
    } catch (err) {
        var resData = await resMsg.onMessage_Response(0,40400);
        response.status(404).json(resData);
    }
};
exports.getReportsByLevel = async function (request, response, next) {
    try {
        const { level } = request.params;
        const querys = { level: level };
        // เรียกผ่าน controller ที่ populate user
        const doc = await Report.onQuerys(querys);
        var resData = await resMsg.onMessage_Response(0,20000);
        resData.data = doc;
        response.status(200).json(resData);
    } catch (err) {
        var resData = await resMsg.onMessage_Response(0,40400);
        response.status(404).json(resData);
    }
};
exports.getReportsByStatus = async function (request, response, next) {
    try {
        const { status } = request.params;
        const querys = { status: status };
        // เรียกผ่าน controller ที่ populate user
        const doc = await Report.onQuerys(querys);
        var resData = await resMsg.onMessage_Response(0,20000);
        resData.data = doc;
        response.status(200).json(resData);
    } catch (err) {
        var resData = await resMsg.onMessage_Response(0,40400);
        response.status(404).json(resData);
    }
};
exports.updateReportStatus = async function (request, response, next) {
    try {
        const { id } = request.params;
        const { status, by } = request.body;
        
        if (!mongo.ObjectId.isValid(id)) {
            const resData = await resMsg.onMessage_Response(0, 40000);
            return response.status(400).json(resData);
        }

        const query = { _id: new mongo.ObjectId(id) };
        const updateData = {
            status: status,
            $push: {
                tracking: {
                    status: status,
                    timeStamps: new Date(),
                    by: by
                }
            }
        };

        const doc = await Report.onUpdate(query, updateData);
        const resData = await resMsg.onMessage_Response(0, 20000);
        resData.data = doc;
        resData.message = 'อัปเดตสถานะสำเร็จ';
        return response.status(200).json(resData);
    } catch (err) {
        const resData = await resMsg.onMessage_Response(0, 40400);
        resData.message = 'ไม่สามารถอัปเดตสถานะได้';
        return response.status(404).json(resData);
    }
};
exports.addMediaToReport = async function (request, response, next) {
    try {
        const { id } = request.params;
        const { media } = request.body;
        
        if (!mongo.ObjectId.isValid(id)) {
            const resData = await resMsg.onMessage_Response(0, 40000);
            return response.status(400).json(resData);
        }

        const query = { _id: new mongo.ObjectId(id) };
        const updateData = {
            $push: { media: { $each: media } }
        };

        const doc = await Report.onUpdate(query, updateData);
        const resData = await resMsg.onMessage_Response(0, 20000);
        resData.data = doc;
        resData.message = 'เพิ่มสื่อสำเร็จ';
        return response.status(200).json(resData);
    } catch (err) {
        const resData = await resMsg.onMessage_Response(0, 40400);
        resData.message = 'ไม่สามารถเพิ่มสื่อได้';
        return response.status(404).json(resData);
    }
};
exports.addAssetsToReport = async function (request, response, next) {
    try {
        const { id } = request.params;
        const { assets } = request.body;
        
        if (!mongo.ObjectId.isValid(id)) {
            const resData = await resMsg.onMessage_Response(0, 40000);
            return response.status(400).json(resData);
        }

        const query = { _id: new mongo.ObjectId(id) };
        const updateData = {
            $push: { assets: { $each: assets } }
        };

        const doc = await Report.onUpdate(query, updateData);
        const resData = await resMsg.onMessage_Response(0, 20000);
        resData.data = doc;
        resData.message = 'เพิ่มทรัพย์สินสำเร็จ';
        return response.status(200).json(resData);
    } catch (err) {
        const resData = await resMsg.onMessage_Response(0, 40400);
        resData.message = 'ไม่สามารถเพิ่มทรัพย์สินได้';
        return response.status(404).json(resData);
    }
};

// Replace the entire assets array for a given report
exports.setAssetsInReport = async function (request, response, next) {
    try {
        const { id } = request.params;
        const { assets } = request.body || {};

        if (!mongo.ObjectId.isValid(id)) {
            const resData = await resMsg.onMessage_Response(0, 40000);
            return response.status(400).json(resData);
        }

        // Normalize assets: keep only { id, amount }
        const normalizedAssets = Array.isArray(assets)
            ? assets.filter(a => a && a.id && typeof a.amount === 'number')
            : [];

        const query = { _id: new mongo.ObjectId(id) };
        const updateData = { $set: { assets: normalizedAssets } };

        const doc = await Report.onUpdate(query, updateData);
        const resData = await resMsg.onMessage_Response(0, 20000);
        resData.data = doc;
        resData.message = 'อัปเดตทรัพย์สินของรายงานสำเร็จ';
        return response.status(200).json(resData);
    } catch (err) {
        const resData = await resMsg.onMessage_Response(0, 40400);
        resData.message = 'ไม่สามารถอัปเดตทรัพย์สินของรายงานได้';
        return response.status(404).json(resData);
    }
};
exports.getReportsByLocation = async function (request, response, next) {
    try {
        const { lat, lng, radius = 10 } = request.query;
        
        if (!lat || !lng) {
            const resData = await resMsg.onMessage_Response(0, 40000);
            resData.message = 'ต้องระบุพิกัด lat และ lng';
            return response.status(400).json(resData);
        }

        const reports = await DisasterReport.find({
            'location.lat': {
                $gte: parseFloat(lat) - (radius / 111), 
                $lte: parseFloat(lat) + (radius / 111)
            },
            'location.lng': {
                $gte: parseFloat(lng) - (radius / 111),
                $lte: parseFloat(lng) + (radius / 111)
            }
        }).sort({ timeStamps: -1 });

        var resData = await resMsg.onMessage_Response(0, 20000);
        resData.data = reports;
        resData.message = 'ดึงข้อมูลรายงานตามพื้นที่สำเร็จ';
        response.status(200).json(resData);
    } catch (err) {
        console.error('Error fetching reports by location:', err);
        var resData = await resMsg.onMessage_Response(0, 40400);
        resData.message = 'ไม่สามารถดึงข้อมูลรายงานตามพื้นที่ได้';
        response.status(500).json(resData);
    }
};



// ====== Time context extraction ======
function extractTimeContext(question) {
  const q = question.toLowerCase();
  const now = new Date();
  let startDate, endDate;
  endDate = new Date(now);
  if (/วันนี้|today/.test(q)) {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return { startDate, endDate };
  }
  if (/เมื่อวาน|yesterday/.test(q)) {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return { startDate, endDate };
  }
  if (/สัปดาห์|week/.test(q)) {
    startDate = new Date(now);
    startDate.setDate(now.getDate() - 7);
    return { startDate, endDate };
  }
  if (/เดือน|month/.test(q)) {
    startDate = new Date(now);
    startDate.setMonth(now.getMonth() - 1);
    return { startDate, endDate };
  }
  // default: 7 วันล่าสุด
  startDate = new Date(now);
  startDate.setDate(now.getDate() - 7);
  return { startDate, endDate };
}

exports.analyzeDisasterReports = async (timeRange = '7d', question = '') => {
  try {
    const { startDate, endDate } = extractTimeContext(question);

    const reports = await DisasterReport.find({
      timeStamps: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ timeStamps: -1 }).limit(50);

    if (reports.length === 0) {
      return "ไม่พบรายงานภัยพิบัติในช่วงเวลาที่กำหนด";
    }

    // ====== AGENT LOGIC ======
    const field = classifyField(question);
    let agentAnswer = null;
    if (field === 'description') {
      agentAnswer = await descriptionAgent(reports, question);
    } else if (field === 'level') {
      agentAnswer = await levelAgent(reports, question);
    } else if (field === 'address') {
      agentAnswer = await addressAgent(reports, question);
    }

    // ====== Fallback LLM เสมอ โดยใช้คำตอบ agent เป็น context ======
    let prompt;
    if (agentAnswer) {
      prompt = `คุณเป็นผู้เชี่ยวชาญในการวิเคราะห์ข้อมูลภัยพิบัติ\n
      คำถาม: ${question}\nข้อมูลที่ได้จากระบบอัตโนมัติ: ${agentAnswer}\n
      ข้อมูลรายงานภัยพิบัติ:\n
      ${formatReports(reports)}\n
      กรุณาตอบคำถามให้กระชับและตรงประเด็น:`;
    } else {
      prompt = `คุณเป็นผู้เชี่ยวชาญในการวิเคราะห์ข้อมูลภัยพิบัติ\n
      คำถาม: ${question}\n
      ข้อมูลรายงานภัยพิบัติ:\n
      ${formatReports(reports)}\n
      กรุณาตอบคำถามให้กระชับและตรงประเด็น:`;
    }
    const answer = await bedrockLLM ? await bedrockLLM(prompt, { maxTokens: 1000, temperature: 0.3 }) : (await (new LLMChain({ llm: ollamaModel, prompt: new PromptTemplate({ template: prompt, inputVariables: [] }) })).call({})).text;
    return answer;
  } catch (error) {
    console.error('Error analyzing disaster reports:', error);
    throw new Error('ไม่สามารถวิเคราะห์ข้อมูลได้');
  }
};

// ==================== VECTOR STORE SERVICE FUNCTIONS ====================

async function upsertDisasterReportsToVectorStore(reports) {
  try {
    console.log('Upserting reports to vector store using REST API...');
    try {
      const schemaResponse = await axios.get(`${WEAVIATE_BASE_URL}/schema`);
      const classes = schemaResponse.data.classes || [];
      const classExists = classes.some(cls => cls.class === WEAVIATE_CLASS_NAME);
      
      if (!classExists) {
        console.log(`${WEAVIATE_CLASS_NAME} class not found - skipping vector embedding`);
        return { success: false, message: 'Class not found' };
      }
      console.log(`${WEAVIATE_CLASS_NAME} class found`);
    } catch (error) {
      console.log('Error checking schema:', error.message);
      return { success: false, message: 'Cannot connect to Weaviate' };
    }
    for (const r of reports) {
      try {
        let vector;
        try {
          vector = await embeddings.embedQuery(r.description);
          console.log(`Generated vector for report ${r._id}`);
        } catch (embedError) {
          console.error(`Error generating vector for report ${r._id}:`, embedError.message);
          console.log('Skipping vector embedding for this report');
          continue; 
        }
        
        // Extract type and level titles
        const typeTitle = r.type?.title?.find(t => t.key === 'th')?.value || 
                         r.type?.title?.[0]?.value || 
                         'ไม่ระบุ';
        const levelTitle = r.level?.title?.find(t => t.key === 'th')?.value || 
                          r.level?.title?.[0]?.value || 
                          'ไม่ระบุ';
        
        const objectData = {
          class: WEAVIATE_CLASS_NAME,
          properties: {
            reportId: r._id?.toString?.() || r.id,
            location: r.location?.coordinates ? `${r.location.coordinates[1]}, ${r.location.coordinates[0]}` : 'ไม่ระบุ',
            type: typeTitle,
            level: levelTitle,
            timeStamps: r.timeStamps ? new Date(r.timeStamps).toISOString() : new Date().toISOString(),
            description: r.description || 'ไม่มีรายละเอียด',
          },
          vector: vector
        };
        
        console.log('Object data to insert:', JSON.stringify(objectData, null, 2));
        
        const response = await axios.post(`${WEAVIATE_BASE_URL}/objects`, objectData, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`Inserted report ${r._id} with object ID: ${response.data.id}`);
      } catch (insertError) {
        console.error(`Error inserting report ${r._id}:`, insertError.message);
      }
    }
    
    console.log(`Embedded ${reports.length} reports to vector store`);
    return { success: true, count: reports.length };
  } catch (error) {
    console.error('Error upserting reports to vector store:', error);
    console.log('Continuing without vector embedding...');
    return { success: false, error: error.message };
  }
}

async function searchDisasterReports(query, topK = 5) {
  try {
    console.log('Searching disaster reports using REST API...');
    
    const vector = await embeddings.embedQuery(query);
    
    const searchData = {
      class: WEAVIATE_CLASS_NAME,
      vector: vector,
      limit: topK
    };
    
    const response = await axios.post(`${WEAVIATE_BASE_URL}/graphql`, {
      query: `
        {
          Get {
            ${WEAVIATE_CLASS_NAME}(
              nearVector: {
                vector: [${vector.join(',')}]
              }
              limit: ${topK}
            ) {
              reportId
              location
              type
              level
              timeStamps
              description
              _additional {
                distance
              }
            }
          }
        }
      `
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const results = response.data.data.Get[WEAVIATE_CLASS_NAME] || [];
    console.log(`Found ${results.length} results`);
    return results;
  } catch (error) {
    console.error('Error searching disaster reports:', error);
    return [];
  }
}

// Export vector store functions
exports.upsertDisasterReportsToVectorStore = upsertDisasterReportsToVectorStore;
exports.searchDisasterReports = searchDisasterReports;

// ==================== VECTOR DB UTILITY FUNCTIONS ====================

// Get all objects from vector database
exports.getAllVectorObjects = async function() {
  try {
    const response = await axios.get(`${WEAVIATE_BASE_URL}/objects?class=${WEAVIATE_CLASS_NAME}`);
    return {
      success: true,
      count: response.data.totalResults,
      objects: response.data.objects || []
    };
  } catch (error) {
    console.error('Error getting vector objects:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get vector database statistics
exports.getVectorDBStats = async function() {
  try {
    const schemaResponse = await axios.get(`${WEAVIATE_BASE_URL}/schema`);
    const objectsResponse = await axios.get(`${WEAVIATE_BASE_URL}/objects?class=${WEAVIATE_CLASS_NAME}`);
    
    return {
      success: true,
      stats: {
        totalClasses: schemaResponse.data.classes?.length || 0,
        disasterReportsCount: objectsResponse.data.totalResults || 0,
        classExists: schemaResponse.data.classes?.some(c => c.class === WEAVIATE_CLASS_NAME) || false
      }
    };
  } catch (error) {
    console.error('Error getting vector DB stats:', error);
    return {
      success: false,
      error: error.message
    };
  }
};



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

/**
 * รวมรายงานภัยพิบัติหลายอันเข้าเป็นกลุ่มเดียวกัน
 * @param {Array<string>} reportIds 
 * @param {Object} options 
 * @returns {Promise<Object>} 
 */
exports.groupReports = async function (reportIds, options = {}) {
  if (!Array.isArray(reportIds) || reportIds.length < 2) {
    throw new Error('ต้องเลือกรายงานอย่างน้อย 2 รายการเพื่อรวมกลุ่ม');
  }
  // สร้างกลุ่มใหม่
  const group = new DisasterReportGroup({
    name: options.name || '',
    description: options.description || '',
    createdBy: options.createdBy || null,
    reports: reportIds
  });
  await group.save();
  await DisasterReport.updateMany(
    { _id: { $in: reportIds } },
    { $set: { groupId: group._id } }
  );
  return group;
};
exports.onQueryGroup = async function (request, response, next) {
  try {
    const { id } = request.params;
    const doc = await DisasterReportGroup.findById(id).populate('reports');
    const resData = await resMsg.onMessage_Response(0, 20000);
    resData.data = doc;
    response.status(200).json(resData);
  } catch (err) {
    const resData = await resMsg.onMessage_Response(0, 40400);
    response.status(404).json(resData);
  }
};

exports.onQueryGroups = async function (request, response, next) {
  try {
    const docs = await DisasterReportGroup.find({}).populate('reports');
    const resData = await resMsg.onMessage_Response(0, 20000);
    resData.data = docs;
    response.status(200).json(resData);
  } catch (err) {
    const resData = await resMsg.onMessage_Response(0, 40400);
    response.status(404).json(resData);
  }
};

exports.onCreateGroup = async function (request, response, next) {
  try {
    const doc = await DisasterReportGroup.create(request.body);
    const resData = await resMsg.onMessage_Response(0, 20000);
    resData.data = doc;
    response.status(200).json(resData);
  } catch (err) {
    const resData = await resMsg.onMessage_Response(0, 40400);
    response.status(404).json(resData);
  }
};

exports.onUpdateGroup = async function (request, response, next) {
  try {
    const { _id, ...update } = request.body;
    const doc = await DisasterReportGroup.findByIdAndUpdate(_id, update, { new: true });
    const resData = await resMsg.onMessage_Response(0, 20000);
    resData.data = doc;
    response.status(200).json(resData);
  } catch (err) {
    const resData = await resMsg.onMessage_Response(0, 40400);
    response.status(404).json(resData);
  }
};

exports.onDeleteGroup = async function (request, response, next) {
  try {
    const { id } = request.body;
    const doc = await DisasterReportGroup.findByIdAndDelete(id);
    await DisasterReport.updateMany({ groupId: id }, { $set: { groupId: null } });
    const resData = await resMsg.onMessage_Response(0, 20000);
    resData.data = doc;
    response.status(200).json(resData);
  } catch (err) {
    const resData = await resMsg.onMessage_Response(0, 40400);
    response.status(404).json(resData);
  }
};

exports.createReportWithDefaultTypeLevelHandler = async function (req, res) {
  try {
    const { description, lat, lng } = req.body;
    const DisasterType = require('../models/disasterType.model');
    const DisasterLevel = require('../models/disasterLevel.model');
    const defaultType = await DisasterType.findOne({ isActive: true });
    const defaultLevel = await DisasterLevel.findOne({ isActive: true });
    if (!defaultType || !defaultLevel) {
      return res.status(500).json({
        success: false,
        message: 'No default disaster type or level found'
      });
    }
    const reportData = {
      description,
      type: defaultType._id,
      level: defaultLevel._id,
      location: {
        type: 'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)]
      },
      status: 'pending'
    };
    const result = await exports.onCreate(reportData);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create report'
    });
  }
};



exports.openCaseHandler = async function (request, response, next) {
    try {
        const reportId = request.params.id;
        const { userName, reason } = request.body;

        if (!userName) {
            return response.status(400).json({
                success: false,
                message: 'ต้องระบุ userName'
            });
        }

        const result = await Report.openCase(reportId, userName, reason);
        
        if (!result) {
            return response.status(404).json({
                success: false,
                message: 'ไม่พบรายงานที่ระบุ'
            });
        }

        return response.status(200).json({
            success: true,
            message: 'เปิดเคสสำเร็จ',
            data: result
        });
    } catch (error) {
        console.error('Error opening case:', error);
        return response.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการเปิดเคส',
            error: error.message
        });
    }
};

exports.closeCaseHandler = async function (request, response, next) {
    try {
        const reportId = request.params.id;
        const { userName, reason } = request.body;

        if (!userName) {
            return response.status(400).json({
                success: false,
                message: 'ต้องระบุ userName'
            });
        }

        const result = await Report.closeCase(reportId, userName, reason);
        
        if (!result) {
            return response.status(404).json({
                success: false,
                message: 'ไม่พบรายงานที่ระบุ'
            });
        }

        return response.status(200).json({
            success: true,
            message: 'ปิดเคสสำเร็จ',
            data: result
        });
    } catch (error) {
        console.error('Error closing case:', error);
        return response.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการปิดเคส',
            error: error.message
        });
    }
};

exports.getCaseHistoryHandler = async function (request, response, next) {
    try {
        const reportId = request.params.id;
        const result = await Report.getCaseHistory(reportId);
        
        if (!result) {
            return response.status(404).json({
                success: false,
                message: 'ไม่พบรายงานที่ระบุ'
            });
        }

        return response.status(200).json({
            success: true,
            data: result.caseManagement
        });
    } catch (error) {
        console.error('Error getting case history:', error);
        return response.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการดึงประวัติเคส',
            error: error.message
        });
    }
};

