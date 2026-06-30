// features/store — 세션(me)·라우팅·api
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { MeResponse } from "../domain/types";
import { api, currentSession } from "../adapters/mockApi";

export type View =
  | { name: "login" } | { name: "home" } | { name: "farm" } | { name: "case" }
  | { name: "case-detail"; id: number } | { name: "admin" };

interface Store {
  me: MeResponse | null;
  refreshMe: () => Promise<void>;
  logout: () => void;
  view: View;
  navigate: (v: View) => void;
  api: typeof api;
}
const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [view, setView] = useState<View>({ name: "login" });

  const refreshMe = useCallback(async () => {
    if (!currentSession()) { setMe(null); return; }
    try { setMe(await api.me()); } catch { setMe(null); }
  }, []);
  useEffect(() => { void refreshMe(); }, [refreshMe]);

  const logout = useCallback(() => { api.logout(); setMe(null); setView({ name: "login" }); }, []);

  const value = useMemo<Store>(() => ({ me, refreshMe, logout, view, navigate: setView, api }), [me, view, refreshMe, logout]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useStore(): Store { const s = useContext(Ctx); if (!s) throw new Error("StoreProvider 밖"); return s; }
export function errMsg(e: unknown): string {
  if (e && typeof e === "object" && "message" in e) return String((e as { message: unknown }).message);
  return "오류가 발생했습니다";
}
