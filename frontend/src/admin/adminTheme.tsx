import type { ReactNode } from "react"
import { BACKGROUND_IMAGE, MASCOT_IMAGE } from "@/assets"
import { FF_NUNITO } from "@/utils/constants"

export const ADMIN_COLORS = {
  ink: "#1b4332",
  inkMuted: "#2d6a4f",
  mint: "#b9f0af",
  mintBorder: "#a8e6b8",
  cardBorder: "#6bc97a",
  cardBg: "#e8f8ef",
  actionGreen: "#2dd62d",
  highlight: "#f4a261",
} as const

/** Nunito hỗ trợ dấu tiếng Việt — không dùng Fredoka cho copy có dấu. */
export const adminFontTitle = { ...FF_NUNITO, fontWeight: 800, color: ADMIN_COLORS.ink }
export const adminFontBody = { ...FF_NUNITO, fontWeight: 400, color: ADMIN_COLORS.ink }

export const ADMIN_TYPE_CLASS =
  "font-['Nunito',sans-serif] antialiased [font-synthesis:none]"

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div
      className={`min-h-screen text-[#1b4332] ${ADMIN_TYPE_CLASS}`}
      style={{
        ...adminFontBody,
        backgroundImage: `url("${BACKGROUND_IMAGE}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {children}
    </div>
  )
}

export function AdminBrandMark({ subtitle }: { subtitle?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#1b3a1b] bg-[#a8dcae] shadow-sm">
        <img src={MASCOT_IMAGE} alt="" className="h-10 w-10 object-contain" />
      </div>
      <div className="min-w-0">
        <p className="text-base font-extrabold leading-tight" style={adminFontTitle}>
          GreenLens Admin
        </p>
        {subtitle ? (
          <p className="text-xs font-normal text-[#2d6a4f]/80">{subtitle}</p>
        ) : null}
      </div>
    </div>
  )
}

export function AdminCard({
  title,
  action,
  children,
  className = "",
}: {
  title?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`overflow-hidden rounded-2xl border-2 border-[#6bc97a] bg-[#e8f8ef] shadow-[0_2px_12px_rgba(82,183,136,0.18)] ${className}`}
    >
      {title ? (
        <div className="flex items-center justify-between gap-2 border-b border-[#b9e4c4]/80 px-3 py-2">
          <p className="flex-1 text-center text-[15px] font-extrabold" style={adminFontTitle}>
            {title}
          </p>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      <div className="bg-white/45 p-4">{children}</div>
    </section>
  )
}

export function AdminStatCard({ label, value }: { label: string; value: ReactNode }) {
  return (
    <section className="rounded-2xl border-2 border-[#6bc97a] bg-[#e8f8ef]/90 p-4 shadow-[0_2px_12px_rgba(82,183,136,0.12)]">
      <p className="text-sm font-normal text-[#2d6a4f]">{label}</p>
      <p className="mt-2 text-3xl font-extrabold tabular-nums" style={adminFontTitle}>
        {value}
      </p>
    </section>
  )
}

export function AdminPrimaryButton({
  className = "",
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center rounded-2xl bg-[#2dd62d] px-4 py-2 text-sm font-bold text-white shadow-md transition active:scale-[0.99] hover:bg-[#28c428] disabled:opacity-50 ${className}`}
      style={adminFontTitle}
      {...props}
    />
  )
}

export function AdminOutlineButton({
  className = "",
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center rounded-2xl border-2 border-[#a8e6b8] bg-white px-4 py-2 text-sm font-bold text-[#1b4332] transition hover:bg-[#f0fdf9] disabled:opacity-50 ${className}`}
      style={adminFontBody}
      {...props}
    />
  )
}

export function AdminInsetRow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl bg-[#f8fdf9] px-3 py-2 text-sm ${className}`}>{children}</div>
  )
}

export function AdminKeyValue({ label, value }: { label: string; value: ReactNode }) {
  return (
    <AdminInsetRow className="flex items-center justify-between gap-3">
      <span className="text-[#2d6a4f]">{label}</span>
      <span className="font-bold tabular-nums">{value}</span>
    </AdminInsetRow>
  )
}

export function AdminPanelMessage({ message }: { message: string }) {
  return (
    <AdminCard>
      <p className="text-center text-sm text-[#2d6a4f]">{message}</p>
    </AdminCard>
  )
}

export function AdminPanelError({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <AdminCard title="Không tải được dữ liệu">
      <p className="text-center text-sm text-red-600">{error}</p>
      <div className="mt-4 flex justify-center">
        <AdminOutlineButton onClick={onRetry}>Thử lại</AdminOutlineButton>
      </div>
    </AdminCard>
  )
}
