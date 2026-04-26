# 🔐 CipherVault — Secure Image Encryption Tool

A powerful, full-stack image encryption and decryption tool that uses **XOR cipher with pixel shuffling** to securely protect images. Built with a modern, glassmorphic web dashboard powered by **Flask** and vanilla JavaScript.

> **SkillCraft Technology** — Cyber Security Internship · Task 3

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔒 **XOR Encryption** | Encrypts pixel data using an XOR cipher derived from a SHA-256 password hash |
| 🔀 **Pixel Shuffling** | Adds a second layer of security by randomly shuffling all pixel positions |
| 🔑 **Password-Based Keys** | Generates deterministic encryption keys from user passwords via SHA-256 |
| 🎨 **Before vs After Slider** | Interactive comparison slider to visualize original and processed images |
| 📊 **Color Histograms** | Real-time RGB channel histogram analysis for original and result images |
| 📈 **Entropy Analysis** | Displays Shannon entropy to measure encryption randomness |
| 🌗 **Dark / Light Mode** | Elegant theme toggle with smooth transitions |
| 💪 **Password Strength Meter** | Visual feedback on password complexity with requirement tips |
| 📱 **Responsive Design** | Fully responsive layout built with modern CSS |

---

## 🖼️ How It Works

### Encryption
1. The password is hashed using **SHA-256** to produce a deterministic numeric key.
2. Each pixel's RGB values are **XOR-ed** with the key (mod 256).
3. All pixels are **flattened and shuffled** using a seeded random permutation.
4. The result is a visually unrecognizable, encrypted image.

### Decryption
1. The same password regenerates the **identical key** via SHA-256.
2. Pixels are **un-shuffled** back to their original positions using the same seed.
3. **XOR is applied again** (since XOR is its own inverse) to restore the original pixel values.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML5, CSS3 (Glassmorphism), Vanilla JavaScript |
| **Backend** | Python, Flask |
| **Encryption** | NumPy, Pillow (PIL), hashlib (SHA-256) |
| **Fonts** | Inter, JetBrains Mono (Google Fonts) |

---

## 📁 Project Structure

```
├── index.html         # Main dashboard UI
├── style.css          # Glassmorphic styling with dark/light themes
├── script.js          # Frontend logic — upload, preview, comparison slider, histograms
├── app.py             # Flask backend — REST API for encrypt/decrypt operations
├── source_code.py     # Standalone CLI encryption/decryption tool
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.8+**
- **pip** (Python package manager)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/shreyas-blr/secure-image-encryption-tool.git
   cd secure-image-encryption-tool
   ```

2. **Install dependencies**
   ```bash
   pip install flask numpy pillow
   ```

3. **Run the web dashboard**
   ```bash
   python app.py
   ```
   Open your browser and navigate to **http://localhost:5000**

### CLI Usage (Standalone)

You can also use the tool directly from the command line:

```bash
python source_code.py
```

Follow the interactive menu to encrypt or decrypt images.

---

## 🔧 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Serves the main dashboard |
| `POST` | `/api/process` | Processes an image (encrypt or decrypt) |
| `POST` | `/api/download` | Downloads the processed result image |

### `POST /api/process`

**Form Data:**
- `image` — Image file (PNG, JPG, BMP, TIFF, WebP)
- `password` — Encryption/decryption password
- `mode` — `encrypt` or `decrypt`

**Response:**
```json
{
  "success": true,
  "mode": "encrypt",
  "processingTime": 0.245,
  "originalImage": "data:image/png;base64,...",
  "resultImage": "data:image/png;base64,...",
  "originalDetails": { "width": 800, "height": 600, "entropy": 7.234 },
  "resultDetails": { "width": 800, "height": 600, "entropy": 7.998 },
  "originalHistogram": { "r": [...], "g": [...], "b": [...] },
  "resultHistogram": { "r": [...], "g": [...], "b": [...] },
  "keyHash": "a1b2c3d4e5f67890"
}
```

---

## ⚠️ Disclaimer

This tool is built for **educational and demonstration purposes** as part of a cyber security internship. The XOR cipher with pixel shuffling provides basic image obfuscation but is **not suitable for protecting highly sensitive data** in production environments. For real-world encryption needs, use established cryptographic libraries (e.g., AES-256).

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/shreyas-blr">shreyas-blr</a>
</p>
