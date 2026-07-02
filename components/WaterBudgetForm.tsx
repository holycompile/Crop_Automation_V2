
import React, { useState } from 'react';
import { FarmData } from '../types';
import { CROPS, SEASONS, IRRIGATION_METHODS } from '../constants';
import { MapPin, ThermometerSun, Sprout, Ruler, Droplets, CloudRain, Waves } from 'lucide-react';

interface Props {
  onCalculate: (data: FarmData) => void;
  isCalculating: boolean;
}

const WaterBudgetForm: React.FC<Props> = ({ onCalculate, isCalculating }) => {
  const [formData, setFormData] = useState<FarmData>({
    farmerName: '',
    farmName: '',
    location: '',
    season: SEASONS[0],
    crop: CROPS[0],
    area: 5,
    irrigationMethod: IRRIGATION_METHODS[0],
    groundwaterLevel: 25,
    rainfallIndex: 0, // Reset to 0 default
    soilMoisture: 45
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'area' || name.includes('Level') || name.includes('Index') || name.includes('Moisture') 
        ? parseFloat(value) 
        : value
    }));
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setFormData(prev => ({ ...prev, location: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}` }));
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCalculate(formData);
  };

  return (
    <div className="glass-card p-8 rounded-3xl shadow-xl border border-emerald-100/20">
      <h2 className="text-2xl font-heading font-bold mb-6 flex items-center text-emerald-900">
        <Droplets className="mr-2 text-emerald-600" /> Start New Budgeting
      </h2>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center">
              <MapPin className="w-4 h-4 mr-1" /> Location
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="City or Coordinates"
                className="flex-1 p-3 bg-white text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                required
              />
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors"
              >
                📍
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center">
              <ThermometerSun className="w-4 h-4 mr-1" /> Season
            </label>
            <select
              name="season"
              value={formData.season}
              onChange={handleChange}
              className="w-full p-3 bg-white text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center">
              <Sprout className="w-4 h-4 mr-1" /> Crop Selection
            </label>
            <select
              name="crop"
              value={formData.crop}
              onChange={handleChange}
              className="w-full p-3 bg-white text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              {CROPS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center">
              <Ruler className="w-4 h-4 mr-1" /> Farm Area (Hectares)
            </label>
            <input
              type="number"
              name="area"
              value={formData.area}
              onChange={handleChange}
              min="0.1"
              step="0.1"
              className="w-full p-3 bg-white text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              required
            />
          </div>
        </div>

        {/* Technical Data */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Irrigation Method</label>
            <select
              name="irrigationMethod"
              value={formData.irrigationMethod}
              onChange={handleChange}
              className="w-full p-3 bg-white text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              {IRRIGATION_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
            <h3 className="text-sm font-bold text-emerald-800 mb-3 flex items-center">
              <Waves className="w-4 h-4 mr-2" /> Live Sensor Data Inputs
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-emerald-700 uppercase mb-1">Groundwater Depth (m)</label>
                <input
                  type="number"
                  name="groundwaterLevel"
                  value={formData.groundwaterLevel}
                  onChange={handleChange}
                  className="w-full p-2 bg-white text-gray-900 border border-emerald-200 rounded-lg outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-emerald-700 uppercase mb-1 flex justify-between text-emerald-900">
                  Soil Moisture (%) <span>{formData.soilMoisture}%</span>
                </label>
                <input
                  type="range"
                  name="soilMoisture"
                  value={formData.soilMoisture}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  className="w-full accent-emerald-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-emerald-700 uppercase mb-1">Rainfall Forecast Index (mm)</label>
                <div className="flex items-center space-x-2">
                  <CloudRain className="text-emerald-400 w-4 h-4" />
                  <input
                    type="number"
                    name="rainfallIndex"
                    value={formData.rainfallIndex}
                    onChange={handleChange}
                    className="w-full p-2 bg-white text-gray-900 border border-emerald-200 rounded-lg outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 mt-4">
          <button
            type="submit"
            disabled={isCalculating}
            className={`w-full py-4 rounded-2xl text-white font-bold text-lg shadow-xl transition-all flex items-center justify-center ${
              isCalculating ? 'bg-emerald-300' : 'bg-emerald-600 hover:bg-emerald-700 hover:-translate-y-1'
            }`}
          >
            {isCalculating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Analyzing Data...
              </>
            ) : 'Calculate Smart Water Budget'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default WaterBudgetForm;
