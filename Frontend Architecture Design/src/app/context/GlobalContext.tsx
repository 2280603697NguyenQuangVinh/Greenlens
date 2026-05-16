import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UserState {
  isAuthenticated: boolean;
  xp: number;
  streak: number;
  badges: string[];
  name: string;
}

interface GlobalState {
  user: UserState;
  login: (name: string) => void;
  logout: () => void;
  addXp: (amount: number) => void;
  addBadge: (badge: string) => void;
}

const initialState: UserState = {
  isAuthenticated: false,
  xp: 120,
  streak: 5,
  badges: ['First Login', 'Nature Explorer'],
  name: '',
};

const GlobalContext = createContext<GlobalState | undefined>(undefined);

export const GlobalProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserState>(initialState);

  const login = (name: string) => {
    setUser((prev) => ({ ...prev, isAuthenticated: true, name }));
  };

  const logout = () => {
    setUser(initialState);
  };

  const addXp = (amount: number) => {
    setUser((prev) => ({ ...prev, xp: prev.xp + amount }));
  };

  const addBadge = (badge: string) => {
    if (!user.badges.includes(badge)) {
      setUser((prev) => ({ ...prev, badges: [...prev.badges, badge] }));
    }
  };

  return (
    <GlobalContext.Provider value={{ user, login, logout, addXp, addBadge }}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalState = () => {
  const context = useContext(GlobalContext);
  if (context === undefined) {
    throw new Error('useGlobalState must be used within a GlobalProvider');
  }
  return context;
};
