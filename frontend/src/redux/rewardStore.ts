import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  createElement,
  type ReactNode,
} from "react";
import type { Badge } from "@/services/rewards";

export interface RewardState {
  level: number;
  xp: number;
  xpToNextLevel: number;
  streak: number;
  badges: Badge[];
}

interface RewardContextValue extends RewardState {
  setProfile: (profile: RewardState) => void;
  addXp: (amount: number) => void;
  incrementStreak: () => void;
}

const defaultState: RewardState = {
  level: 5,
  xp: 120,
  xpToNextLevel: 3000,
  streak: 5,
  badges: [],
};

const RewardContext = createContext<RewardContextValue | undefined>(undefined);

export function RewardProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<RewardState>(defaultState);

  const setProfile = useCallback((profile: RewardState) => {
    setState(profile);
  }, []);

  const addXp = useCallback((amount: number) => {
    setState((prev) => {
      let xp = prev.xp + amount;
      let level = prev.level;
      let xpToNextLevel = prev.xpToNextLevel;
      while (xp >= xpToNextLevel) {
        xp -= xpToNextLevel;
        level += 1;
        xpToNextLevel = Math.round(xpToNextLevel * 1.2);
      }
      return { ...prev, xp, level, xpToNextLevel };
    });
  }, []);

  const incrementStreak = useCallback(() => {
    setState((prev) => ({ ...prev, streak: prev.streak + 1 }));
  }, []);

  const value = useMemo(
    () => ({ ...state, setProfile, addXp, incrementStreak }),
    [state, setProfile, addXp, incrementStreak],
  );

  return createElement(RewardContext.Provider, { value }, children);
}

export function useReward() {
  const ctx = useContext(RewardContext);
  if (!ctx) throw new Error("useReward must be used within RewardProvider");
  return ctx;
}
