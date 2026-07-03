import React from "react";
import { Polygon, Popup } from "react-leaflet";
import { IrrigationZone } from "../types";

interface IrrigationLayerProps {
  irrigationMap?: IrrigationZone[];
}

const IrrigationLayer: React.FC<IrrigationLayerProps> = ({ irrigationMap }) => {
  if (!irrigationMap || irrigationMap.length === 0) return null;

  return (
    <>
      {irrigationMap.map((zone) => (
        <Polygon
          key={zone.id}
          positions={zone.coords as any}
          pathOptions={{
            color: zone.color,
            weight: 1.5,
            fillColor: zone.color,
            fillOpacity: 0.35
          }}
        >
          <Popup>
            <div className="p-1 max-w-[220px]">
              <h3 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-1 mb-1">
                Irrigation Advisory
              </h3>
              {(() => {
                const [blockName, recommendation] = zone.recommendation.includes(": ") 
                  ? zone.recommendation.split(": ") 
                  : [null, zone.recommendation];
                return (
                  <>
                    {blockName && (
                      <p className="text-xs text-gray-600 mb-1">
                        <strong>Subdivision:</strong> <span className="font-semibold text-slate-800">{blockName}</span>
                      </p>
                    )}
                    <p className="text-xs mb-1.5">
                      <strong>Priority:</strong>{" "}
                      <span
                        className="font-bold uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: zone.color + "20",
                          color: zone.color
                        }}
                      >
                        {zone.priority}
                      </span>
                    </p>
                    
                    <div className="space-y-1 text-xs text-gray-600 mb-2">
                      <div>
                        <strong>8-Day Water Deficit:</strong> <span className="font-semibold text-red-600">{zone.deficit} mm</span>
                      </div>
                      <div>
                        <strong>Water Demand (ETc):</strong> {zone.etc} mm
                      </div>
                      <div>
                        <strong>Actual ET (ETa):</strong> {zone.eta} mm
                      </div>
                      <div>
                        <strong>Rainfall Contribution:</strong> {zone.rainfall} mm
                      </div>
                    </div>
                    
                    <div className="p-2 bg-blue-50 rounded text-[11px] text-blue-800 border border-blue-100/50 font-medium">
                      <strong>Advisory:</strong> {recommendation}
                    </div>
                  </>
                );
              })()}
            </div>
          </Popup>
        </Polygon>
      ))}
    </>
  );
};

export default IrrigationLayer;