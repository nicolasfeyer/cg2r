import type { ElectionSummary, PartyResult, CandidateResult } from './types'

export async function exportChartToImage(elementId: string, filename: string) {
  const element = document.getElementById(elementId)
  if (!element) {
    throw new Error('Chart element not found')
  }

  const svgElement = element.querySelector('svg')
  if (!svgElement) {
    throw new Error('SVG element not found in chart')
  }

  const svgData = new XMLSerializer().serializeToString(svgElement)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Could not get canvas context')
  }

  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svgBlob)
  const img = new Image()

  return new Promise<void>((resolve, reject) => {
    img.onload = () => {
      canvas.width = svgElement.clientWidth * 2
      canvas.height = svgElement.clientHeight * 2
      
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to create image blob'))
          return
        }
        
        const link = document.createElement('a')
        const blobUrl = URL.createObjectURL(blob)
        link.href = blobUrl
        link.download = filename
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        URL.revokeObjectURL(url)
        URL.revokeObjectURL(blobUrl)
        resolve()
      }, 'image/png')
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load SVG image'))
    }
    
    img.src = url
  })
}
