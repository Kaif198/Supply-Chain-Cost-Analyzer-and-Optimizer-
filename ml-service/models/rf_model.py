import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report

class SupplierReliabilityModel:
    def __init__(self):
        self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.feature_names = []

    def train(self, X, y):
        """
        Train Random Forest Classifier.
        """
        self.feature_names = X.columns.tolist()
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        self.model.fit(X_train, y_train)
        
        y_pred = self.model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        report = classification_report(y_test, y_pred, output_dict=True)
        
        return {
            'accuracy': accuracy,
            'report': report
        }

    def predict_proba(self, X):
        """
        Predict probability of on-time delivery (class 1).
        """
        # Returns array of [prob_0, prob_1]
        probs = self.model.predict_proba(X)
        return probs[:, 1] # Probability of being on time

    def generate_risk_narrative(self, row_data, prob_on_time):
        """
        Generate risk narrative based on probability and key features.
        row_data: dict containing feature values (e.g. is_alpine, distance)
        """
        risk_level = "Low"
        if prob_on_time < 0.6: risk_level = "High"
        elif prob_on_time < 0.8: risk_level = "Medium"
        
        narrative = f"Reliability Score: {int(prob_on_time * 100)}%. Risk Level: {risk_level}. "
        
        if risk_level == "High":
            narrative += "Major delays likely. "
            if row_data.get('is_alpine_int') == 1:
                narrative += "Alpine route complexity is a primary risk factor. "
            if row_data.get('distance', 0) > 300:
                narrative += "Long-haul distance increases vulnerability to traffic. "
            if row_data.get('month') in [12, 1, 2]:
                narrative += "Winter conditions may exacerbate delays. "
            narrative += "Recommendation: buffer lead time by 24h."
            
        elif risk_level == "Medium":
            narrative += "Monitor closely. "
            if row_data.get('day_of_week') >= 4: # Fri/Sat/Sun
                narrative += "Weekend traffic patterns may impact arrival. "
            narrative += "Ensure vehicle maintenance is up to date."
            
        else:
            narrative += "Route is performing optimally. No immediate actions required."
            
        return narrative
