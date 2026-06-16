import { createBrowserRouter, Navigate } from "react-router";
import ProtectedRoute from "@/layout/ProtectedRoute";
import Layout from "@/layout/Layout";
import Splash from "@/features/splash/pages/Splash";
import Login from "@/features/auth/pages/Login";
import Register from "@/features/auth/pages/Register";
import Dashboard from "@/features/dashboard/pages/Dashboard";
import DailyActivity from "@/features/daily/pages/DailyActivity";
import CameraRoute from "@/features/camera/pages/CameraRoute";
import QuizModule from "@/features/quiz/pages/QuizModule";
import RewardsModule from "@/features/rewards/pages/RewardsModule";
import MiniGameModule from "@/features/mini-games/pages/MiniGameModule";
import { Profile } from "@/features/legacy/profile/pages/Profile";

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
          { path: "camera", Component: CameraRoute },
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
