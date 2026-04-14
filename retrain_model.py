import csv
import pickle
from pathlib import Path

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split

from ml.text_preprocessing import clean_transaction_text


DATASET_PATH = Path("transactions_dataset.csv")
MODEL_PATH = Path("model.pkl")
VECTORIZER_PATH = Path("vectorizer.pkl")


def load_dataset():
    if not DATASET_PATH.exists():
        raise FileNotFoundError(f"{DATASET_PATH} not found")

    rows = []
    seen = set()

    with DATASET_PATH.open(newline="", encoding="utf-8") as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            description = clean_transaction_text(row.get("description", ""))
            category = str(row.get("category", "")).strip()

            if not description or not category:
                continue

            key = (description, category)
            if key in seen:
                continue

            seen.add(key)
            rows.append((description, category))

    if len(rows) < 2:
        raise ValueError("Dataset is too small to train a model")

    return rows


def main():
    rows = load_dataset()
    descriptions = [row[0] for row in rows]
    categories = [row[1] for row in rows]

    if len(set(categories)) < 2:
        raise ValueError("Need at least two categories to train a classifier")

    stratify = categories if min(categories.count(category) for category in set(categories)) >= 2 else None
    test_size = max(0.25, len(set(categories)) / len(rows))

    x_train, x_test, y_train, y_test = train_test_split(
        descriptions,
        categories,
        test_size=test_size,
        random_state=42,
        stratify=stratify,
    )

    vectorizer = TfidfVectorizer(lowercase=True, stop_words="english", ngram_range=(1, 2))
    x_train_vectors = vectorizer.fit_transform(x_train)
    x_test_vectors = vectorizer.transform(x_test)

    model = LogisticRegression(max_iter=1000)
    model.fit(x_train_vectors, y_train)

    predictions = model.predict(x_test_vectors)
    accuracy = accuracy_score(y_test, predictions)
    print(f"Accuracy: {accuracy:.4f}")

    with MODEL_PATH.open("wb") as model_file:
        pickle.dump(model, model_file)

    with VECTORIZER_PATH.open("wb") as vectorizer_file:
        pickle.dump(vectorizer, vectorizer_file)


if __name__ == "__main__":
    main()
