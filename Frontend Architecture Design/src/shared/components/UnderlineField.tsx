import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface UnderlineFieldProps {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  showToggle?: boolean;
}

export function UnderlineField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
  showToggle,
}: UnderlineFieldProps) {
  const [visible, setVisible] = useState(false);
  const inputType = showToggle ? (visible ? "text" : "password") : type;

  return (
    <label className="block mb-6">
      <span className="text-sm text-slate-500 font-medium">{label}</span>
      <div className="relative mt-1 border-b-2 border-slate-200 focus-within:border-[#2dd4bf] transition-colors">
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="w-full py-2.5 pr-10 bg-transparent text-slate-800 font-semibold outline-none placeholder:text-slate-400"
        />
        {showToggle && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-slate-400"
            aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            {visible ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>
    </label>
  );
}
