const express = require('express');
const router = express.Router();

const message = require("./service/message");
const status = require("./service/campus");
const verification = require("./service/verification");

router.get("/message", message.onQuerys);
router.post("/message", message.onCreate);
router.put("/message", message.onUpdate);
router.delete("/message", message.onDelete);

router.get("/status", status.onQuerys);
router.post("/status", status.onCreate);
router.put("/status", status.onUpdate);
router.delete("/status", status.onDelete);

router.get("/verification", verification.onQuerys);
router.post("/verification", verification.onCreate);
router.put("/verification", verification.onUpdate);
router.delete("/verification", verification.onDelete);

module.exports = router;
