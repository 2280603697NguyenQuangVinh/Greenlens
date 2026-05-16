import { createBrowserRouter } from "react-router";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import CameraModule from "./components/CameraModule";
import QuizModule from "./components/QuizModule";
import RewardsModule from "./components/RewardsModule";

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
