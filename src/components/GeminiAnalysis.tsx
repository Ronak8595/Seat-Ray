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
    <section className="w-full bg-slate-800/60 backdrop-blur-xl rounded-2xl shadow-2xl border border-purple-500/30 p-6">
      {geminiLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Generating...</p>
        </div>
      )}
      {geminiError && !geminiLoading && (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-red-400 mb-2">
            Analysis Unavailable
          </h3>
          <p className="text-slate-400 text-sm mb-4">{geminiError}</p>
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
        <div className="grid grid-cols-2 gap-6">
          {/* Best Moments */}
          <div className="p-4 rounded-lg bg-slate-700/50 border border-slate-600/50">
            <div className="flex items-center gap-2 mb-3">
              <FaSun className="text-purple-400" />
              <h3 className="font-semibold text-white">Best Viewing Moments</h3>
            </div>
            <ul className="space-y-2">
              {geminiAnalysis.bestMoments.map(
                (moment: string, index: number) => (
                  <li
                    key={index}
                    className="text-slate-300 text-sm flex items-start gap-2"
                  >
                    <span className="text-purple-400 mt-1">•</span>
                    <span>{moment}</span>
                  </li>
                )
              )}
            </ul>
          </div>
          {/* Practical Tips */}
          <div className="p-4 rounded-lg bg-slate-700/50 border border-slate-600/50">
            <div className="flex items-center gap-2 mb-3">
              <FaStar className="text-purple-400" />
              <h3 className="font-semibold text-white">Practical Tips</h3>
            </div>
            <ul className="space-y-2">
              {geminiAnalysis.tips.map((tip: string, index: number) => (
                <li
                  key={index}
                  className="text-slate-300 text-sm flex items-start gap-2"
                >
                  <span className="text-purple-400 mt-1">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
          {/* Weather Considerations */}
          <div className="p-4 rounded-lg bg-slate-700/50 border border-slate-600/50">
            <div className="flex items-center gap-2 mb-3">
              <FaCloud className="text-slate-400" />
              <h3 className="font-semibold text-white">
                Weather Considerations
              </h3>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              {geminiAnalysis.weatherConsiderations}
            </p>
          </div>
          {/* Fun Fact */}
          <div className="p-4 rounded-lg bg-slate-700/50 border border-slate-600/50">
            <div className="flex items-center gap-2 mb-3">
              <FaSmile className="text-purple-400" />
              <h3 className="font-semibold text-white">Fun Fact</h3>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              {geminiAnalysis.funFact}
            </p>
          </div>
        </div>
      )}
    </section>
  );
};

export default GeminiAnalysis;
