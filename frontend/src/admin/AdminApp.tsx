import { useEffect, useMemo, useState, useRef, type FormEvent } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  BarChart3,
  Brain,
  Camera,
  Gamepad2,
  LogOut,
  Menu,
  RefreshCw,
  Star,
  Users,
  X,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Lock,
  Unlock,
  Archive,
  RotateCcw,
  Zap,
  Activity,
  Scan,
  Layers,
  Search,
  Eye,
  Medal,
} from "lucide-react"
import {
  AdminBrandMark,
  AdminCard,
  AdminInsetRow,
  AdminKeyValue,
  AdminOutlineButton,
  AdminPanelError,
  AdminPanelMessage,
  AdminPrimaryButton,
  AdminDangerButton,
  AdminSectionLabel,
  AdminShell,
  AdminStatCard,
  AdminStatCardSkeleton,
  AdminBadge,
  AdminEmptyState,
  AdminSkeleton,
  adminFontBody,
  adminFontTitle,
  ADMIN_TYPE_CLASS,
  ADMIN_COLORS,
  ADMIN_FONT,
  ADMIN_INPUT_CLASS,
  adminInputStyle,
  statusBadgeVariant,
  useConfirmDialog,
  usePromptDialog,
  toast,
} from "@/admin/adminTheme"
import { adminApi } from "@/admin/api"
import { clearAdminSession, getAdminSession, loginAdmin, type AdminSession } from "@/admin/auth"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Toaster } from "sonner"

// ─── Styled Input & Textarea wrappers ────────────────────────────────────────

function AdminInput({
  className = "",
  label,
  ...props
}: React.ComponentProps<"input"> & { label?: string }) {
  const [focused, setFocused] = useState(false)
  return (
    <div className={label ? "space-y-1.5" : ""}>
      {label && (
        <label
          className="block text-xs font-medium"
          style={{ color: ADMIN_COLORS.inkMuted, fontFamily: ADMIN_FONT }}
        >
          {label}
        </label>
      )}
      <input
        className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-all placeholder:text-[#484f58] ${className}`}
        style={{
          ...adminInputStyle,
          borderColor: focused ? ADMIN_COLORS.primary : ADMIN_COLORS.border,
          boxShadow: focused ? `0 0 0 3px rgba(34,197,94,0.12)` : "none",
          fontFamily: ADMIN_FONT,
        }}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e) }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e) }}
        {...props}
      />
    </div>
  )
}

function AdminTextarea({
  className = "",
  label,
  ...props
}: React.ComponentProps<"textarea"> & { label?: string }) {
  const [focused, setFocused] = useState(false)
  return (
    <div className={label ? "space-y-1.5" : ""}>
      {label && (
        <label
          className="block text-xs font-medium"
          style={{ color: ADMIN_COLORS.inkMuted, fontFamily: ADMIN_FONT }}
        >
          {label}
        </label>
      )}
      <textarea
        className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-all placeholder:text-[#484f58] ${className}`}
        style={{
          ...adminInputStyle,
          borderColor: focused ? ADMIN_COLORS.primary : ADMIN_COLORS.border,
          boxShadow: focused ? `0 0 0 3px rgba(34,197,94,0.12)` : "none",
          fontFamily: ADMIN_FONT,
          resize: "vertical",
        }}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e) }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e) }}
        {...props}
      />
    </div>
  )
}

// ─── Navigation ───────────────────────────────────────────────────────────────

type AdminSection = "overview" | "children" | "quiz" | "camera" | "games" | "rewards"

const NAV_GROUPS = [
  {
    label: "Analytics",
    items: [{ key: "overview" as AdminSection, label: "Tổng quan", icon: BarChart3 }],
  },
  {
    label: "Users & Content",
    items: [
      { key: "children" as AdminSection, label: "Người dùng", icon: Users },
      { key: "quiz" as AdminSection, label: "Quiz", icon: Brain },
      { key: "camera" as AdminSection, label: "AI Camera", icon: Camera },
      { key: "games" as AdminSection, label: "Mini-game", icon: Gamepad2 },
    ],
  },
  {
    label: "System",
    items: [{ key: "rewards" as AdminSection, label: "Rewards & Streak", icon: Star }],
  },
]

const ALL_NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items)

function readSection(): AdminSection {
  const section = window.location.hash.replace(/^#/, "")
  return ALL_NAV_ITEMS.some((item) => item.key === section) ? (section as AdminSection) : "overview"
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function Sidebar({
  section,
  onNavigate,
  collapsed,
  onToggleCollapse,
}: {
  section: AdminSection
  onNavigate: (s: AdminSection) => void
  collapsed: boolean
  onToggleCollapse: () => void
}) {
  return (
    <aside
      className="flex h-screen flex-col transition-all duration-300"
      style={{
        width: collapsed ? 68 : 240,
        background: ADMIN_COLORS.surface,
        borderRight: `1px solid ${ADMIN_COLORS.border}`,
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center px-4 py-4"
        style={{ borderBottom: `1px solid ${ADMIN_COLORS.border}`, minHeight: 60 }}
      >
        <AdminBrandMark collapsed={collapsed} />
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p
                className="mb-1.5 px-2 text-[9px] font-bold uppercase tracking-widest"
                style={{ color: ADMIN_COLORS.inkFaint, fontFamily: ADMIN_FONT }}
              >
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                const active = section === item.key
                return (
                  <button
                    key={item.key}
                    type="button"
                    title={collapsed ? item.label : undefined}
                    onClick={() => onNavigate(item.key)}
                    className={`flex w-full items-center gap-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                      collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
                    }`}
                    style={{
                      background: active ? "rgba(34,197,94,0.12)" : "transparent",
                      color: active ? ADMIN_COLORS.primary : ADMIN_COLORS.inkMuted,
                      borderLeft: active && !collapsed ? `3px solid ${ADMIN_COLORS.primary}` : "3px solid transparent",
                      fontFamily: ADMIN_FONT,
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        ;(e.currentTarget as HTMLElement).style.background = ADMIN_COLORS.surface2
                        ;(e.currentTarget as HTMLElement).style.color = ADMIN_COLORS.ink
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        ;(e.currentTarget as HTMLElement).style.background = "transparent"
                        ;(e.currentTarget as HTMLElement).style.color = ADMIN_COLORS.inkMuted
                      }
                    }}
                  >
                    <Icon size={16} />
                    {!collapsed && <span>{item.label}</span>}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div
        className="px-2 py-3"
        style={{ borderTop: `1px solid ${ADMIN_COLORS.border}` }}
      >
        <button
          type="button"
          onClick={onToggleCollapse}
          title={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
          className="flex w-full items-center justify-center rounded-xl py-2 transition-all duration-150"
          style={{ color: ADMIN_COLORS.inkMuted }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLElement).style.background = ADMIN_COLORS.surface2
            ;(e.currentTarget as HTMLElement).style.color = ADMIN_COLORS.ink
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLElement).style.background = "transparent"
            ;(e.currentTarget as HTMLElement).style.color = ADMIN_COLORS.inkMuted
          }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!collapsed && <span className="ml-2 text-xs font-medium">Thu gọn</span>}
        </button>
      </div>
    </aside>
  )
}

// ─── Mobile Drawer ────────────────────────────────────────────────────────────

function MobileDrawer({
  open,
  onClose,
  section,
  onNavigate,
}: {
  open: boolean
  onClose: () => void
  section: AdminSection
  onNavigate: (s: AdminSection) => void
}) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden"
    else document.body.style.overflow = ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 transition-opacity duration-300 lg:hidden"
        style={{
          background: "rgba(0,0,0,0.6)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          backdropFilter: "blur(4px)",
        }}
        onClick={onClose}
      />
      {/* Drawer */}
      <div
        className="fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-300 lg:hidden"
        style={{
          background: ADMIN_COLORS.surface,
          borderRight: `1px solid ${ADMIN_COLORS.border}`,
          transform: open ? "translateX(0)" : "translateX(-100%)",
        }}
      >
        <div
          className="flex items-center justify-between px-4 py-4"
          style={{ borderBottom: `1px solid ${ADMIN_COLORS.border}` }}
        >
          <AdminBrandMark />
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 transition-colors"
            style={{ color: ADMIN_COLORS.inkMuted }}
            onMouseEnter={(e) => { ;(e.currentTarget as HTMLElement).style.color = ADMIN_COLORS.ink }}
            onMouseLeave={(e) => { ;(e.currentTarget as HTMLElement).style.color = ADMIN_COLORS.inkMuted }}
          >
            <X size={18} />
          </button>
        </div>
        <nav className="space-y-4 overflow-y-auto px-2 py-3">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p
                className="mb-1.5 px-2 text-[9px] font-bold uppercase tracking-widest"
                style={{ color: ADMIN_COLORS.inkFaint }}
              >
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const active = section === item.key
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => { onNavigate(item.key); onClose() }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150"
                      style={{
                        background: active ? "rgba(34,197,94,0.12)" : "transparent",
                        color: active ? ADMIN_COLORS.primary : ADMIN_COLORS.inkMuted,
                        borderLeft: active ? `3px solid ${ADMIN_COLORS.primary}` : "3px solid transparent",
                      }}
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </>
  )
}

// ─── Top Header ──────────────────────────────────────────────────────────────

function TopHeader({
  section,
  session,
  onMenuOpen,
  onLogout,
}: {
  section: AdminSection
  session: AdminSession
  onMenuOpen: () => void
  onLogout: () => void
}) {
  const currentLabel = ALL_NAV_ITEMS.find((item) => item.key === section)?.label ?? "Admin"
  const initials = session.username.slice(0, 2).toUpperCase()

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between gap-4 px-5 py-3"
      style={{
        background: `${ADMIN_COLORS.bg}cc`,
        borderBottom: `1px solid ${ADMIN_COLORS.border}`,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile menu */}
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors lg:hidden"
          style={{ color: ADMIN_COLORS.inkMuted }}
          onClick={onMenuOpen}
          aria-label="Mở menu"
        >
          <Menu size={18} />
        </button>

        {/* Breadcrumb */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs" style={{ color: ADMIN_COLORS.inkMuted }}>
            <span>Admin</span>
            <span>/</span>
            <span style={{ color: ADMIN_COLORS.ink, fontWeight: 500 }}>{currentLabel}</span>
          </div>
          <h1
            className="truncate text-base font-semibold leading-tight"
            style={{ color: ADMIN_COLORS.ink, fontFamily: ADMIN_FONT }}
          >
            {currentLabel}
          </h1>
        </div>
      </div>

      {/* Right side */}
      <div className="flex shrink-0 items-center gap-2">
        {/* User chip */}
        <div
          className="hidden items-center gap-2 rounded-xl border px-3 py-1.5 sm:flex"
          style={{ background: ADMIN_COLORS.surface2, borderColor: ADMIN_COLORS.border }}
        >
          <div
            className="flex h-6 w-6 items-center justify-center rounded-lg text-[10px] font-bold text-white"
            style={{ background: `linear-gradient(135deg, ${ADMIN_COLORS.primary}, ${ADMIN_COLORS.primaryDim})` }}
          >
            {initials}
          </div>
          <span className="text-xs font-medium" style={{ color: ADMIN_COLORS.ink }}>
            {session.username}
          </span>
          <AdminBadge variant="success">admin</AdminBadge>
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={onLogout}
          title="Đăng xuất"
          className="flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-150"
          style={{ color: ADMIN_COLORS.inkMuted }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLElement).style.background = ADMIN_COLORS.dangerBg
            ;(e.currentTarget as HTMLElement).style.color = ADMIN_COLORS.danger
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLElement).style.background = "transparent"
            ;(e.currentTarget as HTMLElement).style.color = ADMIN_COLORS.inkMuted
          }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function AdminApp() {
  const [session, setSession] = useState<AdminSession | null>(() => getAdminSession())
  const [section, setSection] = useState<AdminSection>(() => readSection())
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    const onHashChange = () => setSection(readSection())
    window.addEventListener("hashchange", onHashChange)
    return () => window.removeEventListener("hashchange", onHashChange)
  }, [])

  if (!session) {
    return <AdminLoginPage onLoggedIn={setSession} />
  }

  const navigate = (next: AdminSection) => {
    window.location.hash = next
    setSection(next)
    setMobileNavOpen(false)
  }

  return (
    <AdminShell>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: ADMIN_COLORS.surface,
            color: ADMIN_COLORS.ink,
            border: `1px solid ${ADMIN_COLORS.border}`,
            fontFamily: ADMIN_FONT,
          },
        }}
      />

      <div className={`flex min-h-screen ${ADMIN_TYPE_CLASS}`}>
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <div className="sticky top-0 h-screen">
            <Sidebar
              section={section}
              onNavigate={navigate}
              collapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
            />
          </div>
        </div>

        {/* Mobile Drawer */}
        <MobileDrawer
          open={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
          section={section}
          onNavigate={navigate}
        />

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col">
          <TopHeader
            section={section}
            session={session}
            onMenuOpen={() => setMobileNavOpen(true)}
            onLogout={() => { clearAdminSession(); setSession(null) }}
          />

          <main className="flex-1 p-4 lg:p-6">
            <div
              key={section}
              className="animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              {section === "overview"  && <OverviewPanel />}
              {section === "children" && <ChildrenPanel />}
              {section === "quiz"     && <QuizPanel />}
              {section === "camera"   && <CameraPanel />}
              {section === "games"    && <MiniGamePanel />}
              {section === "rewards"  && <RewardsPanel />}
            </div>
          </main>
        </div>
      </div>
    </AdminShell>
  )
}

// ─── Login Page ───────────────────────────────────────────────────────────────

function AdminLoginPage({ onLoggedIn }: { onLoggedIn: (session: AdminSession) => void }) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      onLoggedIn(await loginAdmin(username, password))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không đăng nhập được.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <AdminShell>
      <div
        className="flex min-h-screen items-center justify-center p-6"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, rgba(34,197,94,0.08) 0%, ${ADMIN_COLORS.bg} 60%)`,
        }}
      >
        <div className="w-full max-w-[400px]">
          {/* Logo area */}
          <div className="mb-8 flex flex-col items-center text-center">
            <div
              className="mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border shadow-xl"
              style={{
                background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                borderColor: ADMIN_COLORS.borderEm,
                boxShadow: "0 0 40px rgba(34,197,94,0.2)",
              }}
            >
              <img
                src={(() => { try { return MASCOT_IMAGE } catch { return "" } })()}
                alt="GreenLens"
                className="h-12 w-12 object-contain"
              />
            </div>
            <h1
              className="text-xl font-bold"
              style={{ color: ADMIN_COLORS.ink, fontFamily: ADMIN_FONT }}
            >
              GreenLens Admin
            </h1>
            <p className="mt-1 text-sm" style={{ color: ADMIN_COLORS.inkMuted }}>
              Đăng nhập để truy cập bảng điều khiển
            </p>
          </div>

          {/* Form card */}
          <form
            onSubmit={handleSubmit}
            className="overflow-hidden rounded-2xl border"
            style={{
              background: ADMIN_COLORS.surface,
              borderColor: ADMIN_COLORS.border,
              boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
            }}
          >
            <div className="p-6 space-y-4">
              <AdminInput
                label="Tên đăng nhập"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                autoComplete="username"
              />
              <AdminInput
                label="Mật khẩu"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />

              {error && (
                <div
                  className="rounded-xl border px-3 py-2.5 text-sm"
                  style={{
                    background: ADMIN_COLORS.dangerBg,
                    borderColor: "rgba(248,81,73,0.3)",
                    color: ADMIN_COLORS.danger,
                  }}
                >
                  {error}
                </div>
              )}

              <AdminPrimaryButton
                type="submit"
                className="!w-full !py-2.5"
                disabled={busy}
                loading={busy}
              >
                {busy ? "Đang đăng nhập..." : "Đăng nhập"}
              </AdminPrimaryButton>
            </div>

            <div
              className="px-6 py-3 text-center text-xs"
              style={{
                background: ADMIN_COLORS.surface2,
                borderTop: `1px solid ${ADMIN_COLORS.border}`,
                color: ADMIN_COLORS.inkFaint,
              }}
            >
              Tài khoản thuộc nhóm admin trên Cognito
            </div>
          </form>
        </div>
      </div>
    </AdminShell>
  )
}

// ─── Overview Panel ───────────────────────────────────────────────────────────

const STAT_CONFIG = [
  { key: "totalChildren",        label: "Tổng người chơi",   icon: Users,    gradient: "linear-gradient(135deg,#161b22,#1c2d20)" },
  { key: "totalAiCameraScans",   label: "Lượt quét AI",      icon: Scan,     gradient: "linear-gradient(135deg,#161b22,#1a2230)" },
  { key: "totalQuizSessions",    label: "Phiên quiz",        icon: Brain,    gradient: "linear-gradient(135deg,#161b22,#201a2d)" },
  { key: "totalMiniGameSessions",label: "Phiên mini-game",   icon: Gamepad2, gradient: "linear-gradient(135deg,#161b22,#201a20)" },
  { key: "dailyActiveUsers",     label: "Hoạt động hôm nay", icon: Activity, gradient: "linear-gradient(135deg,#161b22,#1a2820)" },
  { key: "childrenWithActiveStreak", label: "Streak đang chạy", icon: Zap,  gradient: "linear-gradient(135deg,#161b22,#2a1a10)" },
]

function OverviewPanel() {
  const [data, setData] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setError(null)
    setLoading(true)
    try {
      setData(await adminApi.getOverview())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được overview.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  if (error) return <AdminPanelError error={error} onRetry={() => void load()} />

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <AdminStatCardSkeleton key={i} />)
          : STAT_CONFIG.map(({ key, label, icon: Icon, gradient }) => (
              <AdminStatCard
                key={key}
                label={label}
                value={data?.totals?.[key] ?? 0}
                icon={Icon}
                gradient={gradient}
                trend="flat"
                trendLabel="Today"
              />
            ))}
      </div>

      {/* Chart + Ops */}
      <div className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <AdminCard
          dense
          fill
          title="Xu hướng 7 ngày"
          action={
            <AdminOutlineButton className="!gap-1.5 !px-2.5 !py-1.5 !text-xs" onClick={() => void load()}>
              <RefreshCw size={12} />
              Làm mới
            </AdminOutlineButton>
          }
        >
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div
                className="h-7 w-7 animate-spin rounded-full border-2"
                style={{ borderColor: ADMIN_COLORS.border, borderTopColor: ADMIN_COLORS.primary }}
              />
            </div>
          ) : (
            <WeeklyTrendSection daily={data?.daily ?? []} />
          )}
        </AdminCard>

        <AdminCard dense fill title="Vận hành">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <AdminSkeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : (
            <div className="flex h-full flex-col gap-4">
              <section>
                <AdminSectionLabel>Sức khỏe hệ thống</AdminSectionLabel>
                <div className="space-y-1.5 text-sm">
                  <AdminKeyValue label="Quiz pool ready"  value={data?.quizPool?.readyCount ?? 0} />
                  <AdminKeyValue label="Claimed"          value={data?.quizPool?.claimedCount ?? 0} />
                  <AdminKeyValue label="Failed"           value={data?.quizPool?.failedCount ?? 0} />
                  <AdminKeyValue label="Superseded"       value={data?.quizPool?.supersededCount ?? 0} />
                  <AdminKeyValue label="Fallback active"  value={data?.quizPool?.fallbackCount ?? 0} />
                </div>
              </section>

              <section>
                <AdminSectionLabel>Streak</AdminSectionLabel>
                <div className="space-y-1.5 text-sm">
                  <AdminKeyValue label="Hoạt động hôm nay" value={data?.streak?.activeToday ?? 0} />
                  <AdminKeyValue label="≥ 7 ngày"           value={data?.streak?.streak7OrMore ?? 0} />
                  <AdminKeyValue label="≥ 30 ngày"          value={data?.streak?.streak30OrMore ?? 0} />
                  <AdminKeyValue label="Đã khóa"            value={data?.streak?.disabledChildren ?? 0} />
                  <AdminKeyValue label="Đã lưu trữ"         value={data?.streak?.archivedChildren ?? 0} />
                </div>
              </section>

              {(data?.notes ?? []).length > 0 && (
                <section>
                  <AdminSectionLabel>Ghi chú</AdminSectionLabel>
                  <ul className="space-y-1.5">
                    {data.notes.map((note: string) => (
                      <li
                        key={note}
                        className="rounded-xl px-3 py-2 text-xs leading-relaxed"
                        style={{
                          background: ADMIN_COLORS.surface2,
                          color: ADMIN_COLORS.inkMuted,
                          border: `1px solid ${ADMIN_COLORS.border}`,
                        }}
                      >
                        {note}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}
        </AdminCard>
      </div>
    </div>
  )
}

// ─── Children Panel ───────────────────────────────────────────────────────────

function ChildrenPanel() {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [data, setData] = useState<any | null>(null)
  const [detail, setDetail] = useState<any | null>(null)
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const { confirm, dialog: confirmDialog } = useConfirmDialog()
  const { prompt, dialog: promptDialog } = usePromptDialog()

  const load = async () => {
    setError(null)
    setLoading(true)
    try {
      const response = await adminApi.getChildren(search, status === "all" ? "" : status)
      setData(response)
      if (!selectedChildId && response.items?.[0]?.childId) {
        setSelectedChildId(response.items[0].childId)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được danh sách child.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  useEffect(() => {
    if (!selectedChildId) return
    void adminApi.getChild(selectedChildId).then(setDetail).catch(() => setDetail(null))
  }, [selectedChildId])

  const refreshDetail = async () => {
    if (!selectedChildId) return
    setDetail(await adminApi.getChild(selectedChildId))
  }

  const items = data?.items ?? []

  return (
    <div className="grid gap-5 xl:grid-cols-[1.3fr_0.9fr]">
      {confirmDialog}
      {promptDialog}

      <AdminCard title="Danh sách người chơi">
        {/* Search + filter */}
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: ADMIN_COLORS.inkMuted }}
            />
            <AdminInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void load()}
              placeholder="Tìm theo tên hoặc childId..."
              className="!pl-9"
            />
          </div>
          <div className="w-40">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger
                className="h-[42px] rounded-xl border text-sm"
                style={{
                  background: ADMIN_COLORS.surface2,
                  borderColor: ADMIN_COLORS.border,
                  color: ADMIN_COLORS.ink,
                  fontFamily: ADMIN_FONT,
                }}
              >
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent
                style={{
                  background: ADMIN_COLORS.surface,
                  borderColor: ADMIN_COLORS.border,
                  color: ADMIN_COLORS.ink,
                }}
              >
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Disabled">Disabled</SelectItem>
                <SelectItem value="Archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <AdminPrimaryButton onClick={() => void load()} className="!px-4">
            Lọc
          </AdminPrimaryButton>
        </div>

        {error && (
          <div
            className="mb-3 rounded-xl border px-3 py-2.5 text-sm"
            style={{ background: ADMIN_COLORS.dangerBg, borderColor: "rgba(248,81,73,0.3)", color: ADMIN_COLORS.danger }}
          >
            {error}
          </div>
        )}

        <div
          className="overflow-hidden rounded-xl border"
          style={{ borderColor: ADMIN_COLORS.border }}
        >
          <Table>
            <TableHeader>
              <TableRow
                className="border-0 hover:bg-transparent"
                style={{ background: ADMIN_COLORS.surface2 }}
              >
                {["Tên", "childId", "Level", "XP", "Streak", "Điểm", "Trạng thái"].map((h) => (
                  <TableHead
                    key={h}
                    className="text-[11px] font-bold uppercase tracking-wider"
                    style={{ color: ADMIN_COLORS.inkMuted, borderBottom: `1px solid ${ADMIN_COLORS.border}` }}
                  >
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} style={{ borderColor: ADMIN_COLORS.border }}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}>
                        <AdminSkeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <AdminEmptyState
                      icon={Users}
                      title="Không tìm thấy người chơi"
                      description="Thử thay đổi từ khoá tìm kiếm hoặc bộ lọc."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item: any) => (
                  <TableRow
                    key={item.childId}
                    className="cursor-pointer transition-colors duration-100"
                    style={{
                      borderColor: ADMIN_COLORS.border,
                      background: selectedChildId === item.childId
                        ? "rgba(34,197,94,0.08)"
                        : "transparent",
                    }}
                    onClick={() => setSelectedChildId(item.childId)}
                    onMouseEnter={(e) => {
                      if (selectedChildId !== item.childId)
                        ;(e.currentTarget as HTMLElement).style.background = ADMIN_COLORS.surface2
                    }}
                    onMouseLeave={(e) => {
                      if (selectedChildId !== item.childId)
                        ;(e.currentTarget as HTMLElement).style.background = "transparent"
                    }}
                  >
                    <TableCell className="font-medium" style={{ color: ADMIN_COLORS.ink }}>
                      {item.characterName}
                    </TableCell>
                    <TableCell className="max-w-[100px] truncate font-mono text-[11px]" style={{ color: ADMIN_COLORS.inkMuted }}>
                      {item.childId}
                    </TableCell>
                    <TableCell style={{ color: ADMIN_COLORS.ink }}>{item.level}</TableCell>
                    <TableCell style={{ color: ADMIN_COLORS.ink }}>{item.xp}</TableCell>
                    <TableCell style={{ color: ADMIN_COLORS.ink }}>{item.streak}</TableCell>
                    <TableCell style={{ color: ADMIN_COLORS.ink }}>{item.miniGameHighScore}</TableCell>
                    <TableCell>
                      <AdminBadge variant={statusBadgeVariant(item.status)}>
                        {item.status}
                      </AdminBadge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </AdminCard>

      {/* Detail panel */}
      <AdminCard title="Chi tiết">
        {!detail ? (
          <AdminEmptyState
            icon={Eye}
            title="Chọn một người chơi"
            description="Click vào một hàng trong bảng để xem chi tiết."
          />
        ) : (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-start gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${ADMIN_COLORS.primary}, ${ADMIN_COLORS.primaryDim})` }}
              >
                {detail.characterName?.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold truncate" style={{ color: ADMIN_COLORS.ink }}>
                  {detail.characterName}
                </p>
                <p className="font-mono text-[11px] truncate" style={{ color: ADMIN_COLORS.inkMuted }}>
                  {detail.childId}
                </p>
              </div>
              <AdminBadge variant={statusBadgeVariant(detail.status)}>
                {detail.status}
              </AdminBadge>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2">
              {[
                ["Level", detail.level],
                ["XP", detail.xp],
                ["Streak", detail.streak],
                ["Điểm cao nhất", detail.miniGameHighScore],
              ].map(([label, value]) => (
                <AdminKeyValue key={String(label)} label={String(label)} value={value} />
              ))}
            </div>

            {/* Actions */}
            <div>
              <AdminSectionLabel>Hành động</AdminSectionLabel>
              <div className="grid grid-cols-2 gap-2">
                <AdminOutlineButton
                  className="!gap-1.5 !px-3 !py-2 !text-xs"
                  onClick={async () => {
                    const ok = await confirm("Khóa người chơi?", `Khóa tài khoản ${detail.characterName}. Hành động này có thể hoàn tác.`, "danger")
                    if (!ok) return
                    await adminApi.lockChild(detail.childId)
                    toast.success("Đã khóa người chơi")
                    await load(); await refreshDetail()
                  }}
                >
                  <Lock size={13} /> Khóa
                </AdminOutlineButton>
                <AdminOutlineButton
                  className="!gap-1.5 !px-3 !py-2 !text-xs"
                  onClick={async () => {
                    const ok = await confirm("Mở khóa người chơi?", `Mở khóa tài khoản ${detail.characterName}.`)
                    if (!ok) return
                    await adminApi.unlockChild(detail.childId)
                    toast.success("Đã mở khóa")
                    await load(); await refreshDetail()
                  }}
                >
                  <Unlock size={13} /> Mở khóa
                </AdminOutlineButton>
                <AdminDangerButton
                  className="!gap-1.5 !px-3 !py-2 !text-xs"
                  onClick={async () => {
                    const ok = await confirm("Lưu trữ người chơi?", `Lưu trữ ${detail.characterName}. Hành động này khó hoàn tác.`, "danger")
                    if (!ok) return
                    await adminApi.archiveChild(detail.childId)
                    toast.success("Đã lưu trữ")
                    await load(); await refreshDetail()
                  }}
                >
                  <Archive size={13} /> Lưu trữ
                </AdminDangerButton>
                <AdminOutlineButton
                  className="!gap-1.5 !px-3 !py-2 !text-xs"
                  onClick={async () => {
                    const ok = await confirm("Reset streak?", `Reset streak của ${detail.characterName} về 0.`, "danger")
                    if (!ok) return
                    await adminApi.resetChildStreak(detail.childId)
                    toast.success("Đã reset streak")
                    await refreshDetail()
                  }}
                >
                  <RotateCcw size={13} /> Reset streak
                </AdminOutlineButton>
                <AdminPrimaryButton
                  className="col-span-2 !gap-1.5 !px-3 !py-2 !text-xs"
                  onClick={async () => {
                    const next = await prompt("Điều chỉnh XP", "Nhập XP mới", String(detail.xp))
                    if (!next) return
                    await adminApi.adjustChildXp(detail.childId, Number(next))
                    toast.success(`XP đã cập nhật thành ${next}`)
                    await load(); await refreshDetail()
                  }}
                >
                  <Zap size={13} /> Chỉnh XP
                </AdminPrimaryButton>
              </div>
            </div>

            {/* Badges */}
            {(detail.badges ?? []).length > 0 && (
              <div>
                <AdminSectionLabel>Huy hiệu</AdminSectionLabel>
                <div className="flex flex-wrap gap-1.5">
                  {detail.badges.map((badge: string) => (
                    <AdminBadge key={badge} variant="info">{badge}</AdminBadge>
                  ))}
                </div>
              </div>
            )}

            {/* Recent quizzes */}
            {(detail.recentQuizSessions ?? []).length > 0 && (
              <div>
                <AdminSectionLabel>Quiz gần đây</AdminSectionLabel>
                <div className="space-y-1.5">
                  {detail.recentQuizSessions.slice(0, 4).map((s: any) => (
                    <AdminInsetRow key={s.sessionId}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm" style={{ color: ADMIN_COLORS.ink }}>{s.wasteType}</span>
                        <AdminBadge variant={statusBadgeVariant(s.status)}>{s.status}</AdminBadge>
                      </div>
                      <p className="mt-1 text-xs" style={{ color: ADMIN_COLORS.inkMuted }}>
                        Đúng: {s.correctAnswers} · XP: {s.xpAwarded}
                      </p>
                    </AdminInsetRow>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </AdminCard>
    </div>
  )
}

// ─── Quiz Panel ───────────────────────────────────────────────────────────────

function QuizPanel() {
  const [fallbacks, setFallbacks] = useState<any[]>([])
  const [pool, setPool] = useState<any | null>(null)
  const [selected, setSelected] = useState<any | null>(null)
  const [jsonValue, setJsonValue] = useState("[]")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const { confirm, dialog: confirmDialog } = useConfirmDialog()
  const { prompt, dialog: promptDialog } = usePromptDialog()

  const load = async () => {
    setError(null)
    setLoading(true)
    try {
      const [fallbackData, poolData] = await Promise.all([adminApi.getQuizFallbacks(), adminApi.getQuizPool()])
      setFallbacks(fallbackData)
      setPool(poolData)
      if (!selected && fallbackData[0]) {
        setSelected(fallbackData[0])
        setJsonValue(JSON.stringify(fallbackData[0].questions, null, 2))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được quiz admin.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  return (
    <div className="grid gap-5 xl:grid-cols-[1.1fr_1fr]">
      {confirmDialog}
      {promptDialog}

      <AdminCard
        title="Quiz fallback"
        action={
          <div className="flex gap-2">
            <AdminOutlineButton className="!px-2.5 !py-1.5 !text-xs" onClick={() => void load()}>
              Làm mới
            </AdminOutlineButton>
            <AdminPrimaryButton
              className="!px-2.5 !py-1.5 !text-xs"
              onClick={() => {
                setSelected({ fallbackKey: "", targetAge: 8, questions: [] })
                setJsonValue("[]")
              }}
            >
              + Tạo mới
            </AdminPrimaryButton>
          </div>
        }
      >
        {error && (
          <div
            className="mb-3 rounded-xl border px-3 py-2.5 text-sm"
            style={{ background: ADMIN_COLORS.dangerBg, borderColor: "rgba(248,81,73,0.3)", color: ADMIN_COLORS.danger }}
          >
            {error}
          </div>
        )}
        <div className="space-y-2">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <AdminSkeleton key={i} className="h-16 w-full" />)
            : fallbacks.length === 0
            ? <AdminEmptyState icon={Brain} title="Chưa có fallback quiz" description="Tạo mới một fallback để bắt đầu." />
            : fallbacks.map((item) => (
                <button
                  key={item.fallbackKey}
                  type="button"
                  onClick={() => { setSelected(item); setJsonValue(JSON.stringify(item.questions, null, 2)) }}
                  className="flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all duration-150"
                  style={{
                    background: selected?.fallbackKey === item.fallbackKey
                      ? "rgba(34,197,94,0.08)"
                      : ADMIN_COLORS.surface2,
                    borderColor: selected?.fallbackKey === item.fallbackKey
                      ? ADMIN_COLORS.borderEm
                      : ADMIN_COLORS.border,
                  }}
                  onMouseEnter={(e) => {
                    if (selected?.fallbackKey !== item.fallbackKey)
                      ;(e.currentTarget as HTMLElement).style.borderColor = ADMIN_COLORS.borderEm
                  }}
                  onMouseLeave={(e) => {
                    if (selected?.fallbackKey !== item.fallbackKey)
                      ;(e.currentTarget as HTMLElement).style.borderColor = ADMIN_COLORS.border
                  }}
                >
                  <div>
                    <p className="text-sm font-semibold" style={{ color: ADMIN_COLORS.ink }}>
                      {item.fallbackKey}
                    </p>
                    <p className="mt-0.5 text-xs" style={{ color: ADMIN_COLORS.inkMuted }}>
                      Tuổi {item.targetAge} · {item.questions.length} câu
                    </p>
                  </div>
                  <AdminBadge variant={statusBadgeVariant(item.status)}>{item.status}</AdminBadge>
                </button>
              ))}
        </div>
      </AdminCard>

      <div className="space-y-5">
        <AdminCard
          title="Chỉnh sửa fallback"
          action={
            <div className="flex gap-2">
              {selected?.fallbackKey ? (
                <AdminDangerButton
                  className="!px-2.5 !py-1.5 !text-xs"
                  onClick={async () => {
                    const ok = await confirm("Archive fallback?", `Archive "${selected.fallbackKey}"?`, "danger")
                    if (!ok) return
                    await adminApi.archiveQuizFallback(selected.fallbackKey)
                    toast.success("Đã archive fallback")
                    await load()
                  }}
                >
                  Archive
                </AdminDangerButton>
              ) : null}
              <AdminPrimaryButton
                className="!px-2.5 !py-1.5 !text-xs"
                onClick={async () => {
                  try {
                    let key = selected?.fallbackKey
                    if (!key) {
                      key = await prompt("Nhập fallbackKey mới", "e.g. waste_age8_v1")
                      if (!key) return
                    }
                    await adminApi.saveQuizFallback(
                      { fallbackKey: key, targetAge: Number(selected?.targetAge ?? 8), questions: JSON.parse(jsonValue) },
                      selected?.fallbackKey || undefined,
                    )
                    toast.success("Đã lưu fallback")
                    await load()
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Không lưu được fallback.")
                  }
                }}
              >
                Lưu
              </AdminPrimaryButton>
            </div>
          }
        >
          <div className="space-y-3">
            <AdminInput
              label="Fallback Key"
              value={selected?.fallbackKey ?? ""}
              onChange={(e) => setSelected((prev: any) => ({ ...(prev ?? {}), fallbackKey: e.target.value }))}
              placeholder="e.g. waste_age8_v1"
            />
            <AdminInput
              label="Target Age"
              type="number"
              value={String(selected?.targetAge ?? 8)}
              onChange={(e) => setSelected((prev: any) => ({ ...(prev ?? {}), targetAge: Number(e.target.value || 8) }))}
              placeholder="8"
            />
            <AdminTextarea
              label="Questions JSON"
              value={jsonValue}
              onChange={(e) => setJsonValue(e.target.value)}
              className="min-h-[320px] font-mono !text-xs"
            />
          </div>
        </AdminCard>

        <AdminCard
          title="Quiz pool"
          action={
            <AdminPrimaryButton
              className="!px-2.5 !py-1.5 !text-xs"
              onClick={async () => { await adminApi.refillQuizPool(); toast.success("Pool refilled"); await load() }}
            >
              Refill
            </AdminPrimaryButton>
          }
        >
          <div className="grid grid-cols-2 gap-2">
            {[
              ["Ready", pool?.health?.readyCount ?? 0, "success"],
              ["Claimed", pool?.health?.claimedCount ?? 0, "info"],
              ["Failed", pool?.health?.failedCount ?? 0, "danger"],
              ["Superseded", pool?.health?.supersededCount ?? 0, "neutral"],
            ].map(([label, value, variant]) => (
              <div
                key={String(label)}
                className="flex flex-col items-start rounded-xl border p-3"
                style={{ background: ADMIN_COLORS.surface2, borderColor: ADMIN_COLORS.border }}
              >
                <AdminBadge variant={variant as any}>{label}</AdminBadge>
                <span className="mt-2 text-xl font-bold tabular-nums" style={{ color: ADMIN_COLORS.ink }}>
                  {value}
                </span>
              </div>
            ))}
          </div>
          {(pool?.items ?? []).length > 0 && (
            <div className="mt-4 space-y-2">
              {pool.items.slice(0, 6).map((item: any) => (
                <AdminInsetRow key={item.quizSetId}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium" style={{ color: ADMIN_COLORS.ink }}>{item.topic}</span>
                    <AdminBadge variant={statusBadgeVariant(item.status)}>{item.status}</AdminBadge>
                  </div>
                  <p className="mt-0.5 font-mono text-[11px]" style={{ color: ADMIN_COLORS.inkMuted }}>
                    {item.quizSetId} · {item.questionCount} câu
                  </p>
                </AdminInsetRow>
              ))}
            </div>
          )}
        </AdminCard>
      </div>
    </div>
  )
}

// ─── Camera Panel ─────────────────────────────────────────────────────────────

function CameraPanel() {
  const [items, setItems] = useState<any[] | null>(null)

  useEffect(() => {
    void adminApi.getAiCameraClassifications().then(setItems).catch(() => setItems([]))
  }, [])

  if (!items) return <AdminPanelMessage message="Đang tải AI camera history..." />

  return (
    <AdminCard title="AI Camera — Lịch sử phân loại">
      {items.length === 0 ? (
        <AdminEmptyState
          icon={Camera}
          title="Chưa có dữ liệu phân loại"
          description="Backend chưa lưu lịch sử phân loại riêng — trang này tạm trống."
        />
      ) : (
        <div className="space-y-2">
          {items.map((item: any, i: number) => (
            <AdminInsetRow key={i}>
              <p className="text-sm" style={{ color: ADMIN_COLORS.ink }}>{JSON.stringify(item)}</p>
            </AdminInsetRow>
          ))}
        </div>
      )}
    </AdminCard>
  )
}

// ─── Mini-Game Panel ──────────────────────────────────────────────────────────

const RANK_COLORS = ["#f59e0b", "#8b949e", "#c97c2d"]
const RANK_LABELS = ["🥇", "🥈", "🥉"]

function MiniGamePanel() {
  const [data, setData] = useState<any | null>(null)
  const [draft, setDraft] = useState<any>({ itemId: "", name: "", category: "", binColor: "", iconKey: "", difficulty: "easy", isActive: true })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const { confirm, dialog: confirmDialog } = useConfirmDialog()

  const load = async () => {
    setError(null)
    setLoading(true)
    try {
      setData(await adminApi.getMiniGameItems())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được mini-game items.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const items = data?.items ?? []

  return (
    <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
      {confirmDialog}

      <AdminCard
        title="Mini-game items"
        action={
          <AdminOutlineButton className="!px-2.5 !py-1.5 !text-xs" onClick={() => void load()}>
            <RefreshCw size={12} /> Làm mới
          </AdminOutlineButton>
        }
      >
        {error && (
          <div
            className="mb-3 rounded-xl border px-3 py-2.5 text-sm"
            style={{ background: ADMIN_COLORS.dangerBg, borderColor: "rgba(248,81,73,0.3)", color: ADMIN_COLORS.danger }}
          >
            {error}
          </div>
        )}
        <div className="overflow-hidden rounded-xl border" style={{ borderColor: ADMIN_COLORS.border }}>
          <Table>
            <TableHeader>
              <TableRow className="border-0 hover:bg-transparent" style={{ background: ADMIN_COLORS.surface2 }}>
                {["Item", "Loại", "Độ khó", "Trạng thái", ""].map((h) => (
                  <TableHead
                    key={h}
                    className="text-[11px] font-bold uppercase tracking-wider"
                    style={{ color: ADMIN_COLORS.inkMuted, borderBottom: `1px solid ${ADMIN_COLORS.border}` }}
                  >
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i} style={{ borderColor: ADMIN_COLORS.border }}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <TableCell key={j}><AdminSkeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : items.length === 0
                ? (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <AdminEmptyState icon={Gamepad2} title="Chưa có items" />
                      </TableCell>
                    </TableRow>
                  )
                : items.map((item: any) => (
                    <TableRow
                      key={item.itemId}
                      className="transition-colors"
                      style={{ borderColor: ADMIN_COLORS.border }}
                      onMouseEnter={(e) => { ;(e.currentTarget as HTMLElement).style.background = ADMIN_COLORS.surface2 }}
                      onMouseLeave={(e) => { ;(e.currentTarget as HTMLElement).style.background = "transparent" }}
                    >
                      <TableCell className="font-medium" style={{ color: ADMIN_COLORS.ink }}>{item.name}</TableCell>
                      <TableCell style={{ color: ADMIN_COLORS.inkMuted }}>{item.category}</TableCell>
                      <TableCell>
                        <AdminBadge variant={item.difficulty === "hard" ? "danger" : item.difficulty === "medium" ? "warning" : "success"}>
                          {item.difficulty}
                        </AdminBadge>
                      </TableCell>
                      <TableCell>
                        <AdminBadge variant={statusBadgeVariant(item.status)}>{item.status}</AdminBadge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5">
                          <AdminOutlineButton className="!px-2.5 !py-1 !text-xs" onClick={() => setDraft(item)}>
                            Sửa
                          </AdminOutlineButton>
                          <AdminDangerButton
                            className="!px-2.5 !py-1 !text-xs"
                            onClick={async () => {
                              const ok = await confirm("Archive item?", `Archive "${item.name}"?`, "danger")
                              if (!ok) return
                              await adminApi.archiveMiniGameItem(item.itemId)
                              toast.success("Đã archive item")
                              await load()
                            }}
                          >
                            Archive
                          </AdminDangerButton>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </div>
      </AdminCard>

      <div className="space-y-5">
        <AdminCard title="Chỉnh sửa item">
          <div className="space-y-3">
            {(["itemId", "name", "category", "binColor", "iconKey", "difficulty"] as const).map((field) => (
              <AdminInput
                key={field}
                label={field}
                value={draft[field] ?? ""}
                onChange={(e) => setDraft((prev: any) => ({ ...prev, [field]: e.target.value }))}
                placeholder={field}
              />
            ))}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium" style={{ color: ADMIN_COLORS.inkMuted }}>
                isActive
              </label>
              <Select
                value={draft.isActive ? "true" : "false"}
                onValueChange={(v) => setDraft((prev: any) => ({ ...prev, isActive: v === "true" }))}
              >
                <SelectTrigger
                  className="h-10 w-full rounded-xl border text-sm"
                  style={{ background: ADMIN_COLORS.surface2, borderColor: ADMIN_COLORS.border, color: ADMIN_COLORS.ink }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ background: ADMIN_COLORS.surface, borderColor: ADMIN_COLORS.border, color: ADMIN_COLORS.ink }}>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <AdminPrimaryButton
              className="!w-full"
              onClick={async () => {
                await adminApi.saveMiniGameItem(draft, draft.itemId || undefined)
                toast.success("Đã lưu item")
                await load()
              }}
            >
              Lưu item
            </AdminPrimaryButton>
          </div>
        </AdminCard>

        <AdminCard title="Xếp hạng">
          <div className="space-y-2">
            {(data?.leaderboard ?? []).length === 0
              ? <AdminEmptyState icon={Trophy} title="Chưa có xếp hạng" />
              : (data?.leaderboard ?? []).map((entry: any) => (
                  <div
                    key={entry.childId}
                    className="flex items-center justify-between rounded-xl border px-3 py-2.5"
                    style={{
                      background: entry.rank <= 3 ? `rgba(${entry.rank === 1 ? "245,158,11" : entry.rank === 2 ? "139,148,158" : "201,124,45"},0.08)` : ADMIN_COLORS.surface2,
                      borderColor: entry.rank <= 3 ? `rgba(${entry.rank === 1 ? "245,158,11" : entry.rank === 2 ? "139,148,158" : "201,124,45"},0.3)` : ADMIN_COLORS.border,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">
                        {entry.rank <= 3 ? RANK_LABELS[entry.rank - 1] : `#${entry.rank}`}
                      </span>
                      <span className="text-sm font-medium" style={{ color: ADMIN_COLORS.ink }}>
                        {entry.name}
                      </span>
                    </div>
                    <span className="font-bold tabular-nums" style={{ color: ADMIN_COLORS.ink }}>
                      {entry.miniGameHighScore} <span className="text-xs font-normal" style={{ color: ADMIN_COLORS.inkMuted }}>điểm</span>
                    </span>
                  </div>
                ))}
          </div>
        </AdminCard>
      </div>
    </div>
  )
}

// ─── Rewards Panel ────────────────────────────────────────────────────────────

function RewardsPanel() {
  const [data, setData] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.getOverview()
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => { setData(null); setLoading(false) })
  }, [])

  if (loading) return <AdminPanelMessage message="Đang tải rewards & streak..." />
  if (!data) return <AdminPanelError error="Không tải được dữ liệu." onRetry={() => window.location.reload()} />

  return (
    <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <AdminCard title="Tóm tắt streak">
        <div className="space-y-2">
          {[
            ["Hoạt động hôm nay", data.streak.activeToday, "success"],
            ["Streak ≥ 7 ngày",   data.streak.streak7OrMore, "info"],
            ["Streak ≥ 30 ngày",  data.streak.streak30OrMore, "warning"],
          ].map(([label, value, variant]) => (
            <div
              key={String(label)}
              className="flex items-center justify-between rounded-xl border px-4 py-3"
              style={{ background: ADMIN_COLORS.surface2, borderColor: ADMIN_COLORS.border }}
            >
              <span className="text-sm" style={{ color: ADMIN_COLORS.inkMuted }}>{label}</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tabular-nums" style={{ color: ADMIN_COLORS.ink }}>{value}</span>
                <AdminBadge variant={variant as any}>•</AdminBadge>
              </div>
            </div>
          ))}
        </div>
      </AdminCard>

      <AdminCard title="Danh mục huy hiệu">
        <div className="grid gap-3 md:grid-cols-2">
          {(data.badgeCatalog ?? []).map((badge: any) => (
            <div
              key={badge.code}
              className="rounded-xl border p-3 transition-all duration-150"
              style={{ background: ADMIN_COLORS.surface2, borderColor: ADMIN_COLORS.border }}
              onMouseEnter={(e) => { ;(e.currentTarget as HTMLElement).style.borderColor = ADMIN_COLORS.borderEm }}
              onMouseLeave={(e) => { ;(e.currentTarget as HTMLElement).style.borderColor = ADMIN_COLORS.border }}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold" style={{ color: ADMIN_COLORS.ink }}>{badge.name}</p>
                <AdminBadge variant={badge.enabled ? "success" : "neutral"}>
                  {badge.enabled ? "Bật" : "Tắt"}
                </AdminBadge>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: ADMIN_COLORS.inkMuted }}>
                {badge.description}
              </p>
            </div>
          ))}
          {(data.badgeCatalog ?? []).length === 0 && (
            <div className="col-span-2">
              <AdminEmptyState icon={Star} title="Chưa có huy hiệu" />
            </div>
          )}
        </div>
      </AdminCard>
    </div>
  )
}

// ─── Chart ────────────────────────────────────────────────────────────────────

const TREND_METRICS = [
  { key: "signups", label: "Đăng ký",  color: "#22c55e", field: "signups"          as const },
  { key: "scans",   label: "Quét",     color: "#58a6ff", field: "scans"            as const },
  { key: "quiz",    label: "Quiz",     color: "#a855f7", field: "quizCompletions"  as const },
  { key: "game",    label: "Game",     color: "#f59e0b", field: "miniGameSessions" as const },
]

type DailyTrendItem = {
  date: string
  signups: number
  scans: number
  quizCompletions: number
  miniGameSessions: number
}

function formatTrendDay(date: string) {
  return date.slice(5).replace("-", "/")
}

const CHART_TICK = {
  fontSize: 11,
  fill: ADMIN_COLORS.inkMuted,
  fontFamily: ADMIN_FONT,
}

function WeeklyTrendSection({ daily }: { daily: DailyTrendItem[] }) {
  const chartData = useMemo(
    () =>
      daily.map((item) => ({
        day: formatTrendDay(item.date),
        signups: item.signups,
        scans: item.scans,
        quiz: item.quizCompletions,
        game: item.miniGameSessions,
      })),
    [daily],
  )

  if (daily.length === 0) {
    return (
      <AdminEmptyState
        icon={BarChart3}
        title="Chưa có dữ liệu"
        description="Dữ liệu xu hướng sẽ hiển thị sau khi có hoạt động."
      />
    )
  }

  return (
    <div className="h-[220px] w-full [&_.recharts-surface]:bg-transparent [&_.recharts-wrapper]:bg-transparent">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }} barGap={2} barCategoryGap="24%">
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={ADMIN_COLORS.border} />
          <XAxis dataKey="day" tick={CHART_TICK} axisLine={false} tickLine={false} />
          <YAxis tick={CHART_TICK} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
          <Tooltip content={<TrendTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
          <Legend
            iconType="circle"
            iconSize={7}
            wrapperStyle={{ fontSize: 11, paddingTop: 8, color: ADMIN_COLORS.inkMuted, fontFamily: ADMIN_FONT }}
          />
          {TREND_METRICS.map((metric) => (
            <Bar
              key={metric.key}
              dataKey={metric.key}
              name={metric.label}
              fill={metric.color}
              radius={[4, 4, 0, 0]}
              maxBarSize={12}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function TrendTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null

  return (
    <div
      className="rounded-xl border px-3.5 py-3 shadow-xl"
      style={{
        background: ADMIN_COLORS.surface,
        borderColor: ADMIN_COLORS.border,
        fontFamily: ADMIN_FONT,
        backdropFilter: "blur(12px)",
      }}
    >
      <p className="mb-2 text-xs font-semibold" style={{ color: ADMIN_COLORS.ink }}>
        {label}
      </p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: entry.color }}
          />
          <span style={{ color: ADMIN_COLORS.inkMuted }}>{entry.name}:</span>
          <span className="font-semibold tabular-nums" style={{ color: ADMIN_COLORS.ink }}>
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}
