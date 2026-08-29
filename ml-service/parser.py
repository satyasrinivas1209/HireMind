"""
Resume parsing utilities for HireMind.

Uses PyPDF2 for text extraction and regex/keyword-based logic for
skill, experience, and education extraction. This is intentionally
NOT an LLM-based system -- see project README for transparency notes.
"""

import os
import re
import PyPDF2

# Known skill vocabulary. Matching is case-insensitive and substring/word-boundary based.
KNOWN_SKILLS = [
    "Python", "Java", "C++", "C#", "JavaScript", "TypeScript", "React", "Angular",
    "Vue", "Node", "Node.js", "Express", "Django", "Flask", "Machine Learning",
    "Deep Learning", "SQL", "MongoDB", "PostgreSQL", "MySQL", "Docker", "Kubernetes",
    "AWS", "Azure", "GCP", "Data Analysis", "Data Science", "HTML", "CSS", "SASS",
    "TensorFlow", "Keras", "PyTorch", "Pandas", "NumPy", "scikit-learn", "Git",
    "CI/CD", "Linux", "REST API", "GraphQL", "Redux", "Tailwind", "Bootstrap",
    "Agile", "Scrum", "Jira", "Excel", "Power BI", "Tableau", "R", "Go", "Rust",
    "Swift", "Kotlin", "PHP", "Ruby", "Rails", "Spring Boot", "Microservices",
    "NLP", "Computer Vision", "ETL", "Spark", "Hadoop", "Kafka",
]


def extract_text_from_pdf(file_path: str) -> str:
    """Extracts raw text from a PDF using PyPDF2. Raises ValueError if empty/unreadable."""
    text_chunks = []
    try:
        with open(file_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            if reader.is_encrypted:
                try:
                    reader.decrypt("")
                except Exception:
                    raise ValueError("PDF is encrypted and could not be read.")
            for page in reader.pages:
                page_text = page.extract_text() or ""
                text_chunks.append(page_text)
    except PyPDF2.errors.PdfReadError as e:
        raise ValueError(f"Corrupt or unreadable PDF file: {e}")

    full_text = "\n".join(text_chunks).strip()
    if not full_text:
        raise ValueError("No extractable text found in PDF (it may be a scanned image).")

    return full_text


def extract_skills(text: str) -> list:
    """Case-insensitive keyword matching against KNOWN_SKILLS, deduplicated, order-preserving."""
    text_lower = text.lower()
    found = []
    seen = set()

    for skill in KNOWN_SKILLS:
        skill_lower = skill.lower()
        # Word-boundary-ish match so "R" doesn't match inside "Rails" incorrectly, etc.
        pattern = r"(?<![a-zA-Z0-9])" + re.escape(skill_lower) + r"(?![a-zA-Z0-9])"
        if re.search(pattern, text_lower):
            if skill_lower not in seen:
                found.append(skill)
                seen.add(skill_lower)

    return found


EXPERIENCE_PATTERNS = [
    r"(\d+(?:\.\d+)?)\+?\s*(?:years|yrs)\s+of\s+experience",
    r"(\d+(?:\.\d+)?)\+?\s*(?:years|yrs)\s+experience",
    r"experience\s*[:\-]?\s*(\d+(?:\.\d+)?)\+?\s*(?:years|yrs)",
    r"(\d+(?:\.\d+)?)\+?\s*(?:years|yrs)",
]


def extract_experience(text: str) -> str:
    """Finds the largest plausible years-of-experience mention in the resume text."""
    text_lower = text.lower()
    candidates = []

    for pattern in EXPERIENCE_PATTERNS:
        for match in re.finditer(pattern, text_lower):
            try:
                value = float(match.group(1))
                if 0 < value <= 50:
                    candidates.append(value)
            except (ValueError, IndexError):
                continue

    if not candidates:
        return "Not specified"

    years = max(candidates)
    if years == int(years):
        years = int(years)

    return f"{years} years"


EDUCATION_KEYWORDS = [
    "Bachelor's degree", "Bachelor of Science", "Bachelor of Engineering",
    "Bachelor of Technology", "Master's degree", "Master of Science",
    "Master of Engineering", "Master of Technology", "B.Tech", "M.Tech",
    "B.E.", "M.E.", "B.Sc", "M.Sc", "BCA", "MCA", "MBA", "PhD", "Ph.D",
    "Computer Science", "Information Technology", "Software Engineering",
    "Electronics", "Electrical Engineering", "Data Science",
]


def extract_education(text: str) -> list:
    """Detects education-related phrases, deduplicated, order-preserving."""
    found = []
    seen = set()

    for keyword in EDUCATION_KEYWORDS:
        pattern = r"(?<![a-zA-Z0-9])" + re.escape(keyword.lower()) + r"(?![a-zA-Z0-9])"
        if re.search(pattern, text.lower()):
            if keyword.lower() not in seen:
                found.append(keyword)
                seen.add(keyword.lower())

    return found


def extract_email(text: str) -> str:
    """Extracts email address from resume text, returning empty string if not found."""
    match = re.search(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", text)
    return match.group(0) if match else ""


def extract_phone(text: str) -> str:
    """Extracts phone number from resume text, returning empty string if not found."""
    match = re.search(r"(\+?\d{1,4}[-.\s]?)?\(?\d{2,5}\)?[-.\s]?\d{3,5}[-.\s]?\d{3,5}", text)
    if match and len(re.sub(r"\D", "", match.group(0))) >= 7:
        return match.group(0).strip()
    return ""


def extract_name(text: str, file_name: str = "") -> str:
    """Extracts candidate name from top lines of text, or formats the filename as fallback."""
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    for line in lines[:5]:
        if "@" in line or "http" in line or re.search(r"\d{5,}", line):
            continue
        words = line.split()
        if 1 <= len(words) <= 4 and all(w.isalpha() or w.replace(".", "").isalpha() for w in words):
            return " ".join(words).title()

    if file_name:
        base = os.path.basename(file_name)
        base_no_ext = os.path.splitext(base)[0]
        cleaned = re.sub(r"(?i)\b(resume|cv|profile|document|final)\b", "", base_no_ext)
        cleaned = re.sub(r"[_\-\.]+", " ", cleaned).strip()
        cleaned = re.sub(r"\s+", " ", cleaned)
        if cleaned:
            return cleaned.title()

    return "Candidate"
