from pdf2image import convert_from_path

def pdf_to_images(pdf_path):
    pages = convert_from_path(pdf_path, dpi=300)
    return pages


if __name__ == "__main__":
    images = pdf_to_images("sample_files/statement.pdf")
    print(f"Converted {len(images)} pages to images")
