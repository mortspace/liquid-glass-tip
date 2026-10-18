export type Body = { x: number; y: number; w: number; h: number; r: number; group?: number }
export type Box = { x: number; y: number; w: number; h: number }

const MARGIN = 8

export function bodyBox(bodies: Body[], margin = MARGIN): Box {
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  for (const b of bodies) {
    x0 = Math.min(x0, b.x)
    y0 = Math.min(y0, b.y)
    x1 = Math.max(x1, b.x + b.w)
    y1 = Math.max(y1, b.y + b.h)
  }
  if (!bodies.length) return { x: 0, y: 0, w: 0, h: 0 }
  return {
    x: Math.floor(x0 - margin),
    y: Math.floor(y0 - margin),
    w: Math.ceil(x1 - x0 + margin * 2),
    h: Math.ceil(y1 - y0 + margin * 2),
  }
}
