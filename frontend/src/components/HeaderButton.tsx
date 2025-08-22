import React from "react";
import { Button } from "./ui/button"; // Adjust path as needed
interface HeaderButtonProps {
  icon?: React.ReactNode; // SVG element or any React node
  text: string;
  onClick?: () => void;
  className?: string; // Optional additional classes
}

const HeaderButton: React.FC<HeaderButtonProps> = ({
  icon,
  text,
  onClick,
  className = "",
}) => {
  return (
    <Button
      onClick={onClick}
      className={[
        "flex flex-col items-center justify-center px-3 py-1.5 min-w-[68px] max-w-[96px] h-12",
        "text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md",
        "transition-colors duration-200 space-y-0.5",
        "whitespace-normal break-words text-center leading-tight",
        "cursor-pointer",
        className,
      ].join(" ")}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{text}</span>
    </Button>
  );
};

export default HeaderButton;
