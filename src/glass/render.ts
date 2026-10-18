import { contour } from './contour'
import { sampleField } from './field'
import type { Body, Box } from './geometry'
import { lensMap } from './lensMap'

export type Render = { map: string; path: string }

export function renderGlass(
  bodies: Body[],
  k: number,
  box: Box,
  scale: number,
  bezel: number,
  withMap = true,
): Render {
  if (!box.w || !box.h || typeof document === 'undefined') return { map: '', path: '' }
  const cols = Math.ceil(box.w * scale)
  const rows = Math.ceil(box.h * scale)
  const cell = 1 / scale
  const v = sampleField(bodies, k, box, cols, rows, cell, withMap ? bezel : 0)
  const path = contour(v, cols, rows, cell)
  return { map: withMap ? lensMap(v, cols, rows, bezel) : '', path }
}
