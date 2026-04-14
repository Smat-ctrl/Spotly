import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function Card({ children, className = "", onClick }: CardProps) {
  return (
    <div 
      className={`p-6 rounded-2xl border border-gray-200 bg-white shadow-sm ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
