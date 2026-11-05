function lum(hex: string) {
  const m = hex.replace("#", "").match(/^([0-9a-f]{6})$/i); if (!m) return null;
  const [r, g, b] = [0, 2, 4].map(i => { const c = parseInt(m[1].slice(i, i + 2), 16) / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a: string, b: string) { const x = lum(a), y = lum(b); if (x == null || y == null) return 0; return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
/** Returns brand colors if readable (>= 4.5:1), else null => neutral fallback. */
export function brandSkin(brand: any, dark: boolean) {
  if (!brand?.color || !brand?.on_color) return null;
  const bg = dark && brand.color_dark ? brand.color_dark : brand.color;
  const fg = contrast(bg, brand.on_color) >= 4.5 ? brand.on_color : contrast(bg, "#000000") >= 4.5 ? "#000000" : contrast(bg, "#ffffff") >= 4.5 ? "#ffffff" : null;
  return fg ? { bg, fg, radius: brand.radius ?? 14, name: brand.name, logo: brand.logo } : null;
}
