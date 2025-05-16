export function parseColor(input: string): [number, number, number] {
    if (input.startsWith('#')) {
      const hex = input.slice(1)
      const bigint = parseInt(hex, 16)
      const r = (bigint >> 16) & 255
      const g = (bigint >> 8) & 255
      const b = bigint & 255
      return [r, g, b]
    }
  
    if (input.startsWith('rgb')) {
      const parts = input.match(/\d+/g)
      if (!parts || parts.length < 3) throw new Error('Invalid RGB')
      return parts.map(Number).slice(0, 3) as [number, number, number]
    }
  
    if (input.startsWith('hsl')) {
      const [h, s, l] = input.match(/\d+/g)!.map(Number)
      return hslToRgb(h, s, l)
    }
  
    throw new Error('Unsupported color format')
  }
  
  function hslToRgb(h: number, s: number, l: number): [number, number, number] {
    s /= 100
    l /= 100
    const k = (n: number) => (n + h / 30) % 12
    const a = s * Math.min(l, 1 - l)
    const f = (n: number) =>
      l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
    return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)]
  }
  
export const presetColors: Record<string, string> = {
    blurple: '#5865F2',
    dark: '#2C2F33',
    black: '#23272A',
    white: '#FFFFFF',
    gray: '#99AAB5',
    green: '#57F287',
    yellow: '#FEE75C',
    red: '#ED4245',
    fuchsia: '#EB459E',
    aqua: '#00FFFF',
  }