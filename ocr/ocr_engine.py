import pytesseract


def extract_text(image, timeout_seconds=None):
    kwargs = {"config": "--psm 6"}
    if timeout_seconds is not None:
        kwargs["timeout"] = timeout_seconds

    text = pytesseract.image_to_string(image, **kwargs)
    return text
