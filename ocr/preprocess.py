import cv2
import numpy as np


def _to_grayscale(pil_image):
    image = np.array(pil_image)
    return cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)


def _apply_threshold(gray_image):
    _, thresholded = cv2.threshold(gray_image, 150, 255, cv2.THRESH_BINARY)
    return thresholded


def preprocess_image(pil_image):
    gray_image = _to_grayscale(pil_image)
    return _apply_threshold(gray_image)
