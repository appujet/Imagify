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
  red: "#FF0000",
	green: "#00FF00",
	pink: "#FFC0CB",
	hotpink: "#FF69B4",
	blue: "#0000FF",
	yellow: "#FFFF00",
	cyan: "#00FFFF",
	magenta: "#FF00FF",
	black: "#000000",
	white: "#FFFFFF",
	gray: "#808080",
	maroon: "#800000",
	olive: "#808000",
	navy: "#000080",
	purple: "#800080",
	teal: "#008080",
	silver: "#C0C0C0",
	lime: "#00FF00",
	fuchsia: "#FF00FF",
	aqua: "#00FFFF",
	coral: "#FF7F50",
	salmon: "#FA8072",
	khaki: "#F0E68C",
	plum: "#DDA0DD",
	gold: "#FFD700",
	chocolate: "#D2691E",
	tomato: "#FF6347",
	orchid: "#DA70D6",
	slateblue: "#6A5ACD",
	slategray: "#708090",
	lightslategray: "#778899",
	mediumseagreen: "#3CB371",
	mediumslateblue: "#7B68EE",
	mediumturquoise: "#48D1CC",
	mediumvioletred: "#C71585",
	darkgoldenrod: "#B8860B",
	darkkhaki: "#BDB76B",
	darkolivegreen: "#556B2F",
	darkorange: "#FF8C00",
	darkorchid: "#9932CC",
	darksalmon: "#E9967A",
	darkseagreen: "#8FBC8F",
	darkslateblue: "#483D8B",
	darkslategray: "#2F4F4F",
	darkturquoise: "#00CED1",
	deeppink: "#FF1493",
	deepskyblue: "#00BFFF",
	dimgray: "#696969",
	lightcoral: "#F08080",
	lightcyan: "#E0FFFF",
	lightgoldenrodyellow: "#FAFAD2",
	lightgray: "#D3D3D3",
	lightgreen: "#90EE90",
	lightpink: "#FFB6C1",
	lightsalmon: "#FFA07A",
	lightseagreen: "#20B2AA",
	lightskyblue: "#87CEFA",
	lightslateblue: "#8470FF",
	lightsteelblue: "#B0C4DE",
	lightyellow: "#FFFFE0",
	linen: "#FAF0E6",
	mediumaquamarine: "#66CDAA",
	mediumblue: "#0000CD",
	mediumforestgreen: "#228B22",
	mediumorchid: "#BA55D3",
	mediumpurple: "#9370DB",
	mediumspringgreen: "#00FA9A",
	midnightblue: "#191970",
	mintcream: "#F5FFFA",
	mistyrose: "#FFE4E1",
	moccasin: "#FFE4B5",
	navajowhite: "#FFDEAD",
	oldlace: "#FDF5E6",
	olivedrab: "#6B8E23",
	orangered: "#FF4500",
	palegoldenrod: "#EEE8AA",
	palegreen: "#98FB98",
	paleturquoise: "#AFEEEE",
	palevioletred: "#DB7093",
	papayawhip: "#FFEFD5",
	peachpuff: "#FFDAB9",
	peru: "#CD853F",
	powderblue: "#B0E0E6",
	rosybrown: "#BC8F8F",
	royalblue: "#4169E1",
	saddlebrown: "#8B4513",
	seagreen: "#2E8B57",
	sienna: "#A0522D",
	skyblue: "#87CEEB",
	snow: "#FFFAFA",
	springgreen: "#00FF7F",
	steelblue: "#4682B4",
	tan: "#D2B48C",
	thistle: "#D8BFD8",
	turquoise: "#40E0D0",
	violet: "#EE82EE",
	wheat: "#F5DEB3",
	whitesmoke: "#F5F5F5",
	yellowgreen: "#9ACD32",
	antiquewhite: "#FAEBD7",
	azure: "#F0FFFF",
	beige: "#F5F5DC",
	bisque: "#FFE4C4",
	blanchedalmond: "#FFEBCD",
	burlywood: "#DEB887",
	cadetblue: "#5F9EA0",
	chartreuse: "#7FFF00",
	cornflowerblue: "#6495ED",
	cornsilk: "#FFF8DC",
  crimson: "#DC143C",
  psychic: "#FF00FF",
}
