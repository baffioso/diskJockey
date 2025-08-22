import React, { useCallback, useMemo, useRef } from 'react'

export type VerticalSliderProps = {
  min: number
  max: number
  step?: number
  value: number
  onChange: (value: number) => void
  ariaLabel?: string
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v))
}

function snap(v: number, step = 1, min = 0) {
  const snapped = Math.round((v - min) / step) * step + min
  const fixed = Number(snapped.toFixed(6))
  return fixed
}

export const VerticalSlider: React.FC<VerticalSliderProps> = ({
  min,
  max,
  step = 1,
  value,
  onChange,
  ariaLabel,
}) => {
  const trackRef = useRef<HTMLDivElement | null>(null)

  const pct = useMemo(() => {
    const t = (value - min) / (max - min)
    const clamped = clamp(t, 0, 1)
    // top=0 at top; we want min at bottom => invert
    return 1 - clamped
  }, [value, min, max])

  const setFromPointer = useCallback(
    (clientY: number) => {
      const el = trackRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const ratio = clamp((clientY - rect.top) / rect.height, 0, 1)
      const raw = min + (1 - ratio) * (max - min)
      const snapped = snap(raw, step, min)
      onChange(clamp(snapped, min, max))
    },
    [min, max, step, onChange]
  )

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId)
    setFromPointer(e.clientY)
  }
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.currentTarget as HTMLDivElement).hasPointerCapture(e.pointerId)) {
      setFromPointer(e.clientY)
    }
  }
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    try { (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId) } catch {}
  }

  return (
    <div className="vslider" aria-label={ariaLabel}>
      <div
        ref={trackRef}
        className="vslider-track"
        role="slider"
        aria-orientation="vertical"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div className="vslider-thumb" style={{ top: `${pct * 100}%` }} />
      </div>
    </div>
  )
}

export default VerticalSlider
