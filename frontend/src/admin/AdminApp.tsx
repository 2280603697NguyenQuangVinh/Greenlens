import { useEffect, useState, type FormEvent, type ReactNode } from "react"
import { BarChart3, Brain, Camera, Gamepad2, LogOut, RefreshCw, Shield, Star, Users } from "lucide-react"
import { adminApi } from "@/admin/api"
import { clearAdminSession, getAdminSession, loginAdmin, type AdminSession } from "@/admin/auth"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { FF_COMFORTAA, FF_FREDOKA } from "@/utils/constants"

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
  }

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-[250px] shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
          <div className="border-b border-slate-200 px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-600 text-white">
                <Shield size={18} />
              </div>
              <div>
                <p className="text-sm font-black" style={FF_FREDOKA}>GreenLens Admin</p>
                <p className="text-xs text-slate-500" style={FF_COMFORTAA}>Nội bộ vận hành</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const active = section === item.key
              return (
                <button
                  key={item.key}
                  onClick={() => navigate(item.key)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm ${
                    active ? "bg-green-50 text-green-700" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="flex items-center justify-between gap-4 px-4 py-4 lg:px-6">
              <div>
                <p className="text-lg font-black" style={FF_FREDOKA}>{NAV_ITEMS.find((item) => item.key === section)?.label}</p>
                <p className="text-xs text-slate-500" style={FF_COMFORTAA}>Đăng nhập bởi {session.username}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">admin</Badge>
                <Button
                  variant="outline"
                  onClick={() => {
                    clearAdminSession()
                    setSession(null)
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Đăng xuất
                </Button>
              </div>
            </div>
          </header>

          <div className="p-4 lg:p-6">
            {section === "overview" && <OverviewPanel />}
            {section === "children" && <ChildrenPanel />}
            {section === "quiz" && <QuizPanel />}
            {section === "camera" && <CameraPanel />}
            {section === "games" && <MiniGamePanel />}
            {section === "rewards" && <RewardsPanel />}
          </div>
        </main>
      </div>
    </div>
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
    <div className="flex min-h-screen items-center justify-center bg-[#f6f8fb] p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-[420px] rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xl font-black" style={FF_FREDOKA}>GreenLens Admin</p>
        <p className="mt-1 text-sm text-slate-500" style={FF_COMFORTAA}>Đăng nhập bằng tài khoản Cognito thuộc group admin.</p>
        <div className="mt-5 space-y-3">
          <Input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Username admin" />
          <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" />
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <Button type="submit" className="mt-4 w-full" disabled={busy}>
          {busy ? "Đang đăng nhập..." : "Đăng nhập Admin"}
        </Button>
      </form>
    </div>
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

  if (error) return <PanelError error={error} onRetry={() => void load()} />
  if (!data) return <PanelMessage message="Đang tải dashboard..." />

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[
          ["Tổng child", data.totals.totalChildren],
          ["AI camera scans", data.totals.totalAiCameraScans],
          ["Quiz sessions", data.totals.totalQuizSessions],
          ["Mini-game sessions", data.totals.totalMiniGameSessions],
          ["DAU gần nhất", data.totals.dailyActiveUsers],
          ["Streak đang chạy", data.totals.childrenWithActiveStreak],
        ].map(([label, value]) => (
          <section key={String(label)} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-black" style={FF_FREDOKA}>{value}</p>
          </section>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="font-black" style={FF_FREDOKA}>Xu hướng 7 ngày</p>
            <Button variant="outline" size="sm" onClick={() => void load()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Làm mới
            </Button>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-7">
            {data.daily.map((item: any) => (
              <div key={item.date} className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">{item.date.slice(5)}</p>
                <div className="mt-3 space-y-2 text-xs">
                  <MetricBar label="Signups" value={item.signups} color="bg-green-500" />
                  <MetricBar label="Scans" value={item.scans} color="bg-sky-500" />
                  <MetricBar label="Quiz" value={item.quizCompletions} color="bg-violet-500" />
                  <MetricBar label="Game" value={item.miniGameSessions} color="bg-amber-500" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6 rounded-xl border border-slate-200 bg-white p-4">
          <div>
            <p className="font-black" style={FF_FREDOKA}>Sức khỏe hệ thống</p>
            <div className="mt-3 space-y-2 text-sm">
              <KeyValue label="Quiz pool ready" value={data.quizPool.readyCount} />
              <KeyValue label="Claimed" value={data.quizPool.claimedCount} />
              <KeyValue label="Failed" value={data.quizPool.failedCount} />
              <KeyValue label="Superseded" value={data.quizPool.supersededCount} />
              <KeyValue label="Fallback active" value={data.quizPool.fallbackCount} />
            </div>
          </div>

          <div>
            <p className="font-black" style={FF_FREDOKA}>Streak</p>
            <div className="mt-3 space-y-2 text-sm">
              <KeyValue label="Active today" value={data.streak.activeToday} />
              <KeyValue label=">= 7 days" value={data.streak.streak7OrMore} />
              <KeyValue label=">= 30 days" value={data.streak.streak30OrMore} />
              <KeyValue label="Disabled" value={data.streak.disabledChildren} />
              <KeyValue label="Archived" value={data.streak.archivedChildren} />
            </div>
          </div>

          <div>
            <p className="font-black" style={FF_FREDOKA}>Ghi chú</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {data.notes.map((note: string) => <li key={note}>• {note}</li>)}
            </ul>
          </div>
        </section>
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
    <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo tên hoặc childId" className="max-w-sm" />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Disabled">Disabled</SelectItem>
              <SelectItem value="Archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => void load()}>Lọc</Button>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên</TableHead>
                <TableHead>childId</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>XP</TableHead>
                <TableHead>Streak</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.items ?? []).map((item: any) => (
                <TableRow key={item.childId} className="cursor-pointer" onClick={() => setSelectedChildId(item.childId)}>
                  <TableCell>{item.characterName}</TableCell>
                  <TableCell>{item.childId}</TableCell>
                  <TableCell>{item.level}</TableCell>
                  <TableCell>{item.xp}</TableCell>
                  <TableCell>{item.streak}</TableCell>
                  <TableCell>{item.miniGameHighScore}</TableCell>
                  <TableCell><Badge variant="outline">{item.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        {!detail ? (
          <PanelMessage message="Chọn một child để xem chi tiết." />
        ) : (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-black" style={FF_FREDOKA}>{detail.characterName}</p>
                <p className="text-xs text-slate-500">{detail.childId}</p>
              </div>
              <Badge variant="outline">{detail.status}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <KeyValue label="Level" value={detail.level} />
              <KeyValue label="XP" value={detail.xp} />
              <KeyValue label="Streak" value={detail.streak} />
              <KeyValue label="Best score" value={detail.miniGameHighScore} />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={async () => {
                if (!window.confirm("Khóa child này?")) return
                await adminApi.lockChild(detail.childId)
                await load()
                await refreshDetail()
              }}>Khóa</Button>
              <Button size="sm" variant="outline" onClick={async () => {
                if (!window.confirm("Mở khóa child này?")) return
                await adminApi.unlockChild(detail.childId)
                await load()
                await refreshDetail()
              }}>Mở khóa</Button>
              <Button size="sm" variant="outline" onClick={async () => {
                if (!window.confirm("Lưu trữ child này?")) return
                await adminApi.archiveChild(detail.childId)
                await load()
                await refreshDetail()
              }}>Lưu trữ</Button>
              <Button size="sm" variant="outline" onClick={async () => {
                if (!window.confirm("Reset streak của child này?")) return
                await adminApi.resetChildStreak(detail.childId)
                await refreshDetail()
              }}>Reset streak</Button>
              <Button size="sm" onClick={async () => {
                const next = window.prompt("Nhập XP mới", String(detail.xp))
                if (!next) return
                await adminApi.adjustChildXp(detail.childId, Number(next))
                await load()
                await refreshDetail()
              }}>Chỉnh XP</Button>
            </div>

            <div>
              <p className="text-sm font-semibold">Badges</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(detail.badges ?? []).map((badge: string) => <Badge key={badge}>{badge}</Badge>)}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold">Quiz gần đây</p>
              <div className="mt-2 space-y-2">
                {(detail.recentQuizSessions ?? []).slice(0, 4).map((session: any) => (
                  <div key={session.sessionId} className="rounded-lg bg-slate-50 p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span>{session.wasteType}</span>
                      <Badge variant="outline">{session.status}</Badge>
                    </div>
                    <p className="mt-1 text-slate-500">Correct: {session.correctAnswers} | XP: {session.xpAwarded}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
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
    <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <p className="font-black" style={FF_FREDOKA}>Quiz fallback</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void load()}>Làm mới</Button>
            <Button onClick={() => {
              setSelected({ fallbackKey: "", targetAge: 8, questions: [] })
              setJsonValue("[]")
            }}>Tạo mới</Button>
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-4 space-y-2">
          {fallbacks.map((item) => (
            <button
              key={item.fallbackKey}
              onClick={() => {
                setSelected(item)
                setJsonValue(JSON.stringify(item.questions, null, 2))
              }}
              className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-3 text-left hover:bg-slate-50"
            >
              <div>
                <p className="font-medium">{item.fallbackKey}</p>
                <p className="text-xs text-slate-500">Age {item.targetAge} • {item.questions.length} questions</p>
              </div>
              <Badge variant="outline">{item.status}</Badge>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="font-black" style={FF_FREDOKA}>Fallback editor</p>
            <div className="flex gap-2">
              {selected?.fallbackKey ? (
                <Button variant="outline" onClick={async () => {
                  if (!window.confirm("Archive fallback này?")) return
                  await adminApi.archiveQuizFallback(selected.fallbackKey)
                  await load()
                }}>Archive</Button>
              ) : null}
              <Button onClick={async () => {
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
              }}>Lưu</Button>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <Input value={selected?.fallbackKey ?? ""} onChange={(event) => setSelected((prev: any) => ({ ...(prev ?? {}), fallbackKey: event.target.value }))} placeholder="fallbackKey" />
            <Input value={String(selected?.targetAge ?? 8)} onChange={(event) => setSelected((prev: any) => ({ ...(prev ?? {}), targetAge: Number(event.target.value || 8) }))} placeholder="targetAge" />
            <Textarea value={jsonValue} onChange={(event) => setJsonValue(event.target.value)} className="min-h-[360px] font-mono text-xs" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="font-black" style={FF_FREDOKA}>Quiz pool</p>
            <Button onClick={async () => {
              await adminApi.refillQuizPool()
              await load()
            }}>Trigger refill</Button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <KeyValue label="Ready" value={pool?.health?.readyCount ?? 0} />
            <KeyValue label="Claimed" value={pool?.health?.claimedCount ?? 0} />
            <KeyValue label="Failed" value={pool?.health?.failedCount ?? 0} />
            <KeyValue label="Superseded" value={pool?.health?.supersededCount ?? 0} />
          </div>
          <div className="mt-4 space-y-2">
            {(pool?.items ?? []).slice(0, 8).map((item: any) => (
              <div key={item.quizSetId} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>{item.topic}</span>
                  <Badge variant="outline">{item.status}</Badge>
                </div>
                <p className="text-xs text-slate-500">{item.quizSetId} • {item.questionCount} câu</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

function CameraPanel() {
  const [items, setItems] = useState<any[] | null>(null)

  useEffect(() => {
    void adminApi.getAiCameraClassifications().then(setItems).catch(() => setItems([]))
  }, [])

  if (!items) return <PanelMessage message="Đang tải AI camera history..." />

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="font-black" style={FF_FREDOKA}>AI Camera classifications</p>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">Hiện backend chưa lưu classification history thành bảng riêng, nên trang này đang rỗng.</p>
      ) : null}
    </section>
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
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <p className="font-black" style={FF_FREDOKA}>Mini-game items</p>
          <Button variant="outline" onClick={() => void load()}>Làm mới</Button>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.items ?? []).map((item: any) => (
                <TableRow key={item.itemId}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.difficulty}</TableCell>
                  <TableCell><Badge variant="outline">{item.status}</Badge></TableCell>
                  <TableCell className="space-x-2 text-right">
                    <Button size="sm" variant="outline" onClick={() => setDraft(item)}>Sửa</Button>
                    <Button size="sm" variant="outline" onClick={async () => {
                      if (!window.confirm("Archive item này?")) return
                      await adminApi.archiveMiniGameItem(item.itemId)
                      await load()
                    }}>Archive</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="font-black" style={FF_FREDOKA}>Item editor</p>
          <div className="mt-4 space-y-3">
            {["itemId", "name", "category", "binColor", "iconKey", "difficulty"].map((field) => (
              <Input key={field} value={draft[field] ?? ""} onChange={(event) => setDraft((prev: any) => ({ ...prev, [field]: event.target.value }))} placeholder={field} />
            ))}
            <Select value={draft.isActive ? "true" : "false"} onValueChange={(value) => setDraft((prev: any) => ({ ...prev, isActive: value === "true" }))}>
              <SelectTrigger><SelectValue placeholder="isActive" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Disabled</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={async () => {
              await adminApi.saveMiniGameItem(draft, draft.itemId || undefined)
              await load()
            }}>Lưu item</Button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="font-black" style={FF_FREDOKA}>Leaderboard</p>
          <div className="mt-3 space-y-2">
            {(data?.leaderboard ?? []).map((entry: any) => (
              <div key={entry.childId} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <span>#{entry.rank} {entry.name}</span>
                <span>{entry.miniGameHighScore}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

function RewardsPanel() {
  const [data, setData] = useState<any | null>(null)

  useEffect(() => {
    void adminApi.getOverview().then(setData).catch(() => setData(null))
  }, [])

  if (!data) return <PanelMessage message="Đang tải rewards & streak..." />

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="font-black" style={FF_FREDOKA}>Streak summary</p>
        <div className="mt-4 space-y-2 text-sm">
          <KeyValue label="Active today" value={data.streak.activeToday} />
          <KeyValue label="Streak >= 7" value={data.streak.streak7OrMore} />
          <KeyValue label="Streak >= 30" value={data.streak.streak30OrMore} />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="font-black" style={FF_FREDOKA}>Badge catalog</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {data.badgeCatalog.map((badge: any) => (
            <div key={badge.code} className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold">{badge.name}</p>
                <Badge variant="outline">{badge.enabled ? "Enabled" : "Disabled"}</Badge>
              </div>
              <p className="mt-2 text-sm text-slate-500">{badge.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function MetricBar({ label, value, color }: { label: string; value: number; color: string }) {
  const width = Math.min(Math.max(value * 12, 8), 100)
  return (
    <div>
      <div className="flex items-center justify-between">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-slate-200">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  )
}

function KeyValue({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

function PanelMessage({ message }: { message: string }) {
  return <section className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">{message}</section>
}

function PanelError({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <section className="rounded-xl border border-red-200 bg-white p-6">
      <p className="text-sm text-red-600">{error}</p>
      <Button className="mt-3" variant="outline" onClick={onRetry}>Thử lại</Button>
    </section>
  )
}
