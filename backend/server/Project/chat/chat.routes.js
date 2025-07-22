const express = require('express');
const router = express.Router();

const chat = require("./service/chat");

router.post("/chat", chat.sendMessageService);
router.get("/history/:userId", chat.getChatHistoryService);
router.get("/message", chat.onQuerys);
router.post("/message", chat.onCreate);
router.put("/message", chat.onUpdate);
router.delete("/message", chat.onDelete);

module.exports = router;
