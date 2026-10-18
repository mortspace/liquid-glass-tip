import { useSyncExternalStore } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

const subscribe = (onChange: () => void) => {
  const media = window.matchMedia(QUERY)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}
const snapshot = () => window.matchMedia(QUERY).matches
const serverSnapshot = () => false

export function useReducedMotion() {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot)
}
