import { type ReactNode, useState, useEffect, useRef } from "react"
import { MASCOT_IMAGE } from "@/assets"
import * as Dialog from "@radix-ui/react-dialog"
import { AlertTriangle, CheckCircle2, X, TrendingUp, TrendingDown, Minus } from "lucide-react"

// ─── Design Tokens ──────────────────────────────────────────────────────────

export const ADMIN_COLORS = {
  // Backgrounds
  bg:         "#0d1117",
  surface:    "#161b22",
  surface2:   "#1c2330",
  surface3:   "#21262d",
  // Borders
  border:     "#30363d",
  borderEm:   "#238636",
  // Text
  ink:        "#e6edf3",
  inkMuted:   "#8b949e",
  inkFaint:   "#484f58",
  // Brand
  primary:    "#22c55e",
  primaryDim: "#16a34a",
  primaryFaint: "rgba(34,197,94,0.12)",
  // Semantic
  success:    "#22c55e",
  successBg:  "rgba(34,197,94,0.12)",
  warning:    "#f59e0b",
  warningBg:  "rgba(245,158,11,0.12)",
  danger:     "#f85149",
  dangerBg:   "rgba(248,81,73,0.12)",
  info:       "#58a6ff",
  infoBg:     "rgba(88,166,255,0.12)",
} as const

export const ADMIN_FONT = "'Inter', 'system-ui', sans-serif"
export const ADMIN_FONT_BRAND = "'Nunito', sans-serif"

export const adminFontTitle = { fontFamily: ADMIN_FONT_BRAND, fontWeight: 800, color: ADMIN_COLORS.ink }
export const adminFontBody  = { fontFamily: ADMIN_FONT, fontWeight: 400, color: ADMIN_COLORS.ink }

export const ADMIN_TYPE_CLASS =
  "font-['Inter',system-ui,sans-serif] antialiased [font-synthesis:none]"

// ─── Shell ───────────────────────────────────────────────────────────────────

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div
      className={`min-h-screen text-[#e6edf3] ${ADMIN_TYPE_CLASS}`}
      style={{
        background: ADMIN_COLORS.bg,
        fontFamily: ADMIN_FONT,
      }}
    >
      {children}
    </div>
  )
}

// ─── Brand Mark ──────────────────────────────────────────────────────────────

export function AdminBrandMark({
  subtitle,
  collapsed = false,
}: {
  subtitle?: string
  collapsed?: boolean
}) {
  return (
    <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#238636] shadow-lg"
        style={{ background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)" }}
      >
        <img src={MASCOT_IMAGE} alt="" className="h-7 w-7 object-contain" />
      </div>
      {!collapsed && (
        <div className="min-w-0">
          <p
            className="text-sm font-extrabold leading-tight tracking-tight"
            style={{ fontFamily: ADMIN_FONT_BRAND, color: ADMIN_COLORS.ink }}
          >
            GreenLens
          </p>
          {subtitle ? (
            <p className="text-[10px] font-medium" style={{ color: ADMIN_COLORS.inkMuted }}>
              {subtitle}
            </p>
          ) : (
            <p className="text-[10px] font-medium" style={{ color: ADMIN_COLORS.primary }}>
              Admin Console
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Card ────────────────────────────────────────────────────────────────────

export const ADMIN_CARD_CLASS = "admin-card"

export function AdminCard({
  title,
  action,
  children,
  className = "",
  dense = false,
  fill = false,
}: {
  title?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  dense?: boolean
  fill?: boolean
}) {
  return (
    <section
      className={`overflow-hidden rounded-2xl border transition-all duration-200 ${fill ? "flex h-full flex-col" : ""} ${className}`}
      style={{
        background: ADMIN_COLORS.surface,
        borderColor: ADMIN_COLORS.border,
        boxShadow: "0 1px 3px rgba(0,0,0,0.4), 0 0 0 0 transparent",
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLElement).style.borderColor = ADMIN_COLORS.borderEm
        ;(e.currentTarget as HTMLElement).style.boxShadow = `0 4px 16px rgba(0,0,0,0.4), 0 0 0 1px ${ADMIN_COLORS.borderEm}`
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLElement).style.borderColor = ADMIN_COLORS.border
        ;(e.currentTarget as HTMLElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.4), 0 0 0 0 transparent"
      }}
    >
      {title ? (
        <div
          className="flex shrink-0 items-center justify-between gap-3 px-4 py-3"
          style={{ borderBottom: `1px solid ${ADMIN_COLORS.border}` }}
        >
          <p
            className="text-sm font-semibold tracking-tight"
            style={{ color: ADMIN_COLORS.ink, fontFamily: ADMIN_FONT }}
          >
            {title}
          </p>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      <div
        className={`${dense ? "p-3" : "p-4"} ${fill ? "flex min-h-0 flex-1 flex-col" : ""}`}
      >
        {children}
      </div>
    </section>
  )
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

type TrendDir = "up" | "down" | "flat"

export function AdminStatCard({
  label,
  value,
  icon: Icon,
  trend,
  trendLabel,
  gradient,
}: {
  label: string
  value: ReactNode
  icon?: React.ComponentType<{ size?: number; className?: string }>
  trend?: TrendDir
  trendLabel?: string
  gradient?: string
}) {
  const trendIcon =
    trend === "up" ? (
      <TrendingUp size={11} className="text-[#22c55e]" />
    ) : trend === "down" ? (
      <TrendingDown size={11} className="text-[#f85149]" />
    ) : (
      <Minus size={11} style={{ color: ADMIN_COLORS.inkMuted }} />
    )

  const trendColor =
    trend === "up" ? "#22c55e" : trend === "down" ? "#f85149" : ADMIN_COLORS.inkMuted

  return (
    <section
      className="relative overflow-hidden rounded-2xl border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
      style={{
        background: gradient ?? ADMIN_COLORS.surface,
        borderColor: ADMIN_COLORS.border,
        boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
      }}
    >
      {/* Background glow */}
      {gradient && (
        <div
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{ background: gradient, filter: "blur(20px)" }}
        />
      )}

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p
            className="truncate text-[11px] font-medium uppercase tracking-wider"
            style={{ color: ADMIN_COLORS.inkMuted }}
          >
            {label}
          </p>
          <p
            className="mt-1.5 text-2xl font-bold tabular-nums leading-none"
            style={{ color: ADMIN_COLORS.ink, fontFamily: ADMIN_FONT }}
          >
            {value}
          </p>
          {trendLabel && (
            <div className="mt-2 flex items-center gap-1">
              {trendIcon}
              <span className="text-[10px] font-medium" style={{ color: trendColor }}>
                {trendLabel}
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{ background: ADMIN_COLORS.primaryFaint }}
          >
            <Icon size={18} className="text-[#22c55e]" />
          </div>
        )}
      </div>
    </section>
  )
}

// ─── Buttons ─────────────────────────────────────────────────────────────────

export function AdminPrimaryButton({
  className = "",
  children,
  loading,
  ...props
}: React.ComponentProps<"button"> & { loading?: boolean }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all duration-150 hover:-translate-y-px hover:shadow-lg active:translate-y-0 active:shadow-none disabled:pointer-events-none disabled:opacity-40 ${className}`}
      style={{
        background: `linear-gradient(135deg, ${ADMIN_COLORS.primary} 0%, ${ADMIN_COLORS.primaryDim} 100%)`,
        boxShadow: `0 0 0 0 ${ADMIN_COLORS.primaryFaint}`,
        fontFamily: ADMIN_FONT,
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLElement).style.boxShadow = `0 4px 16px rgba(34,197,94,0.3)`
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 0 transparent`
      }}
      {...props}
    >
      {loading ? (
        <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      ) : null}
      {children}
    </button>
  )
}

export function AdminOutlineButton({
  className = "",
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-medium transition-all duration-150 hover:text-[#e6edf3] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 ${className}`}
      style={{
        background: "transparent",
        borderColor: ADMIN_COLORS.border,
        color: ADMIN_COLORS.inkMuted,
        fontFamily: ADMIN_FONT,
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLElement).style.background = ADMIN_COLORS.surface2
        ;(e.currentTarget as HTMLElement).style.borderColor = ADMIN_COLORS.borderEm
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLElement).style.background = "transparent"
        ;(e.currentTarget as HTMLElement).style.borderColor = ADMIN_COLORS.border
      }}
      {...props}
    />
  )
}

export function AdminDangerButton({
  className = "",
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-medium transition-all duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 ${className}`}
      style={{
        background: ADMIN_COLORS.dangerBg,
        borderColor: "rgba(248,81,73,0.3)",
        color: ADMIN_COLORS.danger,
        fontFamily: ADMIN_FONT,
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLElement).style.background = "rgba(248,81,73,0.2)"
        ;(e.currentTarget as HTMLElement).style.borderColor = ADMIN_COLORS.danger
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLElement).style.background = ADMIN_COLORS.dangerBg
        ;(e.currentTarget as HTMLElement).style.borderColor = "rgba(248,81,73,0.3)"
      }}
      {...props}
    />
  )
}

// ─── Badge ───────────────────────────────────────────────────────────────────

type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral" | "primary"

const BADGE_STYLES: Record<BadgeVariant, { bg: string; color: string; border: string }> = {
  success: { bg: "rgba(34,197,94,0.12)",  color: "#22c55e", border: "rgba(34,197,94,0.3)" },
  warning: { bg: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "rgba(245,158,11,0.3)" },
  danger:  { bg: "rgba(248,81,73,0.12)",  color: "#f85149", border: "rgba(248,81,73,0.3)" },
  info:    { bg: "rgba(88,166,255,0.12)", color: "#58a6ff", border: "rgba(88,166,255,0.3)" },
  neutral: { bg: "rgba(139,148,158,0.12)",color: "#8b949e", border: "rgba(139,148,158,0.3)" },
  primary: { bg: "rgba(34,197,94,0.12)",  color: "#22c55e", border: "rgba(34,197,94,0.25)" },
}

export function AdminBadge({
  variant = "neutral",
  children,
  className = "",
}: {
  variant?: BadgeVariant
  children: ReactNode
  className?: string
}) {
  const s = BADGE_STYLES[variant]
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${className}`}
      style={{ background: s.bg, color: s.color, borderColor: s.border, fontFamily: ADMIN_FONT }}
    >
      {children}
    </span>
  )
}

export function statusBadgeVariant(status: string): BadgeVariant {
  const s = status?.toLowerCase()
  if (s === "active" || s === "ready" || s === "bật") return "success"
  if (s === "disabled" || s === "claimed" || s === "tắt") return "warning"
  if (s === "archived" || s === "failed" || s === "superseded") return "neutral"
  if (s === "fallback") return "info"
  return "neutral"
}

// ─── Inset Row ───────────────────────────────────────────────────────────────

export function AdminInsetRow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl px-3 py-2 text-sm ${className}`}
      style={{ background: ADMIN_COLORS.surface2, border: `1px solid ${ADMIN_COLORS.border}` }}
    >
      {children}
    </div>
  )
}

// ─── Section Label ───────────────────────────────────────────────────────────

export function AdminSectionLabel({ children }: { children: ReactNode }) {
  return (
    <p
      className="mb-2 text-[10px] font-bold uppercase tracking-widest"
      style={{ color: ADMIN_COLORS.inkFaint, fontFamily: ADMIN_FONT }}
    >
      {children}
    </p>
  )
}

// ─── Key Value ───────────────────────────────────────────────────────────────

export function AdminKeyValue({ label, value }: { label: string; value: ReactNode }) {
  return (
    <AdminInsetRow className="flex items-center justify-between gap-3">
      <span style={{ color: ADMIN_COLORS.inkMuted }}>{label}</span>
      <span className="font-semibold tabular-nums" style={{ color: ADMIN_COLORS.ink }}>
        {value}
      </span>
    </AdminInsetRow>
  )
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

export function AdminSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg ${className}`}
      style={{ background: ADMIN_COLORS.surface3 }}
    />
  )
}

export function AdminStatCardSkeleton() {
  return (
    <div
      className="rounded-2xl border p-4"
      style={{ background: ADMIN_COLORS.surface, borderColor: ADMIN_COLORS.border }}
    >
      <AdminSkeleton className="mb-3 h-3 w-24" />
      <AdminSkeleton className="h-7 w-16" />
      <AdminSkeleton className="mt-2 h-2.5 w-12" />
    </div>
  )
}

// ─── Empty State ─────────────────────────────────────────────────────────────

export function AdminEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: React.ComponentType<{ size?: number; className?: string }>
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div
          className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border"
          style={{
            background: ADMIN_COLORS.primaryFaint,
            borderColor: "rgba(34,197,94,0.2)",
          }}
        >
          <Icon size={28} className="text-[#22c55e]" />
        </div>
      )}
      <p className="text-base font-semibold" style={{ color: ADMIN_COLORS.ink }}>
        {title}
      </p>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm" style={{ color: ADMIN_COLORS.inkMuted }}>
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ─── Panel Message ───────────────────────────────────────────────────────────

export function AdminPanelMessage({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2"
          style={{ borderColor: ADMIN_COLORS.border, borderTopColor: ADMIN_COLORS.primary }}
        />
        <p className="text-sm" style={{ color: ADMIN_COLORS.inkMuted }}>
          {message}
        </p>
      </div>
    </div>
  )
}

// ─── Panel Error ─────────────────────────────────────────────────────────────

export function AdminPanelError({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <AdminCard title="Không tải được dữ liệu">
      <div className="flex flex-col items-center py-6 text-center">
        <AlertTriangle size={28} className="mb-3" style={{ color: ADMIN_COLORS.danger }} />
        <p className="text-sm" style={{ color: ADMIN_COLORS.danger }}>
          {error}
        </p>
        <AdminOutlineButton onClick={onRetry} className="mt-5">
          Thử lại
        </AdminOutlineButton>
      </div>
    </AdminCard>
  )
}

// ─── Confirm Dialog ──────────────────────────────────────────────────────────

export function useConfirmDialog() {
  const [state, setState] = useState<{
    open: boolean
    title: string
    message: string
    variant: "danger" | "default"
    resolve: ((ok: boolean) => void) | null
  }>({ open: false, title: "", message: "", variant: "default", resolve: null })

  const confirm = (title: string, message: string, variant: "danger" | "default" = "default") =>
    new Promise<boolean>((resolve) => {
      setState({ open: true, title, message, variant, resolve })
    })

  const handleClose = (ok: boolean) => {
    state.resolve?.(ok)
    setState((s) => ({ ...s, open: false, resolve: null }))
  }

  const dialog = (
    <Dialog.Root open={state.open} onOpenChange={(open) => !open && handleClose(false)}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-50 backdrop-blur-sm"
          style={{ background: "rgba(0,0,0,0.6)" }}
        />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-[380px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border shadow-2xl"
          style={{
            background: ADMIN_COLORS.surface,
            borderColor: state.variant === "danger" ? "rgba(248,81,73,0.4)" : ADMIN_COLORS.border,
          }}
        >
          <div className="p-5">
            <div className="mb-4 flex items-start gap-3">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{
                  background: state.variant === "danger" ? ADMIN_COLORS.dangerBg : ADMIN_COLORS.primaryFaint,
                }}
              >
                {state.variant === "danger" ? (
                  <AlertTriangle size={18} style={{ color: ADMIN_COLORS.danger }} />
                ) : (
                  <CheckCircle2 size={18} style={{ color: ADMIN_COLORS.primary }} />
                )}
              </div>
              <div>
                <Dialog.Title
                  className="text-sm font-semibold"
                  style={{ color: ADMIN_COLORS.ink }}
                >
                  {state.title}
                </Dialog.Title>
                <Dialog.Description
                  className="mt-1 text-sm"
                  style={{ color: ADMIN_COLORS.inkMuted }}
                >
                  {state.message}
                </Dialog.Description>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <AdminOutlineButton className="!px-4 !py-2 !text-xs" onClick={() => handleClose(false)}>
                Huỷ
              </AdminOutlineButton>
              {state.variant === "danger" ? (
                <AdminDangerButton className="!px-4 !py-2 !text-xs" onClick={() => handleClose(true)}>
                  Xác nhận
                </AdminDangerButton>
              ) : (
                <AdminPrimaryButton className="!px-4 !py-2 !text-xs" onClick={() => handleClose(true)}>
                  Xác nhận
                </AdminPrimaryButton>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )

  return { confirm, dialog }
}

// ─── Prompt Dialog ───────────────────────────────────────────────────────────

export function usePromptDialog() {
  const [state, setState] = useState<{
    open: boolean
    title: string
    placeholder: string
    defaultValue: string
    resolve: ((value: string | null) => void) | null
  }>({ open: false, title: "", placeholder: "", defaultValue: "", resolve: null })

  const [inputValue, setInputValue] = useState("")

  const prompt = (title: string, placeholder = "", defaultValue = "") =>
    new Promise<string | null>((resolve) => {
      setInputValue(defaultValue)
      setState({ open: true, title, placeholder, defaultValue, resolve })
    })

  const handleClose = (ok: boolean) => {
    state.resolve?.(ok ? inputValue : null)
    setState((s) => ({ ...s, open: false, resolve: null }))
  }

  const dialog = (
    <Dialog.Root open={state.open} onOpenChange={(open) => !open && handleClose(false)}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-50 backdrop-blur-sm"
          style={{ background: "rgba(0,0,0,0.6)" }}
        />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-[360px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border shadow-2xl"
          style={{ background: ADMIN_COLORS.surface, borderColor: ADMIN_COLORS.border }}
        >
          <div className="p-5">
            <Dialog.Title className="mb-3 text-sm font-semibold" style={{ color: ADMIN_COLORS.ink }}>
              {state.title}
            </Dialog.Title>
            <input
              autoFocus
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleClose(true)}
              placeholder={state.placeholder}
              className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-colors"
              style={{
                background: ADMIN_COLORS.surface2,
                borderColor: ADMIN_COLORS.border,
                color: ADMIN_COLORS.ink,
                fontFamily: ADMIN_FONT,
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = ADMIN_COLORS.primary }}
              onBlur={(e) => { e.currentTarget.style.borderColor = ADMIN_COLORS.border }}
            />
            <div className="mt-4 flex justify-end gap-2">
              <AdminOutlineButton className="!px-4 !py-2 !text-xs" onClick={() => handleClose(false)}>
                Huỷ
              </AdminOutlineButton>
              <AdminPrimaryButton className="!px-4 !py-2 !text-xs" onClick={() => handleClose(true)}>
                OK
              </AdminPrimaryButton>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )

  return { prompt, dialog }
}

// ─── Toast ───────────────────────────────────────────────────────────────────

export { toast } from "sonner"

// ─── Admin Input Class ────────────────────────────────────────────────────────

export const adminInputStyle = {
  background: ADMIN_COLORS.surface2,
  borderColor: ADMIN_COLORS.border,
  color: ADMIN_COLORS.ink,
  fontFamily: ADMIN_FONT,
} as const

export const ADMIN_INPUT_CLASS =
  "rounded-xl border bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-[#484f58] focus:border-[#22c55e] focus:ring-2 focus:ring-[#22c55e]/20"

// backward-compat alias
export { ADMIN_COLORS as ADMIN_COLOR_PALETTE }
