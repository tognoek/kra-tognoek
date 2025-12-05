interface DifficultyBadgeProps {
  difficulty: string | number;
  className?: string;
}

export default function DifficultyBadge({ difficulty, className = "" }: DifficultyBadgeProps) {
  const getDifficultyClass = (d: string | number) => {
    const num = typeof d === "string" ? parseInt(d) : d;
    if (num <= 3) return "difficulty difficulty-easy";
    if (num <= 6) return "difficulty difficulty-medium";
    return "difficulty difficulty-hard";
  };

  const getLabel = (d: string | number) => {
    const num = typeof d === "string" ? parseInt(d) : d;
    if (num <= 3) return "Easy";
    if (num <= 6) return "Medium";
    return "Hard";
  };

  return (
    <span className={`${getDifficultyClass(difficulty)} ${className}`}>
      {getLabel(difficulty)} ({difficulty})
    </span>
  );
}

