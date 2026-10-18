import { forwardRef, useCallback, useId, useImperativeHandle, useLayoutEffect, useRef } from 'react'
import { bodyBox, type Body } from './geometry'
import { renderGlass } from './render'

export type GlassHandle = {
  set: (bodies: Body[], k?: number, motion?: number, milk?: number) => void
}

type Props = {
  bodies: Body[]
  k?: number
  tint?: string
  bezel?: number
  strength?: number
  scale?: number
  shadow?: number
  rim?: number
  frost?: number
}

const DEFAULT_TINT = 'var(--tip-glass-tint)'
const MILK_TINT = 'var(--tip-glass-milk)'
const MOTION_FROST = 7
const MILK_FROST = 10
const MOTION_SCALE = 0.4

export const Glass = forwardRef<GlassHandle, Props>(function Glass(
  {
    bodies,
    k = 0,
    tint = DEFAULT_TINT,
    bezel = 10,
    strength = 26,
    scale = 0.5,
    shadow = 0.09,
    rim = 0.95,
    frost = 3,
  },
  ref,
) {
  const id = useId().replace(/:/g, '')
  const root = useRef<HTMLDivElement>(null)
  const defs = useRef<SVGSVGElement>(null)
  const shadowSvg = useRef<SVGSVGElement>(null)
  const rimSvg = useRef<SVGSVGElement>(null)
  const outline = useRef<SVGPathElement>(null)
  const maskUse = useRef<SVGUseElement>(null)
  const image = useRef<SVGFEImageElement>(null)
  const maskEl = useRef<SVGMaskElement>(null)
  const sheet = useRef<HTMLDivElement>(null)
  const signature = useRef('')
  const mapped = useRef(false)
  const lensId = `tip-lens-${id}`
  const rimId = `tip-rim-${id}`
  const glowId = `tip-glow-${id}`
  const maskId = `tip-mask-${id}`
  const outlineId = `tip-outline-${id}`

  const apply = useCallback(
    (next: Body[], neck = 0, motion = 0, milk = 0) => {
      const el = root.current
      if (!el) return
      if (!next.length) {
        el.style.display = 'none'
        return
      }
      const moving = motion > 0.02 || milk > 0.02
      const sig =
        next
          .map(
            (b) =>
              `${b.x.toFixed(2)},${b.y.toFixed(2)},${b.w.toFixed(2)},${b.h.toFixed(2)},${b.r.toFixed(2)},${b.group ?? ''}`,
          )
          .join('|') + `|${neck.toFixed(2)}|${moving ? 'm' : 's'}`
      el.style.display = ''
      if (sig !== signature.current || (!moving && !mapped.current)) {
        signature.current = sig
        const box = bodyBox(next)
        const { map, path } = renderGlass(
          next,
          neck,
          box,
          moving ? MOTION_SCALE : scale,
          bezel,
          !moving,
        )
        mapped.current = !moving
        el.style.left = `${box.x}px`
        el.style.top = `${box.y}px`
        el.style.width = `${box.w}px`
        el.style.height = `${box.h}px`
        for (const svg of [defs.current, shadowSvg.current, rimSvg.current]) {
          if (!svg) continue
          svg.setAttribute('width', String(box.w))
          svg.setAttribute('height', String(box.h))
          svg.setAttribute('viewBox', `0 0 ${box.w} ${box.h}`)
        }
        outline.current?.setAttribute('d', path)
        const tight = bodyBox(next, 0)
        const dx = tight.x - box.x
        const dy = tight.y - box.y
        maskUse.current?.setAttribute('transform', `translate(${-dx} ${-dy})`)
        if (maskEl.current) {
          maskEl.current.setAttribute('width', String(tight.w))
          maskEl.current.setAttribute('height', String(tight.h))
        }
        if (rimSvg.current) {
          rimSvg.current.style.left = `${-dx}px`
          rimSvg.current.style.top = `${-dy}px`
        }
        if (image.current) {
          if (map) image.current.setAttribute('href', map)
          image.current.setAttribute('x', String(-dx))
          image.current.setAttribute('y', String(-dy))
          image.current.setAttribute('width', String(box.w))
          image.current.setAttribute('height', String(box.h))
        }
        if (sheet.current) {
          const st = sheet.current.style
          st.left = `${dx}px`
          st.top = `${dy}px`
          st.width = `${tight.w}px`
          st.height = `${tight.h}px`
          st.borderRadius = `${Math.min(...next.map((b) => b.r)).toFixed(1)}px`
        }
      }
      const s = sheet.current
      if (s) {
        const blur = frost + MOTION_FROST * motion + MILK_FROST * milk
        const filter = `${moving ? '' : `url(#${lensId}) `}blur(${blur.toFixed(1)}px) saturate(1.5) brightness(1.03)`
        s.style.backdropFilter = filter
        s.style.setProperty('-webkit-backdrop-filter', filter)
        s.style.setProperty(
          '--tip-glass-fill',
          milk > 0.01
            ? `color-mix(in srgb, ${tint} ${((1 - milk) * 100).toFixed(1)}%, ${MILK_TINT})`
            : tint,
        )
      }
    },
    [scale, bezel, frost, lensId, tint],
  )

  useImperativeHandle(ref, () => ({ set: apply }), [apply])
  const placed =
    bodies.map((b) => `${b.x},${b.y},${b.w},${b.h},${b.r},${b.group ?? ''}`).join('|') + `|${k}`
  const placedRef = useRef(bodies)
  placedRef.current = bodies
  useLayoutEffect(() => apply(placedRef.current, k, 0), [placed, k, apply])

  const href = `#${outlineId}`
  return (
    <div
      ref={root}
      className="tip-glass"
      aria-hidden="true"
      data-tinted={tint !== DEFAULT_TINT || undefined}
    >
      <svg ref={defs} className="tip-glass-svg">
        <defs>
          <path id={outlineId} ref={outline} />
          <filter
            id={lensId}
            x="0"
            y="0"
            width="100%"
            height="100%"
            colorInterpolationFilters="sRGB"
          >
            <feImage ref={image} preserveAspectRatio="none" result="map" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="map"
              scale={strength}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
          <linearGradient id={rimId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity={rim} />
            <stop offset="0.5" stopColor="#fff" stopOpacity={rim * 0.55} />
            <stop offset="1" stopColor="#fff" stopOpacity={rim * 0.9} />
          </linearGradient>
          <linearGradient id={glowId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
            <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <mask
            ref={maskEl}
            id={maskId}
            maskUnits="userSpaceOnUse"
            maskContentUnits="userSpaceOnUse"
            x="0"
            y="0"
          >
            <use ref={maskUse} href={href} fill="#fff" />
          </mask>
        </defs>
      </svg>
      {shadow > 0 && (
        <svg ref={shadowSvg} className="tip-glass-svg tip-glass-shadow">
          <use href={href} fill={`rgba(0,0,0,${shadow})`} transform="translate(0 3)" />
        </svg>
      )}
      <div
        ref={sheet}
        className="tip-glass-sheet"
        style={{ maskImage: `url(#${maskId})`, WebkitMaskImage: `url(#${maskId})` }}
      >
        <svg ref={rimSvg} className="tip-glass-svg tip-glass-rim">
          <use href={href} fill={`url(#${glowId})`} />
          <use href={href} fill="none" stroke={`url(#${rimId})`} strokeWidth="2.2" />
        </svg>
      </div>
    </div>
  )
})
