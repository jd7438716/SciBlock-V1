/**
 * UserContext — 当前登录用户的全局状态
 *
 * Layer: context (singleton, wraps the entire authenticated app)
 *
 * 职责:
 *   - 登录后将用户信息存入 localStorage，刷新后自动恢复
 *   - 提供 setCurrentUser / clearCurrentUser 给登录/登出流程调用
 *   - clearCurrentUser 同时清除 JWT token（通过 clearSession()）
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { User } from "../types/auth";
import { clearSession } from "../api/client";

const STORAGE_KEY = "sciblock:currentUser";

function readStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function writeStoredUser(user: User | null): void {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface UserContextValue {
  currentUser: User | null;
  setCurrentUser: (user: User) => void;
  clearCurrentUser: () => void;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<User | null>(
    () => readStoredUser(),
  );

  const setCurrentUser = useCallback((user: User) => {
    writeStoredUser(user);
    setCurrentUserState(user);
  }, []);

  const clearCurrentUser = useCallback(() => {
    // clearSession removes both sciblock:token and sciblock:currentUser.
    clearSession();
    setCurrentUserState(null);
  }, []);

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser, clearCurrentUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useCurrentUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useCurrentUser must be used inside UserProvider");
  return ctx;
}
