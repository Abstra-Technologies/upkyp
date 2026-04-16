// zustand/authStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
    user_id: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    profilePicture: string | null;
    phoneNumber: string | null;
    occupation: string | null;
    citizenship: string | null;
    address: string | null;
    birthDate: string | null;
    points: number;
    status: string;
    userType: string | null;
    emailVerified: boolean | null;
    landlord_id: string | null;
    tenant_id: string | null;
    is_verified?: boolean | null;
    is_trial_used?: boolean | null;
    subscription?: any;
}

interface Admin {
    admin_id: string | null;
    username: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    role: string | null;
    status: string;
    profile_picture: string | null;
    permissions: any;
}

interface AuthState {
    user: User | null;
    admin: Admin | null;

    // 🔥 enterprise flags
    loading: boolean;        // fetching from backend
    isHydrated: boolean;     // persist finished
    hasFetched: boolean;     // prevents duplicate session calls

    setUser: (userData: User | null) => void;
    setAdmin: (adminData: Admin | null) => void;
    updateUser: (updates: Partial<User>) => void;
    logout: () => void;

    fetchSession: () => Promise<void>;
    signOut: () => Promise<void>;
    signOutAdmin: () => Promise<void>;
}

const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            admin: null,

            loading: false,
            isHydrated: false,
            hasFetched: false,

            /* ========================= */
            setUser: (userData) =>
                set({
                    user: userData,
                    admin: null,
                }),

            setAdmin: (adminData) =>
                set({
                    admin: adminData,
                    user: null,
                }),

            updateUser: (updates) =>
                set((state) => ({
                    user: state.user ? { ...state.user, ...updates } : null,
                })),

            logout: () =>
                set({
                    user: null,
                    admin: null,
                }),

            /* =========================
               ENTERPRISE fetchSession
            ========================= */
            fetchSession: async () => {
                const { hasFetched, loading } = get();

                if (hasFetched || loading) return; // 🔥 prevent duplicate calls

                try {
                    set({ loading: true });

                    const response = await fetch("/api/auth/me", {
                        method: "GET",
                        credentials: "include",
                    });

                    if (!response.ok) {
                        set({
                            user: null,
                            admin: null,
                            loading: false,
                            hasFetched: true,
                        });
                        return;
                    }

                    const data = await response.json();

                    if (data.admin_id) {
                        set({
                            admin: data,
                            user: null,
                        });
                    } else if (data.user_id) {
                        set({
                            user: data,
                            admin: null,
                        });
                    } else {
                        set({
                            user: null,
                            admin: null,
                        });
                    }

                    set({
                        loading: false,
                        hasFetched: true,
                    });
                } catch (error) {
                    console.error("[AuthStore] fetchSession error:", error);
                    set({
                        user: null,
                        admin: null,
                        loading: false,
                        hasFetched: true,
                    });
                }
            },

            /* =========================
               USER LOGOUT
            ========================= */
            signOut: async () => {
                try {
                    await fetch("/api/auth/logout", {
                        method: "POST",
                        credentials: "include",
                    });
                } catch {}

                set({
                    user: null,
                    admin: null,
                    hasFetched: false,
                });

                useAuthStore.persist.clearStorage();
                window.location.replace("/auth/login");
            },

            /* =========================
               ADMIN LOGOUT
            ========================= */
            signOutAdmin: async () => {
                try {
                    await fetch("/api/auth/logout", {
                        method: "POST",
                        credentials: "include",
                    });
                } catch {}

                set({
                    admin: null,
                    user: null,
                    hasFetched: false,
                });

                useAuthStore.persist.clearStorage();
                window.location.replace("/admin_login");
            },
        }),
        {
            name: "auth-storage",

            partialize: (state) => ({
                user: state.user
                    ? {
                        user_id: state.user.user_id,
                        landlord_id: state.user.landlord_id,
                        tenant_id: state.user.tenant_id,
                        userType: state.user.userType,
                        emailVerified: state.user.emailVerified,
                        points: state.user.points,
                        is_verified: state.user.is_verified,
                        is_trial_used: state.user.is_trial_used,
                    }
                    : null,
                admin: state.admin
                    ? { admin_id: state.admin.admin_id }
                    : null,
            }),

            onRehydrateStorage: () => (state) => {
                if (state) {
                    state.isHydrated = true; // 🔥 prevents navbar flicker
                }
            },
        }
    )
);

export default useAuthStore;