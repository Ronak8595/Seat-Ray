import React from "react";
import { FaStar, FaSun, FaCloud, FaSmile } from "react-icons/fa";

interface GeminiAnalysisProps {
  geminiLoading: boolean;
  geminiError: string | null;
  geminiAnalysis: any;
  depTime: any;
  arrivalTime: any;
}

const GeminiAnalysis: React.FC<GeminiAnalysisProps> = ({
  geminiLoading,
  geminiError,
  geminiAnalysis,
}) => {
  return (
    <section className="w-full bg-slate-800/60 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-2xl border border-purple-500/30 p-4 sm:p-6">
      {geminiLoading && (
        <div className="text-center py-6 sm:py-8">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-purple-500 mx-auto mb-3 sm:mb-4"></div>
          <p className="text-slate-400 text-sm sm:text-base">Generating...</p>
        </div>
      )}
      {geminiError && !geminiLoading && (
        <div className="text-center py-6 sm:py-8">
          <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">⚠️</div>
          <h3 className="text-base sm:text-lg font-semibold text-red-400 mb-2">
            Analysis Unavailable
          </h3>
          <p className="text-slate-400 text-xs sm:text-sm mb-3 sm:mb-4">
            {geminiError}
          </p>
          <div className="text-xs text-slate-500">
            <p>
              To enable analysis, please set your Gemini API key in the
              environment variables.
            </p>
            <p className="mt-2">
              Add VITE_GEMINI_API_KEY=your_api_key to your .env file
            </p>
          </div>
        </div>
      )}
      {geminiAnalysis && !geminiLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Best Moments */}
          <div className="p-3 sm:p-4 rounded-lg bg-slate-700/50 border border-slate-600/50">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <FaSun className="text-purple-400 text-sm sm:text-base" />
              <h3 className="font-semibold text-white text-sm sm:text-base">
                Best Viewing Moments
              </h3>
            </div>
            <ul className="space-y-1 sm:space-y-2">
              {geminiAnalysis.bestMoments.map(
                (moment: string, index: number) => (
                  <li
                    key={index}
                    className="text-slate-300 text-xs sm:text-sm flex items-start gap-2"
                  >
                    <span className="text-purple-400 mt-1">•</span>
                    <span>{moment}</span>
                  </li>
                )
              )}
            </ul>
          </div>
          {/* Practical Tips */}
          <div className="p-3 sm:p-4 rounded-lg bg-slate-700/50 border border-slate-600/50">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <FaStar className="text-purple-400 text-sm sm:text-base" />
              <h3 className="font-semibold text-white text-sm sm:text-base">
                Practical Tips
              </h3>
            </div>
            <ul className="space-y-1 sm:space-y-2">
              {geminiAnalysis.tips.map((tip: string, index: number) => (
                <li
                  key={index}
                  className="text-slate-300 text-xs sm:text-sm flex items-start gap-2"
                >
                  <span className="text-purple-400 mt-1">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
          {/* Weather Considerations */}
          <div className="p-3 sm:p-4 rounded-lg bg-slate-700/50 border border-slate-600/50">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <FaCloud className="text-slate-400 text-sm sm:text-base" />
              <h3 className="font-semibold text-white text-sm sm:text-base">
                Weather Considerations
              </h3>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              {geminiAnalysis.weatherConsiderations}
            </p>
          </div>
          {/* Fun Fact */}
          <div className="p-3 sm:p-4 rounded-lg bg-slate-700/50 border border-slate-600/50">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <FaSmile className="text-purple-400 text-sm sm:text-base" />
              <h3 className="font-semibold text-white text-sm sm:text-base">
                Fun Fact
              </h3>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              {geminiAnalysis.funFact}
            </p>
          </div>
        </div>
      )}
    </section>
  );
};

export default GeminiAnalysis;
