import { ensureBearerToken, mapAuthErrorMessage } from "@/services/authToken"
import { ApiError, NetworkError } from "@/services/errors"
import { apiUrl } from "@/services/http"

async function readApiErrorMessage(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => ({}))
  const record = body as { message?: string; detail?: string; title?: string }
  return (
    record.message?.trim() ||
    record.detail?.trim() ||
    record.title?.trim() ||
    res.statusText ||
    fallback
  )
}

export async function authorizedJsonRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = await ensureBearerToken()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  }
  headers.Authorization = `Bearer ${token}`

  let res: Response
  try {
    res = await fetch(apiUrl(path), { ...init, headers })
  } catch {
    throw new NetworkError("Không có kết nối mạng. Hãy thử lại sau nhé!")
  }

  if (!res.ok) {
    const raw = await readApiErrorMessage(res, "Đã có lỗi xảy ra.")
    throw new ApiError(mapAuthErrorMessage(raw, res.status))
  }

  return res.json() as Promise<T>
}
