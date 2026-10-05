import os
import json
import tempfile
from functools import wraps

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from parser import (
    extract_text_from_pdf,
    extract_skills,
    extract_experience,
    extract_education,
    extract_email,
    extract_phone,
    extract_name,
)
from matcher import calculate_match_score
from attrition import predict as predict_attrition, get_model as get_attrition_model
from chatbot import get_response as chatbot_response

load_dotenv()

app = Flask(__name__)
CORS(app)

API_KEY = os.environ.get("ML_SERVICE_API_KEY")

# Warm up the attrition model at startup so the first prediction request isn't slow.
get_attrition_model()


def require_api_key(f):
    """Protects internal endpoints so only the HireMind backend can call this service."""

    @wraps(f)
    def wrapper(*args, **kwargs):
        provided_key = request.headers.get("x-internal-api-key")
        if not API_KEY or provided_key != API_KEY:
            return jsonify({"message": "Unauthorized: invalid or missing internal API key."}), 401
        return f(*args, **kwargs)

    return wrapper


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "hiremind-ml-service"})


@app.route("/parse", methods=["POST"])
@require_api_key
def parse_resume():
    if "resume" not in request.files:
        return jsonify({"message": "No resume file was provided."}), 400

    file = request.files["resume"]
    if file.filename == "":
        return jsonify({"message": "No resume file was selected."}), 400
    if not file.filename.lower().endswith(".pdf"):
        return jsonify({"message": "Only PDF files are supported."}), 400

    job_title = request.form.get("jobTitle", "")
    try:
        required_skills = json.loads(request.form.get("requiredSkills", "[]"))
    except json.JSONDecodeError:
        required_skills = []

    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            file.save(tmp.name)
            tmp_path = tmp.name

        resume_text = extract_text_from_pdf(tmp_path)
    except ValueError as e:
        return jsonify({"message": str(e)}), 422
    except Exception as e:
        return jsonify({"message": f"Failed to process PDF: {e}"}), 500
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)

    skills = extract_skills(resume_text)
    experience = extract_experience(resume_text)
    education = extract_education(resume_text)
    candidate_name = extract_name(resume_text, file.filename)
    email = extract_email(resume_text)
    phone = extract_phone(resume_text)

    match_result = calculate_match_score(resume_text, skills, required_skills)

    return jsonify(
        {
            "candidateName": candidate_name,
            "email": email,
            "phone": phone,
            "skills": skills,
            "experience": experience,
            "education": education,
            "matchScore": match_result["matchScore"],
            "explicitScore": match_result["explicitScore"],
            "tfidfScore": match_result["tfidfScore"],
            "jobTitle": job_title,
        }
    )


@app.route("/predict-attrition", methods=["POST"])
@require_api_key
def attrition_endpoint():
    data = request.get_json(silent=True) or {}
    required_fields = ["age", "monthlyIncome", "yearsAtCompany", "jobSatisfaction"]

    missing = [f for f in required_fields if f not in data]
    if missing:
        return jsonify({"message": f"Missing required fields: {', '.join(missing)}"}), 400

    try:
        result = predict_attrition(
            age=float(data["age"]),
            monthly_income=float(data["monthlyIncome"]),
            years_at_company=float(data["yearsAtCompany"]),
            job_satisfaction=int(data["jobSatisfaction"]),
        )
        return jsonify(result)
    except (ValueError, TypeError) as e:
        return jsonify({"message": f"Invalid input values: {e}"}), 400


@app.route("/chatbot", methods=["POST"])
@require_api_key
def chatbot_endpoint():
    data = request.get_json(silent=True) or {}
    message = data.get("message", "").strip()

    if not message:
        return jsonify({"message": "A message is required."}), 400

    reply = chatbot_response(message)
    return jsonify({"reply": reply})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
