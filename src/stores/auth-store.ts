import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { User } from "@/types";
import { DEMO_CREDENTIALS } from "@/types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  signup: (name: string, email: string) => void;
  completeOnboarding: (brokerage: string, markets: string[]) => void;
  updateTerms: (terms: { agentSplit?: number; transactionFee?: number }) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    immer((set) => ({
      user: null,
      isAuthenticated: false,

      login: (email, password) => {
        if (
          email.toLowerCase() === DEMO_CREDENTIALS.email &&
          password === DEMO_CREDENTIALS.password
        ) {
          set((state) => {
            state.user = {
              id: "demo-user",
              name: "Demo Agent",
              email: DEMO_CREDENTIALS.email,
              brokerage: "Summit Realty Group",
              markets: ["Austin", "Round Rock", "Cedar Park"],
              onboarded: true,
              agentSplit: 80,
              transactionFee: 395,
            };
            state.isAuthenticated = true;
          });
          return true;
        }
        return false;
      },

      signup: (name, email) => {
        set((state) => {
          state.user = {
            id: `user-${Date.now()}`,
            name,
            email,
            onboarded: false,
          };
          state.isAuthenticated = true;
        });
      },

      completeOnboarding: (brokerage, markets) => {
        set((state) => {
          if (state.user) {
            state.user.brokerage = brokerage;
            state.user.markets = markets;
            state.user.onboarded = true;
          }
        });
      },

      updateTerms: (terms) => {
        set((state) => {
          if (state.user) Object.assign(state.user, terms);
        });
      },

      logout: () => {
        set((state) => {
          state.user = null;
          state.isAuthenticated = false;
        });
      },
    })),
    {
      name: "itera-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
