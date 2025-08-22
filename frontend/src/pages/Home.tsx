import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
export default function Home() {
  return (
    <div className="mx-auto w-full max-w-screen-sm">
      <ul className="flex flex-col bg-white p-6 rounded-lg shadow-md space-y-4">
        <li className="text-gray-700 text-lg leading-relaxed">
          Be sure to check out Free Play to get the full PokeGridso experience
        </li>
        <li className="text-gray-700 text-lg leading-relaxed">
          Big Thanks to{" "}
          <a
            href="https://pokedoku.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 font-bold hover:underline hover:text-blue-800 text-xl transition-colors duration-200"
          >
            PokeDoku
          </a>{" "}
          and{" "}
          <a
            href="https://pokeapi.co/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 font-bold hover:underline hover:text-blue-800 text-xl transition-colors duration-200"
          >
            pokeapi.co
          </a>{" "}
          for making this possible
        </li>
        <li className="text-gray-700 text-lg leading-relaxed">
          Select a Pokemon for each cell that matches the criteria for its row
          and column
        </li>
        <li className="text-gray-700 text-lg leading-relaxed">
          You only have 9 guesses to fill out the grid
        </li>
        <li className="text-gray-700 text-lg leading-relaxed">
          Once you pick a pokemon, it's locked in so be careful
        </li>
        <li className="text-gray-700 text-lg leading-relaxed">
          Your overall score is all of your answer's percentages added up. Each
          day the scoring mechanic will be randomized and you can click on the ?
          to find out what it is.
        </li>
        <Link to="/game/daily">
          <Button className="w-full cursor-pointer py-3 text-lg font-semibold text-white rounded-md shadow-md transition-colors duration-200">
            Play the Daily
          </Button>
        </Link>
      </ul>
    </div>
  );
}
