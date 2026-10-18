import type { SpringTune } from './motion/spring'

export const RISE: SpringTune = { response: 0.28, bounce: 0.25 }
export const WIDEN: SpringTune = { response: 0.3, bounce: 0.2 }
export const SETTLE: SpringTune = { response: 0.28, bounce: 0 }
export const PRESS: SpringTune = { response: 0.26, bounce: 0.3 }
export const PULSE: SpringTune = { response: 0.3, bounce: 0.4 }
export const SWELL_IN: SpringTune = { response: 0.22, bounce: 0 }
export const SWELL_OUT: SpringTune = { response: 0.32, bounce: 0.35 }
export const MILK_OUT: SpringTune = { response: 0.36, bounce: 0 }

export const WIDEN_DELAY = 60
export const SWELL_PEAK = 170
export const MILK_FADE = 120
export const LAND_DELAY = 200
export const PULSE_BACK = 140
