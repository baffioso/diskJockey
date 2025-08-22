import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Deck } from './Deck'

export default function App() {
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null)
  const [leftGain, setLeftGain] = useState(1)
  const [rightGain, setRightGain] = useState(1)
  const [xfader, setXfader] = useState(0.5) // 0 = left, 1 = right

  const masterGainRef = useRef<GainNode | null>(null)
  const leftGainRef = useRef<GainNode | null>(null)
  const rightGainRef = useRef<GainNode | null>(null)

  // Lazy-create AudioContext on first user interaction (required by browsers)
  useEffect(() => {
    const onFirstClick = () => {
      if (!audioCtx) {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
        const master = ctx.createGain()
        master.gain.value = 0.9
        master.connect(ctx.destination)

        const l = ctx.createGain()
        const r = ctx.createGain()
        l.connect(master)
        r.connect(master)

        setAudioCtx(ctx)
        masterGainRef.current = master
        leftGainRef.current = l
        rightGainRef.current = r
      }
      window.removeEventListener('pointerdown', onFirstClick)
    }
    window.addEventListener('pointerdown', onFirstClick, { once: true })
    return () => window.removeEventListener('pointerdown', onFirstClick)
  }, [audioCtx])

  // Equal-power crossfader
  useEffect(() => {
    const l = leftGainRef.current
    const r = rightGainRef.current
    if (!l || !r) return
    const x = xfader
    const a = Math.cos(x * 0.5 * Math.PI)
    const b = Math.cos((1 - x) * 0.5 * Math.PI)
    l.gain.setTargetAtTime(a * leftGain, audioCtx?.currentTime ?? 0, 0.01)
    r.gain.setTargetAtTime(b * rightGain, audioCtx?.currentTime ?? 0, 0.01)
  }, [xfader, leftGain, rightGain, audioCtx])

  return (
    <div className="app">
      <h1 className="logo">DiskJockey</h1>
      <div className="mixer">
        <Deck
          title="Deck A"
          audioCtx={audioCtx}
          outputNode={leftGainRef.current}
          onLevel={(v) => setLeftGain(v)}
        />
        <Deck
          title="Deck B"
          audioCtx={audioCtx}
          outputNode={rightGainRef.current}
          onLevel={(v) => setRightGain(v)}
        />
      </div>
      <div className="xfader">
        <label>X-Fader</label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={xfader}
          onChange={(e) => setXfader(parseFloat(e.target.value))}
        />
      </div>
    </div>
  )
}
