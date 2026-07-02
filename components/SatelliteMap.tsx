import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { FarmData } from "../types";
import CropLayer from "./CropLayer";
import StressLayer from "./StressLayer";
import IrrigationLayer from "./IrrigationLayer";
import { Sprout, Droplets, Waves, ShieldCheck, Target, Info, MapPin } from "lucide-react";

interface SatelliteMapProps {
  farmData: FarmData | null;
}

const createBoundary = (lat: number, lon: number) => ({
  type: "Feature",
  properties: {
    name: "Farm Boundary"
  },
  geometry: {
    type: "Polygon",
    coordinates: [[
      [lon - 0.009, lat - 0.009],
      [lon + 0.009, lat - 0.009],
      [lon + 0.009, lat + 0.009],
      [lon - 0.009, lat + 0.009],
      [lon - 0.009, lat - 0.009]
    ]]
  }
});

const SatelliteMap: React.FC<SatelliteMapProps> = ({ farmData }) => {
  const [mapMode, setMapMode] = useState<"crop" | "stress" | "irrigation">("crop");
  const [center, setCenter] = useState<[number, number]>([22.5726, 88.3639]);

  useEffect(() => {
    if (farmData?.lat && farmData?.lon) {
      setCenter([farmData.lat, farmData.lon]);
    }
  }, [farmData?.lat, farmData?.lon]);

  if (!farmData) {
    return (
      <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-8 text-center">
        <p className="text-slate-500 font-medium">Please save your profile to load satellite maps.</p>
      </div>
    );
  }

  const boundary = createBoundary(center[0], center[1]);

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-emerald-600 animate-pulse" />
            AI-Driven Geospatial Analytics
          </h2>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
            Command Area: {farmData.location || "Indore Region"}
          </p>
        </div>

        {/* Map Tab Selector */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            onClick={() => setMapMode("crop")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              mapMode === "crop"
                ? "bg-white text-emerald-800 shadow"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Sprout className="w-3.5 h-3.5 mr-1" />
            Crop Map
          </button>
          <button
            onClick={() => setMapMode("stress")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              mapMode === "stress"
                ? "bg-white text-emerald-800 shadow"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Droplets className="w-3.5 h-3.5 mr-1" />
            Moisture Stress
          </button>
          <button
            onClick={() => setMapMode("irrigation")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              mapMode === "irrigation"
                ? "bg-white text-emerald-800 shadow"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Waves className="w-3.5 h-3.5 mr-1" />
            Irrigation Advisory
          </button>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Area */}
        <div className="lg:col-span-2 relative rounded-3xl overflow-hidden shadow-inner border border-slate-100 h-[500px]">
          <MapContainer
            key={`${center[0]}-${center[1]}-${mapMode}`}
            center={center}
            zoom={15}
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <GeoJSON 
              data={boundary as any} 
              pathOptions={{
                color: "#10b981",
                weight: 2,
                dashArray: "5, 5",
                fillColor: "#10b981",
                fillOpacity: 0.05
              }}
            />

            {/* Render selected map layer */}
            {mapMode === "crop" && <CropLayer cropMap={farmData.cropMap} />}
            {mapMode === "stress" && <StressLayer stressMap={farmData.stressMap} />}
            {mapMode === "irrigation" && <IrrigationLayer irrigationMap={farmData.irrigationMap} />}
          </MapContainer>

          {/* Inline Map Indicator */}
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm shadow border border-slate-100 rounded-xl px-3 py-1.5 z-[1000] text-[10px] font-bold text-slate-700 flex items-center">
            <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-ping" />
            MODERATE RESOLUTION MULTI-TEMPORAL PROFILE ACTIVE
          </div>
        </div>

        {/* Sidebar Info Card */}
        <div className="lg:col-span-1 flex flex-col justify-between space-y-6">
          {/* Metadata Display */}
          <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5 space-y-5">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center">
              <Target className="w-4 h-4 mr-2 text-emerald-600" />
              Layer Metadata
            </h3>

            {mapMode === "crop" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">RF Accuracy</span>
                    <p className="text-lg font-bold text-slate-800 mt-1">{(farmData.classificationAccuracy || 88.5).toFixed(1)}%</p>
                  </div>
                  <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Kappa Coeff</span>
                    <p className="text-lg font-bold text-slate-800 mt-1">{(farmData.kappaCoefficient || 0.82).toFixed(2)}</p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Crop Map Legend</span>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <LegendItem color="#f1c40f" label="Wheat" />
                    <LegendItem color="#2ecc71" label="Rice" />
                    <LegendItem color="#27ae60" label="Sugarcane" />
                    <LegendItem color="#ecf0f1" label="Cotton" border />
                    <LegendItem color="#e67e22" label="Maize" />
                    <LegendItem color="#95a5a6" label="Fallow" />
                  </div>
                </div>

                <div className="bg-emerald-50 text-emerald-800 p-4 rounded-2xl border border-emerald-100/50 text-[11px] font-medium leading-relaxed flex items-start">
                  <ShieldCheck className="w-4 h-4 mr-2 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    Crop type map generated via Random Forest supervised classification of multi-temporal Sentinel-2 spectral indices and Sentinel-1 backscatter ratios.
                  </span>
                </div>
              </div>
            )}

            {mapMode === "stress" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Avg VCI</span>
                    <p className="text-lg font-bold text-red-600 mt-1">{(farmData.vci || 65.0).toFixed(0)}%</p>
                  </div>
                  <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Avg SMI</span>
                    <p className="text-lg font-bold text-blue-600 mt-1">{(farmData.smi || 32.0).toFixed(0)}%</p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Stress Legend</span>
                  <div className="space-y-1.5 mt-2">
                    <LegendItem color="#d63031" label="Severe Stress" />
                    <LegendItem color="#e17055" label="High Stress" />
                    <LegendItem color="#fdcb6e" label="Moderate Stress" />
                    <LegendItem color="#81c784" label="Low Stress" />
                    <LegendItem color="#2ecc71" label="No Stress" />
                  </div>
                </div>

                <div className="bg-amber-50 text-amber-800 p-4 rounded-2xl border border-amber-100/50 text-[11px] font-medium leading-relaxed flex items-start">
                  <Info className="w-4 h-4 mr-2 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Moisture stress evaluation combines Sentinel-2 NDWI anomalies (VCI) with Sentinel-1 VV/VH backscatter sensitivities across the crop&apos;s active <strong>{farmData.growthStage || "Vegetative"}</strong> stage.
                  </span>
                </div>
              </div>
            )}

            {mapMode === "irrigation" && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Max Crop Deficit (8-Day)</span>
                  <p className="text-2xl font-bold text-blue-700 mt-1">
                    {farmData.irrigationMap && farmData.irrigationMap.length > 0
                      ? Math.max(...farmData.irrigationMap.map(z => z.deficit)).toFixed(1)
                      : "28.4"}{" "}
                    mm
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Priority Zones</span>
                  <div className="space-y-1.5 mt-2">
                    <LegendItem color="#1d4ed8" label="High Priority (Deficit > 25mm)" />
                    <LegendItem color="#3b82f6" label="Medium Priority (Deficit 10-25mm)" />
                    <LegendItem color="#93c5fd" label="Low Priority (Deficit < 10mm)" />
                  </div>
                </div>

                <div className="bg-blue-50 text-blue-800 p-4 rounded-2xl border border-blue-100/50 text-[11px] font-medium leading-relaxed flex items-start">
                  <Info className="w-4 h-4 mr-2 text-blue-600 shrink-0 mt-0.5" />
                  <span>
                    Advisory computes weekly demand $ET_c = ET_0 \times K_c$ against actual root-zone soil water balances and meteorological grids to direct canal priorities.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const LegendItem = ({ color, label, border = false }: { color: string; label: string; border?: boolean }) => (
  <div className="flex items-center space-x-2 text-[11px] font-semibold text-slate-600">
    <div
      className={`w-3.5 h-3.5 rounded`}
      style={{
        backgroundColor: color,
        border: border ? "1px solid #cbd5e1" : "none"
      }}
    />
    <span>{label}</span>
  </div>
);

export default SatelliteMap;