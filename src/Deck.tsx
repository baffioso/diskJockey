import React, { useEffect, useMemo, useRef, useState } from 'react'
import { VerticalSlider } from './components/ui/VerticalSlider'

export type DeckProps = {
  title: string
  audioCtx: AudioContext | null
  outputNode: GainNode | null
  onLevel?: (gain: number) => void
}

// A simple file-based deck using an <audio> element + MediaElementAudioSourceNode
export function Deck({ title, audioCtx, outputNode, onLevel }: DeckProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const objectUrlRef = useRef<string | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [pitch, setPitch] = useState(1) // 0.92..1.08 for +/-8%
  const [bend, setBend] = useState(0) // temporary pitch bend applied when holding buttons
  const [cueTime, setCueTime] = useState<number | null>(null)
  const [trackName, setTrackName] = useState<string | null>(null)
  const cueHoldRef = useRef(false)
  const suppressNextClickRef = useRef(false)

  // Helper to load a File into the audio element
  const loadFromFile = (file: File) => {
    // Revoke previous URL to avoid memory leaks
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
    const url = URL.createObjectURL(file)
    objectUrlRef.current = url
    const el = audioRef.current
    if (!el) return
    el.src = url
    el.load()
    setIsPlaying(false)
    setTrackName(file.name)
  }

  // Broader file picker for Android/Chromium using File System Access API, with fallback
  const openPicker = async () => {
    try {
      const anyWindow = window as any
      if (anyWindow?.showOpenFilePicker) {
        const [handle] = await anyWindow.showOpenFilePicker({
          multiple: false,
          excludeAcceptAllOption: false,
          types: [
            {
              description: 'Audio files',
              accept: {
                'audio/*': ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'],
              },
            },
          ],
        })
        if (handle) {
          const file = await handle.getFile()
          if (file) loadFromFile(file)
          return
        }
      }
    } catch (err) {
      // fall through to input fallback on any error/cancel
    }
    fileInputRef.current?.click()
  }

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

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }
    }
  }, [])

  const displayName = trackName ?? 'Please load track'
  const hasTrack = !!trackName

  return (
    <div className="deck">
      <div className="deck-header">
        <button
          className="load-btn"
          onClick={openPicker}
          aria-label="Load audio file"
        >
          Load
        </button>
        <h2>{title}</h2>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (!file) return
            loadFromFile(file)
          }}
          style={{ display: 'none' }}
        />
      </div>

      <div className={`track-display ${hasTrack ? '' : 'no-scroll'}`} title={displayName}>
        <div className="scroll">
          <span>{displayName}</span>
          {hasTrack && (
            <span aria-hidden="true">&nbsp;&nbsp;•&nbsp;&nbsp;{displayName}</span>
          )}
        </div>
      </div>

      <audio ref={audioRef} controls={false} preload="auto" />

      <div className="pitch">
        {(() => {
          const pct = (Math.max(0.5, Math.min(4, pitch + bend)) - 1) * 100
          const pctStr = `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`
          return (
            <label>
              Pitch <span className="pitch-readout">{pctStr}</span>
            </label>
          )
        })()}
        <div className="pitch-controls">
          <div className="pitch-slider">
            <VerticalSlider
              min={8}
              max={-8}
              step={0.1}
              value={(pitch - 1) * 100}
              onChange={(v) => setPitch(1 + v / 100)}
              ariaLabel="Pitch"
            />
          </div>
          <div className="pitch-bend-vert">
            <button
              aria-label="Pitch Bend Minus"
              onPointerDown={() => onBend(-1)}
              onPointerUp={onBendEnd}
              onPointerLeave={onBendEnd}
            >
              <span className="bend-label">Pitch Bend</span>
              <span className="big-sign minus">−</span>
            </button>
            <button
              aria-label="Pitch Bend Plus"
              onPointerDown={() => onBend(1)}
              onPointerUp={onBendEnd}
              onPointerLeave={onBendEnd}
            >
              <span className="bend-label">Pitch Bend</span>
              <span className="big-sign plus">+</span>
            </button>
          </div>
        </div>
      </div>

  <div className="transport">
        <button onClick={onTogglePlay} aria-label={isPlaying ? 'Pause' : 'Start'}>
          {isPlaying ? (
            // Pause icon
            <svg width="22" height="22" viewBox="0 0 24 24" role="img" aria-hidden="true">
              <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" />
              <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" />
            </svg>
          ) : (
            // Play (Start) icon
            <svg width="22" height="22" viewBox="0 0 24 24" role="img" aria-hidden="true">
              <path d="M8 5v14l11-7L8 5z" fill="currentColor" />
            </svg>
          )}
        </button>
        <button
          onClick={onCueClick}
          onPointerDown={onCuePointerDown}
          onPointerUp={onCuePointerUp}
          onPointerLeave={onCuePointerUp}
        >
          Cue
        </button>
      </div>
    </div>
  )
}
