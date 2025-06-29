import React, { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  CircleMarker,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { DateTime } from "luxon";

interface FlightMapProps {
  sourceAirport: any;
  destAirport: any;
  flightPath: [number, number][];
  flightPathSegments: [number, number][][];
  depTime: any;
  arrivalTime: any;
  mapTime: Date;
  setMapTime: (date: Date) => void;
  sunPoints: any[];
  subsolar: any;
  terminatorPoints: any[];
  planePos: [number, number] | null;
  sunPos: [number, number] | null;
  currentSunPoint: any;
  minTime: number;
  maxTime: number;
  flightTime: string;
}

const departureIcon = L.divIcon({
  html: `<div style="background: #a855f7; border: 2px solid white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.4); color: white; font-size: 16px;">📍</div>`,
  className: "custom-marker",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});
const arrivalIcon = L.divIcon({
  html: `<div style="background: #dc2626; border: 2px solid white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.4); color: white; font-size: 16px;">📍</div>`,
  className: "custom-marker",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

function FitBounds({ bounds }: { bounds: L.LatLngBoundsExpression }) {
  const map = useMap();
  React.useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  return null;
}

const FlightMap: React.FC<FlightMapProps> = ({
  sourceAirport,
  destAirport,
  flightPath,
  flightPathSegments,
  depTime,
  arrivalTime,
  mapTime,
  setMapTime,
  subsolar,
  terminatorPoints,
  planePos,
  sunPos,
  currentSunPoint,
  minTime,
  maxTime,
}) => {
  const sliderRef = useRef<HTMLInputElement>(null);
  const autoSlideRef = useRef<number | null>(null);

  // Auto-slide functionality when data is loaded
  useEffect(() => {
    if (depTime && arrivalTime && sliderRef.current) {
      // Clear any existing auto-slide
      if (autoSlideRef.current) {
        clearInterval(autoSlideRef.current);
      }

      // Calculate total flight duration in milliseconds
      const totalDuration = maxTime - minTime;

      // Start auto-sliding
      let currentProgress = 0; // 0 to 100
      autoSlideRef.current = window.setInterval(() => {
        if (currentProgress >= 100) {
          // Stop auto-sliding when reaching 100%
          if (autoSlideRef.current) {
            clearInterval(autoSlideRef.current);
            autoSlideRef.current = null;
          }
          return;
        }

        // Calculate current time based on progress percentage
        const currentTime = minTime + (currentProgress / 100) * totalDuration;
        setMapTime(new Date(currentTime));

        currentProgress += 0.1; // Move 0.1% forward
      }, 2); // Update every 0.002 seconds (2 milliseconds)
    }

    return () => {
      if (autoSlideRef.current) {
        clearInterval(autoSlideRef.current);
      }
    };
  }, [depTime, arrivalTime, minTime, maxTime, setMapTime]);

  // Calculate plane direction based on its position in the flight path
  const getPlaneDirection = () => {
    if (!planePos || !destAirport) return 0;

    // Calculate angle from plane position to destination
    const angle =
      (Math.atan2(
        destAirport.lon - planePos[1],
        destAirport.lat - planePos[0]
      ) *
        180) /
      Math.PI;

    return angle;
  };

  const planeDirection = getPlaneDirection();

  const getTimePeriodClass = (time: Date) => {
    const hour = time.getHours();
    if (hour >= 5 && hour < 12) return "slider--morning";
    if (hour >= 12 && hour < 17) return "slider--afternoon";
    if (hour >= 17 && hour < 20) return "slider--evening";
    return "slider--night";
  };

  const getProgressColor = (time: Date) => {
    const hour = time.getHours();
    if (hour >= 5 && hour < 12) return "#3b82f6"; // Blue for morning
    if (hour >= 12 && hour < 17) return "#8b5cf6"; // Purple for afternoon
    if (hour >= 17 && hour < 20) return "#f59e0b"; // Orange for evening
    return "#ef4444"; // Red for night
  };

  const timePeriodClass = getTimePeriodClass(mapTime);
  const progressColor = getProgressColor(mapTime);
  const progressPercentage =
    ((mapTime.getTime() - minTime) / (maxTime - minTime)) * 100;

  return (
    <div className="bg-slate-800/60 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-2xl border border-purple-500/30 p-4 sm:p-6 flex-1 flex flex-col">
      <div className="h-64 sm:h-80 lg:h-96 rounded-lg overflow-hidden border-2 border-purple-500/30 shadow-inner">
        <MapContainer
          center={
            sourceAirport ? [sourceAirport.lat, sourceAirport.lon] : [0, 0]
          }
          zoom={3}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
          className="z-0"
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />

          {/* Main flight path - direct connection */}
          {flightPath.length > 0 && (
            <Polyline
              positions={flightPath}
              pathOptions={{
                color: "#a855f7",
                weight: 4,
                opacity: 0.9,
              }}
            />
          )}

          {/* Segmented flight path (optional - for showing different phases) */}
          {flightPathSegments.length > 0 &&
            flightPathSegments.map((segment, index) => (
              <Polyline
                key={`segment-${index}`}
                positions={segment}
                pathOptions={{
                  color: "#8b5cf6",
                  weight: 2,
                  dashArray: "8, 4",
                  opacity: 0.6,
                }}
              />
            ))}

          {flightPath.length > 0 && <FitBounds bounds={flightPath} />}

          {/* Departure airport marker */}
          {sourceAirport && (
            <Marker
              position={[sourceAirport.lat, sourceAirport.lon]}
              icon={departureIcon}
            >
              <Popup>
                <div className="font-bold text-purple-600 text-sm sm:text-base">
                  🛫 Departure: {sourceAirport.city} ({sourceAirport.iata})
                </div>
                <div className="text-xs sm:text-sm text-gray-600">
                  {sourceAirport.name}
                </div>
              </Popup>
            </Marker>
          )}

          {/* Arrival airport marker */}
          {destAirport && (
            <Marker
              position={[destAirport.lat, destAirport.lon]}
              icon={arrivalIcon}
            >
              <Popup>
                <div className="font-bold text-red-600 text-sm sm:text-base">
                  🛬 Arrival: {destAirport.city} ({destAirport.iata})
                </div>
                <div className="text-xs sm:text-sm text-gray-600">
                  {destAirport.name}
                </div>
              </Popup>
            </Marker>
          )}

          {terminatorPoints && terminatorPoints.length > 0 && (
            <Polyline
              positions={terminatorPoints.map(([lat, lon]) => [lat, lon])}
              pathOptions={{ color: "#9ca3af", weight: 2, dashArray: "4" }}
            />
          )}
          {subsolar && (
            <CircleMarker
              center={[subsolar.lat, subsolar.lon]}
              pathOptions={{
                color: "#f59e0b",
                fillColor: "#f59e0b",
                fillOpacity: 0.7,
              }}
              radius={10}
            >
              <Popup>
                <div className="font-bold text-amber-500 text-sm sm:text-base">
                  Subsolar Point
                </div>
                <div className="text-xs sm:text-sm">Sun directly overhead</div>
              </Popup>
            </CircleMarker>
          )}
          {planePos && (
            <Marker
              position={planePos}
              icon={L.divIcon({
                html: `<div style="transform: rotate(${planeDirection}deg); background: #a855f7; border: 2px solid white; border-radius: 50%; width: 20px; height: 20px; sm:width: 24px; sm:height: 24px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3); color: white; font-size: 10px; sm:font-size: 12px;">✈️</div>`,
                className: "custom-marker",
                iconSize: [20, 20],
                iconAnchor: [10, 10],
              })}
            >
              <Popup>
                <div className="font-bold text-sm sm:text-base">
                  ✈️ Plane Position
                </div>
                <div className="text-xs sm:text-sm">
                  {DateTime.fromJSDate(mapTime).toFormat(
                    "yyyy-LL-dd HH:mm ZZZZ"
                  )}
                </div>
              </Popup>
            </Marker>
          )}
          {sunPos && (
            <CircleMarker
              center={sunPos}
              pathOptions={{
                color: "#f59e0b",
                fillColor: "#f59e0b",
                fillOpacity: 0.8,
                weight: 3,
              }}
              radius={12}
            >
              <Popup>
                <div className="font-bold text-amber-500 text-sm sm:text-base">
                  ☀️ Sun Position
                </div>
                <div className="text-xs sm:text-sm text-gray-300 mt-1">
                  {currentSunPoint && (
                    <>
                      <div>
                        Altitude: {currentSunPoint.altitude.toFixed(1)}°
                      </div>
                      <div>Azimuth: {currentSunPoint.azimuth.toFixed(1)}°</div>
                      <div className="text-amber-400 font-medium">
                        {currentSunPoint.altitude > 0
                          ? "☀️ Above Horizon"
                          : "🌙 Below Horizon"}
                      </div>
                    </>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          )}
        </MapContainer>
      </div>
      {depTime && arrivalTime && (
        <div className="mt-4 sm:mt-6 lg:mt-8">
          <label
            className="block text-sm sm:text-base font-semibold mb-2 sm:mb-3 text-slate-300"
            htmlFor="time-slider"
          >
            Select Any Time During The Flight
          </label>
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-300">
              <span>
                {DateTime.fromJSDate(new Date(minTime)).toFormat("HH:mm")}
              </span>
              <span className="text-purple-400 font-medium">
                {DateTime.fromJSDate(mapTime).toFormat("HH:mm")}
              </span>
              <span>
                {DateTime.fromJSDate(new Date(maxTime)).toFormat("HH:mm")}
              </span>
            </div>

            <div className="relative">
              <input
                id="time-slider"
                ref={sliderRef}
                type="range"
                min={minTime}
                max={maxTime}
                step={10 * 60 * 1000}
                value={mapTime.getTime()}
                onChange={(e) => setMapTime(new Date(Number(e.target.value)))}
                className={`w-full h-2 sm:h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer slider relative z-10 ${timePeriodClass}`}
                style={{
                  background: `linear-gradient(to right, 
                    ${progressColor} 0%, 
                    ${progressColor} ${progressPercentage}%, 
                    #374151 ${progressPercentage}%, 
                    #374151 100%)`,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlightMap;
