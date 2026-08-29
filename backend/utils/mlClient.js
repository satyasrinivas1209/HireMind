const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

const ML_BASE_URL = process.env.ML_SERVICE_URL || "http://localhost:5001";
const ML_API_KEY = process.env.ML_SERVICE_API_KEY;

const mlHeaders = () => ({ "x-internal-api-key": ML_API_KEY });

// Sends a resume PDF + job context to the Flask /parse endpoint.
const parseResume = async (filePath, job) => {
  const form = new FormData();
  form.append("resume", fs.createReadStream(filePath));
  form.append("jobTitle", job.title);
  form.append("requiredSkills", JSON.stringify(job.requiredSkills));

  const response = await axios.post(`${ML_BASE_URL}/parse`, form, {
    headers: { ...form.getHeaders(), ...mlHeaders() },
    timeout: 30000,
  });

  return response.data;
};

const predictAttrition = async (payload) => {
  const response = await axios.post(`${ML_BASE_URL}/predict-attrition`, payload, {
    headers: mlHeaders(),
    timeout: 15000,
  });
  return response.data;
};

const chatbotQuery = async (message) => {
  const response = await axios.post(
    `${ML_BASE_URL}/chatbot`,
    { message },
    { headers: mlHeaders(), timeout: 10000 }
  );
  return response.data;
};

module.exports = { parseResume, predictAttrition, chatbotQuery };
