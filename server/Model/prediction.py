import cv2
import numpy as np
from tensorflow.keras.models import load_model

def load_and_preprocess_image(image_path):
    # Load the image using OpenCV
    image = cv2.imread(image_path)
    
    # Resize the image to the target size (224x224) used during training
    target_size = (224, 224)
    image = cv2.resize(image, target_size)
    
    # Convert the image to a numpy array and normalize pixel values
    image = np.array(image) / 255.0
    
    # Expand the dimensions to match the input shape expected by the model
    image = np.expand_dims(image, axis=0)
    
    return image

def predict_pneumonia(image_path, model_path):
    # Load the saved model
    model = load_model(model_path)
    
    # Preprocess the image
    image = load_and_preprocess_image(image_path)
    
    # Make the prediction
    prediction = model.predict(image)
    
    # Get the class label (0 for 'Normal' and 1 for 'Pneumonia')
    class_label = 'Pneumonia' if prediction[0][0] > 0.5 else 'Normal'
    
    # Display the result
    print(f"Image: {image_path}")
    print(f"Prediction: {class_label} (Confidence: {prediction[0][0]})")

# Example usage:
image_path = './NORMAL2-IM-0307-0001.jpeg'
model_path = './Trained_CNN_Model.h5'
predict_pneumonia(image_path, model_path)
