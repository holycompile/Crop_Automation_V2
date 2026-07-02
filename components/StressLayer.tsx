import React from "react";
import { Polygon, Popup } from "react-leaflet";
import { StressZone } from "../types";

interface StressLayerProps {
  stressMap?: StressZone[];
}

const StressLayer: React.FC<StressLayerProps> = ({ stressMap }) => {
  if (!stressMap || stressMap.length === 0) return null;

  return (
    <>
      {stressMap.map((zone) => (
        <Polygon
          key={zone.id}
          positions={zone.coords as any}
          pathOptions={{
            color: "#fff",
            weight: 1.5,
            fillColor: zone.color,
            fillOpacity: 0.65
          }}
        >
          <Popup>
            <div className="p-1 min-w-[150px]">
              <h3 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-1 mb-1">
                Moisture Stress Analysis
              </h3>
              <p className="text-xs mb-1">
                <strong>Status:</strong>{" "}
                <span
                  className="font-bold uppercase tracking-wider text-xs px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: zone.color + "20",
                    color: zone.color
                  }}
                >
                  {zone.level}
                </span>
              </p>
              <div className="grid grid-cols-2 gap-2 mt-2 pt-1 text-[11px] text-gray-600 border-t border-gray-50">
                <div>
                  <strong>NDVI:</strong> {zone.ndvi.toFixed(2)}
                </div>
                <div>
                  <strong>NDWI:</strong> {zone.ndwi.toFixed(2)}
                </div>
                <div>
                  <strong>VCI:</strong> {zone.vci.toFixed(0)}%
                </div>
                <div>
                  <strong>SMI:</strong> {zone.smi.toFixed(0)}%
                </div>
              </div>
            </div>
          </Popup>
        </Polygon>
      ))}
    </>
  );
};

export default StressLayer;