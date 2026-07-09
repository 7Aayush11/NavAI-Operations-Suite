import joblib
import os
import sys

# Get absolute path for local SQLite db
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "models", "loan_recovery_model.pkl")

print(f"Loading model from: {MODEL_PATH}")
model = joblib.load(MODEL_PATH)

print("\nModel properties:")
print(f"Type: {type(model)}")
print(f"Classes: {getattr(model, 'classes_', 'None')}")
print(f"n_features_in_: {getattr(model, 'n_features_in_', 'None')}")
print(f"feature_names_in_: {getattr(model, 'feature_names_in_', 'None')}")
