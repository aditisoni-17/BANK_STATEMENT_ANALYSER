import pickle
import re
from pathlib import Path


MODEL_PATH = Path(__file__).with_name("model.pkl")
VECTORIZER_PATH = Path(__file__).with_name("vectorizer.pkl")

_model = None
_vectorizer = None


def _clean_text(text: str) -> str:
    text = str(text).lower().strip()
    return re.sub(r"\s+", " ", text)


def _load_artifacts():
    global _model, _vectorizer

    if _model is None:
        with open(MODEL_PATH, "rb") as model_file:
            _model = pickle.load(model_file)

    if _vectorizer is None:
        with open(VECTORIZER_PATH, "rb") as vectorizer_file:
            _vectorizer = pickle.load(vectorizer_file)


def predict_category(description: str):
    try:
        if not description or not str(description).strip():
            return {"category": "OTHER", "confidence": 0.0}

        _load_artifacts()
        cleaned_description = _clean_text(description)
        if not cleaned_description:
            return {"category": "OTHER", "confidence": 0.0}

        features = _vectorizer.transform([cleaned_description])
        probabilities = _model.predict_proba(features)[0]
        best_index = int(probabilities.argmax())
        confidence = float(probabilities[best_index])
        category = str(_model.classes_[best_index]).strip()

        if confidence < 0.5 or not category:
            return {"category": "OTHER", "confidence": confidence}

        return {"category": category, "confidence": confidence}
    except Exception:
        return {"category": "OTHER", "confidence": 0.0}
