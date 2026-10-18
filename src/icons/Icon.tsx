import { EM, GLYPHS, type GlyphName } from './glyphs'

type Props = { name: GlyphName; size: number; color?: string }

export function Icon({ name, size, color = 'currentColor' }: Props) {
  const g = GLYPHS[name]
  const s = size / EM
  return (
    <svg
      width={g.w * s}
      height={g.h * s}
      viewBox={`0 0 ${g.w} ${g.h}`}
      aria-hidden="true"
      style={{ display: 'block', flex: 'none', overflow: 'visible' }}
    >
      <path d={g.d} fill={color} />
    </svg>
  )
}
