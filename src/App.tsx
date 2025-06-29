import { useState, useEffect } from "react";
import {
  getInitialBearing,
  interpolateSunAlongRoute,
  interpolateGreatCircle,
} from "./sunUtils";
import "leaflet/dist/leaflet.css";
import airports from "./airports.json";
import { DateTime } from "luxon";
import SunCalc from "suncalc";
import { analyzeWithGemini } from "./geminiService";
import FlightForm from "./components/FlightForm";
import FlightMap from "./components/FlightMap";
import GeminiAnalysis from "./components/GeminiAnalysis";
import { getCurrentDateTime } from "./utils/getCurrentDateTime";

// Helper to check if a date is a DST changeover
function isDSTChange(dt: DateTime) {
  const startOfDay = dt.startOf("day");
  const endOfDay = dt.endOf("day");
  return startOfDay.offset !== endOfDay.offset;
}

// Calculate subsolar point (where the sun is directly overhead)
function getSubsolarPoint(date: Date) {
  const rad = Math.PI / 180;
  const day = date.getUTCDate();
  const month = date.getUTCMonth() + 1;
  const year = date.getUTCFullYear();
  const N1 = Math.floor((275 * month) / 9);
  const N2 = Math.floor((month + 9) / 12);
  const N3 = 1 + Math.floor((year - 4 * Math.floor(year / 4) + 2) / 3);
  const N = N1 - N2 * N3 + day - 30;
  const decl = 23.44 * Math.sin(rad * ((360 / 365) * (N - 81)));
  const minutes = date.getUTCHours() * 60 + date.getUTCMinutes();
  const lon = 180 - minutes / 4;
  return { lat: decl, lon };
}

// Calculate day/night terminator as a polyline
function getTerminatorPolyline(date: Date) {
  const points: [number, number][] = [];
  for (let lon = -180; lon <= 180; lon += 2) {
    const sun = SunCalc.getPosition(date, 0, lon);
    const decl = (sun.declination * 180) / Math.PI;
    if (Number.isFinite(decl)) {
      points.push([decl, lon]);
    }
  }
  return points;
}

// Define types for airport and sun point
interface Airport {
  iata: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  timezone: string;
}

interface SunPoint {
  time: Date;
  lat: number;
  lon: number;
  azimuth: number;
  altitude: number;
}

function App() {
  // State for user input and results
  const [sourceIATA, setSourceIATA] = useState("");
  const [destIATA, setDestIATA] = useState("");
  const [departure, setDeparture] = useState(getCurrentDateTime());
  const [flightTime, setFlightTime] = useState("");
  const [sourceAirport, setSourceAirport] = useState<Airport | null>(null);
  const [destAirport, setDestAirport] = useState<Airport | null>(null);
  const [recommendation, setRecommendation] = useState("");
  const [flightPath, setFlightPath] = useState<[number, number][]>([]);
  const [flightPathSegments, setFlightPathSegments] = useState<
    [number, number][][]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [depTime, setDepTime] = useState<DateTime | null>(null);
  const [arrivalTime, setArrivalTime] = useState<DateTime | null>(null);
  const [dstWarning, setDstWarning] = useState<string | null>(null);
  const [sunSummary, setSunSummary] = useState<string>("");
  const [sunEvents, setSunEvents] = useState<
    Array<{
      type: "sunrise" | "sunset";
      time: Date;
      lat: number;
      lon: number;
      azimuth: number;
      position: string;
    }>
  >([]);
  const [mapTime, setMapTime] = useState<Date>(() => new Date());

  // Gemini AI analysis state
  const [geminiAnalysis, setGeminiAnalysis] = useState<{
    analysis: string;
    tips: string[];
    bestMoments: string[];
    weatherConsiderations: string;
    funFact: string;
  } | null>(null);
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [geminiError, setGeminiError] = useState<string | null>(null);

  // Swap source and destination airports
  const swapAirports = () => {
    setSourceIATA(destIATA);
    setDestIATA(sourceIATA);
  };

  // Generate a shareable link for the current flight
  const makeShareLink = () => {
    const params = new URLSearchParams();
    params.set("source", sourceIATA);
    params.set("destination", destIATA);
    params.set("departure", departure);
    params.set("duration", flightTime);
    const shareableUrl = `${window.location.origin}${
      window.location.pathname
    }?${params.toString()}`;
    navigator.clipboard.writeText(shareableUrl);
  };

  // Prefill form from URL parameters
  const prefillFromURL = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const sourceParam = urlParams.get("source");
    const destinationParam = urlParams.get("destination");
    const departureParam = urlParams.get("departure");
    const durationParam = urlParams.get("duration");
    if (sourceParam) setSourceIATA(sourceParam.toUpperCase());
    if (destinationParam) setDestIATA(destinationParam.toUpperCase());
    if (departureParam) setDeparture(departureParam);
    if (durationParam) setFlightTime(durationParam);
  };

  // On mount, prefill form if URL params exist
  useEffect(() => {
    prefillFromURL();
  }, []);

  // Main form submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setRecommendation("");
    setFlightPath([]);
    setFlightPathSegments([]);
    setDepTime(null);
    setArrivalTime(null);
    setDstWarning(null);
    setSunSummary("");
    setSunEvents([]);
    setGeminiAnalysis(null);
    setGeminiError(null);
    setLoading(true);

    // Validate airports
    const foundSource =
      airports.find((a) => a.iata === sourceIATA.toUpperCase()) || null;
    const foundDest =
      airports.find((a) => a.iata === destIATA.toUpperCase()) || null;
    setSourceAirport(foundSource);
    setDestAirport(foundDest);
    if (!foundSource || !foundDest) {
      setError(
        "Invalid IATA code. Please select a valid airport from the list."
      );
      setLoading(false);
      return;
    }

    try {
      // Parse and validate times
      const depDT = DateTime.fromISO(departure, { zone: foundSource.timezone });
      if (!depDT.isValid) throw new Error("Invalid departure time.");
      const arrDT = depDT
        .plus({ hours: Number(flightTime) })
        .setZone(foundDest.timezone);
      setDepTime(depDT);
      setArrivalTime(arrDT);

      // DST warning
      let warning = "";
      if (isDSTChange(depDT))
        warning += `Warning: Departure day is a DST changeover in ${foundSource.city}.\n`;
      if (isDSTChange(arrDT))
        warning += `Warning: Arrival day is a DST changeover in ${foundDest.city}.`;
      setDstWarning(warning || null);

      // Prepare coordinates
      const src = { lat: foundSource.lat, lon: foundSource.lon };
      const dst = { lat: foundDest.lat, lon: foundDest.lon };

      // Generate flight path segments (handles date line crossing)
      const createFlightPath = (
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number
      ) => {
        const points: [number, number][] = [];
        const steps = 20;
        for (let i = 0; i <= steps; i++) {
          const frac = i / steps;
          const point = interpolateGreatCircle(lat1, lon1, lat2, lon2, frac);
          points.push([point.lat, point.lon]);
        }
        // Split path if crossing the date line
        const segments: [number, number][][] = [];
        let currentSegment: [number, number][] = [];
        for (let i = 0; i < points.length; i++) {
          const point = points[i];
          if (currentSegment.length === 0) {
            currentSegment.push(point);
          } else {
            const prevPoint = currentSegment[currentSegment.length - 1];
            const lonDiff = Math.abs(point[1] - prevPoint[1]);
            if (lonDiff > 180) {
              if (currentSegment.length > 0) segments.push([...currentSegment]);
              currentSegment = [point];
            } else {
              currentSegment.push(point);
            }
          }
        }
        if (currentSegment.length > 0) segments.push(currentSegment);
        return segments;
      };

      const flightPathSegments = createFlightPath(
        src.lat,
        src.lon,
        dst.lat,
        dst.lon
      );
      setFlightPathSegments(flightPathSegments);
      setFlightPath(flightPathSegments.flat());

      // Calculate sun position along the route
      const intervalMin = 10;
      const sunPoints = interpolateSunAlongRoute(
        src.lat,
        src.lon,
        dst.lat,
        dst.lon,
        depDT.toUTC().toJSDate(),
        Number(flightTime),
        intervalMin
      );

      // Detect sunrise/sunset events along the route
      const events: Array<{
        type: "sunrise" | "sunset";
        time: Date;
        lat: number;
        lon: number;
        azimuth: number;
        position: string;
      }> = [];
      let prevAlt: number | null = null;
      for (let i = 0; i < sunPoints.length; i++) {
        const p = sunPoints[i];
        const times = SunCalc.getTimes(p.time, p.lat, p.lon);
        // Calculate flight heading at this point
        let heading = 0;
        if (i < sunPoints.length - 1) {
          const p2 = sunPoints[i + 1];
          heading = getInitialBearing(p.lat, p.lon, p2.lat, p2.lon);
        } else if (i > 0) {
          const p1 = sunPoints[i - 1];
          heading = getInitialBearing(p1.lat, p1.lon, p.lat, p.lon);
        }
        // Calculate relative sun position
        const relAngle = (p.azimuth - heading + 360) % 360;
        let position = "";
        if (relAngle > 45 && relAngle <= 135) position = "Right";
        else if (relAngle > 225 && relAngle <= 315) position = "Left";
        else if (relAngle > 315 || relAngle <= 45) position = "Ahead";
        else if (relAngle > 135 && relAngle <= 225) position = "Behind";
        if (prevAlt !== null && prevAlt < 0 && p.altitude >= 0) {
          let eventTime = times.sunrise;
          if (
            !(
              eventTime &&
              eventTime >= sunPoints[i - 1].time &&
              eventTime <= p.time
            )
          ) {
            const frac = -prevAlt / (p.altitude - prevAlt);
            eventTime = new Date(
              sunPoints[i - 1].time.getTime() +
                frac * (p.time.getTime() - sunPoints[i - 1].time.getTime())
            );
          }
          events.push({
            type: "sunrise",
            time: eventTime,
            lat: p.lat,
            lon: p.lon,
            azimuth: p.azimuth,
            position,
          });
        }
        if (prevAlt !== null && prevAlt >= 0 && p.altitude < 0) {
          let eventTime = times.sunset;
          if (
            !(
              eventTime &&
              eventTime >= sunPoints[i - 1].time &&
              eventTime <= p.time
            )
          ) {
            const frac = prevAlt / (prevAlt - p.altitude);
            eventTime = new Date(
              sunPoints[i - 1].time.getTime() +
                frac * (p.time.getTime() - sunPoints[i - 1].time.getTime())
            );
          }
          events.push({
            type: "sunset",
            time: eventTime,
            lat: p.lat,
            lon: p.lon,
            azimuth: p.azimuth,
            position,
          });
        }
        prevAlt = p.altitude;
      }
      setSunEvents(events);

      // Analyze sun visibility for seat recommendation
      let leftCount = 0,
        rightCount = 0,
        sunVisible = false;
      for (let i = 0; i < sunPoints.length - 1; i++) {
        const p1 = sunPoints[i];
        const p2 = sunPoints[i + 1];
        const heading = getInitialBearing(p1.lat, p1.lon, p2.lat, p2.lon);
        const relAngle = (p1.azimuth - heading + 360) % 360;
        if (p1.altitude >= 0) {
          sunVisible = true;
          if (relAngle > 45 && relAngle <= 135) rightCount++;
          else if (relAngle > 225 && relAngle <= 315) leftCount++;
        }
      }

      // Final seat recommendation
      let seat = "";
      let summary = "";
      if (!sunVisible) {
        seat = "Neither (Sun not visible during flight)";
        summary = "The sun is below the horizon for the entire flight.";
      } else {
        if (leftCount > rightCount) {
          seat = "Left";
        } else if (rightCount > leftCount) {
          seat = "Right";
        } else {
          seat =
            leftCount > 0 ? "Left" : "Neither (Sun not visible during flight)";
        }
      }
      setRecommendation(seat);
      setSunSummary(summary);
      setMapTime(depDT.toJSDate());
      setLoading(false);

      // AI-powered analysis
      try {
        setGeminiLoading(true);
        setGeminiError(null);
        const geminiData = {
          sourceCity: foundSource.city,
          destinationCity: foundDest.city,
          departureTime: depDT.toFormat("yyyy-LL-dd HH:mm ZZZZ"),
          flightTime: flightTime,
          sunSummary: summary,
          recommendation: seat,
          sunEvents: events,
        };
        const analysis = await analyzeWithGemini(geminiData);
        setGeminiAnalysis(analysis);
      } catch (geminiErr: unknown) {
        console.error("Gemini analysis failed:", geminiErr);
        setGeminiError(
          geminiErr && typeof geminiErr === "object" && "message" in geminiErr
            ? String((geminiErr as { message?: string }).message)
            : "Failed to get AI analysis"
        );
        setGeminiAnalysis(null);
      } finally {
        setGeminiLoading(false);
      }
    } catch (err: unknown) {
      setError(
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Failed to get flight data."
      );
      setLoading(false);
    }
  };

  // Calculate min/max time for slider
  const minTime = depTime ? depTime.toMillis() : Date.now();
  const maxTime = arrivalTime ? arrivalTime.toMillis() : Date.now() + 1;
  let sunPoints: SunPoint[] = [];
  if (flightPath.length > 0 && depTime && arrivalTime) {
    sunPoints = interpolateSunAlongRoute(
      sourceAirport!.lat,
      sourceAirport!.lon,
      destAirport!.lat,
      destAirport!.lon,
      depTime.toUTC().toJSDate(),
      Number(flightTime),
      10
    );
  }
  let sunPos: [number, number] | null = null;
  let planePos: [number, number] | null = null;
  let currentSunPoint: SunPoint | null = null;
  if (sunPoints.length > 0 && mapTime) {
    let idx = sunPoints.findIndex(
      (p) => Math.abs(p.time.getTime() - mapTime.getTime()) < 5 * 60 * 1000
    );
    if (idx === -1) idx = 0;
    currentSunPoint = sunPoints[idx];
    sunPos = [currentSunPoint.lat, currentSunPoint.lon];
    planePos = [currentSunPoint.lat, currentSunPoint.lon];
  }

  // Subsolar point and day/night terminator
  const subsolar = getSubsolarPoint(mapTime);
  const terminatorPoints = getTerminatorPolyline(mapTime);

  // Render main app UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 text-white flex flex-col font-sans">
      <header className="py-4 shadow-lg bg-black/40 backdrop-blur-lg border-b border-purple-500/30 sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between px-4">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3 text-white">
            <span className="inline-flex items-center justify-center bg-white p-1 rounded-xl shadow-md">
              <img src="/icon.png" alt="Seat Ray Icon" className="w-8 h-8" />
            </span>
            Seat Ray
          </h1>
        </div>
      </header>
      <main className=" w-[80%] mx-auto px-4 py-8">
        <div className="flex flex-col gap-6 w-full">
          {/* Flight Details Section */}
          <section className="w-full bg-slate-800/60 backdrop-blur-xl rounded-2xl shadow-2xl border border-purple-500/30 p-6 flex flex-col gap-6">
            <h2 className="text-xl font-bold text-white border-b border-purple-500/30 pb-2">
              Flight Details
            </h2>
            <FlightForm
              sourceIATA={sourceIATA}
              destIATA={destIATA}
              departure={departure}
              flightTime={flightTime}
              setSourceIATA={setSourceIATA}
              setDestIATA={setDestIATA}
              setDeparture={setDeparture}
              setFlightTime={setFlightTime}
              swapAirports={swapAirports}
              handleSubmit={handleSubmit}
              loading={loading}
              geminiLoading={geminiLoading}
              makeShareLink={makeShareLink}
              error={error}
              dstWarning={dstWarning}
              recommendation={recommendation}
              sunSummary={sunSummary}
            />
          </section>

          {/* Loading Skeleton Section */}
          {(loading || geminiLoading) && (
            <section className="w-full bg-slate-800/60 backdrop-blur-xl rounded-2xl shadow-2xl border border-purple-500/30 p-6 flex flex-col gap-6">
              <div className="border-b border-purple-500/30 text-white pb-2">
                <div className="h-8 bg-slate-700 rounded animate-pulse mb-2"></div>
                <div className="h-4 bg-slate-700 rounded animate-pulse w-3/4"></div>
              </div>
              <div className="w-full h-96 bg-slate-700 rounded-lg animate-pulse flex items-center justify-center">
                <div className="text-slate-400 text-lg">Loading map...</div>
              </div>
              <div className="space-y-4">
                <div className="h-6 bg-slate-700 rounded animate-pulse w-1/3"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-slate-700 rounded animate-pulse"></div>
                  <div className="h-4 bg-slate-700 rounded animate-pulse w-5/6"></div>
                  <div className="h-4 bg-slate-700 rounded animate-pulse w-4/6"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-slate-700 rounded animate-pulse w-1/4"></div>
                  <div className="h-4 bg-slate-700 rounded animate-pulse w-3/4"></div>
                  <div className="h-4 bg-slate-700 rounded animate-pulse w-2/3"></div>
                </div>
              </div>
            </section>
          )}

          {/* Flight Path & Sun Position Section */}
          {geminiAnalysis && (
            <div className="space-y-6">
              <section className="w-full bg-slate-800/60 backdrop-blur-xl rounded-2xl shadow-2xl border border-purple-500/30 p-6 flex flex-col gap-6">
                {recommendation && (
                  <div className="border-b  border-purple-500/30  text-white  pb-2">
                    <h2 className="text-xl font-bold text-purple-400">
                      Best Seat at flight :{" "}
                      <span className="text-white">{recommendation}</span>
                    </h2>
                    {geminiAnalysis && (
                      <p className="text-sm  my-2">{geminiAnalysis.analysis}</p>
                    )}
                  </div>
                )}
                <FlightMap
                  sourceAirport={sourceAirport}
                  destAirport={destAirport}
                  flightPath={flightPath}
                  flightPathSegments={flightPathSegments}
                  depTime={depTime}
                  arrivalTime={arrivalTime}
                  mapTime={mapTime}
                  setMapTime={setMapTime}
                  sunPoints={sunPoints}
                  subsolar={subsolar}
                  terminatorPoints={terminatorPoints}
                  planePos={planePos}
                  sunPos={sunPos}
                  currentSunPoint={currentSunPoint}
                  minTime={minTime}
                  maxTime={maxTime}
                  flightTime={flightTime}
                />
              </section>
              {/* AI Analysis Section */}
              {depTime && arrivalTime && (
                <section className="w-full  bg-slate-800/60 backdrop-blur-xl rounded-2xl shadow-2xl border border-purple-500/30 p-6 flex flex-col gap-6">
                  <h2 className="text-xl font-bold text-white border-b border-purple-500/30 pb-2">
                    Our Recommendations
                  </h2>
                  <GeminiAnalysis
                    geminiLoading={geminiLoading}
                    geminiError={geminiError}
                    geminiAnalysis={geminiAnalysis}
                    depTime={depTime}
                    arrivalTime={arrivalTime}
                  />
                </section>
              )}
            </div>
          )}
        </div>
      </main>
      <footer className="mt-auto py-6 bg-black/40 backdrop-blur-lg border-t border-purple-500/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="text-purple-400 font-semibold">Seat Ray</span>
              <span>•</span>
              <span>Made with ❤️ by Ronak</span>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-4 text-sm text-slate-400">
              <span>© 2025 Seat Ray. All rights reserved.</span>
              <span>•</span>
              <span>Flight path visualization tool</span>
              <span>•</span>
              <span>Powered by AI analysis</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-700/50 text-xs text-slate-500 text-center">
            <p>
              Seat Ray is a tool for analyzing optimal seating based on sun
              position during flights. All flight data and calculations are for
              informational purposes only.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
