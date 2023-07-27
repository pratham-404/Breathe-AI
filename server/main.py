from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware  # Import the CORS middleware
import numpy as np
from keras.models import load_model
from keras.preprocessing import image
import io

app = FastAPI()

# Load the pre-trained model and other necessary configurations
model = load_model("./Model/New_Trained_CNN_Model.h5")
labels = ["Normal", "Pneumonia"]  # Update with your class labels

# Configure CORS to allow requests from your React frontend
app.add_middleware(
    CORSMiddleware,
    # Update with the URL of your React frontend
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/predict/")
async def predict_pneumonia(file: UploadFile = File(...)):
    try:
        # Access the file data as bytes directly from the file object
        file_data = await file.read()

        # Process the image using the file_data as binary input
        img = image.load_img(io.BytesIO(file_data), target_size=(224, 224))
        img = image.img_to_array(img)
        img = np.expand_dims(img, axis=0)
        img = img / 255.0  # Preprocess the image

        # Make prediction
        prediction = model.predict(img)
        confidence = prediction[0][0]  # Assuming it's binary classification

        # Map the confidence score to the label
        if confidence > 0.5:
            result = {"prediction": labels[1], "confidence": float(confidence)}
        else:
            result = {"prediction": labels[0],
                      "confidence": float(1 - confidence)}

        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
