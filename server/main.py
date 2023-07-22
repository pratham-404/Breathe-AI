from fastapi import FastAPI, UploadFile, File
import cv2
import numpy as np

app = FastAPI()

def remove_background(image_path):
    # Load the image using OpenCV
    image = cv2.imread(image_path, cv2.IMREAD_UNCHANGED)

    # Convert the image to RGB if it has an alpha channel
    if image.shape[2] == 4:
        image = cv2.cvtColor(image, cv2.COLOR_BGRA2RGB)

    # Create a mask of the pixels to be transparent (remove background)
    lower_white = np.array([200, 200, 200], dtype=np.uint8)
    upper_white = np.array([255, 255, 255], dtype=np.uint8)
    mask = cv2.inRange(image, lower_white, upper_white)

    # Invert the mask (to keep the foreground pixels)
    mask = cv2.bitwise_not(mask)

    # Apply the mask to the image
    image[mask != 0] = [0, 0, 0, 0]

    # Save the resulting image to a file (optional)
    result_image_path = "output_image.png"
    cv2.imwrite(result_image_path, image)

    return result_image_path

@app.post("/remove_background")
async def remove_background_api(file: UploadFile = File(...)):
    # Save the uploaded image to a temporary file
    with open("temp_image.png", "wb") as temp_image:
        temp_image.write(await file.read())

    # Call the remove_background function
    output_image_path = remove_background("temp_image.png")

    return {"message": "Background removed successfully", "image_path": output_image_path}
