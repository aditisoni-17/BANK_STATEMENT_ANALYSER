import csv
import json
import re
import sys
from pathlib import Path


OUTPUT_PATH = "transactions_dataset.csv"


def clean_description(description: str) -> str:
    description = description.lower()
    description = re.sub(r"[^a-z0-9\s]", " ", description)
    description = re.sub(r"\s+", " ", description)
    return description.strip()


def create_dataset(transactions, output_path=OUTPUT_PATH):
    rows = []
    seen = set()

    for transaction in transactions or []:
        if not isinstance(transaction, dict):
            continue

        description = clean_description(str(transaction.get("description", "")))
        category = str(transaction.get("category", "")).strip()

        if not description or not category:
            continue

        row = (description, category)
        if row in seen:
            continue

        seen.add(row)
        rows.append(row)

    with open(output_path, "w", newline="", encoding="utf-8") as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(["description", "category"])
        writer.writerows(rows)

    return output_path


if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit("Usage: python create_dataset.py <transactions_json_file>")

    input_path = Path(sys.argv[1])
    if not input_path.exists():
        raise FileNotFoundError(f"{input_path} not found")

    with open(input_path, "r", encoding="utf-8") as f:
        transactions = json.load(f)

    create_dataset(transactions)
