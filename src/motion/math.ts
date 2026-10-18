export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const clamp01 = (t: number) => Math.min(1, Math.max(0, t))
