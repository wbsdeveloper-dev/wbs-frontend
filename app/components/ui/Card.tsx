import { CSSProperties, ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  style?: CSSProperties;
}

const paddingClasses = {
  none: "",
  sm: "p-3 md:p-4",
  md: "p-4 md:p-6",
  lg: "p-6 md:p-8",
};

/**
 * Reusable Card component with consistent styling
 */
export default function Card({
  children,
  className = "",
  padding = "md",
  style,
}: CardProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 ${paddingClasses[padding]} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

/**
 * Card header with optional description and action button
 */
export function CardHeader({ title, description, action }: CardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
      <div>
        <h3 className="text-base md:text-lg font-semibold text-gray-900">
          {title}
        </h3>
        {description && (
          <p className="text-xs md:text-sm text-gray-500 mt-1">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
