export type Glyph = { w: number; h: number; d: string }

export const EM = 20

export const GLYPHS = {
  plus: {
    w: 16.5,
    h: 16.5,
    d: 'M7 1.25A1.25 1.25 0 0 1 9.5 1.25V7H15.25A1.25 1.25 0 0 1 15.25 9.5H9.5V15.25A1.25 1.25 0 0 1 7 15.25V9.5H1.25A1.25 1.25 0 0 1 1.25 7H7Z',
  },
  checkmark: {
    w: 17.54,
    h: 17.1,
    d: 'M0.31 10.13L5.73 16.62A1.35 1.35 0 0 0 7.9 16.49L17.32 2.09A1.35 1.35 0 0 0 15.06 0.61L6.64 13.49L2.39 8.39A1.35 1.35 0 0 0 0.31 10.13Z',
  },
} satisfies Record<string, Glyph>

export type GlyphName = keyof typeof GLYPHS
