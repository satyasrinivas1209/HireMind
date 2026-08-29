const express = require("express");
const router = express.Router();
const { predictAttritionHandler, chatbotHandler } = require("../controllers/hrController");
const protect = require("../middleware/auth");

router.use(protect);

router.post("/predict-attrition", predictAttritionHandler);
router.post("/chatbot", chatbotHandler);

module.exports = router;
