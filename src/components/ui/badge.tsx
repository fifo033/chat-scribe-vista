import * as React from "react"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success'
}

function Badge({ className = '', variant = 'default', ...props }: BadgeProps) {
  const getBadgeClass = () => {
    let baseClass = 'badge'
    
    switch (variant) {
      case 'secondary':
        baseClass += ' badge-secondary'
        break
      case 'destructive':
        baseClass += ' badge-destructive'
        break
      case 'outline':
        baseClass += ' badge-outline'
        break
      case 'success':
        baseClass += ' badge-success'
        break
      default:
        baseClass += ' badge-default'
    }
    
    return `${baseClass} ${className}`.trim()
  }
  
  return (
    <div className={getBadgeClass()} {...props} />
  )
}

export { Badge }