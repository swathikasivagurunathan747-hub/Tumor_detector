# Included trained model

This package includes `models/brain_tumor_hog_svm.joblib`, trained on the supplied Brain Tumor MRI dataset.

- Training images: 5,600
- Held-out Testing images: 1,600
- Classes: glioma, meningioma, notumor, pituitary
- Preprocessing: grayscale, resize 96x96, scale pixels to 0-1
- Feature extraction: HOG (Histogram of Oriented Gradients)
- Classifier: Linear SVM
- Held-out test accuracy in this training run: **83.125%**

Per-class test F1 approximately: glioma .75, meningioma .76, no-tumor .91, pituitary .89.

The Analyze page calls the local FastAPI `/predict` endpoint. It no longer asks Lovable/Gemini to guess the class.

This is a research/educational prototype, not a diagnostic medical device.
