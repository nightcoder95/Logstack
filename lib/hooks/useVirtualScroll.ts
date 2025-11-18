import { useState, useEffect, useRef, useMemo } from 'react'

interface UseVirtualScrollOptions {
  itemHeight: number
  containerHeight: number
  items: any[]
  overscan?: number
}

export function useVirtualScroll({
  itemHeight,
  containerHeight,
  items,
  overscan = 3,
}: UseVirtualScrollOptions) {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const totalHeight = items.length * itemHeight

  const visibleRange = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const end = Math.min(
      items.length,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    )
    return { start, end }
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan])

  const visibleItems = useMemo(
    () => items.slice(visibleRange.start, visibleRange.end),
    [items, visibleRange]
  )

  const offsetY = visibleRange.start * itemHeight

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      setScrollTop(container.scrollTop)
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  return {
    containerRef,
    visibleItems,
    totalHeight,
    offsetY,
    visibleRange,
  }
}
