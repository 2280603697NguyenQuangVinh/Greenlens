import * as ort from "onnxruntime-web"
import {
  getSupertonicConfigBase,
  getSupertonicOnnxDir,
  getSupertonicVoiceStylePath,
  isSupertonicEnabled,
} from "@/services/supertonic/config"
import {
  loadTextToSpeech,
  loadVoiceStyle,
  writeWavFile,
  type Style,
  type TextToSpeech,
} from "@/services/supertonic/helper.js"

const ORT_VERSION = "1.21.0"
const DEFAULT_LANG = "vi"
const DEFAULT_TOTAL_STEP = 8
const DEFAULT_SPEED = 1.00
const CHUNK_SILENCE = 0.25
const MAX_CACHE_ENTRIES = 4

ort.env.logLevel = "error"
ort.env.wasm.numThreads = Math.min(
  4,
  typeof navigator !== "undefined" ? navigator.hardwareConcurrency || 2 : 2,
)
ort.env.wasm.wasmPaths = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/`

let initPromise: Promise<boolean> | null = null
let textToSpeech: TextToSpeech | null = null
let voiceStyle: Style | null = null
let initError: string | null = null
let currentAudio: HTMLAudioElement | null = null
let speechRunId = 0
let audioUnlocked = false
let webGpuAvailable: boolean | null = null

const audioCache = new Map<string, string>()
const prefetchInFlight = new Map<string, Promise<boolean>>()
let synthChain: Promise<unknown> = Promise.resolve()

type PendingSpeech = {
  text: string
  handlers?: {
    onStart?: () => void
    onEnd?: () => void
    onError?: () => void
  }
  options?: { lang?: string }
}

let pendingSpeech: PendingSpeech | null = null

const SILENT_WAV =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA="

export type SupertonicInitState = {
  loading: boolean
  ready: boolean
  error: string | null
}

const listeners = new Set<(state: SupertonicInitState) => void>()

function cacheKey(text: string, lang: string): string {
  return `${lang}:${text.trim()}`
}

function trimCache() {
  while (audioCache.size > MAX_CACHE_ENTRIES) {
    const oldest = audioCache.keys().next().value
    if (!oldest) break
    const url = audioCache.get(oldest)
    if (url) URL.revokeObjectURL(url)
    audioCache.delete(oldest)
  }
}

function getState(): SupertonicInitState {
  if (textToSpeech && voiceStyle) {
    return { loading: false, ready: true, error: null }
  }
  if (initPromise) {
    return { loading: true, ready: false, error: initError }
  }
  if (initError) {
    return { loading: false, ready: false, error: initError }
  }
  return { loading: false, ready: false, error: null }
}

function notifyListeners() {
  const state = getState()
  listeners.forEach((listener) => listener(state))
}

export function subscribeSupertonicInit(listener: (state: SupertonicInitState) => void) {
  listeners.add(listener)
  listener(getState())
  return () => listeners.delete(listener)
}

export function isSupertonicReady(): boolean {
  return Boolean(textToSpeech && voiceStyle)
}

export function hasPendingSupertonicSpeech(): boolean {
  return pendingSpeech !== null
}

export async function unlockSupertonicAudio(): Promise<boolean> {
  try {
    const probe = new Audio(SILENT_WAV)
    await probe.play()
    audioUnlocked = true
  } catch {
    return false
  }

  if (!pendingSpeech) return audioUnlocked

  const queued = pendingSpeech
  pendingSpeech = null
  return speakSupertonicText(queued.text, queued.handlers, queued.options)
}

async function detectWebGpu(): Promise<boolean> {
  if (webGpuAvailable !== null) return webGpuAvailable
  if (typeof navigator === "undefined" || !("gpu" in navigator)) {
    webGpuAvailable = false
    return false
  }
  try {
    const gpu = navigator.gpu as GPU | undefined
    const adapter = await gpu?.requestAdapter({ powerPreference: "high-performance" })
    webGpuAvailable = adapter !== null && adapter !== undefined
  } catch {
    webGpuAvailable = false
  }
  return webGpuAvailable
}

function enqueueSynthesis<T>(work: () => Promise<T>): Promise<T> {
  const task = synthChain.then(work, work)
  synthChain = task.then(
    () => undefined,
    () => undefined,
  )
  return task
}

async function synthesizeToBlobUrl(text: string, lang: string): Promise<string | null> {
  return enqueueSynthesis(async () => {
    if (!textToSpeech || !voiceStyle) return null

    const { wav, duration } = await textToSpeech.call(
      text,
      lang,
      voiceStyle,
      DEFAULT_TOTAL_STEP,
      DEFAULT_SPEED,
      CHUNK_SILENCE,
    )

    const wavLen = Math.floor(textToSpeech.sampleRate * duration[0])
    const buffer = writeWavFile(wav.slice(0, wavLen), textToSpeech.sampleRate)
    const blob = new Blob([buffer], { type: "audio/wav" })
    return URL.createObjectURL(blob)
  })
}

export async function prefetchSupertonicSpeech(
  text: string,
  options?: { lang?: string },
): Promise<boolean> {
  const trimmed = text.trim()
  if (!trimmed || !isSupertonicEnabled()) return false

  const lang = options?.lang ?? DEFAULT_LANG
  const key = cacheKey(trimmed, lang)
  if (audioCache.has(key)) return true

  const inflight = prefetchInFlight.get(key)
  if (inflight) return inflight

  const task = (async () => {
    const ready = await initSupertonic()
    if (!ready || !textToSpeech || !voiceStyle) return false

    try {
      const url = await synthesizeToBlobUrl(trimmed, lang)
      if (!url) return false
      trimCache()
      audioCache.set(key, url)
      return true
    } catch {
      return false
    } finally {
      prefetchInFlight.delete(key)
    }
  })()

  prefetchInFlight.set(key, task)
  return task
}

async function loadModels(onProgress?: (message: string) => void): Promise<boolean> {
  const onnxDir = getSupertonicOnnxDir()
  const configDir = getSupertonicConfigBase()
  const voicePath = getSupertonicVoiceStylePath()

  const progress = (message: string) => {
    onProgress?.(message)
    notifyListeners()
  }

  const wasmOptions = {
    executionProviders: ["wasm"] as string[],
    graphOptimizationLevel: "all" as const,
  }
  const webgpuOptions = {
    executionProviders: ["webgpu"] as string[],
    graphOptimizationLevel: "all" as const,
  }

  const onModelProgress = (name: string, current: number, total: number) => {
    progress(`Đang tải model (${current}/${total}): ${name}`)
  }

  const useWebGpu = await detectWebGpu()
  progress(useWebGpu ? "Đang tải model (WebGPU)…" : "Đang tải model (WASM)…")
  const loaded = await loadTextToSpeech(
    onnxDir,
    useWebGpu ? webgpuOptions : wasmOptions,
    onModelProgress,
    configDir,
  )
  textToSpeech = loaded.textToSpeech

  progress("Đang tải giọng mascot…")
  voiceStyle = await loadVoiceStyle([voicePath], false)
  initError = null
  notifyListeners()
  return true
}

export function initSupertonic(onProgress?: (message: string) => void): Promise<boolean> {
  if (!isSupertonicEnabled()) return Promise.resolve(false)
  if (textToSpeech && voiceStyle) return Promise.resolve(true)
  if (initPromise) return initPromise

  initError = null
  notifyListeners()

  initPromise = loadModels(onProgress)
    .then((ok) => ok)
    .catch((error: unknown) => {
      initError =
        error instanceof Error ? error.message : "Không tải được giọng Supertonic."
      textToSpeech = null
      voiceStyle = null
      notifyListeners()
      return false
    })
    .finally(() => {
      initPromise = null
    })

  return initPromise
}

function stopCurrentAudio(): void {
  if (!currentAudio) return
  currentAudio.pause()
  currentAudio.removeAttribute("src")
  currentAudio.load()
  currentAudio = null
}

/** Stop playback only — keeps pendingSpeech for retry after user gesture. */
export function cancelSupertonicPlayback(): void {
  speechRunId++
  stopCurrentAudio()
}

export function cancelSupertonicSpeech(): void {
  speechRunId++
  pendingSpeech = null
  stopCurrentAudio()
}

function queuePendingSpeech(
  text: string,
  lang: string,
  handlers?: PendingSpeech["handlers"],
): void {
  pendingSpeech = { text, handlers, options: { lang } }
}

function playBlobUrl(
  url: string,
  runId: number,
  handlers?: PendingSpeech["handlers"],
): Promise<boolean> {
  const audio = new Audio(url)
  currentAudio = audio

  return new Promise((resolve) => {
    let started = false

    const cleanup = () => {
      if (currentAudio === audio) currentAudio = null
    }

    audio.onplay = () => {
      if (!started && runId === speechRunId) {
        started = true
        handlers?.onStart?.()
        resolve(true)
      }
    }
    audio.onended = () => {
      cleanup()
      if (runId === speechRunId) handlers?.onEnd?.()
    }
    audio.onerror = () => {
      cleanup()
      handlers?.onError?.()
      if (!started) resolve(false)
    }

    void audio.play().catch((error: unknown) => {
      const blocked =
        error instanceof DOMException && error.name === "NotAllowedError"
      if (blocked && !audioUnlocked) {
        if (!started) resolve(false)
        return
      }
      cleanup()
      handlers?.onError?.()
      if (!started) resolve(false)
    })

    window.setTimeout(() => {
      if (!started && runId === speechRunId) {
        cleanup()
        handlers?.onError?.()
        resolve(false)
      }
    }, 12000)
  })
}

async function getOrCreateBlobUrl(text: string, lang: string): Promise<string | null> {
  const key = cacheKey(text, lang)
  const cached = audioCache.get(key)
  if (cached) return cached

  const url = await synthesizeToBlobUrl(text, lang)
  if (!url) return null
  trimCache()
  audioCache.set(key, url)
  return url
}

function playBlobUrlToEnd(
  url: string,
  runId: number,
  handlers?: PendingSpeech["handlers"],
  emitStart?: boolean,
): Promise<boolean> {
  const audio = new Audio(url)
  currentAudio = audio

  return new Promise((resolve) => {
    let started = false

    const cleanup = () => {
      if (currentAudio === audio) currentAudio = null
    }

    audio.onplay = () => {
      if (!started && runId === speechRunId && emitStart) {
        started = true
        handlers?.onStart?.()
      }
    }
    audio.onended = () => {
      cleanup()
      if (runId === speechRunId) resolve(true)
    }
    audio.onerror = () => {
      cleanup()
      handlers?.onError?.()
      resolve(false)
    }

    void audio.play().catch((error: unknown) => {
      const blocked =
        error instanceof DOMException && error.name === "NotAllowedError"
      if (blocked && !audioUnlocked) {
        resolve(false)
        return
      }
      cleanup()
      handlers?.onError?.()
      resolve(false)
    })
  })
}

function joinSegmentsForSynthesis(
  segments: Array<{ text: string; lang?: string }>,
): { text: string; lang: string } | null {
  const queue = segments
    .map((segment) => ({
      text: segment.text.trim(),
      lang: segment.lang ?? DEFAULT_LANG,
    }))
    .filter((segment) => segment.text)

  if (!queue.length) return null

  return {
    text: queue.map((segment) => segment.text).join("\n\n"),
    lang: queue[0].lang,
  }
}

export async function speakSupertonicSegments(
  segments: Array<{ text: string; lang?: string }>,
  handlers?: {
    onStart?: () => void
    onEnd?: () => void
    onError?: () => void
  },
): Promise<boolean> {
  const joined = joinSegmentsForSynthesis(segments)
  if (!joined || !isSupertonicEnabled()) return false

  const ready = await initSupertonic()
  if (!ready || !textToSpeech || !voiceStyle) {
    handlers?.onError?.()
    return false
  }

  cancelSupertonicPlayback()
  const runId = speechRunId

  try {
    const { text, lang } = joined
    const blobUrl = await getOrCreateBlobUrl(text, lang)
    if (!blobUrl) {
      handlers?.onError?.()
      queuePendingSpeech(text, lang, handlers)
      return false
    }

    const played = await playBlobUrlToEnd(blobUrl, runId, handlers, true)
    if (!played) {
      queuePendingSpeech(text, lang, handlers)
      return false
    }

    if (runId === speechRunId) pendingSpeech = null

    if (runId === speechRunId) handlers?.onEnd?.()
    return true
  } catch {
    if (runId === speechRunId) handlers?.onError?.()
    return false
  }
}

export async function speakSupertonicText(
  text: string,
  handlers?: {
    onStart?: () => void
    onEnd?: () => void
    onError?: () => void
  },
  options?: { lang?: string },
): Promise<boolean> {
  const trimmed = text.trim()
  if (!trimmed || !isSupertonicEnabled()) return false

  const ready = await initSupertonic()
  if (!ready || !textToSpeech || !voiceStyle) {
    handlers?.onError?.()
    return false
  }

  cancelSupertonicPlayback()
  const runId = speechRunId
  const lang = options?.lang ?? DEFAULT_LANG
  const key = cacheKey(trimmed, lang)

  try {
    let blobUrl = audioCache.get(key)

    if (!blobUrl) {
      blobUrl = (await getOrCreateBlobUrl(trimmed, lang)) ?? undefined
      if (!blobUrl) {
        handlers?.onError?.()
        queuePendingSpeech(trimmed, lang, handlers)
        return false
      }
    }

    if (runId !== speechRunId) return false

    const played = await playBlobUrl(blobUrl, runId, handlers)

    if (!played) {
      queuePendingSpeech(trimmed, lang, handlers)
      return false
    }

    if (runId === speechRunId) pendingSpeech = null
    return true
  } catch {
    if (runId === speechRunId) handlers?.onError?.()
    return false
  }
}
