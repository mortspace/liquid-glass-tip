const EPS = 1e-4

let edgeA = new Int32Array(0)
let edgeB = new Int32Array(0)
let segEdge = new Int32Array(0)
let segPt = new Float32Array(0)
let used = new Uint8Array(0)

function chaikin(pts: number[]) {
  const n = pts.length
  const out = new Array<number>(n * 2)
  for (let i = 0; i < n; i += 2) {
    const j = (i + 2) % n
    const px = pts[i]
    const py = pts[i + 1]
    const qx = pts[j]
    const qy = pts[j + 1]
    out[2 * i] = px * 0.75 + qx * 0.25
    out[2 * i + 1] = py * 0.75 + qy * 0.25
    out[2 * i + 2] = px * 0.25 + qx * 0.75
    out[2 * i + 3] = py * 0.25 + qy * 0.75
  }
  return out
}

function area(l: number[]) {
  let a = 0
  for (let i = 0; i < l.length; i += 2) {
    const j = (i + 2) % l.length
    a += l[i] * l[j + 1] - l[j] * l[i + 1]
  }
  return Math.abs(a) / 2
}

function inside(x: number, y: number, l: number[]) {
  let hit = false
  for (let i = 0, j = l.length - 2; i < l.length; j = i, i += 2) {
    const xi = l[i]
    const yi = l[i + 1]
    const xj = l[j]
    const yj = l[j + 1]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit
  }
  return hit
}

export function contour(v: Float32Array, cols: number, rows: number, cell: number) {
  const W = cols + 1
  const corners = W * (rows + 1)
  const edges = 2 * corners
  const nodes = edges + corners
  if (edgeA.length < nodes) {
    edgeA = new Int32Array(nodes)
    edgeB = new Int32Array(nodes)
    segEdge = new Int32Array(nodes * 2)
    segPt = new Float32Array(nodes * 4)
    used = new Uint8Array(nodes)
  }
  edgeA.fill(-1, 0, nodes)
  edgeB.fill(-1, 0, nodes)
  let ns = 0
  const link = (e: number, s: number) => {
    if (edgeA[e] < 0) edgeA[e] = s
    else edgeB[e] = s
  }
  const seg = (e0: number, x0: number, y0: number, e1: number, x1: number, y1: number) => {
    if (e0 === e1) return
    segEdge[2 * ns] = e0
    segEdge[2 * ns + 1] = e1
    segPt[4 * ns] = x0
    segPt[4 * ns + 1] = y0
    segPt[4 * ns + 2] = x1
    segPt[4 * ns + 3] = y1
    link(e0, ns)
    link(e1, ns)
    ns++
  }
  const ce = new Int32Array(4)
  const cx = new Float64Array(4)
  const cy = new Float64Array(4)
  for (let j = 0; j < rows; j++) {
    const Y = j * cell
    for (let i = 0; i < cols; i++) {
      const a = v[j * W + i]
      const b = v[j * W + i + 1]
      const c = v[(j + 1) * W + i + 1]
      const d = v[(j + 1) * W + i]
      const sa = a < 0
      const sb = b < 0
      const sc = c < 0
      const sd = d < 0
      if (sa === sb && sb === sc && sc === sd) continue
      const X = i * cell
      let n = 0
      const c00 = edges + j * W + i
      if (sa !== sb) {
        const t = a / (a - b)
        ce[n] = t < EPS ? c00 : t > 1 - EPS ? c00 + 1 : 2 * (j * W + i)
        cx[n] = X + cell * t
        cy[n] = Y
        n++
      }
      if (sb !== sc) {
        const t = b / (b - c)
        ce[n] = t < EPS ? c00 + 1 : t > 1 - EPS ? c00 + W + 1 : 2 * (j * W + i + 1) + 1
        cx[n] = X + cell
        cy[n] = Y + cell * t
        n++
      }
      if (sc !== sd) {
        const t = c / (c - d)
        ce[n] = t < EPS ? c00 + W + 1 : t > 1 - EPS ? c00 + W : 2 * ((j + 1) * W + i)
        cx[n] = X + cell - cell * t
        cy[n] = Y + cell
        n++
      }
      if (sd !== sa) {
        const t = d / (d - a)
        ce[n] = t < EPS ? c00 + W : t > 1 - EPS ? c00 : 2 * (j * W + i) + 1
        cx[n] = X
        cy[n] = Y + cell - cell * t
        n++
      }
      if (n === 2) seg(ce[0], cx[0], cy[0], ce[1], cx[1], cy[1])
      else if (n === 4) {
        seg(ce[0], cx[0], cy[0], ce[1], cx[1], cy[1])
        seg(ce[2], cx[2], cy[2], ce[3], cx[3], cy[3])
      }
    }
  }
  used.fill(0, 0, ns)
  const loops: number[][] = []
  for (let s0 = 0; s0 < ns; s0++) {
    if (used[s0]) continue
    used[s0] = 1
    const pts = [segPt[4 * s0], segPt[4 * s0 + 1], segPt[4 * s0 + 2], segPt[4 * s0 + 3]]
    let edge = segEdge[2 * s0 + 1]
    let s = s0
    for (;;) {
      const next = edgeA[edge] === s ? edgeB[edge] : edgeA[edge]
      if (next < 0 || used[next]) break
      used[next] = 1
      const far = segEdge[2 * next] === edge ? segEdge[2 * next + 1] : segEdge[2 * next]
      const o = segEdge[2 * next] === edge ? 2 : 0
      pts.push(segPt[4 * next + o], segPt[4 * next + o + 1])
      edge = far
      s = next
    }
    if (pts.length >= 12) loops.push(pts)
  }
  const areas = loops.map(area)
  let d = ''
  loops.forEach((l, i) => {
    if (loops.some((o, j) => j !== i && areas[j] > areas[i] && inside(l[0], l[1], o))) return
    const c = chaikin(l)
    d += 'M'
    for (let k = 0; k < c.length; k += 2)
      d += `${k ? 'L' : ''}${c[k].toFixed(1)} ${c[k + 1].toFixed(1)}`
    d += 'Z'
  })
  return d
}
