"use client"

import { useRef, type ReactNode } from "react"
import { motion, useMotionValue, animate } from "framer-motion"

interface ElasticScrollProps {
  children: ReactNode
  className?: string
  /** Quanto a borda "estica" no máximo (px). */
  maxPull?: number
}

/**
 * Container de rolagem com efeito rubber-band (overscroll elástico) no topo e no
 * fim — puxa com amortecimento e volta com mola. Puramente aditivo: o transform
 * fica num filho interno, então NÃO pode haver elementos position:fixed dentro.
 */
export function ElasticScroll({ children, className, maxPull = 56 }: ElasticScrollProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const y = useMotionValue(0)
  const pull = useRef(0)
  const touchStartY = useRef(0)
  const releaseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const atEdge = (goingDown: boolean) => {
    const el = scrollRef.current
    if (!el) return false
    if (!goingDown) return el.scrollTop <= 0
    return Math.ceil(el.scrollTop + el.clientHeight) >= el.scrollHeight - 1
  }

  const springBack = () => {
    pull.current = 0
    animate(y, 0, { type: "spring", stiffness: 300, damping: 30, mass: 0.9 })
  }

  const applyPull = (rawDelta: number) => {
    const next = pull.current + rawDelta * 0.22
    const clamped = Math.sign(next) * Math.min(maxPull, Math.abs(next))
    pull.current = clamped
    y.set(clamped)
    if (releaseTimer.current) clearTimeout(releaseTimer.current)
    releaseTimer.current = setTimeout(springBack, 90)
  }

  const onWheel = (e: React.WheelEvent) => {
    const goingDown = e.deltaY > 0
    if (atEdge(goingDown)) applyPull(-e.deltaY)
  }

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
  }
  const onTouchMove = (e: React.TouchEvent) => {
    const dy = e.touches[0].clientY - touchStartY.current
    const goingDown = dy < 0
    if (atEdge(goingDown)) {
      applyPull(dy)
      touchStartY.current = e.touches[0].clientY
    }
  }
  const onTouchEnd = () => springBack()

  return (
    <div
      ref={scrollRef}
      onWheel={onWheel}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className={className}
      style={{ overscrollBehavior: "contain", WebkitOverflowScrolling: "touch" }}
    >
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  )
}
