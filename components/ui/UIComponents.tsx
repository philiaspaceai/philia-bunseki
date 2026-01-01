import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={cn("bg-white dark:bg-card border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-6", className)} {...props}>
    {children}
  </div>
);

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' }> = ({ className, variant = 'primary', ...props }) => {
  const variants = {
    primary: "bg-primary hover:bg-indigo-600 text-white shadow-md hover:shadow-lg shadow-primary/20",
    secondary: "bg-secondary hover:bg-purple-600 text-white shadow-md hover:shadow-lg shadow-secondary/20",
    outline: "border-2 border-gray-200 dark:border-gray-700 hover:border-primary dark:hover:border-primary hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300"
  };
  return (
    <button className={cn("px-4 py-2 rounded-xl font-bold tracking-wide transition-all duration-200 active:scale-95 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none flex items-center justify-center gap-2", variants[variant], className)} {...props} />
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className, ...props }) => (
  <input className={cn("w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none transition-all duration-300 placeholder:text-gray-400", className)} {...props} />
);

export const ProgressBar: React.FC<{ progress: number; label?: string }> = ({ progress, label }) => (
  <div className="w-full">
    {label && <div className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 flex justify-between animate-fade-in"><span>{label}</span><span>{Math.round(progress)}%</span></div>}
    <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]" style={{ width: `${progress}%` }} />
    </div>
  </div>
);