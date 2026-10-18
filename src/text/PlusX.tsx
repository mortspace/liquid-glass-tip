import { Icon } from '../icons/Icon'

type Props = { x: boolean; size?: number; color?: string }

export function PlusX({ x, size = 13, color = 'currentColor' }: Props) {
  return (
    <span className="tip-plusx" data-x={x} aria-hidden="true">
      <Icon name="plus" size={size} color={color} />
    </span>
  )
}
