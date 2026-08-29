"""
Standalone script to (re)train the attrition model and persist it with joblib.
Run with: python train_attrition_model.py
"""

from attrition import train_model, MODEL_PATH

if __name__ == "__main__":
    model = train_model(n_records=1000)
    print(f"[train_attrition_model] Model trained and saved to {MODEL_PATH}")
