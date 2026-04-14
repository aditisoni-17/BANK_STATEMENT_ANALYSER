import csv
import time
from pathlib import Path

from parser.transaction_parser import parse_transactions
from predict import predict_category


DATASET_PATH = Path("transactions_dataset.csv")
MODEL_PATH = Path("model.pkl")
VECTORIZER_PATH = Path("vectorizer.pkl")


def assert_dataset_is_valid():
    assert DATASET_PATH.exists(), "transactions_dataset.csv is missing"

    with DATASET_PATH.open(newline="", encoding="utf-8") as csvfile:
        reader = csv.DictReader(csvfile)
        assert reader.fieldnames == ["description", "category"], "Dataset must have description, category columns"

        seen = set()
        rows = list(reader)
        assert rows, "Dataset is empty"

        for row in rows:
            description = (row.get("description") or "").strip()
            category = (row.get("category") or "").strip()
            assert description, "Dataset contains an empty description"
            assert category, "Dataset contains an empty category"

            key = (description, category)
            assert key not in seen, f"Duplicate row found: {key}"
            seen.add(key)


def assert_model_artifacts_exist():
    assert MODEL_PATH.exists(), "model.pkl is missing"
    assert VECTORIZER_PATH.exists(), "vectorizer.pkl is missing"


def assert_prediction_works():
    prediction = predict_category("swiggy order")
    assert isinstance(prediction, dict), "predict_category must return a dict"
    assert "category" in prediction and "confidence" in prediction, "Prediction must include category and confidence"
    assert prediction["category"] == "Food", f"Expected Food, got {prediction['category']}"
    assert isinstance(prediction["confidence"], float), "Confidence must be a float"

    empty_prediction = predict_category("")
    assert empty_prediction["category"] == "OTHER", "Empty input should return OTHER"


def assert_parser_integration_works():
    transactions = parse_transactions("01/01/2024 SWIGGY ORDER 1200.00")
    assert transactions, "Parser returned no transactions"

    transaction = transactions[0]
    assert transaction["category"] == "Food", f"Expected Food, got {transaction['category']}"
    assert "confidence" in transaction, "Parser must include confidence"
    assert isinstance(transaction["confidence"], float), "Parser confidence must be a float"


def assert_end_to_end_pipeline_works():
    text = "01/01/2024 SWIGGY ORDER 1200.00"
    transactions = parse_transactions(text)
    assert len(transactions) == 1, "End-to-end pipeline should return one transaction"
    assert transactions[0]["category"] == "Food", "End-to-end category assignment failed"


def assert_prediction_speed():
    predict_category("swiggy order")

    start = time.perf_counter()
    for _ in range(20):
        predict_category("swiggy order")
    elapsed = (time.perf_counter() - start) / 20

    assert elapsed < 0.1, f"Prediction is too slow: {elapsed:.4f}s per call"


def main():
    assert_dataset_is_valid()
    assert_model_artifacts_exist()
    assert_prediction_works()
    assert_parser_integration_works()
    assert_end_to_end_pipeline_works()
    assert_prediction_speed()
    print("All ML pipeline tests passed.")


if __name__ == "__main__":
    main()
