import os
import psycopg2
import pandas as pd
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

class DBFetcher:
    def __init__(self):
        self.db_url = os.getenv("DATABASE_URL")
        if not self.db_url:
            raise ValueError("DATABASE_URL environment variable is not set")

    def get_connection(self):
        return psycopg2.connect(self.db_url)

    def fetch_deliveries(self):
        """Fetch all delivery records with related vehicle and route info."""
        query = """
            SELECT 
                d.id, d."originId", d."destinationId", d."vehicleId", d.demand, 
                d.distance, d."totalCost", d."deliveryDate", d."isAlpine", d."hasOvertime",
                v.type as "vehicleType",
                p_origin.category as "originCategory",
                p_dest.category as "destinationCategory"
            FROM deliveries d
            JOIN vehicles v ON d."vehicleId" = v.id
            JOIN premises p_origin ON d."originId" = p_origin.id
            JOIN premises p_dest ON d."destinationId" = p_dest.id
            ORDER BY d."deliveryDate" ASC;
        """
        conn = self.get_connection()
        try:
            df = pd.read_sql_query(query, conn)
            # Ensure date is datetime
            df['deliveryDate'] = pd.to_datetime(df['deliveryDate'])
            return df
        finally:
            conn.close()

    def fetch_vehicles(self):
        """Fetch all vehicles."""
        query = 'SELECT * FROM vehicles;'
        conn = self.get_connection()
        try:
            return pd.read_sql_query(query, conn)
        finally:
            conn.close()

if __name__ == "__main__":
    # Test execution
    try:
        fetcher = DBFetcher()
        df = fetcher.fetch_deliveries()
        print(f"Fetched {len(df)} deliveries")
        print(df.head())
    except Exception as e:
        print(f"Error: {e}")
