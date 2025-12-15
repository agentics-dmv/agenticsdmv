import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const ADMIN_SESSION_KEY = "admin_session";
const SESSION_DURATION = 4 * 60 * 60 * 1000; // 4 hours

interface AdminSession {
  expiresAt: number;
}

export function useAdminAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const session = localStorage.getItem(ADMIN_SESSION_KEY);
    if (session) {
      try {
        const parsed: AdminSession = JSON.parse(session);
        if (parsed.expiresAt > Date.now()) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem(ADMIN_SESSION_KEY);
          setIsAuthenticated(false);
        }
      } catch {
        localStorage.removeItem(ADMIN_SESSION_KEY);
        setIsAuthenticated(false);
      }
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  const login = useCallback(async (password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("verify-admin", {
        body: { password },
      });

      if (fnError) {
        throw new Error("Failed to verify password");
      }

      if (data?.valid) {
        const session: AdminSession = {
          expiresAt: Date.now() + SESSION_DURATION,
        };
        localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
        setIsAuthenticated(true);
        return true;
      } else {
        setError("Invalid password");
        return false;
      }
    } catch (err) {
      setError("Failed to authenticate");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    setIsAuthenticated(false);
  }, []);

  return { isAuthenticated, isLoading, error, login, logout };
}
