import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Session, User } from '@/lib/types'

type SessionState = {
  token: string | null
  user: User | null
  setSession: (session: Session) => void
  setUser: (user: User) => void
  clear: () => void
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setSession: ({ token, user }) => set({ token, user }),
      setUser: (user) => set({ user }),
      clear: () => set({ token: null, user: null }),
    }),
    { name: 'cupcake-session', skipHydration: true },
  ),
)
