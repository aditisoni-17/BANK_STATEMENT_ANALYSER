import pickle

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split


DATASET_PATH = "transactions_dataset.csv"
MODEL_PATH = "transaction_category_model.pkl"
VECTORIZER_PATH = "transaction_tfidf_vectorizer.pkl"


def main():
    df = pd.read_csv(DATASET_PATH)
    df = df.dropna(subset=["description", "category"])

    descriptions = df["description"].astype(str)
    categories = df["category"].astype(str)

    descriptions_train, descriptions_test, categories_train, categories_test = (
        train_test_split(
            descriptions,
            categories,
            test_size=0.2,
            random_state=42,
            stratify=categories if categories.nunique() > 1 else None,
        )
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
