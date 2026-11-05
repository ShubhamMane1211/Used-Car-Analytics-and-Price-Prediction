import os
from pathlib import Path

import pandas as pd
from dotenv import load_dotenv
from pymongo import MongoClient

BASE_DIR = Path(__file__).resolve().parent
CSV_PATH = BASE_DIR / "Data" / "Car Sell Dataset.csv"
ENV_PATH = BASE_DIR / "Backend" / ".env"


load_dotenv(ENV_PATH)

MONGODB_URI = os.getenv("MONGODB_URI")

if not MONGODB_URI:
    raise ValueError("MONGODB_URI not found in Backend/.env")


print("Reading CSV dataset...")
df = pd.read_csv(CSV_PATH)

print("Dataset shape:", df.shape)

# missing values to None
df = df.astype(object).where(pd.notna(df), None)

# Convert values to native Python types
records = [
    {
        key: value.item() if hasattr(value, "item") else value
        for key, value in record.items()
    }
    for record in df.to_dict(orient="records")
]

# Connect to MongoDB Atlas
print("Connecting to MongoDB Atlas...")

client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=15000)

try:
    client.admin.command("ping")
    print("MongoDB connection successful!")

    db = client["used_car_db"]
    collection = db["car_listings"]

    # Prevent accidental duplicate imports
    existing_count = collection.count_documents({})

    if existing_count > 0:
        raise RuntimeError(
            f"Collection already contains {existing_count} documents. "
            "Import cancelled to prevent duplicates."
        )

    batch_size = 1000

    print("Importing car listings...")

    for start in range(0, len(records), batch_size):
        batch = records[start : start + batch_size]
        collection.insert_many(batch)

        inserted = min(start + batch_size, len(records))
        print(f"Imported {inserted}/{len(records)} records")

    print("\nImport completed successfully!")
    print("Total documents:", collection.count_documents({}))

finally:
    client.close()
