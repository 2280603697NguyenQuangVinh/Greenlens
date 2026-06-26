/** Tiếng chuông ngắn khi mở khóa phần thưởng (Web Audio — không cần file). */
export function playRewardChime(): void {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = "sine"
    osc.frequency.setValueAtTime(523.25, ctx.currentTime)
    osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12)
    osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.24)
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.5)
    osc.onended = () => void ctx.close()
  } catch {
    // ignore if autoplay blocked
  }
}
