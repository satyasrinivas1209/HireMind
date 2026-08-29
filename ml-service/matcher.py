"""
Candidate-job matching logic for HireMind.

Combines two signals into a single 0-100 match score:
  1. Explicit skill match (70% weight) -- matched required skills / total required skills
  2. TF-IDF cosine similarity (30% weight) -- resume text vs. job required skills text
"""

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def explicit_skill_match(resume_skills: list, required_skills: list) -> float:
    """Returns 0-100: percentage of required skills found in the resume's extracted skills."""
    if not required_skills:
        return 0.0

    resume_skills_lower = {s.lower() for s in resume_skills}
    matched = sum(1 for skill in required_skills if skill.lower() in resume_skills_lower)

    return (matched / len(required_skills)) * 100


def tfidf_similarity(resume_text: str, required_skills: list) -> float:
    """Returns 0-100: cosine similarity between resume text and job required-skills text."""
    job_text = " ".join(required_skills)

    if not resume_text.strip() or not job_text.strip():
        return 0.0

    try:
        vectorizer = TfidfVectorizer(stop_words="english")
        tfidf_matrix = vectorizer.fit_transform([resume_text, job_text])
        similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        return float(similarity) * 100
    except ValueError:
        # Happens if vocabulary is empty after stop-word removal
        return 0.0


def calculate_match_score(resume_text: str, resume_skills: list, required_skills: list) -> dict:
    """Combines explicit skill match (70%) and TF-IDF similarity (30%) into a final 0-100 score."""
    explicit_score = explicit_skill_match(resume_skills, required_skills)
    tfidf_score = tfidf_similarity(resume_text, required_skills)

    final_score = (0.7 * explicit_score) + (0.3 * tfidf_score)
    final_score = max(0.0, min(100.0, final_score))

    return {
        "matchScore": round(final_score, 2),
        "explicitScore": round(explicit_score, 2),
        "tfidfScore": round(tfidf_score, 2),
    }
