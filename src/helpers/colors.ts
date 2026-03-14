export function getContrastColor(hex: string): '#000000' | '#FFFFFF' {
  // Remove #
  const cleanHex = hex.replace('#', '')

  // Parse RGB
  const r = parseInt(cleanHex.substring(0, 2), 16)
  const g = parseInt(cleanHex.substring(2, 4), 16)
  const b = parseInt(cleanHex.substring(4, 6), 16)

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  // Return black for light colors, white for dark
  return luminance > 0.5 ? '#000000' : '#FFFFFF'
}
