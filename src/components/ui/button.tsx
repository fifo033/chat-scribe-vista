import * as React from "react"
import { Slot } from "@radix-ui/react-slot"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    const getButtonClass = () => {
      let baseClass = 'button'
      
      switch (variant) {
        case 'destructive':
          baseClass += ' button-destructive'
          break
        case 'outline':
          baseClass += ' button-outline'
          break
        case 'secondary':
          baseClass += ' button-secondary'
          break
        case 'ghost':
          baseClass += ' button-ghost'
          break
        case 'link':
          baseClass += ' button-link'
          break
        default:
          baseClass += ' button-primary'
      }
      
      switch (size) {
        case 'sm':
          baseClass += ' button-sm'
          break
        case 'lg':
          baseClass += ' button-lg'
          break
        case 'icon':
          baseClass += ' button-icon'
          break
      }
      
      return `${baseClass} ${className}`.trim()
    }
    
    return (
      <Comp
        className={getButtonClass()}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

// Export for backward compatibility
export const buttonVariants = (...args: any[]) => '';

export { Button }