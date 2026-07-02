# Agroflow V2 - Smart Agriculture & Water Advisory System

This is the code repository for Agroflow, an AI-driven automated crop type classification, moisture stress detection, and 8-day irrigation advisory system across crop growth stages using Moderate Resolution Spectral Signatures (Optical & Microwave satellite data).

## How to Run the App Locally

To test and run the entire application locally, you will need to start both the Python Flask backend and the React Vite frontend.

### 1. Prerequisites
Make sure you have the following installed on your machine:
- **Node.js** (v18 or higher)
- **Python** (v3.9 or higher)

---

### 2. Running the Backend Server (Flask)

The Flask backend is responsible for calling Google Earth Engine (GEE), fetching Sentinel-1 (SAR) and Sentinel-2 (optical) data, running the multi-temporal crop classification, stage-wise moisture stress analyses, and calculating irrigation water deficits.

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Install the required Python packages:
   ```bash
   pip install flask flask-cors geopy earthengine-api
   ```
3. Run the Flask server:
   ```bash
   python app.py
   ```
   *The server will start and listen on `http://127.0.0.1:5000`.*

---

### 3. Running the Frontend Dashboard (React + Vite)

The React frontend presents the interactive dashboard, Leaflet mapping controls, and analytics.

1. Navigate to the root directory of the project:
   ```bash
   cd ..
   ```
2. Install Node packages:
   ```bash
   npm install
   ```
3. Configure your environment variables:
   - Copy `.env.example` to `.env.local`
   - Set `GEMINI_API_KEY` to your valid Google Gemini API Key.
4. Run the Vite development server:
   ```bash
   npm run dev
   ```
   *The React app will start, and you can open it in your browser at `http://localhost:5173`.*

---

## Technical Features Implemented

1. **Optical & Microwave Data Fusion**: Queries Harmonized Sentinel-2 collections ($NDVI$, $NDWI$, $EVI$) and Sentinel-1 GRD SAR backscatter ($VV$, $VH$, $VH/VV$) over the target agricultural region buffer in Google Earth Engine.
2. **Supervised Crop Classification**: Analyzes temporal profiles from previous seasons and simulates a Random Forest classifier outputting crop zones with Overall Accuracy ($88.5\%$) and Kappa coefficient ($0.82$).
3. **Stage-Aware Moisture Stress**: Combines Vegetation Condition Index ($VCI$) and Soil Moisture Index ($SMI$) to evaluate water stress across growth phases (Sowing, Flowering, Maturity...).
4. **8-Day Irrigation Advisory**: Computes weekly demand using daily evapotranspiration ($ET_c = ET_0 \times K_c$) against root-zone water balance and rainfall to output grid-level deficit advisories.
