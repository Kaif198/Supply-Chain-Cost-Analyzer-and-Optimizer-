import pandas as pd
import numpy as np
from datetime import timedelta
import random

class SyntheticGenerator:
    def __init__(self, original_df):
        self.original_df = original_df

    def generate_historical_data(self, target_days=365):
        """
        Augment data to ensure we have at least target_days of history.
        Generates synthetic past data based on the earliest available real data patterns.
        """
        if self.original_df.empty:
            return pd.DataFrame()

        df = self.original_df.copy()
        earliest_date = df['deliveryDate'].min()
        latest_date = df['deliveryDate'].max()
        
        current_span = (latest_date - earliest_date).days
        days_needed = target_days - current_span

        if days_needed <= 0:
            print(f"Data sufficient: {current_span} days available.")
            return df

        print(f"Augmenting data: Generating {days_needed} days of synthetic history...")

        # Analyze distribution of valid data
        daily_vol = df.groupby(df['deliveryDate'].dt.date).size().mean()
        avg_cost = df['totalCost'].mean()
        std_cost = df['totalCost'].std()
        
        # Get list of existing IDs to sample from
        vehicle_ids = df['vehicleId'].unique()
        origin_ids = df['originId'].unique()
        dest_ids = df['destinationId'].unique()
        
        new_rows = []
        
        # Generate backwards from earliest date
        current_synth_date = earliest_date
        
        for i in range(days_needed):
            current_synth_date = current_synth_date - timedelta(days=1)
            
            # Daily volume with some randomness (Poisson-ish)
            n_deliveries = max(1, int(np.random.normal(daily_vol, daily_vol * 0.2)))
            
            for _ in range(n_deliveries):
                # Sample random attributes from existing distribution
                vid = np.random.choice(vehicle_ids)
                oid = np.random.choice(origin_ids)
                did = np.random.choice(dest_ids)
                
                # Sample a "template" row for realistic correlations (e.g. vehicle type matching ID)
                template = df[df['vehicleId'] == vid].sample(1).iloc[0]
                
                # Add some noise to numericals
                noise = np.random.normal(1, 0.1) # 10% variance
                cost = template['totalCost'] * noise
                demand = int(template['demand'] * noise)
                distance = template['distance'] # Distance is fixed between points usually, keeping it simple
                
                row = {
                    'id': f'synth_{i}_{_}',
                    'originId': oid,
                    'destinationId': did,
                    'vehicleId': vid,
                    'demand': demand,
                    'distance': distance,
                    'totalCost': cost,
                    'deliveryDate': current_synth_date,
                    'isAlpine': template['isAlpine'],
                    'hasOvertime': 1 if random.random() < 0.1 else 0, # 10% chance of overtime
                    'vehicleType': template['vehicleType'],
                    'originCategory': template['originCategory'],
                    'destinationCategory': template['destinationCategory'] 
                }
                new_rows.append(row)

        synthetic_df = pd.DataFrame(new_rows)
        # Ensure datetime type
        synthetic_df['deliveryDate'] = pd.to_datetime(synthetic_df['deliveryDate'])
        
        # Combine and sort
        combined_df = pd.concat([synthetic_df, df], ignore_index=True)
        combined_df = combined_df.sort_values('deliveryDate')
        
        print(f"Augmentation complete. Total records: {len(combined_df)}")
        return combined_df
