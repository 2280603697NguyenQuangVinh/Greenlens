import { useState } from "react"
import { FF_FREDOKA, FF_COMFORTAA } from "../constants"
import { AuthField } from "../components/AuthField"
import { AuthShell } from "../components/AuthShell"

type Props = {
  busy: boolean
  error: string | null
  onLogin: (identifier: string) => Promise<boolean>
  onGoRegister: () => void
}

export function LoginScreen({ busy, error, onLogin, onGoRegister }: Props) {
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [localError, setLocalError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!identifier.trim()) {
      setLocalError("Vui lòng nhập email hoặc tên đăng nhập")
      return
    }
    if (!password.trim()) {
      setLocalError("Vui lòng nhập mật khẩu")
      return
    }
    setLocalError(null)
    await onLogin(identifier.trim())
  }

  return (
    <AuthShell title="Chào các bạn" subtitle="Đăng nhập để tiếp tục">
      <form className="space-y-4" onSubmit={submit}>
        <AuthField
          label="Email / Username"
          type="text"
          value={identifier}
          onChange={setIdentifier}
          placeholder="abc@gmail.com"
          error={localError?.includes("email") || localError?.includes("đăng nhập") ? localError : null}
        />
        <AuthField
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
          error={localError?.includes("mật khẩu") ? localError : null}
        />

        {error ? <p className="text-center text-xs font-semibold text-red-500">{error}</p> : null}

        <button
          type="submit"
          disabled={busy}
          className="mt-2 w-full rounded-2xl py-3.5 text-lg font-bold text-white transition-transform active:scale-95 disabled:opacity-60"
          style={{ ...FF_FREDOKA, fontWeight: 700, background: "linear-gradient(90deg,#4ADE80,#2DD4BF)" }}
        >
          {busy ? "Đang đăng nhập..." : "Đăng Nhập"}
        </button>

        <div className="flex items-center justify-between pt-2 text-sm font-semibold">
          <button type="button" onClick={onGoRegister} className="text-slate-700 hover:text-green-600" style={FF_COMFORTAA}>
            Tạo tài khoản
          </button>
          <span className="text-slate-400" style={FF_COMFORTAA}>
            Quên mật khẩu?
          </span>
        </div>
      </form>
    </AuthShell>
  )
}
