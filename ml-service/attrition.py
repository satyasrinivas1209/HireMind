"""
Employee attrition prediction for HireMind.

IMPORTANT TRANSPARENCY NOTE:
This model is trained on SYNTHETIC data generated to produce plausible,
directionally-sensible patterns (lower satisfaction/income/age/tenure ->
higher attrition probability). It is a demonstration of the prediction
architecture, NOT a scientifically validated HR model. Before using this
in a real organization, retrain on real, organization-approved,
consent-collected data.
"""

import os
import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestClassifier

MODEL_PATH = os.path.join(os.path.dirname(__file__), "attrition_model.joblib")
FEATURES = ["Age", "MonthlyIncome", "YearsAtCompany", "JobSatisfaction"]


def generate_synthetic_data(n_records: int = 1000, seed: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)

    age = rng.integers(21, 60, n_records)
    monthly_income = rng.integers(20000, 150000, n_records)
    years_at_company = rng.integers(0, 25, n_records)
    job_satisfaction = rng.integers(1, 6, n_records)  # 1-5 inclusive

    # Build a risk score where lower satisfaction/income/age/tenure -> higher risk.
    risk_score = (
        (5 - job_satisfaction) * 0.35
        + (1 - (monthly_income - 20000) / 130000) * 0.30
        + (1 - np.clip(years_at_company, 0, 15) / 15) * 0.20
        + (1 - np.clip(age - 21, 0, 30) / 30) * 0.15
    )

    # Add noise, then threshold with some randomness to avoid a perfectly deterministic model.
    noise = rng.normal(0, 0.12, n_records)
    probability = np.clip(risk_score + noise, 0, 1)
    attrition = (probability > rng.uniform(0.45, 0.65, n_records)).astype(int)

    return pd.DataFrame(
        {
            "Age": age,
            "MonthlyIncome": monthly_income,
            "YearsAtCompany": years_at_company,
            "JobSatisfaction": job_satisfaction,
            "Attrition": attrition,
        }
    )


def train_model(n_records: int = 1000):
    df = generate_synthetic_data(n_records)
    X = df[FEATURES]
    y = df["Attrition"]

    model = RandomForestClassifier(
        n_estimators=150,
        max_depth=8,
        random_state=42,
        class_weight="balanced",
    )
    model.fit(X, y)
    joblib.dump(model, MODEL_PATH)
    return model


def load_or_train_model():
    if os.path.exists(MODEL_PATH):
        return joblib.load(MODEL_PATH)
    return train_model()


_model = None


def get_model():
    global _model
    if _model is None:
        _model = load_or_train_model()
    return _model


def predict(age: float, monthly_income: float, years_at_company: float, job_satisfaction: int) -> dict:
    model = get_model()
    X = pd.DataFrame(
        [[age, monthly_income, years_at_company, job_satisfaction]],
        columns=FEATURES,
    )

    probability_yes = model.predict_proba(X)[0][1]  # probability of class "1" (Attrition = Yes)
    prediction = "Yes" if probability_yes >= 0.5 else "No"

    return {
        "attrition": prediction,
        "probability": round(float(probability_yes) * 100, 1),
        "explanation": (
            "Predicted using a Random Forest model trained on synthetic data, "
            "based on Age, Monthly Income, Years at Company, and Job Satisfaction. "
            "This is a demonstration model and not a scientifically validated "
            "prediction -- retrain on real, approved data before production HR use."
        ),
    }
