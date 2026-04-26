"""
Flask backend for the Image Encryption Tool Dashboard.
Wraps the source_code.py encryption/decryption logic with REST API endpoints.
"""

import os
import io
import base64
import hashlib
import time
import json
import numpy as np
from PIL import Image
from flask import Flask, request, jsonify, send_from_directory

app = Flask(__name__, static_folder='.', static_url_path='')

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# ==========================
# KEY GENERATION (from source_code.py)
# ==========================
def generate_key(password):
    hash_obj = hashlib.sha256(password.encode())
    return int(hash_obj.hexdigest(), 16) % (10**8)


# ==========================
# ENCRYPTION (from source_code.py)
# ==========================
def encrypt_image(img, password):
    pixels = np.array(img.convert('RGB'))
    key = generate_key(password)

    # XOR encryption
    encrypted_pixels = pixels ^ (key % 256)

    # Shuffle pixels
    flat_pixels = encrypted_pixels.flatten()
    np.random.seed(key)
    np.random.shuffle(flat_pixels)

    encrypted_pixels = flat_pixels.reshape(pixels.shape)
    return Image.fromarray(encrypted_pixels.astype('uint8'))


# ==========================
# DECRYPTION (from source_code.py)
# ==========================
def decrypt_image(img, password):
    pixels = np.array(img.convert('RGB'))
    key = generate_key(password)

    # Unshuffle pixels
    flat_pixels = pixels.flatten()
    np.random.seed(key)
    indices = np.arange(len(flat_pixels))
    np.random.shuffle(indices)

    unshuffled = np.zeros_like(flat_pixels)
    unshuffled[indices] = flat_pixels
    unshuffled_pixels = unshuffled.reshape(pixels.shape)

    # XOR decryption
    decrypted_pixels = unshuffled_pixels ^ (key % 256)
    return Image.fromarray(decrypted_pixels.astype('uint8'))


def image_to_base64(img, fmt='PNG'):
    buffer = io.BytesIO()
    img.save(buffer, format=fmt)
    buffer.seek(0)
    return base64.b64encode(buffer.read()).decode('utf-8')


def get_image_details(img):
    w, h = img.size
    mode = img.mode
    total_pixels = w * h
    pixels = np.array(img.convert('RGB'))
    avg_r = float(np.mean(pixels[:, :, 0]))
    avg_g = float(np.mean(pixels[:, :, 1]))
    avg_b = float(np.mean(pixels[:, :, 2]))
    entropy = 0
    for c in range(3):
        hist, _ = np.histogram(pixels[:, :, c], bins=256, range=(0, 256))
        prob = hist / hist.sum()
        prob = prob[prob > 0]
        entropy += float(-np.sum(prob * np.log2(prob)))
    entropy /= 3.0
    return {
        'width': w,
        'height': h,
        'mode': mode,
        'totalPixels': total_pixels,
        'avgR': round(avg_r, 1),
        'avgG': round(avg_g, 1),
        'avgB': round(avg_b, 1),
        'entropy': round(entropy, 3),
        'aspectRatio': f"{w}:{h}"
    }


# ==========================
# ROUTES
# ==========================
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')


@app.route('/api/process', methods=['POST'])
def process_image():
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400

    file = request.files['image']
    password = request.form.get('password', '')
    mode = request.form.get('mode', 'encrypt')

    if not password:
        return jsonify({'error': 'Password is required'}), 400

    try:
        img = Image.open(file.stream)
    except Exception:
        return jsonify({'error': 'Invalid image file'}), 400

    start_time = time.time()

    original_details = get_image_details(img)

    if mode == 'encrypt':
        result_img = encrypt_image(img, password)
    else:
        result_img = decrypt_image(img, password)

    elapsed = round(time.time() - start_time, 3)

    result_details = get_image_details(result_img)

    original_b64 = image_to_base64(img)
    result_b64 = image_to_base64(result_img)

    # Generate histogram data
    orig_pixels = np.array(img.convert('RGB'))
    res_pixels = np.array(result_img.convert('RGB'))

    orig_hist = {}
    res_hist = {}
    for i, ch in enumerate(['r', 'g', 'b']):
        h1, _ = np.histogram(orig_pixels[:, :, i], bins=256, range=(0, 256))
        h2, _ = np.histogram(res_pixels[:, :, i], bins=256, range=(0, 256))
        orig_hist[ch] = h1.tolist()
        res_hist[ch] = h2.tolist()

    return jsonify({
        'success': True,
        'mode': mode,
        'processingTime': elapsed,
        'originalImage': f'data:image/png;base64,{original_b64}',
        'resultImage': f'data:image/png;base64,{result_b64}',
        'originalDetails': original_details,
        'resultDetails': result_details,
        'originalHistogram': orig_hist,
        'resultHistogram': res_hist,
        'keyHash': hashlib.sha256(password.encode()).hexdigest()[:16]
    })


@app.route('/api/download', methods=['POST'])
def download_image():
    data = request.get_json()
    img_data = data.get('imageData', '')

    if not img_data:
        return jsonify({'error': 'No image data'}), 400

    # Remove data URL prefix
    if ',' in img_data:
        img_data = img_data.split(',')[1]

    img_bytes = base64.b64decode(img_data)

    return app.response_class(
        img_bytes,
        mimetype='image/png',
        headers={'Content-Disposition': 'attachment; filename=processed_image.png'}
    )


if __name__ == '__main__':
    app.run(debug=True, port=5000)
