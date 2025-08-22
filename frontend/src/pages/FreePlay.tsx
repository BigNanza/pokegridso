// FreePlay.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const FreePlay: React.FC = () => {
  const navigate = useNavigate();

  // Categories
  const categories = [
    "Mono/Dual Type",
    "Types",
    "Groups",
    "Evos",
    "Colors",
    "Abil",
    "Generations",
    "Moves",
    "Evolution Triggers",
    "Abilities",
    "Egg Groups",
    "Gender Rates",
    "Growth Rates",
    "Shapes",
  ];
  const [selectedCategories, setSelectedCategories] = useState<number[]>([
    0, 1, 2, 6,
  ]); // Default: 0, 1, 2, 6

  // Win Conditions
  const winConditions = [
    "Weight",
    "Shine",
    "Speed",
    "Learnset",
    "Height",
    "Stats",
    "Smash Rate",
    "Scrabble Score",
    "HP",
    "Attack",
    "Defense",
    "Special Attack",
    "Special Defense",
    "VGC Usage",
    "Gen9 Singles Usage",
    "BMI",
    "Similarity to Lebron",
    "Height and weight difference",
    "Total of atomic numbers of elements in the name",
    "r34 entries",
    "Ranking in other games",
  ];
  const [minChecked, setMinChecked] = useState<boolean>(false);
  const [secondChecked, setSecondChecked] = useState<boolean>(false);
  const [selectedWinCondition, setSelectedWinCondition] = useState<number>(0); // Default: Weight (index 0)

  // Game Options
  const [ppChecked, setPpChecked] = useState<boolean>(false);
  const [optionsChecked, setOptionsChecked] = useState<boolean>(false);
  const [maxRepeats, setMaxRepeats] = useState<number>(3); // Default value

  const toggleCategory = (index: number) => {
    setSelectedCategories((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index].sort((a, b) => a - b)
    );
  };

  const handleWinConditionSelect = (index: number) => {
    setSelectedWinCondition(index);
  };

  const startGame = () => {
    if (selectedCategories.length === 0) {
      alert("Please select at least one category");
      return;
    }

    const winCon = [minChecked, secondChecked, selectedWinCondition];
    const searchParams = new URLSearchParams({
      categories: JSON.stringify(selectedCategories),
      winCon: JSON.stringify(winCon),
      pp: ppChecked.toString(),
      options: optionsChecked.toString(),
      maxRepeats: maxRepeats.toString(), // Add maxRepeats parameter
    });

    window.scrollTo(0, 0);

    navigate(`/game/custom?${searchParams.toString()}`);
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Custom Game Setup</CardTitle>
          <CardDescription>
            Configure your custom Pokemon guessing game
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Categories Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Categories</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Select one or more categories for your game
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {categories.map((category, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-3 cursor-pointer transition-all ${
                    selectedCategories.includes(index)
                      ? "border-primary bg-primary/10"
                      : "border-border hover:bg-accent"
                  }`}
                  onClick={() => toggleCategory(index)}
                >
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={selectedCategories.includes(index)}
                      onCheckedChange={() => toggleCategory(index)}
                      className="cursor-pointer"
                    />
                    <Label className="cursor-pointer text-sm font-medium">
                      {category}
                    </Label>
                  </div>
                </div>
              ))}
            </div>
            {selectedCategories.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedCategories.map((index) => (
                  <Badge key={index} variant="secondary">
                    {categories[index]}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Win Conditions Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Win Conditions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-base font-medium mb-3 block">
                  Extremes
                </Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="min-checkbox"
                      checked={minChecked}
                      onCheckedChange={(checked) =>
                        setMinChecked(checked as boolean)
                      }
                    />
                    <Label htmlFor="min-checkbox">
                      Minimum (instead of maximum)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="second-checkbox"
                      checked={secondChecked}
                      onCheckedChange={(checked) =>
                        setSecondChecked(checked as boolean)
                      }
                    />
                    <Label htmlFor="second-checkbox">
                      Second extreme (instead of first)
                    </Label>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-base font-medium mb-3 block">
                  Target Metric
                </Label>
                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto p-2 border rounded-lg">
                  {winConditions.map((condition, index) => (
                    <div
                      key={index}
                      className={`flex items-start space-x-2 p-2 rounded cursor-pointer transition-colors ${
                        selectedWinCondition === index
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent"
                      }`}
                      onClick={() => handleWinConditionSelect(index)}
                    >
                      <div
                        className={`mt-1 flex-shrink-0 w-3 h-3 rounded-full border ${
                          selectedWinCondition === index
                            ? "bg-primary-foreground border-primary-foreground"
                            : "border-muted-foreground"
                        }`}
                      />
                      <span className="text-sm">{condition}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-2 bg-muted rounded">
                  <p className="text-sm">
                    Selected:{" "}
                    <span className="font-medium">
                      {winConditions[selectedWinCondition]}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Game Options Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Game Options</h2>
            <div className="space-y-6">
              {/* Max Repeats Slider */}
              <div className="space-y-3">
                <Label className="text-base font-medium">
                  Maximum Category Repetition: {maxRepeats}
                </Label>
                <p className="text-sm text-muted-foreground">
                  Controls how many times a single category type can repeat in
                  the puzzle (1-6)
                </p>
                <Slider
                  value={[maxRepeats]}
                  onValueChange={(value) => setMaxRepeats(value[0])}
                  min={1}
                  max={6}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                  <span>5</span>
                  <span>6</span>
                </div>
              </div>

              {/* Other Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="pp-checkbox"
                    checked={ppChecked}
                    onCheckedChange={(checked) =>
                      setPpChecked(checked as boolean)
                    }
                  />
                  <Label htmlFor="pp-checkbox">
                    PP System (Limited Guesses)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="options-checkbox"
                    checked={optionsChecked}
                    onCheckedChange={(checked) =>
                      setOptionsChecked(checked as boolean)
                    }
                  />
                  <Label htmlFor="options-checkbox">
                    Show all possible options
                  </Label>
                </div>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => navigate("/")}>
            Back to Home
          </Button>
          <Button
            onClick={startGame}
            disabled={selectedCategories.length === 0}
          >
            Start Custom Game
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default FreePlay;
