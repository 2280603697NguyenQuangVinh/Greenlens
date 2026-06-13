import { useState } from "react"
import { Lock, ShieldCheck, X } from "lucide-react"
import { FF_FREDOKA, FF_COMFORTAA } from "@/utils/constants"
import { AuthField } from "@/features/auth/components/AuthField"

type Props = {
  onClose: () => void
  onSubmit: (password: string) => boolean
}

export function AdminLoginScreen({ onClose, onSubmit }: Props) {
  const [password, setPassword] = useState("")
  const [localError, setLocalError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) {
      setLocalError("Vui lòng nhập mật khẩu admin")
      return
    }
    const ok = onSubmit(password.trim())
    if (!ok) {
      setLocalError("Mật khẩu admin chưa đúng")
      return
    }
    setLocalError(null)
    onClose()
  }

  return (
    <div className="absolute inset-0 z-[60] bg-black/45 flex items-center justify-center p-5">
      <div className="w-full max-w-[340px] rounded-3xl bg-white shadow-2xl overflow-hidden">
        <div className="px-4 pt-4 pb-3 bg-green-50 border-b border-green-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-green-700">
            <ShieldCheck size={18} />
            <p className="text-sm font-black" style={FF_FREDOKA}>Admin Login</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-full bg-white border border-slate-200 flex items-center justify-center">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <AuthField
            label="Mật khẩu admin"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="Nhập mật khẩu"
            error={localError}
          />

          <button
            type="submit"
            className="w-full rounded-2xl py-3 text-white font-black flex items-center justify-center gap-2 active:scale-95"
            style={{ ...FF_FREDOKA, background: "linear-gradient(90deg,#16A34A,#22C55E)" }}
          >
            <Lock size={16} />
            Đăng nhập Admin
          </button>
          <p className="text-center text-xs text-slate-500" style={FF_COMFORTAA}>
            Chỉ cần mật khẩu, không cần tài khoản đăng ký
          </p>
        </form>
      </div>
    </div>
  )
}

