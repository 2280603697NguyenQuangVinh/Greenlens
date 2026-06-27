import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { BINS, FF_FREDOKA, FF_COMFORTAA, GAME_POOL } from "../../../utils/constants"
import type { TrashCategory } from "../../../utils/constants"
import { getTrashSortItems } from "../../../services/miniGame/miniGameApi"
import { mapTrashSortApiItems, type GamePoolItem } from "../../../services/miniGame/trashSortMappers"
import { getAchievement } from "../../../assets/achievementAssets"
import { MASCOT_IMAGE } from "../../../assets/assetUrl"
import {
  cancelSupertonicPlayback,
  isSupertonicEnabled,
  speakSupertonicText,
  unlockSupertonicOnGesture,
} from "../../../services/supertonic"

type GameEndResult = {
  score: number
  correctCount: number
  wrongCount: number
  durationSeconds: number
}

type GameEndResult = {
  score: number
  correctCount: number
  wrongCount: number
  durationSeconds: number
}

type Props = {
  onBack: () => void
  busy: boolean
  onGameEnd: (result: GameEndResult) => Promise<void>
<<<<<<< HEAD
}

type GamePhase = "loading" | "playing" | "gameOver"
type GameEndReason = "timeout" | "completed"
type PoolItem = GamePoolItem
type StageSlotItem = {
  token: number
  slotIndex: number
  item: PoolItem
  offsetX: number
  offsetY: number
  isDragging: boolean
  isSettling: boolean
}
type DragSession = {
  slotIndex: number
  token: number
  pointerId: number
  startX: number
  startY: number
  startOffsetX: number
  startOffsetY: number
  lastX: number
  lastY: number
  finalized: boolean
}
type GameResultPayload = {
  xpAwarded: number
  unlockedBadges: string[]
}
type BinEffectType = "idle" | "success" | "error"
type StarBurst = { id: number; category: TrashCategory }
type MascotMood = "idle" | "success" | "error"

const TOTAL_TIME = 60
const ROUND_ITEM_COUNT = 6
const STAGE_SIZE = 3
const CORRECT_POINTS = 10
const WRONG_PENALTY = 5
const PERFECT_BONUS = 30
const HIGH_SCORE_THRESHOLD = 80
const RAC_KY_THU_BADGE = "Rác Kỳ Thủ"
const MOUSE_POINTER_ID = -100
const MESSAGE_SUCCESS = "Tuyệt vời! Con đã phân loại đúng rồi!"
const MESSAGE_ERROR = "Ôi không! Thùng rác này chưa đúng rồi. Con hãy thử lại nhé!"
const MESSAGE_RESULT_TIMEOUT = "Con cần cố gắng hơn nữa!"
const MESSAGE_RESULT_SUCCESS = "Con làm tốt lắm!"
const DEFAULT_MASCOT_MESSAGE = "Kéo rác vào đúng thùng nhé!"
const ALLOWED_CATEGORIES: readonly TrashCategory[] = ["Recyclable", "Organic", "Hazardous"]
const INITIAL_BIN_EFFECT: Record<TrashCategory, BinEffectType> = {
  Recyclable: "idle",
  Organic: "idle",
  Hazardous: "idle",
}

const FONT_DISPLAY = { ...FF_FREDOKA, fontWeight: 700 }
const FONT_TEXT = { ...FF_COMFORTAA, fontWeight: 700 }

async function loadTrashSortPool(): Promise<PoolItem[]> {
  try {
    const response = await getTrashSortItems()
    const mapped = mapTrashSortApiItems(response.items)
    if (mapped.length > 0) return mapped
    console.warn("[TrashSort] API returned no usable items; falling back to local pool.")
  } catch (error) {
    console.error("[TrashSort] Failed to load items from API; falling back to local pool.", error)
  }
  return GAME_POOL
}

function isPerfectRun(correctCount: number, wrongCount: number) {
  return correctCount === ROUND_ITEM_COUNT && wrongCount === 0
}

function computeFinalScore(correctCount: number, wrongCount: number) {
  const baseScore = Math.max(0, correctCount * CORRECT_POINTS - wrongCount * WRONG_PENALTY)
  return baseScore + (isPerfectRun(correctCount, wrongCount) ? PERFECT_BONUS : 0)
}

function buildResultPayload(correctCount: number, wrongCount: number): GameResultPayload {
  const finalScore = computeFinalScore(correctCount, wrongCount)
  const unlockedBadges =
    isPerfectRun(correctCount, wrongCount) && finalScore > HIGH_SCORE_THRESHOLD
      ? [RAC_KY_THU_BADGE]
      : []
  const xpAwarded = finalScore > HIGH_SCORE_THRESHOLD ? 20 : 10
  return { xpAwarded, unlockedBadges }
}

function createStageSlot(slotIndex: number, item: PoolItem): StageSlotItem {
  return {
    token: Date.now() + Math.floor(Math.random() * 100000) + slotIndex,
    slotIndex,
    item,
    offsetX: 0,
    offsetY: 0,
    isDragging: false,
    isSettling: false,
  }
}

function toDragPayload(slotIndex: number, token: number, itemCategory: TrashCategory) {
  return JSON.stringify({ slotIndex, token, itemCategory })
}

function fromDragPayload(payload: string) {
  if (!payload) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(payload)
  } catch {
    return null
  }
  if (!parsed || typeof parsed !== "object") return null
  const record = parsed as { slotIndex?: unknown; token?: unknown; itemCategory?: unknown }
  const slotIndex = Number(record.slotIndex)
  const token = Number(record.token)
  const itemCategory = String(record.itemCategory ?? "")
  if (!Number.isInteger(slotIndex) || !Number.isInteger(token)) return null
  if (!ALLOWED_CATEGORIES.includes(itemCategory as TrashCategory)) return null
  return { slotIndex, token, itemCategory: itemCategory as TrashCategory }
}

function shuffle<T>(arr: T[]) {
  const next = [...arr]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

function pickUniqueItems(source: PoolItem[], amount: number): PoolItem[] {
  return shuffle(source).slice(0, amount)
}

function buildRoundItems(pool: PoolItem[]): PoolItem[] {
  const byCategory = {
    Recyclable: pool.filter((item) => item.category === "Recyclable"),
    Organic: pool.filter((item) => item.category === "Organic"),
    Hazardous: pool.filter((item) => item.category === "Hazardous"),
  }

  const picked = [
    ...pickUniqueItems(byCategory.Recyclable, 2),
    ...pickUniqueItems(byCategory.Organic, 2),
    ...pickUniqueItems(byCategory.Hazardous, 2),
  ]

  const unique = new Map<string, PoolItem>()
  picked.forEach((item) => unique.set(item.key, item))
  const fallback = shuffle(pool)
  for (const item of fallback) {
    if (unique.size >= ROUND_ITEM_COUNT) break
    if (!unique.has(item.key)) unique.set(item.key, item)
  }

  return shuffle(Array.from(unique.values())).slice(0, ROUND_ITEM_COUNT)
}

function createEmptyBinContents() {
  return {
    Recyclable: [] as PoolItem[],
    Organic: [] as PoolItem[],
    Hazardous: [] as PoolItem[],
  }
=======
>>>>>>> fd135d64253c255983079844d1c7e8a8bd883288
}

export function GameScreen({ onBack, busy, onGameEnd }: Props) {
  const [phase, setPhase] = useState<GamePhase>("loading")
  const [pool, setPool] = useState<PoolItem[]>([])
  const [roundItems, setRoundItems] = useState<PoolItem[]>([])
  const [stageIndex, setStageIndex] = useState(0)
  const [stageSlots, setStageSlots] = useState<Array<StageSlotItem | null>>(
    Array.from({ length: STAGE_SIZE }, () => null),
  )
  const [binContents, setBinContents] = useState(createEmptyBinContents())
  const [binEffects, setBinEffects] = useState<Record<TrashCategory, BinEffectType>>(INITIAL_BIN_EFFECT)
  const [starBursts, setStarBursts] = useState<StarBurst[]>([])
  const [score, setScore] = useState(0)
<<<<<<< HEAD
  const [correctCount, setCorrectCount] = useState(0)
  const [wrongCount, setWrongCount] = useState(0)
  const [time, setTime] = useState(TOTAL_TIME)
  const [resultPayload, setResultPayload] = useState<GameResultPayload | null>(null)
  const [failedItemImages, setFailedItemImages] = useState<Record<string, true>>({})
  const [failedBinImages, setFailedBinImages] = useState<Record<string, true>>({})
  const [failedMascotImage, setFailedMascotImage] = useState(false)
  const [mascotMood, setMascotMood] = useState<MascotMood>("idle")
  const [mascotBubbleText, setMascotBubbleText] = useState(DEFAULT_MASCOT_MESSAGE)
  const [endReason, setEndReason] = useState<GameEndReason | null>(null)

  const racKyThuAchievement = useMemo(() => getAchievement("game-king"), [])
  const binRefs = useRef<Array<HTMLButtonElement | null>>([])
  const slotRefs = useRef<Array<HTMLDivElement | null>>([])
  const dragSessionRef = useRef<DragSession | null>(null)
  const htmlDropProcessedRef = useRef<string | null>(null)
  const submittedRef = useRef(false)
  const effectTimeoutsRef = useRef<number[]>([])
  const mascotTimeoutRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const validCategorySet = useMemo(() => new Set<TrashCategory>(ALLOWED_CATEGORIES), [])

  const clearEffects = useCallback(() => {
    effectTimeoutsRef.current.forEach((id) => window.clearTimeout(id))
    effectTimeoutsRef.current = []
  }, [])

  const resetMascotToIdle = useCallback(() => {
    if (mascotTimeoutRef.current !== null) {
      window.clearTimeout(mascotTimeoutRef.current)
      mascotTimeoutRef.current = null
    }
    setMascotMood("idle")
    setMascotBubbleText(DEFAULT_MASCOT_MESSAGE)
  }, [])

  const showMascotBubble = useCallback(
    (text: string, mood: MascotMood) => {
      if (mascotTimeoutRef.current !== null) {
        window.clearTimeout(mascotTimeoutRef.current)
        mascotTimeoutRef.current = null
      }
      setMascotMood(mood)
      setMascotBubbleText(text)
      const displayMs = Math.max(2200, text.length * 55)
      mascotTimeoutRef.current = window.setTimeout(resetMascotToIdle, displayMs)
    },
    [resetMascotToIdle],
  )

  const speakMascot = useCallback(
    async (text: string, mood: MascotMood) => {
      if (mascotTimeoutRef.current !== null) {
        window.clearTimeout(mascotTimeoutRef.current)
        mascotTimeoutRef.current = null
      }

      setMascotMood(mood)
      setMascotBubbleText(text)

      const fallbackResetMs = Math.max(2500, text.length * 75)

      if (!isSupertonicEnabled()) {
        console.error("[TrashSort] Supertonic is disabled; feedback voice playback skipped.")
        mascotTimeoutRef.current = window.setTimeout(resetMascotToIdle, fallbackResetMs)
        return
      }

      const played = await speakSupertonicText(
        text,
        {
          onEnd: resetMascotToIdle,
          onError: () => {
            mascotTimeoutRef.current = window.setTimeout(resetMascotToIdle, fallbackResetMs)
          },
        },
        { lang: "vi" },
      )

      if (!played) {
        console.error("[TrashSort] Supertonic playback failed for feedback text:", text)
        cancelSupertonicPlayback()
        mascotTimeoutRef.current = window.setTimeout(resetMascotToIdle, fallbackResetMs)
      }
    },
    [resetMascotToIdle],
  )

  const unlockAudio = useCallback(() => {
    if ("AudioContext" in window || "webkitAudioContext" in window) {
      const AudioContextCtor =
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).AudioContext ??
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (AudioContextCtor && !audioContextRef.current) {
        audioContextRef.current = new AudioContextCtor()
      }
      void audioContextRef.current?.resume()
    }
    if (isSupertonicEnabled()) {
      void unlockSupertonicOnGesture()
    }
  }, [])

  const playTone = useCallback((frequencies: number[]) => {
    const ctx = audioContextRef.current
    if (!ctx) return
    const now = ctx.currentTime
    frequencies.forEach((freq, index) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "sine"
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(0.09, now + index * 0.09 + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.09 + 0.08)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + index * 0.09)
      osc.stop(now + index * 0.09 + 0.09)
    })
  }, [])

  const triggerBinEffect = useCallback(
    (category: TrashCategory, type: BinEffectType) => {
      setBinEffects((prev) => ({ ...prev, [category]: type }))
      const timeoutId = window.setTimeout(() => {
        setBinEffects((prev) => ({ ...prev, [category]: "idle" }))
      }, 800)
      effectTimeoutsRef.current.push(timeoutId)
    },
    [],
  )

  const triggerStarBurst = useCallback((category: TrashCategory) => {
    const burst = { id: Date.now() + Math.floor(Math.random() * 9999), category }
    setStarBursts((prev) => [...prev, burst])
    const timeoutId = window.setTimeout(() => {
      setStarBursts((prev) => prev.filter((entry) => entry.id !== burst.id))
    }, 900)
    effectTimeoutsRef.current.push(timeoutId)
  }, [])

  const sanitizePool = useCallback(
    (source: PoolItem[]) => source.filter((entry) => validCategorySet.has(entry.category)),
    [validCategorySet],
  )

  const spawnStageSlots = useCallback((items: PoolItem[]) => {
    return Array.from({ length: STAGE_SIZE }, (_, slotIndex) => {
      const item = items[slotIndex]
      return item ? createStageSlot(slotIndex, item) : null
    })
  }, [])

  const refreshGame = useCallback(async () => {
    submittedRef.current = false
    dragSessionRef.current = null
    htmlDropProcessedRef.current = null
    clearEffects()
    cancelSupertonicPlayback()
    resetMascotToIdle()
    setPhase("loading")
    setScore(0)
    setCorrectCount(0)
    setWrongCount(0)
    setTime(TOTAL_TIME)
    setResultPayload(null)
    setEndReason(null)
    setStageIndex(0)
    setFailedItemImages({})
    setFailedBinImages({})
    setBinEffects(INITIAL_BIN_EFFECT)
    setBinContents(createEmptyBinContents())
    setStarBursts([])

    const safePool = sanitizePool(await loadTrashSortPool())
    const round = buildRoundItems(safePool)

    setPool(safePool)
    setRoundItems(round)
    setStageSlots(spawnStageSlots(round.slice(0, STAGE_SIZE)))
    setPhase("playing")
  }, [clearEffects, resetMascotToIdle, sanitizePool, spawnStageSlots])
=======
  const [wrongCount, setWrongCount] = useState(0)
  const [time, setTime] = useState(60)
  const [feedback, setFb] = useState<{ msg: string; ok: boolean } | null>(null)
  const [over, setOver] = useState(false)
  const [nextId, setNextId] = useState(4)
  const submitted = useRef(false)
>>>>>>> fd135d64253c255983079844d1c7e8a8bd883288

  useEffect(() => {
    void refreshGame()
    return () => {
      clearEffects()
      if (mascotTimeoutRef.current) {
        window.clearTimeout(mascotTimeoutRef.current)
      }
    }
  }, [clearEffects, refreshGame])

  useEffect(() => {
    if (phase !== "playing") return
    const iv = window.setInterval(() => {
      setTime((currentTime) => {
        if (currentTime <= 1) {
          setEndReason("timeout")
          setPhase("gameOver")
          window.clearInterval(iv)
          return 0
        }
        return currentTime - 1
      })
    }, 1000)
    return () => window.clearInterval(iv)
  }, [phase])

  useEffect(() => {
<<<<<<< HEAD
    if (phase !== "playing") return
    if (roundItems.length < ROUND_ITEM_COUNT) return
    const stageCleared = stageSlots.every((slot) => slot === null)
    if (!stageCleared) return

    if (stageIndex === 0) {
      const nextStageItems = roundItems.slice(STAGE_SIZE, STAGE_SIZE * 2)
      setStageIndex(1)
      setStageSlots(spawnStageSlots(nextStageItems))
      return
    }

    if (stageIndex === 1) {
      setEndReason("completed")
      setPhase("gameOver")
=======
    if (over && !submitted.current) {
      submitted.current = true
      void onGameEnd({
        score,
        correctCount: Math.floor(score / 10),
        wrongCount,
        durationSeconds: Math.max(1, 60 - time),
      })
    }
  }, [over, score, wrongCount, time, onGameEnd])

  const flash = (msg: string, ok: boolean) => {
    setFb({ msg, ok })
    setTimeout(() => setFb(null), 1000)
  }

  const sort = (binIdx: number) => {
    if (sel === null || over) return
    const item = items.find((x) => x.id === sel)
    if (!item) return
    if (item.b === binIdx) {
      setScore((s) => s + 10)
      flash("Great! +10 🌟", true)
      const pool = GAME_POOL.filter((p) => !items.some((x) => x.e === p.e && x.id !== sel))
      const next = pool[nextId % pool.length]
      setNextId((n) => n + 1)
      setItems((prev) => prev.filter((x) => x.id !== sel).concat(next ? { ...next, id: Date.now() } : []))
    } else {
      setWrongCount((count) => count + 1)
      flash("Try again! ❌", false)
>>>>>>> fd135d64253c255983079844d1c7e8a8bd883288
    }
  }, [phase, roundItems, stageIndex, stageSlots, spawnStageSlots])

<<<<<<< HEAD
  useEffect(() => {
    if (phase !== "gameOver" || !endReason || submittedRef.current) return
    submittedRef.current = true

    const resultMessage =
      endReason === "timeout" ? MESSAGE_RESULT_TIMEOUT : MESSAGE_RESULT_SUCCESS
    void speakMascot(resultMessage, endReason === "timeout" ? "idle" : "success")

    if (endReason === "completed") {
      const finalScore = computeFinalScore(correctCount, wrongCount)
      const durationSeconds = Math.max(1, TOTAL_TIME - time)
      setResultPayload(buildResultPayload(correctCount, wrongCount))
      void onGameEnd({
        score: finalScore,
        correctCount,
        wrongCount,
        durationSeconds,
      })
    }
  }, [phase, endReason, correctCount, wrongCount, time, onGameEnd, speakMascot])

  const elapsedSeconds = Math.max(1, TOTAL_TIME - time)
  const finalScore =
    endReason === "completed" ? computeFinalScore(correctCount, wrongCount) : score
  const resultMessage =
    endReason === "timeout" ? MESSAGE_RESULT_TIMEOUT : MESSAGE_RESULT_SUCCESS

  const detectBinByPoint = useCallback((clientX: number, clientY: number): TrashCategory | null => {
    for (let i = 0; i < BINS.length; i += 1) {
      const node = binRefs.current[i]
      if (!node) continue
      const rect = node.getBoundingClientRect()
      if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
        return BINS[i]?.category ?? null
      }
    }
    return null
  }, [])

  const calculateTravelToBin = useCallback((slotIndex: number, targetCategory: TrashCategory) => {
    const slotRect = slotRefs.current[slotIndex]?.getBoundingClientRect()
    const binIndex = BINS.findIndex((bin) => bin.category === targetCategory)
    const binRect = binRefs.current[binIndex]?.getBoundingClientRect()
    if (!slotRect || !binRect) return { dx: 0, dy: 0 }
    const slotCenterX = slotRect.left + slotRect.width / 2
    const slotCenterY = slotRect.top + slotRect.height / 2
    const binCenterX = binRect.left + binRect.width / 2
    const binTargetY = binRect.top + binRect.height * 0.62
    return { dx: binCenterX - slotCenterX, dy: binTargetY - slotCenterY }
  }, [])

  const resolveDrop = useCallback(
    (slotIndex: number, token: number, targetBinCategory: TrashCategory | null) => {
      if (phase !== "playing") return
      const current = stageSlots[slotIndex]
      if (!current || current.token !== token || current.isSettling) return

      const resetToStart = () => {
        setStageSlots((prev) => {
          const next = [...prev]
          const slot = next[slotIndex]
          if (!slot || slot.token !== token) return prev
          next[slotIndex] = {
            ...slot,
            isDragging: false,
            offsetX: 0,
            offsetY: 0,
          }
          return next
        })
      }

      if (targetBinCategory === null || !validCategorySet.has(current.item.category)) {
        resetToStart()
        return
      }

      if (current.item.category !== targetBinCategory) {
        setWrongCount((value) => value + 1)
        setScore((value) => Math.max(0, value - WRONG_PENALTY))
        showMascotBubble(MESSAGE_ERROR, "error")
        triggerBinEffect(targetBinCategory, "error")
        playTone([520, 420])
        resetToStart()
        return
      }

      const travel = calculateTravelToBin(slotIndex, targetBinCategory)
      setStageSlots((prev) => {
        const next = [...prev]
        const slot = next[slotIndex]
        if (!slot || slot.token !== token) return prev
        next[slotIndex] = {
          ...slot,
          isDragging: false,
          isSettling: true,
          offsetX: slot.offsetX + travel.dx,
          offsetY: slot.offsetY + travel.dy,
        }
        return next
      })

      showMascotBubble(MESSAGE_SUCCESS, "success")
      triggerBinEffect(targetBinCategory, "success")
      triggerStarBurst(targetBinCategory)
      playTone([620, 760, 920])

      const timeoutId = window.setTimeout(() => {
        setScore((value) => value + CORRECT_POINTS)
        setCorrectCount((value) => value + 1)
        setBinContents((prev) => {
          const updated = [...prev[targetBinCategory], current.item].slice(0, 2)
          return { ...prev, [targetBinCategory]: updated }
        })
        setStageSlots((prev) => {
          const next = [...prev]
          const slot = next[slotIndex]
          if (!slot || slot.token !== token) return prev
          next[slotIndex] = null
          return next
        })
      }, 320)
      effectTimeoutsRef.current.push(timeoutId)
    },
    [
      calculateTravelToBin,
      phase,
      playTone,
      showMascotBubble,
      stageSlots,
      triggerBinEffect,
      triggerStarBurst,
      validCategorySet,
    ],
  )

  const endPointerSession = useCallback(
    (targetBinCategory: TrashCategory | null) => {
      const session = dragSessionRef.current
      if (!session || session.finalized) return
      dragSessionRef.current = { ...session, finalized: true }
      resolveDrop(session.slotIndex, session.token, targetBinCategory)
      dragSessionRef.current = null
    },
    [resolveDrop],
  )

  const startPointerDrag = useCallback(
    (slotIndex: number, pointerId: number, clientX: number, clientY: number) => {
      unlockAudio()
      if (phase !== "playing") return
      const slot = stageSlots[slotIndex]
      if (!slot || slot.isSettling) return

      dragSessionRef.current = {
        slotIndex,
        token: slot.token,
        pointerId,
        startX: clientX,
        startY: clientY,
        startOffsetX: slot.offsetX,
        startOffsetY: slot.offsetY,
        lastX: clientX,
        lastY: clientY,
        finalized: false,
      }

      setStageSlots((prev) => {
        const next = [...prev]
        const current = next[slotIndex]
        if (!current || current.token !== slot.token) return prev
        next[slotIndex] = { ...current, isDragging: true }
        return next
      })
    },
    [phase, stageSlots, unlockAudio],
  )

  const moveDragSession = useCallback((slotIndex: number, pointerId: number, clientX: number, clientY: number) => {
    const session = dragSessionRef.current
    if (!session || session.slotIndex !== slotIndex || session.pointerId !== pointerId) return
    const nextOffsetX = session.startOffsetX + (clientX - session.startX)
    const nextOffsetY = session.startOffsetY + (clientY - session.startY)
    dragSessionRef.current = { ...session, lastX: clientX, lastY: clientY }

    setStageSlots((prev) => {
      const next = [...prev]
      const current = next[slotIndex]
      if (!current || current.token !== session.token) return prev
      next[slotIndex] = { ...current, offsetX: nextOffsetX, offsetY: nextOffsetY }
      return next
    })
  }, [])

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      const session = dragSessionRef.current
      if (!session || session.pointerId !== MOUSE_POINTER_ID) return
      moveDragSession(session.slotIndex, MOUSE_POINTER_ID, event.clientX, event.clientY)
    }

    const onMouseUp = (event: MouseEvent) => {
      const session = dragSessionRef.current
      if (!session || session.pointerId !== MOUSE_POINTER_ID) return
      endPointerSession(detectBinByPoint(event.clientX, event.clientY))
    }

    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)
    return () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
    }
  }, [detectBinByPoint, endPointerSession, moveDragSession])
=======
  const restart = () => {
    submitted.current = false
    setItems(getInitItems())
    setScore(0)
    setWrongCount(0)
    setTime(60)
    setOver(false)
    setSel(null)
    setNextId(4)
  }
>>>>>>> fd135d64253c255983079844d1c7e8a8bd883288

  return (
    <div className="relative h-full overflow-hidden bg-[#DBF8FF]">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,_#dff6ff_0%,_#cdeeff_40%,_#b7e1ff_70%,_#9bd8ff_100%)]" />
        <div className="absolute left-[6%] top-[10%] h-20 w-36 rounded-full bg-white/90 blur-[1px]" />
        <div className="absolute left-[13%] top-[8%] h-12 w-24 rounded-full bg-white/95" />
        <div className="absolute right-[9%] top-[16%] h-16 w-32 rounded-full bg-white/90" />
        <div className="absolute right-[17%] top-[14%] h-10 w-16 rounded-full bg-white/95" />
        <div className="absolute right-6 top-6 h-24 w-24 rounded-full bg-[#FFD93D] shadow-[0_0_40px_8px_rgba(255,217,61,0.5)]">
          <div className="absolute left-[28%] top-[33%] h-2 w-2 rounded-full bg-[#9A3412]" />
          <div className="absolute right-[28%] top-[33%] h-2 w-2 rounded-full bg-[#9A3412]" />
          <div className="absolute left-[34%] top-[53%] h-3 w-8 rounded-b-full border-b-2 border-[#9A3412]" />
        </div>
        <motion.span
          className="absolute left-[12%] top-[34%] text-2xl opacity-30"
          animate={{ y: [0, -8, 0], rotate: [-6, 6, -6] }}
          transition={{ repeat: Infinity, duration: 3.5 }}
        >
          ♻️
        </motion.span>
        <motion.span
          className="absolute right-[18%] top-[32%] text-xl opacity-25"
          animate={{ y: [0, -10, 0], rotate: [8, -8, 8] }}
          transition={{ repeat: Infinity, duration: 3.2 }}
        >
          ♻️
        </motion.span>
        <motion.span
          className="absolute right-[38%] top-[22%] text-lg opacity-20"
          animate={{ y: [0, -7, 0], rotate: [5, -5, 5] }}
          transition={{ repeat: Infinity, duration: 2.8 }}
        >
          ♻️
        </motion.span>
        <div className="absolute inset-x-0 bottom-0 h-[40%] bg-[radial-gradient(ellipse_at_bottom,_#A7F3D0_0%,_#6EE7B7_48%,_#34D399_100%)]" />
        <div className="absolute bottom-16 left-0 h-20 w-52 rounded-tr-[80px] rounded-tl-[50px] bg-[#4ADE80]/90" />
        <div className="absolute bottom-14 right-0 h-24 w-60 rounded-tl-[90px] rounded-tr-[40px] bg-[#22C55E]/90" />
        <div className="absolute bottom-10 left-[30%] h-16 w-44 rounded-[80px] bg-[#16A34A]/70" />
      </div>

      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-center justify-between gap-2 bg-white/80 px-3 pb-2 pt-3 shadow-sm backdrop-blur-sm">
          <button
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/90"
          >
            <span className="text-gray-600">←</span>
          </button>
          <div
            className={`flex items-center gap-2 rounded-2xl px-3 py-2 text-base ${
              time <= 10 ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"
            }`}
            style={FONT_DISPLAY}
          >
            <span>⏱</span>
            <span>{String(time).padStart(2, "0")}s</span>
          </div>
          <div
            className="flex items-center gap-2 rounded-2xl bg-amber-100 px-3 py-2 text-base text-amber-600"
            style={FONT_DISPLAY}
          >
            <span>Điểm</span>
            <span>{score}</span>
          </div>
        </div>

        <div
          className="flex items-center justify-between px-3 py-1 text-sm text-[#14532d]"
          style={FONT_TEXT}
        >
          <span>
            Đúng: {correctCount} | Sai: {wrongCount}
          </span>
          <span>
            Lượt {stageIndex + 1}/2
          </span>
        </div>

        <div className="relative flex-1 overflow-hidden px-3 py-2">
          <AnimatePresence>
            {phase === "loading" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 rounded-2xl bg-white/95"
              >
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-500" />
                <p className="px-4 text-center text-base text-[#14532d]" style={FONT_DISPLAY}>
                  Đang chuẩn bị sân chơi tái chế...
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {phase === "playing" && (
            <div className="absolute inset-0 flex items-center justify-center px-2 sm:px-4">
              <div className="mx-auto grid w-full max-w-[380px] grid-cols-3 place-items-center gap-2 md:max-w-[600px] md:gap-5">
                {Array.from({ length: STAGE_SIZE }, (_, slotIndex) => {
                  const slot = stageSlots[slotIndex]
                  return (
                    <div
                      key={`slot-${slotIndex}`}
                      className="relative flex h-[118px] w-[130px] items-center justify-center md:h-[162px] md:w-[190px]"
                    >
                      {slot && (
                        <motion.div
                          ref={(el) => {
                            slotRefs.current[slotIndex] = el
                          }}
                          role="button"
                          tabIndex={0}
                          draggable={!slot.isSettling}
                          onMouseDown={(event) => {
                            event.preventDefault()
                            startPointerDrag(slotIndex, MOUSE_POINTER_ID, event.clientX, event.clientY)
                          }}
                          onPointerDown={(event) => {
                            if (event.pointerType === "mouse") return
                            event.preventDefault()
                            startPointerDrag(slotIndex, event.pointerId, event.clientX, event.clientY)
                          }}
                          onPointerMove={(event) =>
                            moveDragSession(slotIndex, event.pointerId, event.clientX, event.clientY)
                          }
                          onPointerUp={(event) => {
                            const session = dragSessionRef.current
                            if (!session || session.slotIndex !== slotIndex) return
                            if (session.pointerId !== event.pointerId) return
                            endPointerSession(detectBinByPoint(event.clientX, event.clientY))
                          }}
                          onPointerCancel={() => endPointerSession(null)}
                          onTouchStart={(event) => {
                            if ("PointerEvent" in window) return
                            const touch = event.touches[0]
                            if (!touch) return
                            startPointerDrag(slotIndex, -1, touch.clientX, touch.clientY)
                          }}
                          onTouchMove={(event) => {
                            if ("PointerEvent" in window) return
                            const session = dragSessionRef.current
                            if (!session || session.slotIndex !== slotIndex || !event.touches.length) return
                            const touch = event.touches[0]
                            moveDragSession(slotIndex, -1, touch.clientX, touch.clientY)
                          }}
                          onTouchEnd={() => {
                            if ("PointerEvent" in window) return
                            const session = dragSessionRef.current
                            if (!session || session.slotIndex !== slotIndex) return
                            endPointerSession(detectBinByPoint(session.lastX, session.lastY))
                          }}
                          onDragStartCapture={(event: React.DragEvent<HTMLDivElement>) => {
                            unlockAudio()
                            const payload = toDragPayload(slotIndex, slot.token, slot.item.category)
                            event.dataTransfer.setData("text/plain", payload)
                            event.dataTransfer.setData("application/x-trash-item", payload)
                            htmlDropProcessedRef.current = null
                          }}
                          onDragEndCapture={() => {
                            const key = toDragPayload(slotIndex, slot.token, slot.item.category)
                            if (htmlDropProcessedRef.current === key) {
                              htmlDropProcessedRef.current = null
                              return
                            }
                            resolveDrop(slotIndex, slot.token, null)
                          }}
                          className="absolute inset-0 z-20 flex h-full w-full select-none flex-col items-center justify-center bg-transparent px-1 py-1 text-center"
                          animate={{ x: slot.offsetX, y: slot.offsetY, scale: slot.isDragging ? 1.08 : 1 }}
                          transition={
                            slot.isDragging
                              ? { duration: 0.03, ease: "linear" }
                              : { type: "spring", stiffness: 360, damping: 24 }
                          }
                          style={{ touchAction: "none" }}
                        >
                          {!failedItemImages[slot.item.key] && slot.item.iconSrc ? (
                            <img
                              src={slot.item.iconSrc}
                              alt={slot.item.n}
                              className="h-[84px] w-[84px] object-contain md:h-[116px] md:w-[116px]"
                              onError={() =>
                                setFailedItemImages((prev) => ({
                                  ...prev,
                                  [slot.item.key]: true,
                                }))
                              }
                              draggable={false}
                            />
                          ) : (
                            <div className="text-xs text-slate-500" style={FONT_TEXT}>
                              Không có ảnh
                            </div>
                          )}
                          <p className="mt-1 text-sm leading-tight text-[#334155] md:text-base" style={FONT_TEXT}>
                            {slot.item.n}
                          </p>
                        </motion.div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="pointer-events-none absolute bottom-2 left-2 z-30 md:bottom-3 md:left-4">
            <motion.div
              className="relative flex items-end gap-2"
              animate={
                mascotMood === "success"
                  ? { y: [0, -3, 0], scale: [1, 1.04, 1] }
                  : mascotMood === "error"
                    ? { x: [0, -3, 3, -2, 2, 0] }
                    : { y: [0, -1, 0] }
              }
              transition={{ duration: 0.42, repeat: mascotMood === "idle" ? Infinity : 0, repeatDelay: 1.2 }}
            >
              {!failedMascotImage ? (
                <img
                  src={MASCOT_IMAGE}
                  alt="Mascot"
                  className="h-[88px] w-[88px] object-contain md:h-[108px] md:w-[108px]"
                  onError={() => setFailedMascotImage(true)}
                  draggable={false}
                />
              ) : (
                <div className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-white/85 text-2xl md:h-[108px] md:w-[108px]">
                  🦊
                </div>
              )}
              <div
                className={`max-w-[210px] rounded-2xl border-2 px-3 py-2 text-xs ${
                  mascotMood === "success"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : mascotMood === "error"
                      ? "border-red-500 bg-red-50 text-red-700"
                      : "border-sky-400 bg-white/90 text-sky-700"
                }`}
                style={FONT_DISPLAY}
              >
                {mascotBubbleText}
              </div>
            </motion.div>
          </div>

          <AnimatePresence>
            {phase === "gameOver" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 z-40 rounded-2xl bg-black/60 p-4 backdrop-blur-sm sm:p-6"
              >
                <div className="h-full w-full overflow-y-auto rounded-3xl bg-white p-4 sm:p-6">
                  <h3 className="text-center text-xl text-[#14532d]" style={FONT_DISPLAY}>
                    Kết quả trò chơi
                  </h3>

                  <p className="mt-2 text-center text-base text-[#334155]" style={FONT_TEXT}>
                    {resultMessage}
                  </p>

                  {endReason === "completed" && (
                    <>
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-emerald-50 p-3">
                          <p className="text-xs text-emerald-700" style={FONT_TEXT}>
                            Điểm số
                          </p>
                          <p className="text-2xl text-emerald-700" style={FONT_DISPLAY}>
                            {finalScore}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-sky-50 p-3">
                          <p className="text-xs text-sky-700" style={FONT_TEXT}>
                            Thời gian
                          </p>
                          <p className="text-2xl text-sky-700" style={FONT_DISPLAY}>
                            {elapsedSeconds}s
                          </p>
                        </div>
                        <div className="rounded-2xl bg-lime-50 p-3">
                          <p className="text-xs text-lime-700" style={FONT_TEXT}>
                            Số câu đúng
                          </p>
                          <p className="text-2xl text-lime-700" style={FONT_DISPLAY}>
                            {correctCount}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-rose-50 p-3">
                          <p className="text-xs text-rose-700" style={FONT_TEXT}>
                            Số câu sai
                          </p>
                          <p className="text-2xl text-rose-700" style={FONT_DISPLAY}>
                            {wrongCount}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl bg-amber-50 p-3">
                        <p className="text-sm text-amber-700" style={FONT_TEXT}>
                          Phần thưởng
                        </p>
                        {resultPayload ? (
                          <>
                            <p className="mt-1 text-base text-amber-700" style={FONT_DISPLAY}>
                              +{resultPayload.xpAwarded} XP
                            </p>
                            <div className="mt-2 flex flex-wrap justify-center gap-3">
                              {resultPayload.unlockedBadges.length ? (
                                resultPayload.unlockedBadges.map((badge) => (
                                  <div key={badge} className="flex flex-col items-center gap-1">
                                    {badge === RAC_KY_THU_BADGE && racKyThuAchievement ? (
                                      <img
                                        src={racKyThuAchievement.image}
                                        alt={badge}
                                        className="h-14 w-14 object-contain"
                                      />
                                    ) : null}
                                    <span className="text-xs text-amber-800" style={FONT_TEXT}>
                                      {badge}
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <span className="text-xs text-amber-700" style={FONT_TEXT}>
                                  Chưa mở khóa huy hiệu mới
                                </span>
                              )}
                            </div>
                          </>
                        ) : (
                          <p className="mt-2 text-xs text-amber-700" style={FONT_TEXT}>
                            Đang tải phần thưởng...
                          </p>
                        )}
                      </div>

                      {busy && (
                        <p className="mt-2 text-center text-xs text-slate-500" style={FONT_TEXT}>
                          Đang lưu điểm...
                        </p>
                      )}
                    </>
                  )}

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <button
                      onClick={() => void refreshGame()}
                      className="rounded-2xl bg-emerald-500 py-3 text-sm text-white active:scale-95"
                      style={FONT_DISPLAY}
                    >
                      Chơi lại
                    </button>
                    <button
                      onClick={onBack}
                      className="rounded-2xl bg-slate-200 py-3 text-sm text-slate-700 active:scale-95"
                      style={FONT_DISPLAY}
                    >
                      Về trang chủ
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex-shrink-0 px-2 pb-3 pt-2">
          <div className="mx-auto flex w-full max-w-[760px] flex-row flex-nowrap justify-center gap-3">
            {BINS.map((bin, i) => {
              const effect = binEffects[bin.category]
              const stars = starBursts.filter((entry) => entry.category === bin.category)
              return (
                <motion.button
                  key={bin.category}
                  data-category={bin.category}
                  ref={(el) => {
                    binRefs.current[i] = el
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event: React.DragEvent<HTMLButtonElement>) => {
                    event.preventDefault()
                    unlockAudio()
                    const payload = fromDragPayload(
                      event.dataTransfer.getData("application/x-trash-item") ||
                        event.dataTransfer.getData("text/plain"),
                    )
                    if (!payload) return
                    const binCategory = event.currentTarget.dataset.category as TrashCategory | undefined
                    if (!binCategory || !validCategorySet.has(binCategory)) {
                      resolveDrop(payload.slotIndex, payload.token, null)
                      return
                    }

                    htmlDropProcessedRef.current = toDragPayload(
                      payload.slotIndex,
                      payload.token,
                      payload.itemCategory,
                    )
                    resolveDrop(payload.slotIndex, payload.token, binCategory)
                  }}
                  className="relative flex h-[140px] w-[31%] min-w-0 flex-col items-center rounded-2xl border-[3px] px-2 py-2 active:scale-95 md:h-[180px] md:w-[176px] md:px-3 md:py-3"
                  style={{
                    backgroundColor: effect === "error" ? "#FEE2E2" : effect === "success" ? "#DCFCE7" : "#FFFFFF",
                    borderColor: effect === "error" ? "#DC2626" : effect === "success" ? "#16A34A" : "#111111",
                    boxShadow: effect === "success" ? "0 0 20px rgba(22,163,74,0.55)" : undefined,
                  }}
                  animate={
                    effect === "error"
                      ? { x: [0, -6, 6, -5, 5, -2, 2, 0] }
                      : { x: 0 }
                  }
                  transition={{ duration: 0.42 }}
                >
                  {stars.map((star, idx) => (
                    <motion.span
                      key={`${star.id}-${idx}`}
                      className="pointer-events-none absolute top-[24%] text-yellow-400"
                      initial={{ opacity: 0, scale: 0.5, x: 0, y: 0 }}
                      animate={{
                        opacity: [0, 1, 0],
                        scale: [0.5, 1.2, 0.6],
                        x: [0, -24 + idx * 12],
                        y: [0, -22 - idx * 8],
                      }}
                      transition={{ duration: 0.8 }}
                    >
                      ✨
                    </motion.span>
                  ))}

                  {!failedBinImages[bin.category] && bin.binImageSrc ? (
                    <img
                      src={bin.binImageSrc}
                      alt={`${bin.lVi} bin`}
                      className="h-10 w-10 object-contain md:h-14 md:w-14"
                      onError={() =>
                        setFailedBinImages((prev) => ({
                          ...prev,
                          [bin.category]: true,
                        }))
                      }
                      draggable={false}
                    />
                  ) : (
                    <div className="text-2xl">{bin.i}</div>
                  )}
                  <span className="mt-1 text-sm leading-none" style={FONT_TEXT}>
                    {bin.l}
                  </span>
                  <span
                    className="text-center text-xs leading-tight"
                    style={{ ...FONT_DISPLAY, color: bin.c }}
                  >
                    {bin.lVi}
                  </span>

                  <div className="mt-2 grid w-full grid-cols-2 gap-1">
                    {Array.from({ length: 2 }, (_, slot) => {
                      const item = binContents[bin.category][slot]
                      return (
                        <div
                          key={`${bin.category}-filled-${slot}`}
                          className="flex h-8 items-center justify-center rounded-lg bg-[#F3F4F6] md:h-10"
                        >
                          {item ? (
                            !failedItemImages[item.key] && item.iconSrc ? (
                              <img
                                src={item.iconSrc}
                                alt={item.n}
                                className="h-6 w-6 object-contain md:h-7 md:w-7"
                                draggable={false}
                              />
                            ) : (
                              <span className="text-xs text-slate-500" style={FONT_TEXT}>
                                Đã vào
                              </span>
                            )
                          ) : (
                            <span className="text-xs text-slate-300" style={FONT_TEXT}>
                              trống
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </motion.button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
