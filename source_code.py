import os
import hashlib
import numpy as np
from PIL import Image

# ==========================
# KEY GENERATION
# ==========================
def generate_key(password):
    """
    Convert password into a numeric key using SHA-256
    """
    hash_obj = hashlib.sha256(password.encode())
    return int(hash_obj.hexdigest(), 16) % (10**8)


# ==========================
# ENCRYPTION FUNCTION
# ==========================
def encrypt_image(input_path, output_path, password):
    if not os.path.exists(input_path):
        print("Error: Input file not found!")
        return

    try:
        img = Image.open(input_path).convert('RGB')
    except:
        print("Error: Invalid image format!")
        return

    pixels = np.array(img)
    key = generate_key(password)

    print("Encrypting image...")

    # XOR encryption
    encrypted_pixels = pixels ^ (key % 256)

    # Shuffle pixels
    flat_pixels = encrypted_pixels.flatten()
    np.random.seed(key)
    np.random.shuffle(flat_pixels)

    encrypted_pixels = flat_pixels.reshape(pixels.shape)

    encrypted_img = Image.fromarray(encrypted_pixels.astype('uint8'))
    encrypted_img.save(output_path)

    print(f"Encryption complete! Saved to {output_path}")


# ==========================
# DECRYPTION FUNCTION
# ==========================
def decrypt_image(input_path, output_path, password):
    if not os.path.exists(input_path):
        print("Error: Input file not found!")
        return

    try:
        img = Image.open(input_path).convert('RGB')
    except:
        print("Error: Invalid image format!")
        return

    pixels = np.array(img)
    key = generate_key(password)

    print("Decrypting image...")

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

    decrypted_img = Image.fromarray(decrypted_pixels.astype('uint8'))
    decrypted_img.save(output_path)

    print(f"Decryption complete! Saved to {output_path}")


# ==========================
# MAIN MENU
# ==========================
def main():
    print("\n==== IMAGE ENCRYPTION TOOL ====\n")
    print("1. Encrypt Image")
    print("2. Decrypt Image")
    print("3. Exit")

    choice = input("\nEnter your choice: ")

    if choice == '1':
        input_path = input("Enter input image path: ")
        output_path = input("Enter output image path (e.g., encrypted.png): ")
        password = input("Enter password: ")

        encrypt_image(input_path, output_path, password)

    elif choice == '2':
        input_path = input("Enter encrypted image path: ")
        output_path = input("Enter output image path (e.g., decrypted.png): ")
        password = input("Enter password: ")

        decrypt_image(input_path, output_path, password)

    elif choice == '3':
        print("Exiting...")

    else:
        print("Invalid choice!")

    print("\nProgram finished.\n")


# ==========================
# RUN PROGRAM
# ==========================
if __name__ == "__main__":
    main()