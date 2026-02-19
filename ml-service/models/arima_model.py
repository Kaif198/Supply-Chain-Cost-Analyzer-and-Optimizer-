import pandas as pd
import numpy as np
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.stattools import adfuller

class ArimaModel:
    def __init__(self, order=(5, 1, 0)):
        self.order = order
        self.model = None
        self.model_fit = None

    def train(self, series):
        """
        Train ARIMA model on a pandas Series (index=date, value=float).
        Returns True if successful, False otherwise.
        """
        # Ensure frequency is set
        if series.index.freq is None:
            series = series.asfreq('D').fillna(0)
            
        try:
            # Try primary order
            try:
                self.model = ARIMA(series, order=self.order)
                self.model_fit = self.model.fit()
            except Exception as e:
                print(f"Primary ARIMA{self.order} failed: {e}. Retrying with (1,1,0)...")
                # Fallback to simpler model
                self.model = ARIMA(series, order=(1,1,0))
                self.model_fit = self.model.fit()
            
            return True
        except Exception as e:
            print(f"ARIMA Training Error: {e}")
            self.model_fit = None
            return False

    def forecast(self, steps=30):
        """
        Generate forecast for N steps.
        Returns DataFrame with 'mean', 'confidence_lower', 'confidence_upper'.
        """
        if not self.model_fit:
            raise ValueError("Model not trained yet.")
            
        forecast_result = self.model_fit.get_forecast(steps=steps)
        summary_frame = forecast_result.summary_frame()
        
        # Renaissance of dataframe columns
        df = pd.DataFrame({
            'mean': summary_frame['mean'],
            'lower': summary_frame['mean_ci_lower'],
            'upper': summary_frame['mean_ci_upper']
        })
        
        return df

    def generate_insight(self, history, forecast, metric_name="Demand"):
        """
        Generate natural language insight based on forecast vs history.
        """
        current_avg = history[-30:].mean() if len(history) >= 30 else history.mean()
        future_avg = forecast['mean'].mean()
        
        if current_avg == 0: current_avg = 1 # Avoid division by zero
        
        change_pct = ((future_avg - current_avg) / current_avg) * 100
        
        trend = "stable"
        if change_pct > 5: trend = "increasing"
        elif change_pct < -5: trend = "decreasing"
        
        magnitude = "slightly"
        if abs(change_pct) > 20: magnitude = "significantly"
        elif abs(change_pct) > 50: magnitude = "drastically"
        
        # Identify peak day in forecast
        peak_idx = forecast['mean'].idxmax()
        peak_val = forecast['mean'].max()
        peak_date_str = peak_idx.strftime('%b %d')
        
        insight = f"{metric_name} is projected to {trend} {magnitude} ({change_pct:+.1f}%) over the next {len(forecast)} days. "
        
        if trend == "increasing":
            insight += f"Prepare for a peak of {int(peak_val)} units around {peak_date_str}. "
            insight += "Consider increasing buffer stock in regional warehouses."
        elif trend == "decreasing":
            insight += f"Expect lower activity levels, bottoming out around {peak_idx.strftime('%b %d')}. "
            insight += "Opportunity to schedule vehicle maintenance or reduce labor shifts."
        else:
            insight += f"Operations are expected to remain steady with an average of {int(future_avg)} units. "
            insight += "Maintain current inventory levels."
            
        return insight
