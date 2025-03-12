import { useEffect, useState } from "react"
import { authenticationProviderInstance } from "@/lib/authentication-provider.ts"
import { UsersApiClient } from "@/lib/api/users.ts"

interface User {
  name: string
  email: string
  avatar: string
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const fetchUserData = async () => {
      if (!authenticationProviderInstance.isAuthenticated()) return

      try {
        const usersApiClient = new UsersApiClient()
        const response = await usersApiClient.getCurrentUser()
        setUser({
          name: response.name || "User",
          email: response.email,
          avatar: response.avatar || "/default-avatar.png",
        })
      } catch (error) {
        console.error("Błąd pobierania danych użytkownika:", error)
      }
    }

    fetchUserData()
  }, [])

  const logout = () => {
    authenticationProviderInstance.logout()
    setUser(null)
    window.location.href = "/login"
  }

  return { user, logout }
}
