from pdf_to_image import pdf_to_images
from preprocess import preprocess_image
from ocr_engine import extract_text
from clean_text import clean_ocr_text
from parser import parse_transactions

import json

images = pdf_to_images("sample_files/statement.pdf")

all_transactions = []

for i, img in enumerate(images):
    processed = preprocess_image(img)

    # OCR
    raw_text = extract_text(processed)

    # Clean text
    cleaned_text = clean_ocr_text(raw_text)
    
    # Parse transactions
    transactions = parse_transactions(cleaned_text)

    all_transactions.extend(transactions)

# Print output
print("\n✅ FINAL PARSED TRANSACTIONS:\n")
for t in all_transactions:
    print(t)

# Save JSON
with open("ocr/output.json", "w") as f:
    json.dump(all_transactions, f, indent=2)

print("\n📁 JSON saved to ocr/output.json")
