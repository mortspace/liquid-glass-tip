export type SpringTune = { response: number; bounce: number }

const SUBSTEP = 1 / 240
const REST_DISTANCE = 0.0015
const REST_SPEED = 0.015

export class Spring {
  value: number
  velocity = 0
  target: number
  tune: SpringTune

  constructor(value: number, tune: SpringTune) {
    this.value = value
    this.target = value
    this.tune = tune
  }

  get active() {
    return (
      Math.abs(this.value - this.target) > REST_DISTANCE || Math.abs(this.velocity) > REST_SPEED
    )
  }

  step(dt: number) {
    const omega = (2 * Math.PI) / this.tune.response
    const zeta = 1 - this.tune.bounce
    const k = omega * omega
    const c = 2 * zeta * omega
    let left = dt
    while (left > 0) {
      const h = Math.min(SUBSTEP, left)
      const a = -k * (this.value - this.target) - c * this.velocity
      this.velocity += a * h
      this.value += this.velocity * h
      left -= h
    }
    if (!this.active) {
      this.value = this.target
      this.velocity = 0
    }
  }
}
