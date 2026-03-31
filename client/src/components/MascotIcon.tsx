import { cn } from "@/lib/utils";

interface MascotIconProps {
  size?: "sm" | "md" | "lg";
  expression?: "neutral" | "happy" | "celebrating";
  className?: string;
}

export function MascotIcon({ 
  size = "md", 
  expression = "neutral",
  className 
}: MascotIconProps) {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-24 h-24",
  };

  const getEyeExpression = () => {
    if (expression === "happy" || expression === "celebrating") {
      return (
        <>
          <circle cx="35" cy="45" r="3" className="fill-foreground" />
          <circle cx="65" cy="45" r="3" className="fill-foreground" />
          <path
            d="M 30 40 Q 35 35 40 40"
            className="stroke-foreground fill-none"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M 60 40 Q 65 35 70 40"
            className="stroke-foreground fill-none"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </>
      );
    }
    return (
      <>
        <circle cx="35" cy="45" r="4" className="fill-foreground" />
        <circle cx="65" cy="45" r="4" className="fill-foreground" />
      </>
    );
  };

  const getMouthExpression = () => {
    if (expression === "celebrating") {
      return (
        <ellipse cx="50" cy="65" rx="12" ry="8" className="fill-foreground" />
      );
    }
    if (expression === "happy") {
      return (
        <path
          d="M 35 60 Q 50 70 65 60"
          className="stroke-foreground fill-none"
          strokeWidth="3"
          strokeLinecap="round"
        />
      );
    }
    return (
      <path
        d="M 35 65 Q 50 68 65 65"
        className="stroke-foreground fill-none"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    );
  };

  return (
    <div className={cn(sizeClasses[size], className)}>
      <svg
        viewBox="0 0 100 100"
        className={cn(
          "w-full h-full",
          expression === "celebrating" && "animate-bounce"
        )}
      >
        <circle cx="50" cy="50" r="48" className="fill-primary" />
        <circle cx="50" cy="50" r="46" className="fill-accent" />
        
        {getEyeExpression()}
        {getMouthExpression()}
        
        {expression === "celebrating" && (
          <>
            <circle cx="20" cy="20" r="3" className="fill-accent animate-pulse" />
            <circle cx="80" cy="20" r="3" className="fill-accent animate-pulse" />
            <circle cx="15" cy="35" r="2" className="fill-primary animate-pulse" />
            <circle cx="85" cy="35" r="2" className="fill-primary animate-pulse" />
          </>
        )}
      </svg>
    </div>
  );
}
