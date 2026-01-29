import re

def clean_ocr_text(raw_text):
    """
    Cleans noisy OCR text so it can be parsed later
    """

    # 1️⃣ Convert everything to uppercase (consistency)
    text = raw_text.upper()

    # 2️⃣ Remove unwanted special characters
    text = re.sub(r"[^A-Z0-9\s\-/\.]", " ", text)

    # 3️⃣ Remove multiple spaces
    text = re.sub(r"\s+", " ", text)

    # 4️⃣ Remove leading/trailing spaces
    text = text.strip()

    return text


# 🧪 Testing (temporary)
if __name__ == "__main__":
    sample_text = """
    uBERTAP | SSS] SSC*~SCSCSC
    feo-or-a0es [AMAZON PURCHASE «| awe]
    """

    print("---- BEFORE ----")
    print(sample_text)

    print("\n---- AFTER ----")
    print(clean_ocr_text(sample_text))
