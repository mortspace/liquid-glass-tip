import { useCallback, useEffect, useRef } from 'react'
import { Spring, type SpringTune } from './spring'

export type Targets<K extends string> = Partial<Record<K, number>>

export function useSprings<K extends string>(
  initial: Record<K, number>,
  tune: SpringTune,
  onFrame: (v: Record<K, number>) => void,
) {
  const springs = useRef<Record<K, Spring> | null>(null)
  if (!springs.current) {
    const made = {} as Record<K, Spring>
    for (const key of Object.keys(initial) as K[]) made[key] = new Spring(initial[key], tune)
    springs.current = made
  }
  const frameFn = useRef(onFrame)
  frameFn.current = onFrame
  const frame = useRef<number | null>(null)
  const last = useRef(0)
  const timers = useRef<number[]>([])

  const read = useCallback(() => {
    const v = {} as Record<K, number>
    for (const key in springs.current) v[key] = springs.current[key].value
    return v
  }, [])

  const loop = useCallback(
    (now: number) => {
      const all = springs.current!
      const dt = Math.min(0.05, (now - last.current) / 1000)
      last.current = now
      let live = false
      for (const key in all) {
        const s = all[key]
        if (s.active) {
          s.step(dt)
          live = true
        }
      }
      frameFn.current(read())
      frame.current = live ? requestAnimationFrame(loop) : null
    },
    [read],
  )

  const wake = useCallback(() => {
    if (frame.current !== null) return
    last.current = performance.now()
    frame.current = requestAnimationFrame(loop)
  }, [loop])

  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current)
      frame.current = null
      timers.current.forEach(clearTimeout)
      timers.current = []
    },
    [],
  )

  const set = useCallback(
    (targets: Targets<K>, retune?: SpringTune, delay = 0) => {
      const apply = () => {
        const all = springs.current!
        for (const key in targets) {
          const s = all[key]
          s.target = targets[key]!
          if (retune) s.tune = retune
        }
        wake()
      }
      if (delay > 0) timers.current.push(window.setTimeout(apply, delay))
      else apply()
    },
    [wake],
  )

  const snap = useCallback(
    (targets: Targets<K>) => {
      const all = springs.current!
      for (const key in targets) {
        const s = all[key]
        s.value = targets[key]!
        s.target = s.value
        s.velocity = 0
      }
      frameFn.current(read())
    },
    [read],
  )

  const cancel = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }, [])

  return { set, snap, cancel }
}
