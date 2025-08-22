import React, { useEffect, useMemo, useRef, useState } from 'react'

export type DeckProps = {
  title: string
  audioCtx: AudioContext | null
  outputNode: GainNode | null
  onLevel?: (gain: number) => void
}

// A simple file-based deck using an <audio> element + MediaElementAudioSourceNode
export function Deck({ title, audioCtx, outputNode, onLevel }: DeckProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [pitch, setPitch] = useState(1) // 0.92..1.08 for +/-8%
  const [bend, setBend] = useState(0) // temporary pitch bend applied when holding buttons
  const [cueTime, setCueTime] = useState<number | null>(null)
  const cueHoldRef = useRef(false)
  const suppressNextClickRef = useRef(false)

  // Wire the audio graph for this deck
  useEffect(() => {
    if (!audioCtx || !outputNode || !audioRef.current) return

    if (!sourceRef.current) {
      sourceRef.current = audioCtx.createMediaElementSource(audioRef.current)
    }
    if (!gainRef.current) {
      gainRef.current = audioCtx.createGain()
      gainRef.current.gain.value = 1
    }

    // Connect: source -> gain -> mixer (outputNode)
    try {
      sourceRef.current.disconnect()
    } catch {}
    sourceRef.current.connect(gainRef.current)

    try {
      gainRef.current.disconnect()
    } catch {}
    gainRef.current.connect(outputNode)
  }, [audioCtx, outputNode])

  // Apply playbackRate = pitch + bend
  useEffect(() => {
    const el = audioRef.current
    if (el) {
      const rate = Math.max(0.5, Math.min(4, pitch + bend))
      el.playbackRate = rate
    }
  }, [pitch, bend])

  const onTogglePlay = async () => {
    const el = audioRef.current
    if (!el) return
    if (!audioCtx) return
    if (audioCtx.state === 'suspended') await audioCtx.resume()
    if (el.paused) {
      await el.play()
      setIsPlaying(true)
    } else {
      el.pause()
      setIsPlaying(false)
    }
  }

  // Cue behavior similar to CDJs:
  // - Click: set cue point at current position.
  // - Hold: play from cue while held, release returns to cue and pauses.
  const onCueClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (suppressNextClickRef.current) {
      e.preventDefault()
      return
    }
    const el = audioRef.current
    if (!el) return
    setCueTime(el.currentTime)
  }

  const onCuePointerDown = async (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault()
    const el = audioRef.current
    if (!el || !audioCtx) return
    if (audioCtx.state === 'suspended') await audioCtx.resume()
    if (cueTime != null) {
      el.currentTime = cueTime
      try {
        await el.play()
        setIsPlaying(true)
      } catch {}
      cueHoldRef.current = true
      suppressNextClickRef.current = true
      setTimeout(() => (suppressNextClickRef.current = false), 250)
    }
  }

  const onCuePointerUp = () => {
    const el = audioRef.current
    if (!el) return
    if (cueHoldRef.current) {
      el.pause()
      setIsPlaying(false)
      if (cueTime != null) el.currentTime = cueTime
      cueHoldRef.current = false
    }
  }

  const onPitchSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    // map [-8, +8] percent to rate [0.92, 1.08]
    const rate = 1 + val / 100
    setPitch(rate)
  }

  const onBend = (dir: 1 | -1) => {
    setBend(dir * 0.02) // +/- 2% while held
  }

  const onBendEnd = () => setBend(0)

  // Level meter (simple: reflect gain node value if provided)
  useEffect(() => {
    onLevel?.(gainRef.current?.gain.value ?? 1)
  }, [onLevel])

  return (
    <div className="deck">
      <h2>{title}</h2>
      <div className="loader">
        <input
          type="file"
          accept="audio/mp3,audio/mpeg"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (!file) return
            const url = URL.createObjectURL(file)
            const el = audioRef.current
            if (!el) return
            el.src = url
            el.load()
            setIsPlaying(false)
          }}
        />
        <audio ref={audioRef} controls={false} preload="auto" />
      </div>

      <div className="transport">
        <button onClick={onTogglePlay}>{isPlaying ? 'Pause' : 'Play'}</button>
        <button
          onClick={onCueClick}
          onPointerDown={onCuePointerDown}
          onPointerUp={onCuePointerUp}
          onPointerLeave={onCuePointerUp}
        >
          Cue
        </button>
      </div>

      <div className="pitch">
        <label>Pitch ±8%</label>
        <input
          type="range"
          min={-8}
          max={8}
          step={0.1}
          defaultValue={0}
          onChange={onPitchSlider}
          className="vertical"
          {...({ orient: 'vertical' } as React.HTMLAttributes<HTMLInputElement>)}
        />
      </div>

      <div className="bend">
        <button
          onPointerDown={() => onBend(1)}
          onPointerUp={onBendEnd}
          onPointerLeave={onBendEnd}
        >
          Pitch Bend +
        </button>
        <button
          onPointerDown={() => onBend(-1)}
          onPointerUp={onBendEnd}
          onPointerLeave={onBendEnd}
        >
          Pitch Bend -
        </button>
      </div>
    </div>
  )
}
