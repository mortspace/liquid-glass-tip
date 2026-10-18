import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { SUBTOTAL, TIPS, money, round2, tipChoices, type Bill, type TipChoice } from './bill'
import { Glass, type GlassHandle } from './glass/Glass'
import { Icon } from './icons/Icon'
import { BUD, HEIGHT, NECK, PAY, PICKER, STAGE_W, budBody, payBody, pickerBody } from './layout'
import { clamp01 } from './motion/math'
import type { SpringTune } from './motion/spring'
import { useSprings, type Targets } from './motion/useSprings'
import { haptic } from './platform/haptics'
import { useReducedMotion } from './platform/useReducedMotion'
import { PlusX } from './text/PlusX'
import { Swap } from './text/Swap'
import {
  LAND_DELAY,
  MILK_FADE,
  MILK_OUT,
  PRESS,
  PULSE,
  PULSE_BACK,
  RISE,
  SETTLE,
  SWELL_IN,
  SWELL_OUT,
  SWELL_PEAK,
  WIDEN,
  WIDEN_DELAY,
} from './timing'
import './tip.css'

type Keys = 'rise' | 'widen' | 'press' | 'pulse' | 'swell' | 'milk'
type Phase = 'closed' | 'open' | 'closing'

export type TipProps = {
  subtotal?: number
  tips?: number[]
  serviceCharge?: number
  currency?: string
  locale?: string
  onPay?: (bill: Bill) => void
  className?: string
}

const PAY_TINT = 'var(--tip-pay)'

export function Tip({
  subtotal = SUBTOTAL,
  tips = TIPS,
  serviceCharge = 0,
  currency = 'GBP',
  locale = 'en-GB',
  onPay,
  className,
}: TipProps) {
  const reduced = useReducedMotion()
  const service = serviceCharge > 0
  const choices = useMemo(() => tipChoices(tips), [tips])
  const fmt = useMemo(() => money(currency, locale), [currency, locale])
  const [tip, setTip] = useState<TipChoice | null>(null)
  const [phase, setPhase] = useState<Phase>('closed')
  const glass = useRef<GlassHandle>(null)
  const payGlass = useRef<GlassHandle>(null)
  const picker = useRef<HTMLDivElement>(null)
  const foot = useRef<HTMLDivElement>(null)
  const payBtn = useRef<HTMLButtonElement>(null)
  const budBtn = useRef<HTMLButtonElement>(null)
  const budLabel = useRef<HTMLSpanElement>(null)
  const landing = useRef<number | null>(null)

  const springs = useSprings<Keys>(
    { rise: 0, widen: 0, press: 0, pulse: 0, swell: 0, milk: 0 },
    RISE,
    (v) => {
      const bud = budBody(v.press, v.swell)
      const pk = pickerBody(v.rise, v.widen)
      const neck = NECK * clamp01(v.rise / 0.08) * clamp01((1 - v.rise) / 0.35)
      const motion = clamp01(Math.min(v.rise, 1 - v.rise) * 5 + Math.min(v.widen, 1 - v.widen) * 5)
      glass.current?.set(
        v.rise > 0.004 ? [bud, pk] : [bud],
        neck,
        motion,
        Math.max(v.milk, 0.22 * v.press),
      )
      const reveal = clamp01((Math.min(v.widen, v.rise) - 0.3) / 0.45)
      const p = picker.current
      if (p) {
        p.style.left = `${pk.x}px`
        p.style.top = `${pk.y}px`
        p.style.width = `${pk.w}px`
        p.style.height = `${pk.h}px`
        p.style.opacity = String(reveal)
        p.style.filter = reveal < 1 ? `blur(${((1 - reveal) * 10).toFixed(1)}px)` : ''
        p.style.transform = `scale(${(0.94 + 0.06 * Math.min(1.12, v.rise)).toFixed(3)})`
      }
      if (foot.current) foot.current.style.opacity = String(reveal)
      payGlass.current?.set([payBody(v.pulse)])
      if (payBtn.current)
        payBtn.current.style.transform = `scale(${(1 + 0.03 * v.pulse).toFixed(3)})`
      if (budBtn.current)
        budBtn.current.style.transform = `scale(${(1 + 0.04 * v.press).toFixed(3)})`
      const l = budLabel.current
      if (l) {
        l.style.opacity = String(1 - 0.5 * v.press - 0.7 * v.milk)
        l.style.filter = v.milk > 0.01 ? `blur(${(8 * v.milk).toFixed(1)}px)` : ''
      }
    },
  )

  const go = useCallback(
    (targets: Targets<Keys>, tune: SpringTune, delay = 0) =>
      reduced ? springs.snap(targets) : springs.set(targets, tune, delay),
    [reduced, springs],
  )

  useLayoutEffect(() => {
    springs.snap({})
  }, [springs])

  useEffect(
    () => () => {
      if (landing.current) clearTimeout(landing.current)
    },
    [],
  )

  const kick = useCallback(() => {
    springs.snap({ milk: reduced ? 0 : 1 })
    go({ swell: 1 }, SWELL_IN)
    go({ swell: 0 }, SWELL_OUT, SWELL_PEAK)
    go({ milk: 0 }, MILK_OUT, MILK_FADE)
  }, [go, springs, reduced])

  const open = useCallback(() => {
    if (landing.current) clearTimeout(landing.current)
    setPhase('open')
    springs.cancel()
    kick()
    go({ rise: 1 }, RISE)
    go({ widen: 1 }, WIDEN, WIDEN_DELAY)
  }, [go, springs, kick])

  const close = useCallback(
    (next: TipChoice | null, pulse: boolean) => {
      setPhase('closing')
      setTip(next)
      springs.cancel()
      kick()
      go({ widen: 0, rise: 0 }, SETTLE)
      const land = () => {
        setPhase('closed')
        if (pulse && !reduced) {
          springs.set({ pulse: 1 }, PULSE)
          springs.set({ pulse: 0 }, PULSE, PULSE_BACK)
        }
      }
      if (landing.current) clearTimeout(landing.current)
      if (reduced) land()
      else landing.current = window.setTimeout(land, LAND_DELAY)
    },
    [go, springs, reduced, kick],
  )

  useEffect(() => {
    if (!service) return
    setTip(null)
    if (phase !== 'closed') close(null, false)
  }, [service, phase, close])

  const choose = (c: TipChoice) => {
    haptic('selection')
    close(c.pct ? c : null, c.pct > 0)
  }

  const bud = () => {
    if (service) return
    haptic('light')
    if (phase === 'open') {
      close(tip, false)
      return
    }
    if (tip) {
      setTip(null)
      return
    }
    open()
  }

  const press = (down: boolean) => {
    if (service) return
    go({ press: down ? 1 : 0 }, PRESS)
  }

  const tipAmount = tip ? round2(subtotal * tip.pct) : 0
  const serviceAmount = service ? round2(subtotal * serviceCharge) : 0
  const total = round2(subtotal + tipAmount + serviceAmount)
  const sub = tip ? `incl. ${fmt.full(tipAmount)} tip` : service ? 'service included' : ''
  const showX = !service && (phase !== 'closed' || !!tip)
  const label = service ? 'Included' : phase !== 'open' && tip ? tip.label : 'Add tip'
  const budInk = service ? 'var(--tip-secondary)' : 'var(--tip-label)'
  const interactive = phase === 'open'
  const status = service
    ? `Service included, total ${fmt.full(total)}`
    : tip
      ? `${tip.label} tip added, total ${fmt.full(total)}`
      : `No tip, total ${fmt.full(total)}`

  return (
    <div
      className={`tip${className ? ' ' + className : ''}`}
      style={{ width: STAGE_W, height: HEIGHT }}
      role="group"
      aria-label="Pay with an optional tip"
    >
      <div
        ref={foot}
        className="tip-foot"
        style={{ left: 0, width: STAGE_W, top: PICKER.y - 24, textAlign: 'center', opacity: 0 }}
      >
        Worked out on {fmt.full(subtotal)}
      </div>
      <span className="tip-sr" role="status" aria-live="polite">
        {status}
      </span>

      <Glass ref={glass} bodies={[BUD]} />
      <Glass
        ref={payGlass}
        bodies={[PAY]}
        tint={PAY_TINT}
        bezel={9}
        strength={18}
        rim={0.5}
        frost={2}
      />

      <div ref={picker} className="tip-picker" data-open={interactive}>
        {choices.map((c) => {
          const on = (tip?.pct ?? 0) === c.pct
          const amt = round2(subtotal * c.pct)
          return (
            <button
              key={c.label}
              type="button"
              className="tip-seg"
              data-on={on}
              disabled={!interactive}
              onClick={() => choose(c)}
              aria-label={`Tip ${c.label}, ${c.pct ? fmt.short(amt) : 'nothing'}`}
            >
              <b>{c.label}</b>
              <small>{fmt.short(amt)}</small>
            </button>
          )
        })}
      </div>

      <button
        ref={payBtn}
        type="button"
        className="tip-btn"
        onClick={() => onPay?.({ subtotal, tip: tipAmount, service: serviceAmount, total })}
        style={{ left: PAY.x, top: PAY.y, width: PAY.w, height: PAY.h, color: '#fff' }}
        aria-label={`Pay ${fmt.full(total)}${sub ? ', ' + sub : ''}`}
      >
        <span className="tip-label">
          <span className="tip-main">
            Pay <span className="tip-num">{fmt.full(total)}</span>
          </span>
          {sub && (
            <Swap token={tip ? 'tip' : 'service'} className="tip-sub">
              {tip ? (
                <>
                  incl. <span className="tip-num">{fmt.full(tipAmount)}</span> tip
                </>
              ) : (
                sub
              )}
            </Swap>
          )}
        </span>
      </button>

      <button
        ref={budBtn}
        type="button"
        className="tip-btn"
        disabled={service}
        onClick={bud}
        onPointerDown={() => press(true)}
        onPointerUp={() => press(false)}
        onPointerLeave={() => press(false)}
        onPointerCancel={() => press(false)}
        style={{ left: BUD.x, top: BUD.y, width: BUD.w, height: BUD.h, color: budInk }}
        aria-label={
          service
            ? 'Service included, no tip needed'
            : phase === 'open'
              ? 'Close tip options'
              : tip
                ? `Remove ${tip.label} tip`
                : 'Add tip'
        }
      >
        <span ref={budLabel} className="tip-bud-label">
          {service ? (
            <Icon name="checkmark" size={13} color={budInk} />
          ) : (
            <PlusX x={showX} size={13} />
          )}
          <Swap token={label} className="tip-action">
            {label}
          </Swap>
        </span>
      </button>
    </div>
  )
}
