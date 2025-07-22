const express = require('express');
const router = express.Router();
const assets = require("./service/assets");
const category = require("./service/category");
const subtype = require("./service/subtype");


router.get("/assets/:id", assets.onQuery);
router.get("/assets", assets.onQuerys);
router.post("/assets", assets.onCreate );
router.put("/assets", assets.onUpdate);
router.delete("/assets", assets.onDelete);

router.get("/category/:id", category.onQuery);
router.get("/category", category.onQuerys);
router.post("/category", category.onCreate );
router.put("/category", category.onUpdate);
router.delete("/category", category.onDelete);

router.get("/subtype/:id", subtype.onQuery);
router.get("/subtype", subtype.onQuerys);
router.post("/subtype", subtype.onCreate );
router.put("/subtype", subtype.onUpdate);
router.delete("/subtype", subtype.onDelete);

module.exports = router;