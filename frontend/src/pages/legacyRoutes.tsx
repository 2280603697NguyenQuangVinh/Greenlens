import { createBrowserRouter } from "react-router";
import Layout from "@/layout/AppLayout";
import Dashboard from "@/features/legacy/components/Dashboard";
import CameraModule from "@/features/legacy/components/CameraModule";
import QuizModule from "@/features/legacy/components/QuizModule";
import RewardsModule from "@/features/legacy/components/RewardsModule";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "camera", Component: CameraModule },
      { path: "quiz", Component: QuizModule },
      { path: "rewards", Component: RewardsModule },
    ],
  },
]);
