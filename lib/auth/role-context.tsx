"use client";

import { createContext, useContext } from "react";
import type { Rol } from "./roles";

const RolContext = createContext<Rol>("visor");

export function RolProvider({ rol, children }: { rol: Rol; children: React.ReactNode }) {
  return <RolContext.Provider value={rol}>{children}</RolContext.Provider>;
}

export function useRol(): Rol {
  return useContext(RolContext);
}

export function useEsAdmin(): boolean {
  return useContext(RolContext) === "admin";
}
