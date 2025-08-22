// Game.tsx - Modified to round grid corners
import { useParams } from "react-router-dom";
import type { FC } from "react";
import { useEffect, useState } from "react";
import { auth } from "../lib/firebase"; // Add this import

type GameParams = {
  mode: "daily" | "custom" | "weekly";
};

type cell = {
  guess: string | null;
  sprite: string | null;
  percentage: number | null;
};

type category = {
  type: string;
  name: string;
};

type PuzzleData = {
  date: string;
  completed: boolean;
  method: string;
  pp: number;
  options: boolean;
  config: {
    categories: number[];
    winCondition: {
      isMinimum: boolean;
      isSecond: boolean;
      targetMetric: number;
    };
    gameOptions: {
      limitedGuesses: boolean;
      showAllOptions: boolean;
      maxRepeats: number;
    };
  };
  boxes: [[cell, cell, cell], [cell, cell, cell], [cell, cell, cell]];
  xCategories: [category, category, category];
  yCategories: [category, category, category];
  type: string;
  id: string;
  userId: string;
  isGuest: boolean;
};

// Helper function to get the correct corner rounding class
const getCornerClass = (
  x: number,
  y: number,
  xMax: number,
  yMax: number
): string => {
  const isTop = y === 0;
  const isBottom = y === yMax;
  const isLeft = x === 0;
  const isRight = x === xMax;

  if (isTop && isLeft) return "rounded-tl-lg";
  if (isTop && isRight) return "rounded-tr-lg";
  if (isBottom && isLeft) return "rounded-bl-lg";
  if (isBottom && isRight) return "rounded-br-lg";

  return ""; // Return an empty string for non-corner cells
};

const Game: FC = () => {
  const { mode } = useParams<GameParams>();
  const [gameData, setGameData] = useState<PuzzleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [score] = useState<number>(0);
  const [points] = useState<number>(0);
  const [pp] = useState<number>(9);

  // Fetch puzzle data when mode changes
  useEffect(() => {
    // Reset state
    setGameData(null);
    setError(null);
    setLoading(true);

    // Game.tsx - Update the fetchGameData function
    const fetchGameData = async () => {
      try {
        const apiUrl = import.meta.env.PROD
          ? "https://pokegridso-api.vercel.app/"
          : "http://localhost:3000/api";

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        // Get Firebase ID token
        const user = auth.currentUser;
        if (user) {
          const idToken = await user.getIdToken();
          headers["Authorization"] = `Bearer ${idToken}`;
        }

        // Get search parameters for custom mode
        const searchParams = window.location.search;

        // Add cache-busting parameter for weekly mode
        let fullUrl = `${apiUrl}/puzzle/${mode}.json${searchParams}`;
        if (mode === "weekly") {
          const timestamp = new Date().getTime();
          const separator = searchParams ? "&" : "?";
          fullUrl = `${fullUrl}${separator}_=${timestamp}`;
        }

        const response = await fetch(fullUrl, {
          headers,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const PuzzleData = await response.json();
        setGameData(PuzzleData);
      } catch (err: unknown) {
        console.error(`Failed to fetch ${mode} puzzle:`, err);
        if (err instanceof Error) {
          setError(`Failed to load ${mode} puzzle: ${err.message}`);
        } else {
          setError(`Failed to load ${mode} puzzle`);
        }
      } finally {
        setLoading(false);
      }
    };

    // Only fetch for valid modes
    if (mode === "daily" || mode === "custom" || mode === "weekly") {
      fetchGameData();
    }
  }, [mode]);

  // Handle invalid modes
  if (!mode || (mode !== "daily" && mode !== "custom" && mode !== "weekly")) {
    return <div>Invalid game mode!</div>;
  }

  // Render the game grid
  const renderGameGrid = () => {
    if (!gameData) return null;

    const xCategories = gameData.xCategories;
    const yCategories = gameData.yCategories;

    // Calculate max indices for corner detection
    const yMaxIndex = yCategories.length - 1;
    const xMaxIndex = xCategories.length - 1;

    let title = `${gameData.type} Puzzle - ${gameData.date}`;
    if (mode === "daily") {
      title = "Today's Puzzle";
    } else if (mode === "weekly") {
      title = "Random Weekly Puzzle";
    } else if (mode === "custom") {
      title = "Your Custom Puzzle";
    }

    return (
      <div className="flex flex-col items-center w-full">
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight text-center">
          {title}
        </h2>

        {/* Responsive Grid container */}
        <div className="w-full md:max-w-3xl sm:max-w-xl mt-4">
          {/* Unified Responsive Grid */}
          <div className="grid grid-cols-[max-content_repeat(3,minmax(0,1fr))] md:grid-cols-[max-content_repeat(3,minmax(0,1fr))_max-content] gap-1 md:gap-2 rounded-2xl">
            {" "}
            {/* Top row */}
            <div></div> {/* Top-left empty */}
            {/* X headers - Top row (columns 2-4) */}
            {xCategories.map((cat, i) => (
              <div
                key={`x-header-${i}`}
                className="flex flex-col items-center justify-end text-center rounded-xl"
              >
                <div className="text-[2vw] md:text-sm font-medium text-gray-500">
                  {cat.type}
                </div>
                <div className="text-[2.5vw] md:text-lg font-bold text-gray-900">
                  {cat.name}
                </div>
              </div>
            ))}
            {/* Empty top-right corner (only on desktop) */}
            <div className="hidden md:block"></div>
            {/* Left column: Y headers (3 rows nested) */}
            <div className="grid grid-rows-3">
              {yCategories.map((cat, i) => (
                <div
                  key={`y-header-${i}`}
                  className="flex items-center justify-end text-center "
                >
                  <div className="flex flex-col items-start">
                    <div className="text-[2vw] md:text-sm font-medium text-gray-500 text-wrap">
                      {cat.type}
                    </div>
                    <div className="text-[2.5vw] md:text-lg font-bold text-gray-900 text-wrap">
                      {cat.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Main 3x3 grid */}
            <div className="col-span-3 bg-gradient-to-br from-gray-800 to-gray-900 p-1 shadow-md rounded-lg">
              <div className="grid grid-cols-3 grid-rows-3 gap-1 h-full">
                {yCategories.map((_, y) =>
                  xCategories.map((_, x) => (
                    <div
                      key={`cell-${y}-${x}`}
                      className={`
                      aspect-square bg-gray-700 border border-gray-600 
                      flex items-center justify-center cursor-pointer 
                      hover:bg-gray-600 transition-all duration-200
                      ${getCornerClass(x, y, xMaxIndex, yMaxIndex)}
                    `}
                      onClick={() => {
                        handleClickedCell(x, y);
                      }}
                    >
                      <div className="text-gray-300 text-xs md:text-sm text-center px-1"></div>
                    </div>
                  ))
                )}
              </div>
            </div>
            {/* Right-side info panel (only visible on desktop) */}
            <div className="hidden md:grid grid-rows-3 gap-1 h-full">
              {[`Score: ${score}`, `Points: ${points}`, `PP: ${pp} / 9`].map(
                (text, index) => (
                  <div
                    key={`game-info-${index}`}
                    className="flex items-center justify-center text-center p-2 rounded-lg"
                  >
                    <div className="text-lg font-medium text-purple-800">
                      {text}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Mobile Info Section - Only visible on mobile */}
          <div className="grid grid-cols-3 gap-2 mt-4 md:hidden">
            <div className="flex items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm p-3">
              <div className="text-lg font-medium text-purple-800">
                Score: {score}
              </div>
            </div>
            <div className="flex items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm p-3">
              <div className="text-lg font-medium text-purple-800">
                Points: {points}
              </div>
            </div>
            <div className="flex items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm p-3">
              <div className="text-lg font-medium text-purple-800">
                PP: {pp}/9
              </div>
            </div>
          </div>
        </div>

        {/* Game info */}
        <div className="mt-8 p-4 md:p-6 bg-white rounded-2xl shadow-md w-full max-w-lg">
          <div className="grid grid-cols-2 gap-3 md:gap-4 text-sm md:text-base text-gray-800">
            <div>
              <span className="font-semibold">Target Metric:</span>{" "}
              {gameData.config.winCondition.targetMetric}
            </div>
            <div>
              <span className="font-semibold">PP Mode:</span>{" "}
              {gameData.config.gameOptions.limitedGuesses ? "On" : "Off"}
            </div>
            <div>
              <span className="font-semibold">Minimum:</span>{" "}
              {gameData.config.winCondition.isMinimum ? "Yes" : "No"}
            </div>
            <div>
              <span className="font-semibold">Second Extreme:</span>{" "}
              {gameData.config.winCondition.isSecond ? "Yes" : "No"}
            </div>
          </div>
        </div>
      </div>
    );
  };

  function handleClickedCell(x: number, y: number) {
    console.log(`Clicked cell [${y}][${x}]`);
    console.log(getCategoriesByCell(x, y));
  }

  function getCategoriesByCell(x: number, y: number) {
    if (!gameData) return [];

    return [gameData.xCategories[x], gameData.yCategories[y]];
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading {mode} puzzle...</div>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-red-500 text-lg">{error}</div>
        </div>
      ) : gameData ? (
        renderGameGrid()
      ) : (
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">No puzzle data available</div>
        </div>
      )}
    </div>
  );
};

export default Game;
