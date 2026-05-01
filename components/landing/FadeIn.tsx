interface Props {
  children: React.ReactNode
  className?: string
  delay?: number
  direction?: "up" | "left" | "right" | "none"
  id?: string
}

export function FadeIn({ children, className, id }: Props) {
  return (
    <div id={id} className={className}>
      {children}
    </div>
  )
}
