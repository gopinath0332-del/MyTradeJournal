// Icon generation script - Run with Node.js if sharp is available
// For now, we'll create placeholder icons with HTML5 Canvas

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]

function createIcon(size) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  canvas.width = size
  canvas.height = size

  // Create gradient background
  const gradient = ctx.createLinearGradient(0, 0, size, size)
  gradient.addColorStop(0, '#10b981')
  gradient.addColorStop(1, '#059669')

  // Draw rounded rectangle background
  const radius = size * 0.15
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.roundRect(0, 0, size, size, radius)
  ctx.fill()

  // Draw chart bars
  const barWidth = size * 0.08
  const barSpacing = size * 0.12
  const startX = size * 0.15
  const baseY = size * 0.85

  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'

  const barHeights = [0.22, 0.30, 0.38, 0.45, 0.53, 0.49]

  for (let i = 0; i < 6; i++) {
    const x = startX + i * barSpacing
    const height = size * barHeights[i]
    const y = baseY - height

    ctx.beginPath()
    ctx.roundRect(x, y, barWidth, height, 2)
    ctx.fill()
  }

  // Draw dollar sign
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
  ctx.font = `bold ${size * 0.15}px Arial`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('$', size * 0.5, size * 0.25)

  return canvas
}

// This is a placeholder function - in a real implementation,
// you would use a proper image generation library
function generateIcons() {
  console.log('Icon generation script - placeholder implementation')
  console.log('To generate actual PNG icons, use a tool like:')
  console.log('1. Sharp (Node.js library)')
  console.log('2. ImageMagick')
  console.log('3. Online SVG to PNG converter')
  console.log('4. Design tools like Figma, Sketch, or Adobe Illustrator')

  sizes.forEach(size => {
    console.log(`Generate icon-${size}x${size}.png from icon.svg`)
  })
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { generateIcons, createIcon, sizes }
} else if (typeof window !== 'undefined') {
  window.IconGenerator = { generateIcons, createIcon, sizes }
}
