const { predictAttrition, chatbotQuery } = require("../utils/mlClient");

// POST /api/hr/predict-attrition
const predictAttritionHandler = async (req, res) => {
  try {
    const { age, monthlyIncome, yearsAtCompany, jobSatisfaction } = req.body;

    if (
      age === undefined ||
      monthlyIncome === undefined ||
      yearsAtCompany === undefined ||
      jobSatisfaction === undefined
    ) {
      return res.status(400).json({
        message: "Age, monthly income, years at company, and job satisfaction are required.",
      });
    }

    const values = [age, monthlyIncome, yearsAtCompany, jobSatisfaction].map(Number);
    if (values.some((value) => !Number.isFinite(value))) {
      return res.status(400).json({ message: "All attrition values must be valid numbers." });
    }

    if (values[0] < 18 || values[0] > 100 || values[1] < 0 || values[2] < 0 || values[3] < 1 || values[3] > 5) {
      return res.status(400).json({ message: "Job satisfaction must be between 1 and 5." });
    }

    const result = await predictAttrition({
      age: values[0],
      monthlyIncome: values[1],
      yearsAtCompany: values[2],
      jobSatisfaction: values[3],
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error("[predictAttrition] error:", err.message);
    return res.status(502).json({
      message: "The attrition prediction service is currently unavailable. Please try again shortly.",
    });
  }
};

// POST /api/hr/chatbot
const chatbotHandler = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: "A message is required." });
    }

    const result = await chatbotQuery(message);
    return res.status(200).json(result);
  } catch (err) {
    console.error("[chatbot] error:", err.message);
    return res.status(502).json({
      message: "The HR assistant is temporarily unavailable. Please try again shortly.",
    });
  }
};

module.exports = { predictAttritionHandler, chatbotHandler };
