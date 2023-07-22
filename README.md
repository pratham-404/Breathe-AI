# Pneumonia-Detection-using-CNN

![Pneumonia Prediction using Deep CNN](https://github.com/RushilShivade/Pneumonia-Detection-using-CNN/assets/116446026/dcf919c0-8644-46dd-8c9e-84c8b00e0430)


## Introduction
This project aims to build a deep Convolutional Neural Network (CNN) model to detect pneumonia in individuals using chest X-ray images. Pneumonia is a serious lung infection that can be life-threatening if not diagnosed and treated promptly. This model utilizes the publicly available [Chest X-ray Images (Pneumonia)](https://www.kaggle.com/paultimothymooney/chest-xray-pneumonia) dataset from Kaggle to train and evaluate the CNN for binary classification – identifying whether a person has pneumonia or not.

## Dataset Description
The dataset contains a large collection of chest X-ray images obtained from pediatric and adult patients. It is divided into three main subsets: training, validation, and test. Each subset contains two classes: "Normal" and "Pneumonia." The "Normal" class represents healthy individuals without pneumonia, while the "Pneumonia" class comprises X-ray images of patients with pneumonia. The dataset provides a valuable resource for training a robust deep learning model to perform pneumonia detection.

## Model Architecture
The deep CNN model employed for this task is built using the Keras API with a TensorFlow backend. The architecture consists of multiple Convolutional, Batch Normalization, Max Pooling, and Dropout layers, followed by Dense layers for final classification. The model is designed to extract meaningful features from chest X-ray images and make accurate predictions.

## Data Preprocessing and Augmentation
Before feeding the images into the model, they are preprocessed by resizing them to a standard size (e.g., 224x224 pixels) and normalizing the pixel values to a range between 0 and 1. Data augmentation techniques, such as shear, zoom, rotation, horizontal flip, and shift, are applied to increase the diversity of the training dataset and improve model generalization.

## Training and Evaluation
The model is trained using the training dataset and evaluated on the validation set. The training process involves optimizing the model's parameters using the binary cross-entropy loss and the Adam optimizer. Early stopping and learning rate reduction callbacks are used to prevent overfitting and fine-tune the model's performance. After successful training, the model is evaluated on the test set to assess its real-world performance.

## Model Deployment and Prediction
Once the model is fully trained and evaluated, it can be saved as a `.h5` file for future use. The saved model can then be loaded and utilized to make predictions on new chest X-ray images. The model will provide a probability score indicating the likelihood of pneumonia presence in the image.

## Dependencies
- TensorFlow
- Keras
- Pandas
- NumPy
- Matplotlib
- PIL (Python Imaging Library)

## Usage
1. Download the Chest X-ray Images (Pneumonia) dataset from Kaggle and organize it into appropriate train, validation, and test folders.
2. Preprocess the data, augment the training set, and split it into train, validation, and test DataFrames using pandas.
3. Create the deep CNN model by defining the architecture and compiling it with appropriate loss and optimizer functions.
4. Train the model using the training dataset and evaluate its performance on the validation set.
5. Fine-tune the model using early stopping and learning rate reduction callbacks to prevent overfitting.
6. Save the trained model as a `.h5` file for future use.
7. Load the saved model and use it to predict pneumonia on new chest X-ray images.

## Conclusion
Pneumonia detection using deep CNN with chest X-ray images is a critical task with potentially life-saving applications. By leveraging the power of deep learning and large datasets, this model can assist medical professionals in making accurate and timely diagnoses, leading to better patient outcomes. However, it is essential to remember that this model is intended to be used as an assisting tool and not a replacement for professional medical judgment. Always consult a qualified healthcare professional for medical decisions and diagnosis.

**Note**: Please refer to the Jupyter notebook or Python script accompanying this README for detailed code implementation and execution.

## References
1. Dataset: Chest X-ray Images (Pneumonia) - [Kaggle](https://www.kaggle.com/paultimothymooney/chest-xray-pneumonia)
2. Keras Documentation - [Keras.io](https://keras.io/)
3. TensorFlow Documentation - [TensorFlow.org](https://www.tensorflow.org/)
