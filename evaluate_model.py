from pathlib import Path

import pandas as pd
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, precision_score, recall_score
from sklearn.model_selection import train_test_split

import ml.category_predictor as category_predictor
from ml.text_preprocessing import clean_transaction_text


DATASET_PATH = "transactions_dataset.csv"


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

    category_predictor._load_artifacts()

    test_vectors = category_predictor._vectorizer.transform(descriptions_test)
    predictions = category_predictor._model.predict(test_vectors)

    accuracy = accuracy_score(categories_test, predictions)
    precision = precision_score(categories_test, predictions, average="macro", zero_division=0)
    recall = recall_score(categories_test, predictions, average="macro", zero_division=0)
    report = classification_report(categories_test, predictions, zero_division=0)
    matrix = confusion_matrix(categories_test, predictions)

    print(f"Accuracy: {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall: {recall:.4f}")
    print("\nClassification Report:")
    print(report)

    print("Confusion Matrix:")
    print(matrix)

    print("\nMisclassified Examples:")
    misclassified = []
    for description, actual, predicted in zip(descriptions_test, categories_test, predictions):
        if actual != predicted:
            misclassified.append(
                {
                    "description": description,
                    "actual": actual,
                    "predicted": predicted,
                }
            )

    if misclassified:
        for example in misclassified[:10]:
            print(example)
    else:
        print("None")


if __name__ == "__main__":
    main()
