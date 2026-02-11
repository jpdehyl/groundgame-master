import { cn } from "@/lib/utils"
import { ButtonHTMLAttributes, forwardRef } from "react"

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none cursor-pointer"

    const variants = {
      default: "bg-primary text-white hover:bg-primary-hover",
      destructive: "bg-accent-red text-white hover:bg-accent-red/90",
      outline: "border border-border-strong bg-transparent text-text-secondary hover:bg-white/5 hover:text-white hover:border-white/20",
      secondary: "bg-muted text-foreground hover:bg-white/10",
      ghost: "text-muted-foreground hover:bg-white/5 hover:text-white",
      link: "underline-offset-4 hover:underline text-primary",
    }

    const sizes = {
      default: "h-9 py-2 px-4",
      sm: "h-8 px-3 rounded-md text-xs",
      lg: "h-10 px-6 rounded-md",
      icon: "h-9 w-9",
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
