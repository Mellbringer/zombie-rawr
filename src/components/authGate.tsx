"use client"

import { useAuth } from "@/contexts/AuthContext"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import LoadingScreen from "./LoadingScreen"

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const publicRoutes = ["/login"]
  const isPublic = publicRoutes.includes(pathname) || /^\/join\/[A-Z0-9]{6}$/.test(pathname);
  ;

  // Check if this is an OAuth callback (e.g., Google login redirect)
  const isOAuthCallback =
    typeof window !== "undefined" && window.location.hash.includes("access_token")

  useEffect(() => {
    if (!loading && !isPublic && !user && !isOAuthCallback) {
      router.replace("/login")
    }
  }, [loading, user, pathname, router, isPublic, isOAuthCallback])

  // Public routes: render langsung
  if (isPublic) {
    return <>{children}</>;
  }

  if (loading || !user && !isOAuthCallback) return <LoadingScreen children={undefined} />

  return <>{children}</>
}