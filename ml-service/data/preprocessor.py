import pandas as pd
from sklearn.preprocessing import LabelEncoder
import joblib

class Preprocessor:
    def __init__(self):
        self.le_vehicle = LabelEncoder()
        self.le_origin = LabelEncoder()
        
    def prepare_arima_data(self, df, column='demand'):
        """
        Aggregate to daily level for ARIMA.
        Returns Series indexed by date.
        """
        # Ensure daily frequency, fill missing with 0
        daily = df.groupby(df['deliveryDate'].dt.date)[column].sum()
        daily.index = pd.to_datetime(daily.index)
        daily = daily.asfreq('D').fillna(0)
        return daily

    def prepare_rf_data(self, df):
        """
        Prepare features for Supplier Reliability Random Forest.
        Target: on_time (derived from hasOvertime - if overtime=True, reliability=0, else 1)
        """
        features = df.copy()
        
        # Target: 0 if overtime/delayed, 1 if on time
        features['target'] = features['hasOvertime'].apply(lambda x: 0 if x else 1)
        
        # Feature Engineering
        features['day_of_week'] = features['deliveryDate'].dt.dayofweek
        features['month'] = features['deliveryDate'].dt.month
        
        # Encoding categorical variables
        # Using codes for simplicity in this RF model
        features['vehicle_encoded'] = features['vehicleId'].astype('category').cat.codes
        features['origin_encoded'] = features['originId'].astype('category').cat.codes
        features['is_alpine_int'] = features['isAlpine'].astype(int)
        
        # Select final vectors
        X = features[[
            'vehicle_encoded', 'origin_encoded', 'distance', 'demand', 
            'is_alpine_int', 'day_of_week', 'month'
        ]]
        y = features['target']
        
        return X, y, features[['id', 'vehicleId', 'originId']] # Return identifiers for mapping results
