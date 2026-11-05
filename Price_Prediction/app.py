import json
from pathlib import Path

import pandas as pd
from catboost import CatBoostRegressor
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

# ------------------------------------------------
# INITIALIZATION
# ------------------------------------------------

app = FastAPI(
    title="Used Car Price Prediction API",
    description="Predict used-car prices using CatBoost",
    version="1.0.0",
)

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "models" / "used_car_price_model.cbm"
CONFIG_PATH = BASE_DIR / "models" / "model_config.json"

model = CatBoostRegressor()
model.load_model(str(MODEL_PATH))

with open(CONFIG_PATH, "r") as file:
    config = json.load(file)

FEATURES = config["features"]
CATEGORICAL_FEATURES = config["categorical_features"]
NUMERICAL_FEATURES = config["numerical_features"]
REFERENCE_YEAR = config["reference_year"]


# ------------------------------------------------
# REQUEST SCHEMA
# ------------------------------------------------


class CarDetails(BaseModel):
    Brand: str
    Model_Name: str
    Model_Variant: str
    Car_Type: str
    Transmission: str
    Fuel_Type: str
    Year: int = Field(ge=2000, le=2023)
    Kilometers: int = Field(ge=0, le=1000000)
    Owner: str
    State: str
    Accidental: str


# ------------------------------------------------
# HEALTH CHECK
# ------------------------------------------------


@app.get("/")
def home():
    return {"message": "Used Car Price Prediction API is running"}


# ------------------------------------------------
# PRICE PREDICTION
# ------------------------------------------------


@app.post("/predict")
def predict_price(car: CarDetails):

    try:
        car_data = car.model_dump()

        # Create engineered features
        car_age = REFERENCE_YEAR - car_data["Year"]

        if car_age < 0:
            raise HTTPException(
                status_code=400, detail="Year is outside the model's training range"
            )

        km_per_year = car_data["Kilometers"] / max(car_age, 1)

        # Match training column names
        input_data = {
            "Brand": car_data["Brand"],
            "Model Name": car_data["Model_Name"],
            "Model Variant": car_data["Model_Variant"],
            "Car Type": car_data["Car_Type"],
            "Transmission": car_data["Transmission"],
            "Fuel Type": car_data["Fuel_Type"],
            "Year": car_data["Year"],
            "Kilometers": car_data["Kilometers"],
            "Owner": car_data["Owner"],
            "State": car_data["State"],
            "Accidental": car_data["Accidental"],
            "Car_Age": car_age,
            "KM_Per_Year": km_per_year,
        }

        # Ensure exact training feature order
        input_df = pd.DataFrame([input_data], columns=FEATURES)

        for col in CATEGORICAL_FEATURES:
            input_df[col] = input_df[col].astype(str)

        for col in NUMERICAL_FEATURES:
            input_df[col] = pd.to_numeric(input_df[col])

        prediction = float(model.predict(input_df)[0])

        return {
            "success": True,
            "predicted_price": round(prediction, 2),
            "predicted_price_lakhs": round(prediction / 100000, 2),
            "currency": "INR",
            "model": "CatBoost Regressor",
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))
