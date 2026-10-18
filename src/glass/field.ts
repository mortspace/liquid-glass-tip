import type { Body, Box } from './geometry'

type Field = { groups: Body[][]; solo: Body[]; k: number }

let grid = new Float32Array(0)
let packed = new Float64Array(0)
let active = new Int32Array(0)
let groupMin = new Float64Array(0)

function partition(bodies: Body[], k: number): Field {
  const map = new Map<number, Body[]>()
  const solo: Body[] = []
  for (const b of bodies) {
    if (b.group === undefined) solo.push(b)
    else {
      const list = map.get(b.group)
      if (list) list.push(b)
      else map.set(b.group, [b])
    }
  }
  return { groups: [...map.values()], solo, k }
}

export function sampleField(
  bodies: Body[],
  k: number,
  box: Box,
  cols: number,
  rows: number,
  cell: number,
  band: number,
) {
  const f = partition(bodies, k)
  const need = (cols + 1) * (rows + 1)
  if (grid.length < need) grid = new Float32Array(need * 2)
  const v = grid
  const W = cols + 1
  const n = f.solo.length + f.groups.reduce((t, g) => t + g.length, 0)
  if (packed.length < n * 6) {
    packed = new Float64Array(n * 12)
    active = new Int32Array(n * 2)
  }
  if (groupMin.length < f.groups.length) groupMin = new Float64Array(f.groups.length * 2)
  let o = 0
  const pack = (b: Body, g: number) => {
    packed[o++] = b.x + b.w / 2
    packed[o++] = b.y + b.h / 2
    packed[o++] = b.w / 2
    packed[o++] = b.h / 2
    packed[o++] = Math.min(b.r, b.w / 2, b.h / 2)
    packed[o++] = g
  }
  for (const b of f.solo) pack(b, -1)
  f.groups.forEach((g, gi) => g.forEach((b) => pack(b, gi)))
  const groups = f.groups.length
  const chain = f.groups.reduce((m, g) => Math.max(m, g.length), 1)
  const rowReach = (groups ? k * (1 + (chain - 1) / 4) : 0) + band + 2 * cell + 1
  for (let j = 0; j <= rows; j++) {
    const y = box.y + j * cell
    let na = 0
    for (let b = 0; b < n; b++)
      if (Math.abs(y - packed[b * 6 + 1]) - packed[b * 6 + 3] <= rowReach) active[na++] = b * 6
    const row = j * W
    for (let i = 0; i <= cols; i++) {
      const x = box.x + i * cell
      let d = Infinity
      for (let g = 0; g < groups; g++) groupMin[g] = Infinity
      for (let a = 0; a < na; a++) {
        const p = active[a]
        const dx = Math.abs(x - packed[p]) - packed[p + 2]
        const dy = Math.abs(y - packed[p + 1]) - packed[p + 3]
        const cheb = dx > dy ? dx : dy
        const g = packed[p + 5]
        if (g < 0) {
          if (cheb >= d) continue
        } else if (cheb >= groupMin[g] + k) continue
        const r = packed[p + 4]
        const qx = dx + r
        const qy = dy + r
        const ox = qx > 0 ? qx : 0
        const oy = qy > 0 ? qy : 0
        const m = qx > qy ? qx : qy
        const sd = (m < 0 ? m : 0) + Math.sqrt(ox * ox + oy * oy) - r
        if (g < 0) {
          if (sd < d) d = sd
        } else {
          const gd = groupMin[g]
          if (k <= 0 || gd === Infinity) groupMin[g] = sd < gd ? sd : gd
          else {
            const h = Math.max(k - Math.abs(gd - sd), 0) / k
            groupMin[g] = (gd < sd ? gd : sd) - h * h * k * 0.25
          }
        }
      }
      for (let g = 0; g < groups; g++) if (groupMin[g] < d) d = groupMin[g]
      v[row + i] = d
    }
  }
  return v
}
