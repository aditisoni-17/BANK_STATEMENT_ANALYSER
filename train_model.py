import pickle
import csv
from pathlib import Path

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split
from ml.text_preprocessing import clean_transaction_text


DATASET_PATH = "transactions_dataset.csv"
MODEL_PATH = "model.pkl"
VECTORIZER_PATH = "vectorizer.pkl"


def main():
    dataset_path = Path(DATASET_PATH)
    if not dataset_path.exists():
        raise FileNotFoundError(f"{DATASET_PATH} not found")

    rows = []
    seen = set()

    with dataset_path.open(newline="", encoding="utf-8") as csvfile:
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
        raise ValueError("Dataset is empty after cleaning")

    descriptions = [row[0] for row in rows]
    categories = [row[1] for row in rows]

    if len(set(categories)) < 2:
        raise ValueError("Need at least two categories to train a classifier")

    category_counts = {category: categories.count(category) for category in set(categories)}
    stratify = categories if min(category_counts.values()) >= 2 else None

    test_size = max(0.25, len(set(categories)) / len(rows))

    descriptions_train, descriptions_test, categories_train, categories_test = train_test_split(
        descriptions,
        categories,
        test_size=test_size,
        random_state=42,
        stratify=stratify,
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
