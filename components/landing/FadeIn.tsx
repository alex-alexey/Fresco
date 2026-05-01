"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"

interface Props {
  children: React.ReactNode
  className?: string
  delay?: number
  direction?: "up" | "left" | "right" | "none"
  id?: string
}

export function FadeIn({ children, className, delay = 0, direction = "up", id }: Props) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })

  const initial = {
    opacity: 0,
    y: direction === "up" ? 24 : 0,
    x: direction === "left" ? -24 : direction === "right" ? 24 : 0,
  }

  return (
    <motion.div
      ref={ref}
      id={id}
      initial={initial}
      animate={inView ? { opacity: 1, y: 0, x: 0 } : initial}
      transition={{ duration: 0.55, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
      suppressHydrationWarning
    >
      {children}
    </motion.div>
  )
}
