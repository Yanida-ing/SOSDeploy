var mongo = require('mongodb');
const Report = require('../controller/report');
const resMsg = require("../../settings/service/message");
const {  LLMChain } = require("langchain/chains");
const { ChatOllama } = require("@langchain/community/chat_models/ollama");
const { PromptTemplate } = require("@langchain/core/prompts");
const { AgentExecutor, createOpenAIFunctionsAgent } = require("langchain/agents");
const DisasterReport = require("../models/report.model");
const DisasterReportGroup = require('../models/DisasterReportGroup.model');
const UserTypeModel = require('../models/userType.model');
// Vector Store Service 
const axios = require('axios');
const { OllamaEmbeddings } = require("@langchain/community/embeddings/ollama");
const rateLimit = require('express-rate-limit');

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



console.log('Using Weaviate REST API directly');
console.log('Weaviate base URL:', WEAVIATE_BASE_URL);

// Initialize Ollama model (for LLMChain use)
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

const embeddings = new OllamaEmbeddings({
  model: "all-minilm",
});

// เพิ่ม import RAG service
const rag = require('./aiservice');
const userTypeModel = require('../models/userType.model');

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

exports.parseDisasterText = async (text) => {
  try {
    // ดึงรายการประเภทภัยพิบัติจาก database (ภาษาไทย)
    const DisasterType = require('../models/disasterType.model');
    const disasterTypes = await DisasterType.find({});
    const typeList = disasterTypes
      .map(t => t.title.find(tt => tt.key === 'th')?.value)
      .filter(Boolean);
    const typeListStr = typeList.map(t => `- ${t}`).join('\n');

    const promptTemplate = `
      คุณเป็นผู้เชี่ยวชาญในการแยกข้อมูลภัยพิบัติจากข้อความ
      กรุณาแยกข้อมูลจากข้อความต่อไปนี้และตอบกลับในรูปแบบ JSON:

      ประเภทภัยพิบัติที่อนุญาตให้เลือก มีดังนี้:
      ${typeListStr}

      ห้ามสร้างชื่อประเภทใหม่ ให้เลือกจากรายการข้างต้นเท่านั้น

      ข้อความ: {text}

      กรุณาตอบกลับในรูปแบบ JSON นี้เท่านั้น:
      {
        "disasterType": "เลือกจากรายการที่ให้เท่านั้น",
        "userType": "ประเภทผู้ใช้ (เช่น: นักเรียน, อาจารย์, ประชาชนทั่วไป,เจ้าหน้าที่)",
        "location": {
          "address": "ที่อยู่เต็ม (เช่น: บ้านเลขที่ 123 หมู่ 4 ต.เวียง อ.เมือง จ.เชียงราย)",
          "coordinates": [longitude, latitude] หรือ null ถ้าไม่มีพิกัด
        },
        "level": "ระดับความรุนแรง (เช่น: ต่ำ, กลาง, สูง, รุนแรง)",
        "reasoning": "เหตุผลที่ทำให้เกิดภัยพิบัติหรือความรุนแรงนั้น",
        "description": "รายละเอียดเพิ่มเติมหรือข้อความเดิม",
        "contact": {
          "name": "ชื่อผู้แจ้ง (ถ้ามีในข้อความ)",
          "phone": "เบอร์โทร (ถ้ามีในข้อความ)"
        }
      }

      หมายเหตุ:
      - ต้องเลือกประเภทภัยพิบัติจากรายการที่ให้เท่านั้น ห้ามสร้างชื่อใหม่
      - ถ้ามีข้อมูลสถานที่หรือที่อยู่ในข้อความ ให้แยก address ออกมาให้ละเอียดที่สุด แม้จะอยู่ในประโยคยาวหรือมีหลายประโยค
      - address ต้องไม่เป็น null ถ้าไม่มีให้ใส่เป็นข้อความว่าง ""
      - ถ้าไม่มีพิกัด ให้ใส่ null ใน coordinates
      - ใช้ข้อความเดิมใน description ถ้าไม่มีรายละเอียดเพิ่มเติม
      - ระบุประเภทภัยพิบัติให้ชัดเจน
      - ประเมินระดับความรุนแรงจากคำที่ใช้ในข้อความ
      - ถ้าพบเบอร์โทรหรือชื่อในข้อความ ให้แยกไปใส่ contact ด้วย
      - ถ้าไม่มี contact ให้ใส่เป็นค่าว่าง
      `;
    let llmResponse;
    if (useBedrock) {
      // Replace {text} in prompt
      const prompt = promptTemplate.replace('{text}', text);
      llmResponse = await bedrockLLM(prompt, { maxTokens: 1000, temperature: 0.3 });
      console.log('Bedrock AI raw response:', llmResponse);
    } else {
      // Use LLMChain as before
      const prompt = new PromptTemplate({
        template: promptTemplate,
        inputVariables: ["text"]
      });
      const chain = new LLMChain({
        llm: ollamaModel,
        prompt: prompt
      });
      const result = await chain.call({ text });
      llmResponse = result.text;
      console.log('Ollama AI raw response:', llmResponse);
    }
    // Parse JSON response
    const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('AI did not return JSON.');
      throw new Error('ไม่สามารถแยกข้อมูลได้');
    }
    const parsedData = JSON.parse(jsonMatch[0]);
    if (!parsedData.disasterType || !parsedData.description) {
      console.error('AI JSON missing disasterType or description:', parsedData);
      throw new Error('ข้อมูลไม่ครบถ้วน');
    }
    // เพิ่ม logic regex backend ดึงเบอร์โทรจาก description ถ้า AI ไม่แยก contact ให้
    if (!parsedData.contact || !parsedData.contact.phone) {
      const phoneMatch = parsedData.description.match(/(0[689]\d{8})/);
      if (phoneMatch) {
        if (!parsedData.contact) {
          parsedData.contact = {};
        }
        parsedData.contact.phone = phoneMatch[1];
      }
    }
    if (!parsedData.contact || !parsedData.contact.name) {
      const nameMatch = parsedData.description.match(/ติดต่อ(?:คุณ)?([\wก-๙ ]{2,})/);
      if (nameMatch) {
        if (!parsedData.contact) {
          parsedData.contact = {};
        }
        parsedData.contact.name = nameMatch[1].trim();
      }
    }
    return parsedData;
  } catch (error) {
    console.error('Error parsing disaster text:', error);
    throw new Error('ไม่สามารถแยกข้อมูลจากข้อความได้');
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


exports.onCreateReport = async function (request, response, next) {
  try {
    let reportData = request.body;

    // Fix: parse media if it's a string
    if (typeof reportData.media === 'string') {
      try {
        reportData.media = JSON.parse(reportData.media);
      } catch (e) {
        reportData.media = [];
      }
    }

    if (request.body.text) {
      console.log('Parsing text input with AI:', request.body.text);
      const parsedData = await exports.parseDisasterText(request.body.text);
      const disasterTypeId = await exports.findMatchingDisasterType(parsedData.disasterType);
      const disasterLevelId = await exports.findMatchingDisasterLevel(parsedData.level);
      let userTypeId = await exports.findMatchingUserType(parsedData.userType);
      const defaultStatusId = await exports.getDefaultStatus();

      console.log('AI userType:', parsedData.userType);
      console.log('userTypeId from DB:', userTypeId);

      // Fallback: ถ้า userTypeId เป็น null หรือ undefined ให้หา default อีกครั้ง
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

      // ใช้ coordinates จาก frontend (browser) ถ้ามี, address ใช้ของ LLM เสมอถ้ามี
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
        coordinates = [0, 0];
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
        user: userTypeId, // ✅ robust & log
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
        media: request.body.media || [],
        contact:
          parsedData.contact && (parsedData.contact.name || parsedData.contact.phone)
            ? {
                ...(parsedData.contact.name !== undefined ? { name: parsedData.contact.name } : {}),
                ...(parsedData.contact.phone !== undefined ? { phone: parsedData.contact.phone } : {}),
                ...(parsedData.contact.email !== undefined ? { email: parsedData.contact.email } : {}),
              }
            : undefined,
        assets: [],
      };
      console.log('Final reportData.user:', reportData.user);
      console.log('Parsed report data:', reportData);
    }

    const result = await Report.onCreateReport(reportData);

    if (result && result._id && WEAVIATE_ENABLED) {
      try {
        const embedResult = await exports.upsertDisasterReportsToVectorStore([result]);
        if (embedResult && embedResult.success) {
          console.log('Report embedded to vector store successfully');
        } else {
          console.log('Vector embedding skipped - collection not available');
        }
      } catch (embedError) {
        console.log('Vector store disabled or not available - skipping embedding');
      }
    }

    var resData = await resMsg.onMessage_Response(0, 20000);
    resData.data = result;
    resData.message = 'บันทึกข้อมูลสำเร็จ';
    response.status(200).json(resData);
  } catch (err) {
    console.error('Error creating disaster report:', err);
    var resData = await resMsg.onMessage_Response(0, 40400);
    resData.message = err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
    response.status(500).json(resData);
  }
};

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
                $gte: parseFloat(lat) - (radius / 111), // 1 degree ≈ 111 km
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

// ลบ analyzeReports ที่ใช้ openAIModel ออก (ถ้าต้องการ LLM summary ให้ใช้ bedrockLLM หรือ ollamaModel ผ่าน LLMChain แทน)
exports.analyzeReports = async (reports) => {
  return "ฟังก์ชันนี้ถูกปิดการใช้งาน (ใช้ bedrock หรือ ollama LLM โดยตรงแทน)";
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

const agents = {
  reader: {
    name: "reader_agent",
    description: "อ่านและสรุปข้อมูลรายงานภัยพิบัติ",
    func: async (reports, question) => {
      const prompt = new PromptTemplate({
        template: `คุณเป็นผู้เชี่ยวชาญในการอ่านและสรุปข้อมูลภัยพิบัติ
        หน้าที่ของคุณคืออ่านรายงานภัยพิบัติและตอบคำถามให้ตรงประเด็น

        คำถาม: {question}

        ข้อมูลรายงานภัยพิบัติ:
        {reports}

        กรุณาตอบคำถามให้กระชับและตรงประเด็น:`,
        inputVariables: ["reports", "question"]
      });

      if (useBedrock) {
        // Use Bedrock LLM
        const promptStr = prompt.template
          .replace('{reports}', formatReports(reports))
          .replace('{question}', question);
        return await bedrockLLM(promptStr, { maxTokens: 1000, temperature: 0.3 });
      } else {
        const chain = new LLMChain({
          llm: ollamaModel,
          prompt: prompt
        });
        const result = await chain.call({
          reports: formatReports(reports),
          question: question
        });
        return result.text;
      }
    }
  },

  analyzer: {
    name: "analyzer_agent",
    description: "วิเคราะห์แนวโน้มและรูปแบบของภัยพิบัติ",
    func: async (reports, question) => {
      const prompt = new PromptTemplate({
        template: `คุณเป็นผู้เชี่ยวชาญในการวิเคราะห์แนวโน้มภัยพิบัติ
        หน้าที่ของคุณคือวิเคราะห์รูปแบบและแนวโน้มของภัยพิบัติ

        คำถาม: {question}

        ข้อมูลรายงานภัยพิบัติ:
        {reports}

        กรุณาวิเคราะห์และตอบคำถามให้กระชับ:`,
        inputVariables: ["reports", "question"]
      });

      if (useBedrock) {
        const promptStr = prompt.template
          .replace('{reports}', formatReports(reports))
          .replace('{question}', question);
        return await bedrockLLM(promptStr, { maxTokens: 1000, temperature: 0.3 });
      } else {
        const chain = new LLMChain({
          llm: ollamaModel,
          prompt: prompt
        });
        const result = await chain.call({
          reports: formatReports(reports),
          question: question
        });
        return result.text;
      }
    }
  },

  advisor: {
    name: "advisor_agent",
    description: "ให้คำแนะนำในการป้องกันและรับมือกับภัยพิบัติ",
    func: async (reports, question) => {
      const prompt = new PromptTemplate({
        template: `คุณเป็นผู้เชี่ยวชาญในการให้คำแนะนำเกี่ยวกับภัยพิบัติ
        หน้าที่ของคุณคือให้คำแนะนำในการป้องกันและรับมือกับภัยพิบัติ

        คำถาม: {question}

        ข้อมูลรายงานภัยพิบัติ:
        {reports}

        กรุณาให้คำแนะนำที่กระชับและตรงประเด็น:`,
        inputVariables: ["reports", "question"]
      });

      if (useBedrock) {
        const promptStr = prompt.template
          .replace('{reports}', formatReports(reports))
          .replace('{question}', question);
        return await bedrockLLM(promptStr, { maxTokens: 1000, temperature: 0.3 });
      } else {
        const chain = new LLMChain({
          llm: ollamaModel,
          prompt: prompt
        });
        const result = await chain.call({
          reports: formatReports(reports),
          question: question
        });
        return result.text;
      }
    }
  }
};

// Create the main agent that coordinates other agents
const createMainAgent = async () => {
  const tools = Object.values(agents).map(agent => ({
    name: agent.name,
    description: agent.description,
    func: agent.func
  }));

  const prompt = new PromptTemplate({
    template: `คุณเป็นผู้ประสานงานในการวิเคราะห์ข้อมูลภัยพิบัติ
    หน้าที่ของคุณคือประสานงานกับผู้เชี่ยวชาญแต่ละด้านเพื่อตอบคำถามให้ตรงประเด็น

    คำถาม: {question}

    ข้อมูลรายงานภัยพิบัติ:
    {reports}

    กรุณาประสานงานกับผู้เชี่ยวชาญเพื่อตอบคำถามให้กระชับและตรงประเด็น:
    {agent_scratchpad}`,
    inputVariables: ["reports", "question", "agent_scratchpad"]
  });

  if (useBedrock) {
    // Not supported: createOpenAIFunctionsAgent with Bedrock (custom agent logic needed)
    // For now, fallback to single bedrockLLM call
    return null;
  } else {
    return await createOpenAIFunctionsAgent({
      llm: ollamaModel,
      tools: tools,
      prompt: prompt
    });
  }
};

// Main function to analyze disaster reports
exports.analyzeDisasterReports = async (timeRange = '7d', question = '') => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const reports = await DisasterReport.find({
      timeStamps: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ timeStamps: -1 }).limit(10);

    if (reports.length === 0) {
      return "ไม่พบรายงานภัยพิบัติในช่วงเวลาที่กำหนด";
    }

    const mainAgent = await createMainAgent();
    if (useBedrock || !mainAgent) {
      // Fallback: single bedrockLLM call (no agent tool coordination)
      const prompt = `คุณเป็นผู้เชี่ยวชาญในการวิเคราะห์ข้อมูลภัยพิบัติ\nคำถาม: ${question}\nข้อมูลรายงานภัยพิบัติ:\n${formatReports(reports)}\nกรุณาตอบคำถามให้กระชับและตรงประเด็น:`;
      return await bedrockLLM(prompt, { maxTokens: 1000, temperature: 0.3 });
    } else {
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
    }
  } catch (error) {
    console.error('Error analyzing disaster reports:', error);
    throw new Error('ไม่สามารถวิเคราะห์ข้อมูลได้');
  }
};

// Function to get specific insights about a disaster type
exports.getDisasterTypeInsights = async (disasterType, question = '') => {
  try {
    const reports = await DisasterReport.find({
      type: disasterType
    }).sort({ timeStamps: -1 }).limit(10);

    if (reports.length === 0) {
      return `ไม่พบรายงานเกี่ยวกับภัยพิบัติประเภท ${disasterType}`;
    }

    const mainAgent = await createMainAgent();
    if (useBedrock || !mainAgent) {
      const prompt = `คุณเป็นผู้เชี่ยวชาญในการวิเคราะห์ข้อมูลภัยพิบัติประเภท ${disasterType}\nคำถาม: ${question}\nข้อมูลรายงานภัยพิบัติ:\n${formatReports(reports)}\nกรุณาตอบคำถามให้กระชับและตรงประเด็น:`;
      return await bedrockLLM(prompt, { maxTokens: 1000, temperature: 0.3 });
    } else {
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
    }
  } catch (error) {
    console.error('Error getting disaster type insights:', error);
    throw new Error('ไม่สามารถวิเคราะห์ข้อมูลได้');
  }
};

// ==================== VECTOR STORE SERVICE FUNCTIONS ====================

// Removed automatic class creation - class must be created manually in Weaviate

async function upsertDisasterReportsToVectorStore(reports) {
  try {
    console.log('Upserting reports to vector store using REST API...');
    
    // Check if class exists
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

const reportLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 นาที
  max: 3, // 3 requests ต่อ window ต่อ IP
  message: 'คุณแจ้งรายงานบ่อยเกินไป กรุณารอสักครู่'
});

// Export vector store functions
exports.upsertDisasterReportsToVectorStore = upsertDisasterReportsToVectorStore;
exports.searchDisasterReports = searchDisasterReports;
exports.reportLimiter = reportLimiter;

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

// ==================== EMBED ALL REPORTS FUNCTION ====================

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
 * @param {Array<string>} reportIds - รายการ _id ของรายงานที่ต้องการรวม
 * @param {Object} options - { name, description, createdBy }
 * @returns {Promise<Object>} group document
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

exports.groupReportsRouteHandler = (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented: groupReportsRouteHandler' });
};
exports.analyzeDisasterReportsRouteHandler = (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented: analyzeDisasterReportsRouteHandler' });
};
exports.embedAllReportsRouteHandler = (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented: embedAllReportsRouteHandler' });
};
exports.searchDisasterReportsRouteHandler = (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented: searchDisasterReportsRouteHandler' });
};

// Update only contact info by report ID
exports.updateContact = async function (request, response, next) {
  try {
    const { id } = request.params;
    const { contact } = request.body;
    const { ObjectId } = require('mongodb');
    console.log('updateContact called', { id, contact });
    if (!id || !contact) {
      response.statusCode = 400;
      return response.json({ success: false, message: 'Missing id or contact' });
    }
    if (!ObjectId.isValid(id)) {
      response.statusCode = 400;
      return response.json({ success: false, message: 'Invalid id format' });
    }
    const updated = await DisasterReport.findByIdAndUpdate(
      id,
      { contact },
      { new: true }
    );
    if (!updated) {
      response.statusCode = 404;
      return response.json({ success: false, message: 'Report not found' });
    }
    response.statusCode = 200;
    response.json({ success: true, data: updated });
  } catch (err) {
    console.error('updateContact error:', err);
    response.statusCode = 500;
    response.json({ success: false, message: err.message });
  }
};