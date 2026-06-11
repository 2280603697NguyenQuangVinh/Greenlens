import { useState } from "react"
import { FF_FREDOKA, FF_COMFORTAA } from "../constants"
import type { AvatarConfig } from "../types"
import { AuthField } from "../components/AuthField"
import { AuthShell } from "../components/AuthShell"

type Props = {
  busy: boolean
  error: string | null
  onRegister: (identifier: string, avatar: AvatarConfig) => Promise<boolean>
  onGoLogin: () => void
}

export function RegisterScreen({ busy, error, onRegister, onGoLogin }: Props) {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [localError, setLocalError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) return setLocalError("Vui lòng nhập tên đăng nhập")
    if (!email.trim()) return setLocalError("Vui lòng nhập email")
    if (!password.trim()) return setLocalError("Vui lòng nhập mật khẩu")
    if (!confirmPassword.trim()) return setLocalError("Vui lòng xác nhận mật khẩu")
    if (password !== confirmPassword) return setLocalError("Mật khẩu xác nhận chưa khớp")

    setLocalError(null)
    const defaultAvatar: AvatarConfig = { characterName: "", gender: 0, skin: 0, hair: 1, eyes: 0, outfit: 1 }
    await onRegister(email.trim() || username.trim(), defaultAvatar)
  }

  return (
    <AuthShell title="Chào các bạn" subtitle="Đăng ký để tiếp tục">
      <form className="space-y-4" onSubmit={submit}>
        <AuthField
          label="Tên Đăng Nhập"
          value={username}
          onChange={setUsername}
          placeholder="Phúc"
          error={localError?.includes("tên đăng nhập") ? localError : null}
        />
        <AuthField
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="abc@gmail.com"
          error={localError?.includes("email") ? localError : null}
        />
        <AuthField
          label="Mật Khẩu"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
          error={localError?.includes("Mật khẩu") && !localError.includes("xác nhận") ? localError : null}
        />
        <AuthField
          label="Xác nhận mật khẩu"
          type="password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="••••••••"
          error={localError?.includes("xác nhận") ? localError : null}
        />

        {error ? <p className="text-center text-xs font-semibold text-red-500">{error}</p> : null}

        <button
          type="submit"
          disabled={busy}
          className="mt-2 w-full rounded-2xl py-3.5 text-lg font-bold text-white transition-transform active:scale-95 disabled:opacity-60"
          style={{ ...FF_FREDOKA, fontWeight: 700, background: "linear-gradient(90deg,#4ADE80,#2DD4BF)" }}
        >
          {busy ? "Đang đăng ký..." : "Đăng Ký"}
        </button>

        <div className="pt-2 text-center">
          <button type="button" onClick={onGoLogin} className="text-sm font-semibold text-slate-700 hover:text-green-600" style={FF_COMFORTAA}>
            Đã có tài khoản?
          </button>
        </div>
      </form>
    </AuthShell>
  )
}
