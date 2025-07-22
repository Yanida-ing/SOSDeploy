var mongo = require('mongodb');
var Chat = require('../controller/chat');
const resMsg = require("../../settings/service/message");
const ChatMessage = require('../models/chat.model');
const rag = require('./aiservice');
const reportService = require('../../report/service/report');

exports.getChatHistory = async (userId) => {
  try {
    const messages = await ChatMessage.find({ userId }).sort({ createdAt: 1 });
    return { success: true, messages };
  } catch (error) {
    console.error('Error getting chat history:', error);
    return { success: false, error: 'Failed to get chat history' };
  }
};

exports.processMessage = async (userId, message) => {
  try {
    console.log(`💬 เริ่มประมวลผลข้อความจากผู้ใช้: ${userId}`);
    
    // Save user message
    const userMsg = new ChatMessage({ userId, role: 'user', text: message });
    await userMsg.save();
    console.log('✅ บันทึกข้อความผู้ใช้สำเร็จ');

    // Intent: ถามเกี่ยวกับการรวมกลุ่มรายงาน
    if (/รวม(เคส|กลุ่ม|case|group)|ควร(รวม|จัดกลุ่ม)/i.test(message)) {
      // เรียก suggestGroups (AI reasoning & suggest)
      // mock request/response object for service
      const req = { query: { useContent: 'true', contentSim: '0.7' } };
      let aiReply = '';
      await reportService.suggestGroups(req, {
        status: (code) => ({
          json: (data) => {
            if (data.groups && data.groups.length > 0) {
              aiReply = 'AI แนะนำให้รวมรายงานดังนี้:\n';
              data.groups.forEach((g, idx) => {
                aiReply += `กลุ่ม ${idx + 1}: ${g.reportIds.join(', ')}\nเหตุผล: ${g.reason}\n\n`;
              });
            } else {
              aiReply = 'AI ไม่พบกลุ่มรายงานที่ควรรวมกันในขณะนี้';
            }
          }
        })
      }, null);
      // Save AI response
      const aiMsg = new ChatMessage({ userId, role: 'ai', text: aiReply });
      await aiMsg.save();
      return { success: true, response: aiReply };
    }

    // Default: ใช้ฟังก์ชัน AI เดิม
    const chatHistoryDocs = await ChatMessage.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)  // ลดลงเหลือ 5 ข้อความล่าสุด
      .lean();
    
    console.log(`📚 พบประวัติการสนทนา ${chatHistoryDocs.length} ข้อความ`);

    // ใช้ฟังก์ชันใหม่ที่รวม Classifier Agent
    const aiResponse = await rag.processUserMessage(message);
    
    console.log('🤖 ได้รับการตอบกลับจาก AI');

    // Save AI response
    const aiMsg = new ChatMessage({ userId, role: 'ai', text: aiResponse });
    await aiMsg.save();
    console.log('✅ บันทึกการตอบกลับของ AI สำเร็จ');

    return { success: true, response: aiResponse };

  } catch (error) {
    console.error('❌ Error in processMessage:', error);
    return { 
      success: false, 
      error: 'เกิดข้อผิดพลาดในการประมวลผลข้อความ',
      details: error.message 
    };
  }
};

exports.getChatHistoryService = async function (request, response, next) {
    try {
        const { userId } = request.params;
        const result = await exports.getChatHistory(userId);
        
        if (result.success) {
            var resData = await resMsg.onMessage_Response(0, 20000);
            resData.data = result.messages;
            response.status(200).json(resData);
        } else {
            var resData = await resMsg.onMessage_Response(0, 40400);
            response.status(500).json(resData);
        }
    } catch (err) {
        var resData = await resMsg.onMessage_Response(0, 40400);
        response.status(500).json(resData);
    }
};

exports.sendMessageService = async function (request, response, next) {
    try {
        const { userId, message } = request.body;

        if (!userId || !message) {
            var resData = await resMsg.onMessage_Response(0, 40000);
            resData.message = 'Missing userId or message';
            return response.status(400).json(resData);
        }

        const result = await exports.processMessage(userId, message);
        
        if (result.success) {
            var resData = await resMsg.onMessage_Response(0, 20000);
            resData.data = { response: result.response };
            response.status(200).json(resData);
        } else {
            var resData = await resMsg.onMessage_Response(0, 40400);
            resData.message = result.error;
            response.status(500).json(resData);
        }
    } catch (err) {
        var resData = await resMsg.onMessage_Response(0, 40400);
        response.status(500).json(resData);
    }
};

exports.onQuery = async function (request, response, next) {
    try {
        var querys = {};
        if (request.params && request.params.id) {
            querys._id = request.params.id;
        }
        const doc = await Chat.onQuery(querys);
        var resData = await resMsg.onMessage_Response(0,20000)
        resData.data = doc
        response.status(200).json(resData);
    } catch (err) {
        var resData = await resMsg.onMessage_Response(0,40400)
        response.status(404).json(resData);
    }
};

exports.onQuerys = async function (request, response, next) {
    try {
        var querys = {};
        if (request.query) {
            querys = { ...querys, ...request.query };
        }
        const doc = await Chat.onQuerys(querys);
        var resData = await resMsg.onMessage_Response(0,20000)
        resData.data = doc
        response.status(200).json(resData);
    } catch (err) {
        var resData = await resMsg.onMessage_Response(0,40400)
        response.status(404).json(resData);
    }
};

exports.onCreate = async function (request, response, next) {
    try {
        const doc = await Chat.onCreate(request.body);
        var resData = await resMsg.onMessage_Response(0,20000)
        resData.data = doc
        response.status(200).json(resData);
    } catch (err) {
        var resData = await resMsg.onMessage_Response(0,40400)
        response.status(404).json(resData);
    }
};

exports.onUpdate = async function (request, response, next) {
    try {
        var query = {}
        query._id = new mongo.ObjectId(request.body._id);
        const doc = await Chat.onUpdate(query, request.body);
        var resData = await resMsg.onMessage_Response(0,20000)
        resData.data = doc
        response.status(200).json(resData);
    } catch (err) {
        var resData = await resMsg.onMessage_Response(0,40400)
        response.status(404).json(resData);
    }
};

exports.onDelete = async function (request, response, next) {
    try {
        var query = {};
        query._id = new mongo.ObjectId(request.body.id)
        const doc = await Chat.onDelete(query);
        var resData = await resMsg.onMessage_Response(0,20000)
        resData.data = doc
        response.status(200).json(resData);
    } catch (err) {
        var resData = await resMsg.onMessage_Response(0,40400)
        response.status(404).json(resData);
    }
};
