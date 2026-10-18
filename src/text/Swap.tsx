import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'

type Leaving = { id: number; node: ReactNode }
type Props = { children: ReactNode; token: string; className?: string }

const OUT_MS = 180
let seq = 0

export function Swap({ children, token, className }: Props) {
  const [leaving, setLeaving] = useState<Leaving[]>([])
  const [entered, setEntered] = useState(0)
  const last = useRef(token)
  const shown = useRef(children)
  const sweep = useRef<number | undefined>(undefined)

  useLayoutEffect(() => {
    if (last.current === token) {
      shown.current = children
      return
    }
    last.current = token
    const id = ++seq
    setLeaving((ls) => [...ls, { id, node: shown.current }])
    shown.current = children
    setEntered(id)
    window.clearTimeout(sweep.current)
    sweep.current = window.setTimeout(() => setLeaving([]), OUT_MS + 40)
  }, [token, children])

  useEffect(() => () => window.clearTimeout(sweep.current), [])

  return (
    <span className={`tip-swap${className ? ' ' + className : ''}`}>
      {leaving.map((l) => (
        <span key={l.id} className="tip-swap-out">
          {l.node}
        </span>
      ))}
      <span key={entered} className={entered ? 'tip-swap-in' : undefined}>
        {children}
      </span>
    </span>
  )
}
