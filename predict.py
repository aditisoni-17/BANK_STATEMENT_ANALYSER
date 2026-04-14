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


def predict_category(description: str) -> str:
    try:
        _load_artifacts()
        cleaned_description = _clean_text(description)
        features = _vectorizer.transform([cleaned_description])
        prediction = _model.predict(features)
        return str(prediction[0])
    except Exception:
        return "OTHER"
