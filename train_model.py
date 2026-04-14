import pickle
from pathlib import Path

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split
from ml.text_preprocessing import clean_transaction_text


DATASET_PATH = "transactions_dataset.csv"
MODEL_PATH = "transaction_category_model.pkl"
VECTORIZER_PATH = "transaction_tfidf_vectorizer.pkl"


def main():
    dataset_path = Path(DATASET_PATH)
    if not dataset_path.exists():
        raise FileNotFoundError(f"{DATASET_PATH} not found")

    df = pd.read_csv(dataset_path)
    df = df.dropna(subset=["description", "category"])
    df = df.drop_duplicates(subset=["description", "category"])

    if df.empty:
        raise ValueError("Dataset is empty after cleaning")

    descriptions = df["description"].astype(str).map(clean_transaction_text)
    categories = df["category"].astype(str)

    descriptions_train, descriptions_test, categories_train, categories_test = train_test_split(
        descriptions,
        categories,
        test_size=0.2,
        random_state=42,
        stratify=categories if categories.nunique() > 1 else None,
    )

    vectorizer = TfidfVectorizer(
        lowercase=True,
        stop_words="english",
        ngram_range=(1, 2),
    )

    train_vectors = vectorizer.fit_transform(descriptions_train)
    test_vectors = vectorizer.transform(descriptions_test)

    model = LogisticRegression(max_iter=1000)
    model.fit(train_vectors, categories_train)

    predictions = model.predict(test_vectors)
    accuracy = accuracy_score(categories_test, predictions)
    print(f"Accuracy: {accuracy:.4f}")

    with open(MODEL_PATH, "wb") as model_file:
        pickle.dump(model, model_file)

    with open(VECTORIZER_PATH, "wb") as vectorizer_file:
        pickle.dump(vectorizer, vectorizer_file)


if __name__ == "__main__":
    main()
