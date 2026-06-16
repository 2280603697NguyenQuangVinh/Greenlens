import { useNavigate } from "react-router"
import CameraModule from "@/features/camera/pages/CameraModule"

export default function CameraRoute() {
  const navigate = useNavigate()

  return (
    <CameraModule
      onBack={() => navigate("/app")}
      onGoQuiz={() => navigate("/app/quiz")}
    />
  )
}
