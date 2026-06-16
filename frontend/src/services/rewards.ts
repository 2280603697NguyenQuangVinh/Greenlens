export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  progress?: string;
}

export interface RewardProfile {
  level: number;
  xp: number;
  xpToNextLevel: number;
  streak: number;
  badges: Badge[];
}

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchRewardProfile(): Promise<RewardProfile> {
  await delay();
  return {
    level: 5,
    xp: 2450,
    xpToNextLevel: 3000,
    streak: 5,
    badges: [
      {
        id: "b1",
        title: "Bug Catcher",
        description: "Scan 5 insects",
        icon: "🦋",
        earned: true,
      },
      {
        id: "b2",
        title: "Botanist",
        description: "Scan 10 plants",
        icon: "🌱",
        earned: true,
      },
      {
        id: "b3",
        title: "Recycler",
        description: "Sort 20 items",
        icon: "♻️",
        earned: false,
        progress: "15/20",
      },
      {
        id: "b4",
        title: "Earth Saver",
        description: "Reach Level 10",
        icon: "🌎",
        earned: false,
        progress: "Lvl 5/10",
      },
    ],
  };
}

export async function claimDailyStreakBonus(): Promise<{ xp: number }> {
  await delay(200);
  return { xp: 50 };
}
