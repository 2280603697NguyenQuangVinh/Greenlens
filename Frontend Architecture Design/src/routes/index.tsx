import { createBrowserRouter, Navigate } from "react-router";
import ProtectedRoute from "@/shared/ProtectedRoute";
import Layout from "@/shared/Layout";
import Splash from "@/features/splash/Splash";
import Login from "@/features/auth/Login";
import Register from "@/features/auth/Register";
import Dashboard from "@/features/dashboard/Dashboard";
import DailyActivity from "@/features/daily/DailyActivity";
import CameraModule from "@/features/camera/CameraModule";
import QuizModule from "@/features/quiz/QuizModule";
import RewardsModule from "@/features/rewards/RewardsModule";
import MiniGameModule from "@/features/mini-games/MiniGameModule";
import { Profile } from "@/app/features/profile/Profile";

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/splash" replace /> },
  { path: "/splash", Component: Splash },
  { path: "/login", Component: Login },
  { path: "/register", Component: Register },
  {
    path: "/app",
    Component: ProtectedRoute,
    children: [
      {
        Component: Layout,
        children: [
          { index: true, Component: Dashboard },
          { path: "daily", Component: DailyActivity },
          { path: "camera", Component: CameraModule },
          { path: "quiz", Component: QuizModule },
          { path: "rewards", Component: RewardsModule },
          { path: "game", Component: MiniGameModule },
          { path: "profile", Component: Profile },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/login" replace /> },
]);
