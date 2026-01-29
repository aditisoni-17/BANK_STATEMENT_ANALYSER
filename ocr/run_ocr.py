from pdf_to_image import pdf_to_images
from preprocess import preprocess_image
from ocr_engine import extract_text

images = pdf_to_images("sample_files/statement.pdf")

for i, img in enumerate(images):
    processed = preprocess_image(img)
    text = extract_text(processed)

    print(f"--- PAGE {i+1} OCR OUTPUT ---")
    print(text)
