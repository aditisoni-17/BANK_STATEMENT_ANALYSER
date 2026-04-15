import pickle

from ml.text_preprocessing import clean_transaction_text


MODEL_PATH = "model.pkl"
VECTORIZER_PATH = "vectorizer.pkl"
LEGACY_MODEL_PATH = "transaction_category_model.pkl"
LEGACY_VECTORIZER_PATH = "transaction_tfidf_vectorizer.pkl"

_model = None
_vectorizer = None


def _clean_text(text: str) -> str:
    return clean_transaction_text(text)


def _load_artifacts():
    global _model, _vectorizer

    if _model is None:
        try:
            with open(MODEL_PATH, "rb") as model_file:
                _model = pickle.load(model_file)
        except FileNotFoundError:
            with open(LEGACY_MODEL_PATH, "rb") as model_file:
                _model = pickle.load(model_file)

    if _vectorizer is None:
        try:
            with open(VECTORIZER_PATH, "rb") as vectorizer_file:
                _vectorizer = pickle.load(vectorizer_file)
        except FileNotFoundError:
            with open(LEGACY_VECTORIZER_PATH, "rb") as vectorizer_file:
                _vectorizer = pickle.load(vectorizer_file)


def predict_category(description: str) -> str:
    _load_artifacts()
    cleaned_description = _clean_text(description)
    vector = _vectorizer.transform([cleaned_description])
    return _model.predict(vector)[0]
