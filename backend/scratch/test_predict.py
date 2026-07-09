import joblib
import os
import pandas as pd

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "models", "loan_recovery_model.pkl")

print(f"Loading model from: {MODEL_PATH}")
model = joblib.load(MODEL_PATH)

# Exact feature order:
# OutstandingAmount, DaysOverdue, PreviousLoanDefaults, BankruptcyHistory, CreditScore, DistanceFromBranch, CallResponse
feature_names = ['OutstandingAmount', 'DaysOverdue', 'PreviousLoanDefaults', 'BankruptcyHistory', 'CreditScore', 'DistanceFromBranch', 'CallResponse']

test_df = pd.DataFrame([[15000.0, 45, 0, 0, 600, 12.5, 1]], columns=feature_names)

print("\nTrying prediction with pandas DataFrame:")
try:
    pred = model.predict(test_df)
    print(f"Success! Prediction: {pred}")
except Exception as e:
    print(f"Failed with pandas DataFrame: {e}")
