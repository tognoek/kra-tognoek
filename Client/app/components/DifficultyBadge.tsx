interface DifficultyBadgeProps {
  difficulty: string;
  className?: string;
}

export default function DifficultyBadge({ difficulty, className = "" }: DifficultyBadgeProps) {
  const getDifficultyClass = (d: string) => {
    const num = parseInt(d);
    if (num <= 3) return "difficulty difficulty-easy";
    if (num <= 7) return "difficulty difficulty-medium";
    return "difficulty difficulty-hard";
  };

  const getLabel = (d: string) => {
    const num = typeof d === "string" ? parseInt(d) : d;
    if (num <= 3) return "Easy";
    if (num <= 7) return "Medium";
    return "Hard";
  };

  return (
    <span className={`${getDifficultyClass(difficulty)} ${className}`}>
      {getLabel(difficulty)} ({difficulty})
    </span>
  );
}

