import { authorizedJsonRequest } from "@/services/backendHttp"
import type { QuizQuestion } from "@/services/greenLens"

type BackendQuizQuestion = {
  question: string
  options: string[]
  correct: string
  explanation: string
}

type GenerateQuizResponse = {
  sessionId: string
  childId: string
  gameType: string
  wasteType: string
  targetAge: number
  questions: BackendQuizQuestion[]
  usedFallback: boolean
}

type CompleteQuizResponse = {
  sessionId: string
  gameType: string
  score: number
  correctAnswers: number
  totalQuestions: number
  xpAwarded: number
  status: string
}

export type QuizSessionResult = {
  sessionId: string
  questions: QuizQuestion[]
}

const MOCK_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "Chai nhựa nên bỏ vào thùng nào?",
    emoji: "🍶",
    options: ["Thùng tái chế", "Thùng hữu cơ", "Thùng rác nguy hại"],
    correctIndex: 0,
    tip: "Nhựa PET có thể tái chế thành sản phẩm mới.",
  },
  {
    id: 2,
    question: "Vỏ chuối thuộc loại rác nào?",
    emoji: "🍌",
    options: ["Hữu cơ", "Nguy hại", "Kim loại"],
    correctIndex: 0,
    tip: "Vỏ chuối phân hủy được và có thể ủ làm phân.",
  },
  {
    id: 3,
    question: "Pin cũ nên xử lý thế nào?",
    emoji: "🔋",
    options: ["Đưa người lớn mang đi thu gom", "Bỏ thùng thường", "Ném ra sân"],
    correctIndex: 0,
    tip: "Pin có chất nguy hại nên cần người lớn xử lý đúng chỗ.",
  },
]

function emojiForWasteType(wasteType: string): string {
  const lower = wasteType.toLowerCase()
  if (lower.includes("organic") || lower.includes("hữu")) return "🍃"
  if (lower.includes("hazard") || lower.includes("nguy")) return "⚠️"
  if (lower.includes("recycl") || lower.includes("paper") || lower.includes("plastic")) return "♻️"
  return "🌍"
}

function mapBackendQuestion(
  question: BackendQuizQuestion,
  index: number,
  wasteType: string,
): QuizQuestion {
  const correctIndex = question.options.findIndex(
    (option) => option.trim().toLowerCase() === question.correct.trim().toLowerCase(),
  )

  return {
    id: index + 1,
    question: question.question,
    emoji: emojiForWasteType(wasteType),
    options: [...question.options],
    correctIndex: correctIndex >= 0 ? correctIndex : 0,
    tip: question.explanation,
  }
}

export async function generateQuiz(
  childId: string,
): Promise<QuizSessionResult> {
  if (import.meta.env.VITE_USE_MOCK === "true") {
    return {
      sessionId: `mock_quiz_${Date.now()}`,
      questions: MOCK_QUESTIONS,
    }
  }

  const response = await authorizedJsonRequest<GenerateQuizResponse>("/quiz/generate", {
    method: "POST",
    body: JSON.stringify({
      childId,
    }),
  })

  return {
    sessionId: response.sessionId,
    questions: response.questions.map((q, i) =>
      mapBackendQuestion(q, i, response.wasteType || "trash"),
    ),
  }
}

export async function completeQuizSession(
  sessionId: string,
  correctAnswers: number,
): Promise<CompleteQuizResponse> {
  if (import.meta.env.VITE_USE_MOCK === "true") {
    const xpAwarded = correctAnswers * 10 + Math.max(0, 3 - correctAnswers) * 5
    return {
      sessionId,
      gameType: "quiz",
      score: correctAnswers * 10,
      correctAnswers,
      totalQuestions: 3,
      xpAwarded,
      status: "Completed",
    }
  }

  return authorizedJsonRequest<CompleteQuizResponse>("/quiz/complete", {
    method: "POST",
    body: JSON.stringify({
      sessionId,
      correctAnswers,
    }),
  })
}
