import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import sharp from "sharp"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ACHIEVEMENT_DIR = path.join(__dirname, "../src/assets/achievement")

const TOLERANCE = 45
const DARK_GAP = 28

function luminance(r, g, b) {
  return 0.299 * r + 0.587 * g + 0.114 * b
}

function colorDistance(r1, g1, b1, r2, g2, b2) {
  const dr = r1 - r2
  const dg = g1 - g2
  const db = b1 - b2
  return Math.sqrt(dr * dr + dg * dg + db * db)
}

function matchesBackground(r, g, b, bgR, bgG, bgB) {
  return colorDistance(r, g, b, bgR, bgG, bgB) <= TOLERANCE
}

function isBarrier(r, g, b, a, bgR, bgG, bgB, bgLum) {
  if (a < 20) return true
  if (matchesBackground(r, g, b, bgR, bgG, bgB)) return false
  return luminance(r, g, b) < bgLum - DARK_GAP
}

function sampleBackground(get, width, height) {
  const samples = []

  for (const [x, y] of [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ]) {
    const [r, g, b, a] = get(x, y)
    if (a < 200) continue
    samples.push([r, g, b])
  }

  if (samples.length === 0) {
    throw new Error("Could not sample outer background from corners")
  }

  const bgR = Math.round(samples.reduce((sum, [r]) => sum + r, 0) / samples.length)
  const bgG = Math.round(samples.reduce((sum, [, g]) => sum + g, 0) / samples.length)
  const bgB = Math.round(samples.reduce((sum, [, , b]) => sum + b, 0) / samples.length)
  return [bgR, bgG, bgB]
}

async function removeOuterBackground(filePath) {
  const img = sharp(filePath)
  const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info
  const pixels = new Uint8Array(data)

  const get = (x, y) => {
    const i = (y * width + x) * channels
    return [pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3]]
  }

  const setAlpha = (x, y, alpha) => {
    pixels[(y * width + x) * channels + 3] = alpha
  }

  const [bgR, bgG, bgB] = sampleBackground(get, width, height)
  const bgLum = luminance(bgR, bgG, bgB)

  const visited = new Uint8Array(width * height)
  const queue = []

  const trySeed = (x, y) => {
    const idx = y * width + x
    if (visited[idx]) return
    const [r, g, b, a] = get(x, y)
    if (!matchesBackground(r, g, b, bgR, bgG, bgB) || a < 20) return
    visited[idx] = 1
    queue.push([x, y])
  }

  for (let x = 0; x < width; x++) {
    trySeed(x, 0)
    trySeed(x, height - 1)
  }
  for (let y = 0; y < height; y++) {
    trySeed(0, y)
    trySeed(width - 1, y)
  }

  while (queue.length) {
    const [x, y] = queue.pop()
    setAlpha(x, y, 0)

    for (const [nx, ny] of [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ]) {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
      const idx = ny * width + nx
      if (visited[idx]) continue

      const [r, g, b, a] = get(nx, ny)
      if (isBarrier(r, g, b, a, bgR, bgG, bgB, bgLum)) continue
      if (!matchesBackground(r, g, b, bgR, bgG, bgB)) continue

      visited[idx] = 1
      queue.push([nx, ny])
    }
  }

  const outPath = `${filePath}.tmp`
  await sharp(pixels, { raw: { width, height, channels } }).png().toFile(outPath)
  fs.renameSync(outPath, filePath)
}

const files = fs
  .readdirSync(ACHIEVEMENT_DIR)
  .filter((name) => name.toLowerCase().endsWith(".png"))

for (const file of files) {
  const filePath = path.join(ACHIEVEMENT_DIR, file)
  await removeOuterBackground(filePath)

  const { data, info } = await sharp(filePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info
  const alphaAt = (x, y) => data[(y * width + x) * channels + 3]
  const corners = [
    alphaAt(0, 0),
    alphaAt(width - 1, 0),
    alphaAt(0, height - 1),
    alphaAt(width - 1, height - 1),
  ]
  const center = alphaAt(Math.floor(width / 2), Math.floor(height / 2))
  console.log(`${file} -> corners: ${corners.join(",")}, center: ${center}`)
}

console.log(`done (${files.length} files)`)
