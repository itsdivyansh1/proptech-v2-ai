import os
import pickle
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.neighbors import NearestNeighbors
import logging
from flask_cors import cross_origin
import requests
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Gemini API
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
genai.configure(api_key=GOOGLE_API_KEY)
model = genai.GenerativeModel('gemini-2.0-flash')

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, supports_credentials=True, resources={
    r"/predict_price": {
        "origins": ["http://localhost:5173"],
        "methods": ["POST", "OPTIONS"],
        "allow_headers": ["Content-Type"],
        "supports_credentials": True
    },
    r"/recommend_properties": {
        "origins": ["http://localhost:5173"],
        "methods": ["POST", "OPTIONS"],
        "allow_headers": ["Content-Type"],
        "supports_credentials": True
    },
    r"/chat": {
        "origins": ["http://localhost:5173"],
        "methods": ["POST", "OPTIONS"],
        "allow_headers": ["Content-Type"],
        "supports_credentials": True
    }
})

# 🔹 Define dynamic paths for models and encoders
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PRICE_MODEL_PATH = os.path.join(BASE_DIR, "../models/house_prediction.pkl")
REGION_ENCODER_PATH = os.path.join(BASE_DIR, "../models/region_encoder.pkl")  # For price prediction
RECOMMEND_MODEL_PATH = os.path.join(BASE_DIR, "../models/recommendation_model.pkl")  # KNN Model
LABEL_ENCODERS_PATH = os.path.join(BASE_DIR, "../models/label_encoders.pkl")  # For recommendation model (region, locality, etc.)

# 🔹 Load models and encoders
with open(PRICE_MODEL_PATH, "rb") as file:
    price_model = pickle.load(file)

with open(REGION_ENCODER_PATH, "rb") as file:
    region_encoder = pickle.load(file)  # Used for price prediction

with open(RECOMMEND_MODEL_PATH, "rb") as file:
    recommend_model = pickle.load(file)  # Used for recommendations

with open(LABEL_ENCODERS_PATH, "rb") as file:
    label_encoders = pickle.load(file)  # Used for recommendation model (region, locality, etc.)

# 🔹 Load dataset (for recommendations)
dataset_path = os.path.join(BASE_DIR, "../dataset/Mumbai House Prices.csv")
df = pd.read_csv(dataset_path)

# Encode categorical columns for recommendation dataset
for col in ["region", "locality", "type", "status", "age"]:
    df[col] = label_encoders[col].transform(df[col])

# Features used in KNN model
feature_columns = ["region", "locality", "type", "bhk", "status", "age", "area"]
X = df[feature_columns]

# ========================== PRICE PREDICTION API ==========================
@app.route("/predict_price", methods=["POST"])
def predict_price():
    try:
        data = request.json
        logger.debug(f"Received data: {data}")
        
        # Get and validate inputs
        region = data.get("region", "").title()
        bhk = int(data.get("bhk", 0))
        user_price = float(data.get("user_price", 0))

        logger.debug(f"Processed inputs - region: {region}, bhk: {bhk}, user_price: {user_price}")

        # Validate inputs
        if not region or bhk <= 0 or user_price <= 0:
            return jsonify({
                "error": "Invalid input. Provide valid 'region', 'bhk', and 'user_price'.",
                "details": {
                    "region": region,
                    "bhk": bhk,
                    "user_price": user_price
                }
            }), 400

        # Check if region exists in encoder
        if region not in region_encoder.classes_:
            return jsonify({
                "error": "Region not found",
                "status": "error"
            }), 400

        # Encode region for price prediction
        region_encoded = region_encoder.transform([region])[0]
        logger.debug(f"Encoded region: {region_encoded}")

        # Predict market price (model predicts in lakhs)
        input_data = np.array([[region_encoded, bhk]])
        predicted_price = float(price_model.predict(input_data)[0])
        logger.debug(f"Predicted price in lakhs: {predicted_price}")

        # If user_price is already in lakhs (e.g., 20), use it directly
        # If user_price is in actual amount (e.g., 2000000), convert to lakhs
        user_price_in_lakhs = user_price if user_price < 100000 else user_price / 100000
        logger.debug(f"User price in lakhs: {user_price_in_lakhs}")

        # Calculate price variation
        variation = ((user_price_in_lakhs - predicted_price) / predicted_price) * 100
        variation = round(variation, 2)
        logger.debug(f"Price variation: {variation}%")

        # Return prices in lakhs for consistent frontend display
        return jsonify({
            "predicted_price": predicted_price,  # Already in lakhs
            "user_price": user_price_in_lakhs,   # In lakhs
            "price_variation": variation
        })

    except Exception as e:
        logger.error(f"Error in predict_price: {str(e)}", exc_info=True)
        return jsonify({
            "error": "Internal server error",
            "details": str(e)
        }), 500

# ========================== PROPERTY RECOMMENDATION API ==========================
@app.route("/recommend_properties", methods=["POST"])
@cross_origin(origins=['http://localhost:5173'], supports_credentials=True)
def recommend_properties():
    try:
        data = request.json
        logger.info(f"Received recommendation request with data: {data}")
        
        # Get coordinates and seed from request
        latitude = float(data.get("latitude"))
        longitude = float(data.get("longitude"))
        seed = data.get("seed")  # Get random seed from request
        
        if not latitude or not longitude:
            logger.error("No coordinates provided")
            return jsonify({
                "error": "Latitude and longitude are required",
                "status": "error"
            }), 400

        # Get all unique regions from the dataset
        available_regions = df['region'].unique()
        # Decode the regions back to their original names
        available_regions = [label_encoders['region'].inverse_transform([r])[0] for r in available_regions]
        logger.info(f"Available regions: {available_regions}")

        # Get the most common region as fallback
        most_common_region = df['region'].mode()[0]
        most_common_region = label_encoders['region'].inverse_transform([most_common_region])[0]
        logger.info(f"Most common region: {most_common_region}")

        # For now, use the most common region since we don't have coordinates in our dataset
        target_location = "Airoli"
        
        # Get recommendations for the target location
        region_encoded = region_encoder.transform([target_location])[0]
        recommendations = get_recommendations_for_location(region_encoded, target_location, seed)
        
        return jsonify({
            "recommendations": recommendations,
            "status": "success",
            "message": f"Showing popular recommendations for {target_location}",
            "location": target_location
        })
        
    except Exception as e:
        logger.error(f"Error in recommend_properties: {str(e)}", exc_info=True)
        return jsonify({
            "error": "Internal server error",
            "details": str(e)
        }), 500

def get_recommendations_for_location(location_encoded, location_name, seed=None):
    """Helper function to get recommendations for a specific location"""
    recommendations = []
    
    # Set random seed if provided
    if seed is not None:
        np.random.seed(int(seed * 1000000))  # Convert float to int for seed
    
    # Get the most common values for other features in this region
    region_mask = df['region'] == location_encoded
    region_data = df[region_mask]
    
    # Get top 5 localities in this region
    top_localities = region_data['locality'].value_counts().head(5).index.tolist()
    top_localities = [label_encoders['locality'].inverse_transform([l])[0] for l in top_localities]
    
    most_common_status = label_encoders['status'].inverse_transform([region_data['status'].mode()[0]])[0]
    most_common_age = label_encoders['age'].inverse_transform([region_data['age'].mode()[0]])[0]
    
    for bhk in [1, 2, 3]:  # Recommend for 1, 2, and 3 BHK
        # Get properties for this BHK in the region
        bhk_mask = region_data['bhk'] == bhk
        bhk_data = region_data[bhk_mask]
        
        if len(bhk_data) > 0:
            # Select a random property from the dataset for this BHK
            random_property = bhk_data.sample(n=1).iloc[0]
            
            # Get the actual locality name
            property_locality = label_encoders['locality'].inverse_transform([random_property['locality']])[0]
            
            recommendations.append({
                "bhk": bhk,
                "price": round(float(random_property['price']), 2),  # Using actual price
                "price_unit": random_property['price_unit'],  # Using price unit from dataset
                "location": location_name,
                "locality": property_locality,
                "status": label_encoders['status'].inverse_transform([random_property['status']])[0],
                "age": label_encoders['age'].inverse_transform([random_property['age']])[0],
                "area": round(float(random_property['area']), 2)  # Using actual area
            })
            logger.info(f"Selected property for {bhk} BHK in {property_locality}: {random_property['price']} {random_property['price_unit']}, {random_property['area']} sq ft")
        else:
            # If no data for this BHK, skip it
            logger.warning(f"No properties found for {bhk} BHK in {location_name}")
            continue
    
    # Reset random seed
    np.random.seed(None)
    return recommendations

# ========================== CHAT API ==========================
@app.route("/chat", methods=["POST"])
@cross_origin(origins=['http://localhost:5173'], supports_credentials=True)
def chat():
    try:
        data = request.json
        message = data.get("message", "")
        system_prompt = data.get("system_prompt", "")
        
        if not message:
            return jsonify({
                "error": "Message is required",
                "status": "error"
            }), 400

        # Combine system prompt and user message
        prompt = f"{system_prompt}\n\nUser: {message}\n\nAssistant:"
        
        # Generate response using Gemini
        response = model.generate_content(prompt)
        
        return jsonify({
            "response": response.text,
            "status": "success"
        })
        
    except Exception as e:
        logger.error(f"Error in chat: {str(e)}", exc_info=True)
        return jsonify({
            "error": "Internal server error",
            "details": str(e)
        }), 500

# ========================== RUN FLASK APP ==========================
if __name__ == "__main__":
    app.run(debug=True)
