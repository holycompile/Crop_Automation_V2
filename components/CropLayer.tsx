import React from "react";
import { Polygon, Popup } from "react-leaflet";
import { CropZone } from "../types";

interface CropLayerProps {
  cropMap?: CropZone[];
}

const CropLayer: React.FC<CropLayerProps> = ({ cropMap }) => {
  if (!cropMap || cropMap.length === 0) return null;

  return (
    <>
      {cropMap.map((zone) => (
        <Polygon
          key={zone.id}
          positions={zone.coords as any}
          pathOptions={{
            color: "#fff",
            weight: 1.5,
            fillColor: zone.color,
            fillOpacity: 0.6
          }}
        >
          <Popup>
            <div className="p-1">
              <h3 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-1 mb-1">
                Crop Classification
              </h3>
              <p className="text-xs text-gray-600 mb-1">
                <strong>Crop Type:</strong> <span className="font-semibold text-emerald-700">{zone.cropType}</span>
              </p>
              <p className="text-xs text-gray-600 mb-1">
                <strong>Classification Confidence:</strong> {zone.confidence.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-600">
                <strong>Field Area:</strong> {zone.area} Ha
              </p>
            </div>
          </Popup>
        </Polygon>
      ))}
    </>
  );
};

export default CropLayer;
