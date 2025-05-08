import pickle
import numpy as np

# --- Load the saved model bundle ---
with open('viti.pkl', 'rb') as file:
    model_bundle = pickle.load(file)

rf_model = model_bundle['model']
label_encoder_treatment = model_bundle['label_encoder_treatment']

# --- Create a new example for prediction ---
# Example values: [Age, Duration (weeks), Speed Rate, % Affected Before, % Affected After]
sample_input = np.array([[25, 12, 1.2, 35.0, 28.0]])  # Replace with real values as needed

# --- Predict ---
predicted_label = rf_model.predict(sample_input)[0]
predicted_treatment = label_encoder_treatment.inverse_transform([predicted_label])[0]

print(f"Predicted Treatment Type: {predicted_treatment}")