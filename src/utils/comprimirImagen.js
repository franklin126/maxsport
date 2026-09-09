export async function comprimirImagen(file, opciones = {}) {
  const maxSizeMB = opciones.maxSizeMB || 0.4
  const maxWidthOrHeight = opciones.maxWidthOrHeight || 1600

  const bitmap = await createImageBitmap(file)
  let width = bitmap.width
  let height = bitmap.height

  const escala = Math.min(1, maxWidthOrHeight / Math.max(width, height))
  width = Math.round(width * escala)
  height = Math.round(height * escala)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(bitmap, 0, 0, width, height)

  let calidad = 0.92
  let blob = await new Promise((res) => canvas.toBlob(res, 'image/webp', calidad))

  while (blob && blob.size > maxSizeMB * 1024 * 1024 && calidad > 0.4) {
    calidad = calidad - 0.08
    blob = await new Promise((res) => canvas.toBlob(res, 'image/webp', calidad))
  }

  const nuevoNombre = file.name.replace(/\.\w+$/, '.webp')
  return new File([blob], nuevoNombre, { type: 'image/webp' })
}