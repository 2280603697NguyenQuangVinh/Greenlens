type AuthFieldProps = {
  label: string
  type?: "text" | "password" | "email"
  value: string
  onChange: (value: string) => void
  placeholder: string
  error?: string | null
}

export function AuthField({ label, type = "text", value, onChange, placeholder, error }: AuthFieldProps) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`mt-1 w-full rounded-2xl border-2 px-4 py-3 text-sm font-medium outline-none transition-colors ${
          error
            ? "border-red-300 bg-red-50 text-red-700 placeholder:text-red-300 focus:border-red-400"
            : "border-slate-200 bg-white text-slate-700 focus:border-green-400"
        }`}
      />
      {error ? <p className="mt-1 text-xs font-semibold text-red-500">{error}</p> : null}
    </label>
  )
}
