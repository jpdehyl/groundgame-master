import { cn } from "@/lib/utils"
import { ButtonHTMLAttributes, forwardRef } from "react"

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none cursor-pointer"

    const variants = {
      default: "bg-accent-blue text-white hover:bg-accent-blue/90 shadow-sm shadow-accent-blue/25",
      destructive: "bg-accent-red text-white hover:bg-accent-red/90 shadow-sm shadow-accent-red/25",
      outline: "border border-border bg-transparent text-muted-foreground hover:bg-white/5 hover:text-white hover:border-white/20",
      secondary: "bg-muted text-white hover:bg-white/10",
      ghost: "text-muted-foreground hover:bg-white/5 hover:text-white",
      link: "underline-offset-4 hover:underline text-accent-blue",
    }

    const sizes = {
      default: "h-10 py-2 px-4",
      sm: "h-9 px-3 rounded-lg text-xs",
      lg: "h-11 px-8 rounded-lg",
      icon: "h-10 w-10",
    }

    return (
      <button
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

Button.displayName = "Button"

export { Button }