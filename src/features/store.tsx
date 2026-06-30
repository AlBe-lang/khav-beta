// features/store — 앱 세션 + 간단 라우팅 (의존성 최소: React Context).
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { User } from "../domain/types";
import { api } from "../adapters/mockApi";

export type View =
  | { name: "login" }
  | { name: "home" }
  | { name: "farm" }
  | { name: "case" }
  | { name: "case-detail"; id: string }
  | { name: "admin" };

interface Store {
  user: User | null;
  setUser: (u: User | null) => void;
  view: View;
  navigate: (v: View) => void;
  api: typeof api;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<View>({ name: "login" });

  const value = useMemo<Store>(
    () => ({
      user,
      setUser,
      view,
      navigate: setView,
      api,
    }),
    [user, view],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error("StoreProvider 밖에서 useStore 사용");
  return s;
}
