import { forwardRef } from "react";
import { cn } from "../../lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    const baseStyles = "w-full bg-transparent border-b border-gray-300 py-3 text-text-main placeholder:text-text-muted/50 focus:outline-none focus:border-brand transition-colors";
    
    return (
      <input
        className={cn(baseStyles, className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
