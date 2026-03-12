"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import LoginModal from "@/components/LoginModal";

interface AuthModalContextType {
  openLogin: () => void;
  closeLogin: () => void;
}

const AuthModalContext = createContext<AuthModalContextType>({
  openLogin: () => {},
  closeLogin: () => {},
});

export function useAuthModal() {
  return useContext(AuthModalContext);
}

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <AuthModalContext.Provider value={{ openLogin: () => setLoginOpen(true), closeLogin: () => setLoginOpen(false) }}>
      {children}
      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
    </AuthModalContext.Provider>
  );
}
