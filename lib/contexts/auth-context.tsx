"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import type { Session, User } from "@supabase/supabase-js"
import { getSupabaseBrowserClient } from "@/lib/clients/supabase-browser"

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

interface AuthResult {
  error: string | null
}

interface AuthContextValue {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  signInWithEmail: (email: string, password: string) => Promise<AuthResult>
  signUpWithEmail: (
    name: string,
    email: string,
    password: string
  ) => Promise<AuthResult>
  signInWithGoogle: () => Promise<AuthResult>
  signOut: () => Promise<AuthResult>
  updateProfileName: (fullName: string) => Promise<AuthResult>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), [])
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(
    async (userId: string) => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, created_at, updated_at")
        .eq("id", userId)
        .single()

      if (error) {
        if (error.code === "PGRST116") {
          setProfile(null)
          return
        }

        throw error
      }

      setProfile(data)
    },
    [supabase]
  )

  useEffect(() => {
    let mounted = true

    const bootstrap = async () => {
      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession()

        if (!mounted) {
          return
        }

        setSession(currentSession)
        setUser(currentSession?.user ?? null)

        if (currentSession?.user) {
          await loadProfile(currentSession.user.id)
        }
      } catch {
        if (mounted) {
          setSession(null)
          setUser(null)
          setProfile(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    bootstrap()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event: string, nextSession: Session | null) => {
      if (!mounted) {
        return
      }

      setSession(nextSession)
      setUser(nextSession?.user ?? null)

      if (nextSession?.user) {
        try {
          await loadProfile(nextSession.user.id)
        } catch {
          setProfile(null)
        }
      } else {
        setProfile(null)
      }

      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [loadProfile, supabase])

  const signInWithEmail = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      return {
        error: error?.message ?? null,
      }
    },
    [supabase]
  )

  const signUpWithEmail = useCallback(
    async (name: string, email: string, password: string): Promise<AuthResult> => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      })

      if (error) {
        return { error: error.message }
      }

      if (data.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({
            id: data.user.id,
            full_name: name,
          })

        if (profileError) {
          return { error: profileError.message }
        }
      }

      return { error: null }
    },
    [supabase]
  )

  const signInWithGoogle = useCallback(async (): Promise<AuthResult> => {
    const redirectTo = `${window.location.origin}/auth/callback`

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    })

    return {
      error: error?.message ?? null,
    }
  }, [supabase])

  const signOut = useCallback(async (): Promise<AuthResult> => {
    const { error } = await supabase.auth.signOut()

    if (!error) {
      setSession(null)
      setUser(null)
      setProfile(null)
    }

    return {
      error: error?.message ?? null,
    }
  }, [supabase])

  const updateProfileName = useCallback(
    async (fullName: string): Promise<AuthResult> => {
      if (!user) {
        return {
          error: "Usuario nao autenticado.",
        }
      }

      const cleanName = fullName.trim()

      if (!cleanName) {
        return {
          error: "Informe um nome valido.",
        }
      }

      const { data, error } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            full_name: cleanName,
          },
          { onConflict: "id" }
        )
        .select("id, full_name, avatar_url, created_at, updated_at")
        .single()

      if (error) {
        return { error: error.message }
      }

      setProfile(data)

      const { error: metadataError } = await supabase.auth.updateUser({
        data: { full_name: cleanName },
      })

      if (metadataError) {
        return { error: metadataError.message }
      }

      return { error: null }
    },
    [supabase, user]
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      profile,
      loading,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      signOut,
      updateProfileName,
    }),
    [
      loading,
      profile,
      session,
      signInWithEmail,
      signInWithGoogle,
      signOut,
      signUpWithEmail,
      updateProfileName,
      user,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuthContext must be used inside AuthProvider")
  }

  return context
}

