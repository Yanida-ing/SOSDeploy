const express = require('express');
const router = express.Router();

const reportService = require("./service/report");
const resMsg = require("../settings/service/message");
const disasterTypeService = require('./service/disasterType');
const disasterLevelService = require('./service/disasterLevel');
const userType = require('./service/userType');
const statusService = require('./service/status');
const aiService = require('./service/aiservice');

// ===== CRUD userType =====
router.get('/usertype', userType.onQuerys);
router.post('/usertype', userType.onCreate);
router.put('/usertype', userType.onUpdate);
router.delete('/usertype', userType.onDelete);
router.get('/usertype/:id', userType.onQuery);

// ===== CRUD DisasterType =====
router.get('/type', disasterTypeService.onQuerys);
router.post('/type', disasterTypeService.onCreate);
router.put('/type', disasterTypeService.onUpdate);
router.delete('/type', disasterTypeService.onDelete);
router.get('/type/:id', disasterTypeService.onQuery);


// ===== CRUD DisasterLevel =====
router.get('/level', disasterLevelService.onQuerys);
router.post('/level', disasterLevelService.onCreate);
router.put('/level', disasterLevelService.onUpdate);
router.delete('/level', disasterLevelService.onDelete);
router.get('/level/:id', disasterLevelService.onQuery);


// ===== CRUD Status =====
router.get('/status', statusService.onQuerys);
router.post('/status', statusService.onCreate);
router.put('/status', statusService.onUpdate);
router.delete('/status', statusService.onDelete);
router.get('/status/:id', statusService.onQuery);

// POST /default สำหรับสร้าง report แบบ default type/level
router.post("/default", reportService.createReportWithDefaultTypeLevelHandler);

// Report CRUD routes
router.get("/", reportService.onQuerys);
router.get("/:id", reportService.onQuery);
router.post("/", reportService.onCreate);
router.put("/", reportService.onUpdate);
router.delete("/", reportService.onDelete);


// New route for text-based disaster reporting
router.post("/report", reportService.onCreateReport);

// CRUD routes
router.get("/type/:type", reportService.getReportsByType);
router.get("/level/:level", reportService.getReportsByLevel);
router.get("/status/:status", reportService.onQuerys);
router.get("/location/search", reportService.onQuerys);

// Update operations
router.put("/:id/status", reportService.onUpdate);
router.put("/:id/media", reportService.onUpdate);
router.put("/:id/assets", reportService.setAssetsInReport);

// CRUD DisasterReportGroup 
router.get('/group/:id', reportService.onQueryGroup);
router.get('/groups', reportService.onQueryGroups);
router.post('/group/create', reportService.onCreateGroup);
router.put('/group/update', reportService.onUpdateGroup);
router.delete('/group/delete', reportService.onDeleteGroup);
router.get('/group/suggest', aiService.suggestGroups);

// Case Management routes
router.post('/:id/open', reportService.openCaseHandler);
router.post('/:id/close', reportService.closeCaseHandler);
router.get('/:id/case-history', reportService.getCaseHistoryHandler);


module.exports = router;


