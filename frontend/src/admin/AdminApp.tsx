import { useEffect, useMemo, useState, type FormEvent } from "react"
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
import { BarChart3, Brain, Camera, Gamepad2, LogOut, Menu, RefreshCw, Star, Users, X } from "lucide-react"
import {
  AdminBrandMark,
  AdminCard,
  AdminInsetRow,
  AdminKeyValue,
  AdminOutlineButton,
  AdminPanelError,
  AdminPanelMessage,
  AdminPrimaryButton,
  AdminSectionLabel,
  AdminShell,
  AdminStatCard,
  adminFontBody,
  adminFontTitle,
  ADMIN_TYPE_CLASS,
} from "@/admin/adminTheme"
import { adminApi } from "@/admin/api"
import { clearAdminSession, getAdminSession, loginAdmin, type AdminSession } from "@/admin/auth"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"

const adminInputClass =
  "rounded-xl border-2 border-[#a8e6b8] bg-[#f8fdf9] font-['Nunito',sans-serif] font-normal focus-visible:border-[#2dd62d] focus-visible:ring-[#2dd62d]/30"
const adminBadgeClass = "rounded-full border-[#a8e6b8] bg-[#f0fdf9] font-normal text-[#1b4332]"
const adminTableClass = "[&_th]:font-bold [&_td]:font-normal"

type AdminSection = "overview" | "children" | "quiz" | "camera" | "games" | "rewards"

const NAV_ITEMS: Array<{ key: AdminSection; label: string; icon: React.ComponentType<{ size?: number }> }> = [
  { key: "overview", label: "Tổng quan", icon: BarChart3 },
  { key: "children", label: "Người dùng", icon: Users },
  { key: "quiz", label: "Quiz", icon: Brain },
  { key: "camera", label: "AI Camera", icon: Camera },
  { key: "games", label: "Mini-game", icon: Gamepad2 },
  { key: "rewards", label: "Rewards & Streak", icon: Star },
]

function readSection(): AdminSection {
  const section = window.location.hash.replace(/^#/, "")
  return NAV_ITEMS.some((item) => item.key === section) ? (section as AdminSection) : "overview"
}

export default function AdminApp() {
  const [session, setSession] = useState<AdminSession | null>(() => getAdminSession())
  const [section, setSection] = useState<AdminSection>(() => readSection())
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

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

  const currentLabel = NAV_ITEMS.find((item) => item.key === section)?.label ?? "Admin"

  const navButtons = (
    <>
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon
        const active = section === item.key
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => navigate(item.key)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-normal transition ${
              active
                ? "bg-[#b9f0af] font-bold text-[#1b4332] shadow-sm"
                : "text-[#2d6a4f] hover:bg-white/70"
            }`}
          >
            <Icon size={18} />
            <span>{item.label}</span>
          </button>
        )
      })}
    </>
  )

  return (
    <AdminShell>
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-3 p-3 lg:p-4">
        <aside className={`hidden w-[252px] shrink-0 flex-col overflow-hidden rounded-xl bg-[#f4fbf6] ring-1 ring-inset ring-[#a8e6b8] lg:flex ${ADMIN_TYPE_CLASS}`}>
          <div className="border-b border-[#d8f3dc] px-4 py-4">
            <AdminBrandMark subtitle="Nội bộ vận hành" />
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4">{navButtons}</nav>
        </aside>

        <main className="min-w-0 flex-1">
          <header className={`sticky top-0 z-10 overflow-hidden rounded-xl bg-[#f4fbf6] ring-1 ring-inset ring-[#a8e6b8] px-4 py-2.5 lg:px-5 ${ADMIN_TYPE_CLASS}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#a8e6b8] bg-white lg:hidden"
                  onClick={() => setMobileNavOpen((open) => !open)}
                  aria-label="Mở menu"
                >
                  {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
                </button>
                <div className="min-w-0">
                  <p className="truncate text-lg font-extrabold" style={adminFontTitle}>
                    {currentLabel}
                  </p>
                  <p className="truncate text-xs font-normal text-[#2d6a4f]/80">
                    Xin chào, {session.username}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant="outline" className={adminBadgeClass}>
                  admin
                </Badge>
                <AdminOutlineButton
                  className="!px-3 !py-2"
                  onClick={() => {
                    clearAdminSession()
                    setSession(null)
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Đăng xuất</span>
                </AdminOutlineButton>
              </div>
            </div>

            {mobileNavOpen ? (
              <nav className="mt-3 space-y-1 border-t border-[#d8f3dc] pt-3 lg:hidden">{navButtons}</nav>
            ) : null}
          </header>

          <div className={`py-3 lg:py-4 ${ADMIN_TYPE_CLASS}`}>
            {section === "overview" && <OverviewPanel />}
            {section === "children" && <ChildrenPanel />}
            {section === "quiz" && <QuizPanel />}
            {section === "camera" && <CameraPanel />}
            {section === "games" && <MiniGamePanel />}
            {section === "rewards" && <RewardsPanel />}
          </div>
        </main>
      </div>
    </AdminShell>
  )
}

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
      <div className="flex min-h-screen items-center justify-center p-6">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-[420px] overflow-hidden rounded-3xl border-2 border-[#a8e6b8] bg-white/95 p-6 shadow-[0_8px_32px_rgba(45,106,79,0.12)]"
          style={adminFontBody}
        >
          <div className="flex justify-center">
            <AdminBrandMark subtitle="Đăng nhập quản trị" />
          </div>
          <p className="mt-4 text-center text-sm text-[#2d6a4f]">
            Tài khoản thuộc nhóm admin trên Cognito.
          </p>
          <div className="mt-5 space-y-3">
            <Input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Tên đăng nhập"
              className={adminInputClass}
            />
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Mật khẩu"
              className={adminInputClass}
            />
          </div>
          {error ? <p className="mt-3 text-center text-sm text-red-600">{error}</p> : null}
          <AdminPrimaryButton type="submit" className="mt-5 w-full py-3" disabled={busy}>
            {busy ? "Đang đăng nhập..." : "Đăng nhập"}
          </AdminPrimaryButton>
        </form>
      </div>
    </AdminShell>
  )
}

function OverviewPanel() {
  const [data, setData] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setError(null)
    try {
      setData(await adminApi.getOverview())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được overview.")
    }
  }

  useEffect(() => {
    void load()
  }, [])

  if (error) return <AdminPanelError error={error} onRetry={() => void load()} />
  if (!data) return <AdminPanelMessage message="Đang tải dashboard..." />

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
        {[
          ["Tổng người chơi", data.totals.totalChildren],
          ["Lượt quét AI", data.totals.totalAiCameraScans],
          ["Phiên quiz", data.totals.totalQuizSessions],
          ["Phiên mini-game", data.totals.totalMiniGameSessions],
          ["Hoạt động hôm nay", data.totals.dailyActiveUsers],
          ["Streak đang chạy", data.totals.childrenWithActiveStreak],
        ].map(([label, value]) => (
          <AdminStatCard key={String(label)} label={String(label)} value={value} />
        ))}
      </div>

      <div className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <AdminCard
          dense
          fill
          title="Xu hướng 7 ngày"
          action={
            <AdminOutlineButton className="!px-2 !py-1 text-xs" onClick={() => void load()}>
              <RefreshCw className="h-3.5 w-3.5" />
              Làm mới
            </AdminOutlineButton>
          }
        >
          <WeeklyTrendSection daily={data.daily} />
        </AdminCard>

        <AdminCard dense fill title="Vận hành">
          <div className="flex h-full flex-col gap-3">
            <section>
              <AdminSectionLabel>Sức khỏe hệ thống</AdminSectionLabel>
              <div className="space-y-1 text-sm">
                <AdminKeyValue label="Quiz pool ready" value={data.quizPool.readyCount} />
                <AdminKeyValue label="Claimed" value={data.quizPool.claimedCount} />
                <AdminKeyValue label="Failed" value={data.quizPool.failedCount} />
                <AdminKeyValue label="Superseded" value={data.quizPool.supersededCount} />
                <AdminKeyValue label="Fallback active" value={data.quizPool.fallbackCount} />
              </div>
            </section>

            <div className="border-t border-[#d8f3dc]/80 pt-3">
              <AdminSectionLabel>Streak</AdminSectionLabel>
              <div className="space-y-1 text-sm">
                <AdminKeyValue label="Hoạt động hôm nay" value={data.streak.activeToday} />
                <AdminKeyValue label="≥ 7 ngày" value={data.streak.streak7OrMore} />
                <AdminKeyValue label="≥ 30 ngày" value={data.streak.streak30OrMore} />
                <AdminKeyValue label="Đã khóa" value={data.streak.disabledChildren} />
                <AdminKeyValue label="Đã lưu trữ" value={data.streak.archivedChildren} />
              </div>
            </div>

            {data.notes.length > 0 ? (
              <div className="border-t border-[#d8f3dc]/80 pt-3">
                <AdminSectionLabel>Ghi chú</AdminSectionLabel>
                <ul className="space-y-1 text-xs leading-relaxed text-[#2d6a4f]/85">
                  {data.notes.map((note: string) => (
                    <li key={note} className="rounded-lg bg-[#f8fdf9] px-2.5 py-1.5">
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </AdminCard>
      </div>
    </div>
  )
}

function ChildrenPanel() {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [data, setData] = useState<any | null>(null)
  const [detail, setDetail] = useState<any | null>(null)
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setError(null)
    try {
      const response = await adminApi.getChildren(search, status === "all" ? "" : status)
      setData(response)
      if (!selectedChildId && response.items?.[0]?.childId) {
        setSelectedChildId(response.items[0].childId)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được danh sách child.")
    }
  }

  useEffect(() => {
    void load()
  }, [])

  useEffect(() => {
    if (!selectedChildId) return
    void adminApi.getChild(selectedChildId).then(setDetail).catch(() => setDetail(null))
  }, [selectedChildId])

  const refreshDetail = async () => {
    if (!selectedChildId) return
    setDetail(await adminApi.getChild(selectedChildId))
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1.25fr_0.95fr]">
      <AdminCard title="Danh sách người chơi">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo tên hoặc childId"
            className={`max-w-sm ${adminInputClass}`}
          />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className={`w-[180px] ${adminInputClass}`}>
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Disabled">Disabled</SelectItem>
              <SelectItem value="Archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <AdminPrimaryButton className="!px-4 !py-2" onClick={() => void load()}>
            Lọc
          </AdminPrimaryButton>
        </div>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        <div className={`mt-4 overflow-x-auto rounded-xl border border-[#d8f3dc] ${adminTableClass}`}>
          <Table>
            <TableHeader>
              <TableRow className="border-[#d8f3dc] hover:bg-transparent">
                <TableHead>Tên</TableHead>
                <TableHead>childId</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>XP</TableHead>
                <TableHead>Streak</TableHead>
                <TableHead>Điểm</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.items ?? []).map((item: any) => (
                <TableRow
                  key={item.childId}
                  className={`cursor-pointer border-[#eef8f0] ${
                    selectedChildId === item.childId ? "bg-[#b9f0af]/60" : "hover:bg-[#f8fdf9]"
                  }`}
                  onClick={() => setSelectedChildId(item.childId)}
                >
                  <TableCell>{item.characterName}</TableCell>
                  <TableCell className="max-w-[120px] truncate text-xs">{item.childId}</TableCell>
                  <TableCell>{item.level}</TableCell>
                  <TableCell>{item.xp}</TableCell>
                  <TableCell>{item.streak}</TableCell>
                  <TableCell>{item.miniGameHighScore}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={adminBadgeClass}>
                      {item.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </AdminCard>

      <AdminCard title="Chi tiết">
        {!detail ? (
          <p className="py-6 text-center text-sm text-[#2d6a4f]">Chọn một người chơi để xem chi tiết.</p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-extrabold" style={adminFontTitle}>
                  {detail.characterName}
                </p>
                <p className="text-xs text-[#2d6a4f]">{detail.childId}</p>
              </div>
              <Badge variant="outline" className={adminBadgeClass}>
                {detail.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <AdminKeyValue label="Level" value={detail.level} />
              <AdminKeyValue label="XP" value={detail.xp} />
              <AdminKeyValue label="Streak" value={detail.streak} />
              <AdminKeyValue label="Điểm cao nhất" value={detail.miniGameHighScore} />
            </div>

            <div className="flex flex-wrap gap-2">
              <AdminOutlineButton
                className="!px-3 !py-1.5 text-xs"
                onClick={async () => {
                  if (!window.confirm("Khóa người chơi này?")) return
                  await adminApi.lockChild(detail.childId)
                  await load()
                  await refreshDetail()
                }}
              >
                Khóa
              </AdminOutlineButton>
              <AdminOutlineButton
                className="!px-3 !py-1.5 text-xs"
                onClick={async () => {
                  if (!window.confirm("Mở khóa người chơi này?")) return
                  await adminApi.unlockChild(detail.childId)
                  await load()
                  await refreshDetail()
                }}
              >
                Mở khóa
              </AdminOutlineButton>
              <AdminOutlineButton
                className="!px-3 !py-1.5 text-xs"
                onClick={async () => {
                  if (!window.confirm("Lưu trữ người chơi này?")) return
                  await adminApi.archiveChild(detail.childId)
                  await load()
                  await refreshDetail()
                }}
              >
                Lưu trữ
              </AdminOutlineButton>
              <AdminOutlineButton
                className="!px-3 !py-1.5 text-xs"
                onClick={async () => {
                  if (!window.confirm("Reset streak?")) return
                  await adminApi.resetChildStreak(detail.childId)
                  await refreshDetail()
                }}
              >
                Reset streak
              </AdminOutlineButton>
              <AdminPrimaryButton
                className="!px-3 !py-1.5 text-xs"
                onClick={async () => {
                  const next = window.prompt("Nhập XP mới", String(detail.xp))
                  if (!next) return
                  await adminApi.adjustChildXp(detail.childId, Number(next))
                  await load()
                  await refreshDetail()
                }}
              >
                Chỉnh XP
              </AdminPrimaryButton>
            </div>

            <div>
              <p className="text-sm font-bold text-[#1b4332]">Huy hiệu</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(detail.badges ?? []).map((badge: string) => (
                  <Badge key={badge} className="rounded-full bg-[#b9f0af] text-[#1b4332] hover:bg-[#b9f0af]">
                    {badge}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-bold text-[#1b4332]">Quiz gần đây</p>
              <div className="mt-2 space-y-2">
                {(detail.recentQuizSessions ?? []).slice(0, 4).map((session: any) => (
                  <AdminInsetRow key={session.sessionId}>
                    <div className="flex items-center justify-between gap-2">
                      <span>{session.wasteType}</span>
                      <Badge variant="outline" className={adminBadgeClass}>
                        {session.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-[#2d6a4f]">
                      Đúng: {session.correctAnswers} | XP: {session.xpAwarded}
                    </p>
                  </AdminInsetRow>
                ))}
              </div>
            </div>
          </div>
        )}
      </AdminCard>
    </div>
  )
}

function QuizPanel() {
  const [fallbacks, setFallbacks] = useState<any[]>([])
  const [pool, setPool] = useState<any | null>(null)
  const [selected, setSelected] = useState<any | null>(null)
  const [jsonValue, setJsonValue] = useState("[]")
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setError(null)
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
    }
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <div className="grid gap-5 xl:grid-cols-[1.1fr_1fr]">
      <AdminCard
        title="Quiz fallback"
        action={
          <div className="flex gap-2">
            <AdminOutlineButton className="!px-2.5 !py-1.5 text-xs" onClick={() => void load()}>
              Làm mới
            </AdminOutlineButton>
            <AdminPrimaryButton
              className="!px-2.5 !py-1.5 text-xs"
              onClick={() => {
                setSelected({ fallbackKey: "", targetAge: 8, questions: [] })
                setJsonValue("[]")
              }}
            >
              Tạo mới
            </AdminPrimaryButton>
          </div>
        }
      >
        {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
        <div className="space-y-2">
          {fallbacks.map((item) => (
            <button
              key={item.fallbackKey}
              type="button"
              onClick={() => {
                setSelected(item)
                setJsonValue(JSON.stringify(item.questions, null, 2))
              }}
              className={`flex w-full items-center justify-between rounded-xl border-2 px-3 py-3 text-left transition ${
                selected?.fallbackKey === item.fallbackKey
                  ? "border-[#a8e6b8] bg-[#b9f0af]/50"
                  : "border-[#d8f3dc] bg-[#f8fdf9] hover:bg-white"
              }`}
            >
              <div>
                <p className="font-bold">{item.fallbackKey}</p>
                <p className="text-xs text-[#2d6a4f]">
                  Tuổi {item.targetAge} • {item.questions.length} câu
                </p>
              </div>
              <Badge variant="outline" className={adminBadgeClass}>
                {item.status}
              </Badge>
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
                <AdminOutlineButton
                  className="!px-2.5 !py-1.5 text-xs"
                  onClick={async () => {
                    if (!window.confirm("Archive fallback này?")) return
                    await adminApi.archiveQuizFallback(selected.fallbackKey)
                    await load()
                  }}
                >
                  Archive
                </AdminOutlineButton>
              ) : null}
              <AdminPrimaryButton
                className="!px-2.5 !py-1.5 text-xs"
                onClick={async () => {
                  try {
                    const key = selected?.fallbackKey || window.prompt("fallbackKey mới") || ""
                    await adminApi.saveQuizFallback(
                      {
                        fallbackKey: key,
                        targetAge: Number(selected?.targetAge ?? 8),
                        questions: JSON.parse(jsonValue),
                      },
                      selected?.fallbackKey || undefined,
                    )
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
            <Input
              value={selected?.fallbackKey ?? ""}
              onChange={(event) => setSelected((prev: any) => ({ ...(prev ?? {}), fallbackKey: event.target.value }))}
              placeholder="fallbackKey"
              className={adminInputClass}
            />
            <Input
              value={String(selected?.targetAge ?? 8)}
              onChange={(event) => setSelected((prev: any) => ({ ...(prev ?? {}), targetAge: Number(event.target.value || 8) }))}
              placeholder="targetAge"
              className={adminInputClass}
            />
            <Textarea
              value={jsonValue}
              onChange={(event) => setJsonValue(event.target.value)}
              className={`min-h-[360px] font-mono text-xs ${adminInputClass}`}
            />
          </div>
        </AdminCard>

        <AdminCard
          title="Quiz pool"
          action={
            <AdminPrimaryButton
              className="!px-2.5 !py-1.5 text-xs"
              onClick={async () => {
                await adminApi.refillQuizPool()
                await load()
              }}
            >
              Refill
            </AdminPrimaryButton>
          }
        >
          <div className="grid grid-cols-2 gap-2 text-sm">
            <AdminKeyValue label="Ready" value={pool?.health?.readyCount ?? 0} />
            <AdminKeyValue label="Claimed" value={pool?.health?.claimedCount ?? 0} />
            <AdminKeyValue label="Failed" value={pool?.health?.failedCount ?? 0} />
            <AdminKeyValue label="Superseded" value={pool?.health?.supersededCount ?? 0} />
          </div>
          <div className="mt-4 space-y-2">
            {(pool?.items ?? []).slice(0, 8).map((item: any) => (
              <AdminInsetRow key={item.quizSetId}>
                <div className="flex items-center justify-between gap-2">
                  <span>{item.topic}</span>
                  <Badge variant="outline" className={adminBadgeClass}>
                    {item.status}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-[#2d6a4f]">
                  {item.quizSetId} • {item.questionCount} câu
                </p>
              </AdminInsetRow>
            ))}
          </div>
        </AdminCard>
      </div>
    </div>
  )
}

function CameraPanel() {
  const [items, setItems] = useState<any[] | null>(null)

  useEffect(() => {
    void adminApi.getAiCameraClassifications().then(setItems).catch(() => setItems([]))
  }, [])

  if (!items) return <AdminPanelMessage message="Đang tải AI camera history..." />

  return (
    <AdminCard title="AI Camera">
      {items.length === 0 ? (
        <p className="text-sm text-[#2d6a4f]">
          Backend chưa lưu lịch sử phân loại riêng — trang này tạm trống.
        </p>
      ) : null}
    </AdminCard>
  )
}

function MiniGamePanel() {
  const [data, setData] = useState<any | null>(null)
  const [draft, setDraft] = useState<any>({ itemId: "", name: "", category: "", binColor: "", iconKey: "", difficulty: "easy", isActive: true })
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setError(null)
    try {
      setData(await adminApi.getMiniGameItems())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được mini-game items.")
    }
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
      <AdminCard
        title="Mini-game items"
        action={
          <AdminOutlineButton className="!px-2.5 !py-1.5 text-xs" onClick={() => void load()}>
            Làm mới
          </AdminOutlineButton>
        }
      >
        {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
        <div className={`overflow-x-auto rounded-xl border border-[#d8f3dc] ${adminTableClass}`}>
          <Table>
            <TableHeader>
              <TableRow className="border-[#d8f3dc] hover:bg-transparent">
                <TableHead>Item</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Độ khó</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.items ?? []).map((item: any) => (
                <TableRow key={item.itemId} className="border-[#eef8f0] hover:bg-[#f8fdf9]">
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.difficulty}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={adminBadgeClass}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="space-x-2 text-right">
                    <AdminOutlineButton className="!px-2.5 !py-1 text-xs" onClick={() => setDraft(item)}>
                      Sửa
                    </AdminOutlineButton>
                    <AdminOutlineButton
                      className="!px-2.5 !py-1 text-xs"
                      onClick={async () => {
                        if (!window.confirm("Archive item này?")) return
                        await adminApi.archiveMiniGameItem(item.itemId)
                        await load()
                      }}
                    >
                      Archive
                    </AdminOutlineButton>
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
            {["itemId", "name", "category", "binColor", "iconKey", "difficulty"].map((field) => (
              <Input
                key={field}
                value={draft[field] ?? ""}
                onChange={(event) => setDraft((prev: any) => ({ ...prev, [field]: event.target.value }))}
                placeholder={field}
                className={adminInputClass}
              />
            ))}
            <Select
              value={draft.isActive ? "true" : "false"}
              onValueChange={(value) => setDraft((prev: any) => ({ ...prev, isActive: value === "true" }))}
            >
              <SelectTrigger className={adminInputClass}>
                <SelectValue placeholder="isActive" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Disabled</SelectItem>
              </SelectContent>
            </Select>
            <AdminPrimaryButton
              onClick={async () => {
                await adminApi.saveMiniGameItem(draft, draft.itemId || undefined)
                await load()
              }}
            >
              Lưu item
            </AdminPrimaryButton>
          </div>
        </AdminCard>

        <AdminCard title="Xếp hạng">
          <div className="space-y-2">
            {(data?.leaderboard ?? []).map((entry: any) => (
              <AdminInsetRow key={entry.childId} className="flex items-center justify-between">
                <span>
                  #{entry.rank} {entry.name}
                </span>
                <span className="font-bold tabular-nums">{entry.miniGameHighScore} điểm</span>
              </AdminInsetRow>
            ))}
          </div>
        </AdminCard>
      </div>
    </div>
  )
}

function RewardsPanel() {
  const [data, setData] = useState<any | null>(null)

  useEffect(() => {
    void adminApi.getOverview().then(setData).catch(() => setData(null))
  }, [])

  if (!data) return <AdminPanelMessage message="Đang tải rewards & streak..." />

  return (
    <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
      <AdminCard title="Tóm tắt streak">
        <div className="space-y-2 text-sm">
          <AdminKeyValue label="Hoạt động hôm nay" value={data.streak.activeToday} />
          <AdminKeyValue label="Streak ≥ 7" value={data.streak.streak7OrMore} />
          <AdminKeyValue label="Streak ≥ 30" value={data.streak.streak30OrMore} />
        </div>
      </AdminCard>

      <AdminCard title="Danh mục huy hiệu">
        <div className="grid gap-3 md:grid-cols-2">
          {data.badgeCatalog.map((badge: any) => (
            <div key={badge.code} className="rounded-xl border-2 border-[#d8f3dc] bg-[#f8fdf9] p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-bold text-[#1b4332]">{badge.name}</p>
                <Badge variant="outline" className={adminBadgeClass}>
                  {badge.enabled ? "Bật" : "Tắt"}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-[#2d6a4f]">{badge.description}</p>
            </div>
          ))}
        </div>
      </AdminCard>
    </div>
  )
}

const TREND_METRICS = [
  { key: "signups", label: "Đăng ký", color: "#2dd62d", field: "signups" as const },
  { key: "scans", label: "Quét", color: "#0ea5e9", field: "scans" as const },
  { key: "quiz", label: "Quiz", color: "#8b5cf6", field: "quizCompletions" as const },
  { key: "game", label: "Game", color: "#7ED957", field: "miniGameSessions" as const },
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

const CHART_TICK = { fontSize: 11, fill: "#2d6a4f", fontFamily: "Nunito, system-ui, sans-serif" }

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

  return (
    <div className="min-h-[220px] w-full flex-1 [&_.recharts-surface]:bg-transparent [&_.recharts-wrapper]:bg-transparent">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={1} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d8f3dc" />
          <XAxis
            dataKey="day"
            tick={CHART_TICK}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={CHART_TICK}
            axisLine={false}
            tickLine={false}
            width={36}
            allowDecimals={false}
            tickFormatter={(value) => String(value)}
          />
          <Tooltip content={<TrendTooltip />} cursor={{ fill: "rgba(232,245,236,0.45)" }} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 11, paddingTop: 6, color: "#2d6a4f" }}
          />
          {TREND_METRICS.map((metric) => (
            <Bar
              key={metric.key}
              dataKey={metric.key}
              name={metric.label}
              fill={metric.color}
              radius={[3, 3, 0, 0]}
              maxBarSize={10}
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
    <div className="rounded-lg border border-[#d8f3dc] bg-white px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-bold text-[#1b4332]">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="tabular-nums" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  )
}
