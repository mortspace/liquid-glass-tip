const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

let bmp = new Uint8Array(0)

function lens(t: number) {
  return 1 - Math.sqrt(Math.max(0, 1 - t * t))
}

function base64(bytes: Uint8Array, len: number) {
  let out = ''
  let i = 0
  for (; i + 2 < len; i += 3) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]
    out += B64[n >> 18] + B64[(n >> 12) & 63] + B64[(n >> 6) & 63] + B64[n & 63]
  }
  if (i < len) {
    const n = (bytes[i] << 16) | ((i + 1 < len ? bytes[i + 1] : 0) << 8)
    out += B64[n >> 18] + B64[(n >> 12) & 63] + (i + 1 < len ? B64[(n >> 6) & 63] : '=') + '='
  }
  return out
}

function u32(b: Uint8Array, o: number, v: number) {
  b[o] = v & 255
  b[o + 1] = (v >> 8) & 255
  b[o + 2] = (v >> 16) & 255
  b[o + 3] = (v >> 24) & 255
}

export function lensMap(v: Float32Array, cols: number, rows: number, bezel: number) {
  const stride = (cols * 3 + 3) & ~3
  const size = 54 + stride * rows
  if (bmp.length < size) bmp = new Uint8Array(size)
  const b = bmp
  b[0] = 0x42
  b[1] = 0x4d
  u32(b, 2, size)
  u32(b, 6, 0)
  u32(b, 10, 54)
  u32(b, 14, 40)
  u32(b, 18, cols)
  u32(b, 22, rows)
  b[26] = 1
  b[27] = 0
  b[28] = 24
  b[29] = 0
  u32(b, 30, 0)
  u32(b, 34, stride * rows)
  u32(b, 38, 2835)
  u32(b, 42, 2835)
  u32(b, 46, 0)
  u32(b, 50, 0)
  for (let j = 0; j < rows; j++) {
    let o = 54 + (rows - 1 - j) * stride
    for (let i = 0; i < cols; i++) {
      const d = v[j * (cols + 1) + i]
      let rch = 128
      let gch = 128
      if (d <= 0.5 && d > -bezel) {
        const t = Math.min(1, Math.max(0, 1 + d / bezel))
        const m = lens(t)
        const il = i > 0 ? i - 1 : i
        const ir = i < cols ? i + 1 : i
        const ju = j > 0 ? j - 1 : j
        const jd = j < rows ? j + 1 : j
        let gx = v[j * (cols + 1) + ir] - v[j * (cols + 1) + il]
        let gy = v[jd * (cols + 1) + i] - v[ju * (cols + 1) + i]
        const len = Math.hypot(gx, gy) || 1
        gx /= len
        gy /= len
        rch = 128 - gx * m * 127
        gch = 128 - gy * m * 127
      }
      b[o] = 128
      b[o + 1] = gch
      b[o + 2] = rch
      o += 3
    }
    for (let p = cols * 3; p < stride; p++) b[o++] = 0
  }
  return 'data:image/bmp;base64,' + base64(b, size)
}
