import { WebHaptics, type HapticInput } from 'web-haptics'

let instance: WebHaptics | null = null

function get() {
  if (typeof window === 'undefined') return null
  if (!instance) {
    try {
      instance = new WebHaptics()
    } catch {
      instance = null
    }
  }
  return instance
}

export function haptic(input?: HapticInput) {
  try {
    void get()?.trigger(input)
  } catch {}
}
