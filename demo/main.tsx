import { StrictMode, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { Tip, type Bill } from '../src'
import './demo.css'

type Option<T> = { value: T; label: string }

const PANEL_W = 393
const PANEL_H = 236

const BILL: Option<number>[] = [
  { value: 0, label: 'Tip' },
  { value: 0.125, label: 'Service charge' },
]

type SegmentedProps<T> = {
  label: string
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
}

function Segmented<T>({ label, options, value, onChange }: SegmentedProps<T>) {
  return (
    <div className="demo-seg" role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.label}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

function Fit({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const fit = () => setScale(Math.min(1, el.clientWidth / PANEL_W))
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={ref} className="demo-stage" style={{ height: PANEL_H * scale }}>
      <div className="demo-fit" style={{ transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  )
}

function Demo() {
  const [serviceCharge, setServiceCharge] = useState(0)
  const [paid, setPaid] = useState<Bill | null>(null)

  return (
    <main className="demo">
      <header className="demo-head">
        <h1>Liquid Tip</h1>
        <p>Tap Add tip. The picker grows out of the button, and folds back in when you choose.</p>
      </header>
      <Fit>
        <Tip serviceCharge={serviceCharge} onPay={setPaid} />
      </Fit>
      <div className="demo-options">
        <Segmented
          label="What the bill asks for"
          options={BILL}
          value={serviceCharge}
          onChange={setServiceCharge}
        />
      </div>
      <p className="demo-paid" aria-live="polite">
        {paid ? `Paid £${paid.total.toFixed(2)}, with £${paid.tip.toFixed(2)} tip` : ''}
      </p>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Demo />
  </StrictMode>,
)
