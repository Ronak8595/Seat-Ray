import React from "react";
import Select from "react-select";
import { FixedSizeList as List } from "react-window";
import airports from "../airports.json";

interface AirportOption {
  value: string;
  label: string;
  airport: any;
}

interface FlightFormProps {
  sourceIATA: string;
  destIATA: string;
  departure: string;
  flightTime: string;
  setSourceIATA: (iata: string) => void;
  setDestIATA: (iata: string) => void;
  setDeparture: (val: string) => void;
  setFlightTime: (val: string) => void;
  swapAirports: () => void;
  handleSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  geminiLoading: boolean;
  makeShareLink: () => void;
  error: string | null;
  dstWarning: string | null;
  recommendation: string;
  sunSummary: string;
}

const airportOptions: AirportOption[] = airports.map((airport: any) => ({
  value: airport.iata,
  label: `${airport.iata} - ${airport.city}, ${airport.country}`,
  airport: airport,
}));

const customSelectStyles = {
  control: (provided: any, state: any) => ({
    ...provided,
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    borderRadius: "0.5rem",
    border: state.isFocused ? "2px solid #a855f7" : "2px solid transparent",
    boxShadow: "none",
    minHeight: "44px",
    "&:hover": {
      borderColor: "#a855f7",
    },
  }),
  menu: (provided: any) => ({
    ...provided,
    backgroundColor: "rgba(30, 41, 59, 0.95)",
    backdropFilter: "blur(10px)",
    borderRadius: "0.5rem",
    border: "1px solid rgba(168, 85, 247, 0.5)",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
    zIndex: 1000,
    marginTop: "4px",
  }),
  option: (provided: any, state: any) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "#a855f7"
      : state.isFocused
      ? "rgba(168, 85, 247, 0.2)"
      : "transparent",
    color: state.isSelected ? "#ffffff" : "#d1d5db",
    padding: "12px 16px",
    cursor: "pointer",
    margin: "2px 8px",
    borderRadius: "0.375rem",
    "&:active": {
      backgroundColor: "rgba(168, 85, 247, 0.3)",
    },
  }),
  singleValue: (provided: any) => ({
    ...provided,
    color: "#d1d5db",
    fontWeight: "500",
  }),
  input: (provided: any) => ({
    ...provided,
    color: "#d1d5db",
  }),
  placeholder: (provided: any) => ({
    ...provided,
    color: "#9ca3af",
  }),
  noOptionsMessage: (provided: any) => ({
    ...provided,
    color: "#9ca3af",
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    padding: "16px",
  }),
  menuList: (provided: any) => ({
    ...provided,
    padding: "4px",
  }),
};

const CustomOption = ({ data, isFocused, isSelected, innerProps }: any) => {
  const airport = data.airport;
  return (
    <div
      {...innerProps}
      className={`p-3 cursor-pointer transition-colors w-full ${
        isSelected
          ? "bg-purple-500 text-white"
          : isFocused
          ? "bg-purple-500/20 text-slate-200"
          : "text-slate-300"
      }`}
    >
      <div className="flex items-center w-full">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">{airport.iata}</div>
          <div className="text-xs opacity-80 truncate">
            {airport.city}, {airport.country}
          </div>
          <div className="text-xs opacity-60 truncate">{airport.name}</div>
        </div>
      </div>
    </div>
  );
};

const MenuList = (props: any) => {
  const { options, children, maxHeight, getValue } = props;
  const [value] = getValue();
  const initialOffset = Array.isArray(options)
    ? options.indexOf(value) * 50
    : 0;
  return (
    <List
      width="100%"
      height={maxHeight}
      itemCount={Array.isArray(children) ? children.length : 0}
      itemSize={50}
      initialScrollOffset={initialOffset}
    >
      {({ index, style }: any) => (
        <div style={{ ...style, width: "100%", overflow: "hidden" }}>
          {Array.isArray(children) ? children[index] : null}
        </div>
      )}
    </List>
  );
};

const FlightForm: React.FC<FlightFormProps> = ({
  sourceIATA,
  destIATA,
  departure,
  flightTime,
  setSourceIATA,
  setDestIATA,
  setDeparture,
  setFlightTime,
  swapAirports,
  handleSubmit,
  loading,
  geminiLoading,
  error,
  dstWarning,
}) => {
  // Get current date and time for min attribute
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const minDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;

  return (
    <form className="flex flex-col gap-4 sm:gap-6" onSubmit={handleSubmit}>
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 items-end">
        <div className="flex-1 w-full">
          <label
            className="block text-sm sm:text-base font-semibold mb-1 sm:mb-2 text-slate-300"
            htmlFor="source"
          >
            From
          </label>
          <Select<AirportOption>
            id="source"
            options={airportOptions}
            value={airportOptions.find((opt) => opt.value === sourceIATA)}
            onChange={(selectedOption) => {
              if (selectedOption) setSourceIATA(selectedOption.value);
            }}
            styles={customSelectStyles}
            placeholder="Enter the source airport..."
            components={{ MenuList, Option: CustomOption }}
            isSearchable={true}
            filterOption={(option: any, inputValue: string) => {
              const airport = option.data.airport;
              const searchTerm = inputValue.toLowerCase();
              return (
                airport.iata.toLowerCase().includes(searchTerm) ||
                airport.city.toLowerCase().includes(searchTerm) ||
                airport.country.toLowerCase().includes(searchTerm) ||
                airport.name.toLowerCase().includes(searchTerm)
              );
            }}
          />
        </div>
        <button
          type="button"
          onClick={swapAirports}
          className="p-2 sm:p-3 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-purple-400 transition-all duration-200 border border-slate-600/50 hover:border-purple-500/50 self-center lg:self-end"
          title="Swap airports"
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
            />
          </svg>
        </button>
        <div className="flex-1 w-full">
          <label
            className="block text-sm sm:text-base font-semibold mb-1 sm:mb-2 text-slate-300"
            htmlFor="dest"
          >
            To
          </label>
          <Select<AirportOption>
            id="dest"
            options={airportOptions}
            value={airportOptions.find((opt) => opt.value === destIATA)}
            onChange={(selectedOption) => {
              if (selectedOption) setDestIATA(selectedOption.value);
            }}
            styles={customSelectStyles}
            placeholder="Enter the destination airport..."
            components={{ MenuList, Option: CustomOption }}
            isSearchable={true}
            filterOption={(option: any, inputValue: string) => {
              const airport = option.data.airport;
              const searchTerm = inputValue.toLowerCase();
              return (
                airport.iata.toLowerCase().includes(searchTerm) ||
                airport.city.toLowerCase().includes(searchTerm) ||
                airport.country.toLowerCase().includes(searchTerm) ||
                airport.name.toLowerCase().includes(searchTerm)
              );
            }}
          />
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
        <div className="flex-1">
          <label
            className="block text-sm sm:text-base font-semibold mb-1 sm:mb-2 text-slate-300"
            htmlFor="departure"
          >
            Departure Time
          </label>
          <input
            id="departure"
            type="datetime-local"
            min={minDateTime}
            placeholder="Enter the departure time..."
            className="w-full rounded-lg px-3 sm:px-4 py-2 sm:py-3 bg-slate-700/70 text-white placeholder:text-slate-400 border border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm sm:text-base"
            value={departure}
            onChange={(e) => setDeparture(e.target.value)}
            required
          />
        </div>
        <div className="flex-1">
          <label
            className="block text-sm sm:text-base font-semibold mb-1 sm:mb-2 text-slate-300"
            htmlFor="flightTime"
          >
            Flight Duration (hrs)
          </label>
          <input
            id="flightTime"
            type="number"
            step="0.1"
            min="0.1"
            placeholder="Enter the flight duration..."
            className="w-full rounded-lg px-3 sm:px-4 py-2 sm:py-3 bg-slate-700/70 text-white placeholder:text-slate-400 border border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm sm:text-base"
            value={flightTime}
            onChange={(e) => setFlightTime(e.target.value)}
            required
          />
        </div>
      </div>
      <button
        type="submit"
        className={`mt-4 sm:mt-6 w-full py-3 sm:py-4 rounded-lg font-bold text-base sm:text-lg text-white shadow-lg transition-all duration-300 ${
          loading || geminiLoading
            ? "bg-slate-600 cursor-not-allowed opacity-60"
            : "bg-gradient-to-r from-purple-600 to-indigo-600 cursor-pointer hover:shadow-purple-500/20 hover:scale-[1.02]"
        }`}
        disabled={loading || geminiLoading}
      >
        {loading || geminiLoading
          ? "Calculating..."
          : "Get Path and Sun Events"}
      </button>
      {error && (
        <div className="mt-2 p-3 sm:p-4 bg-red-500/80 rounded-lg text-white font-semibold text-sm sm:text-base">
          {error}
        </div>
      )}
      {dstWarning && (
        <div className="mt-2 p-3 sm:p-4 bg-purple-500/80 rounded-lg text-white font-semibold whitespace-pre-line text-sm sm:text-base">
          {dstWarning}
        </div>
      )}
    </form>
  );
};

export default FlightForm;
