import type { Body } from './glass/geometry'
import { lerp } from './motion/math'

export const STAGE_W = 393
export const HEIGHT = 236
export const BAR_Y = HEIGHT - 24 - 52
export const PAY: Body = { x: 16, y: BAR_Y, w: 234, h: 52, r: 26 }
export const BUD: Body = { x: 258, y: BAR_Y, w: 119, h: 52, r: 26, group: 0 }
export const SLIVER: Body = { x: 268, y: BAR_Y + 6, w: 99, h: 14, r: 7, group: 0 }
export const PICKER: Body = { x: 16, y: BAR_Y - 8 - 56, w: 361, h: 56, r: 28, group: 0 }
export const NECK = 26

export function budBody(press: number, swell: number): Body {
  const gw = 0.22 * BUD.w * swell + 0.04 * BUD.w * press
  const gh = 0.18 * BUD.h * swell + 0.04 * BUD.h * press
  return {
    x: BUD.x - gw / 2,
    y: BUD.y - gh / 2,
    w: BUD.w + gw,
    h: BUD.h + gh,
    r: BUD.r + gh / 2,
    group: 0,
  }
}

export function pickerBody(rise: number, widen: number): Body {
  return {
    x: lerp(SLIVER.x, PICKER.x, widen),
    w: lerp(SLIVER.w, PICKER.w, widen),
    y: lerp(SLIVER.y, PICKER.y, rise),
    h: lerp(SLIVER.h, PICKER.h, rise),
    r: lerp(SLIVER.r, PICKER.r, rise),
    group: 0,
  }
}

export function payBody(pulse: number): Body {
  return {
    x: PAY.x - 4 * pulse,
    y: PAY.y - 2 * pulse,
    w: PAY.w + 8 * pulse,
    h: PAY.h + 4 * pulse,
    r: PAY.r + 2 * pulse,
  }
}
