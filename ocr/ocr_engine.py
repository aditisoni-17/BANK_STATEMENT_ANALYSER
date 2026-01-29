import pytesseract

def extract_text(image):
    text = pytesseract.image_to_string(image, config="--psm 6")
    return text
