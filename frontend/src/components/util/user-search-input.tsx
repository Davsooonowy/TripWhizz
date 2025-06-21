import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { cn } from "@/lib/utils"
import { FriendsApiClient } from "@/lib/api/friends"
import { authenticationProviderInstance } from "@/lib/authentication-provider"
import type { User } from "@/lib/api/users"

import * as React from "react"
import { Search, UserPlus } from "lucide-react"

interface UserSearchInputProps {
  placeholder?: string
  onUserSelect: (user: User) => void
  excludeUserIds?: number[]
  className?: string
  showFriends?: boolean
  disabled?: boolean
}

export function UserSearchInput({
  placeholder = "Search users...",
  onUserSelect,
  excludeUserIds = [],
  className,
  showFriends = true,
  disabled = false,
}: UserSearchInputProps) {
  const [query, setQuery] = React.useState("")
  const [searchResults, setSearchResults] = React.useState<User[]>([])
  const [friends, setFriends] = React.useState<User[]>([])
  const [isSearching, setIsSearching] = React.useState(false)
  const [isLoadingFriends, setIsLoadingFriends] = React.useState(false)
  const [showDropdown, setShowDropdown] = React.useState(false)
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null)

  const searchTimeoutRef = React.useRef<NodeJS.Timeout>()
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (showFriends) {
      loadFriends()
    }
  }, [showFriends])

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  React.useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (query.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        handleSearch(query)
      }, 300)
    } else {
      setSearchResults([])
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [query])

  const loadFriends = async () => {
    setIsLoadingFriends(true)
    try {
      const friendsApiClient = new FriendsApiClient(authenticationProviderInstance)
      const friendsData = await friendsApiClient.getFriends()

      const availableFriends = friendsData.filter((friend) => !excludeUserIds.includes(friend.id))
      setFriends(availableFriends)
    } catch (error) {
      console.error("Failed to load friends:", error)
    } finally {
      setIsLoadingFriends(false)
    }
  }

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const friendsApiClient = new FriendsApiClient(authenticationProviderInstance)
      const results = await friendsApiClient.searchUsers(searchQuery)

      const availableUsers = results.filter((user) => !excludeUserIds.includes(user.id))
      setSearchResults(availableUsers)
    } catch (error) {
      console.error("Search failed:", error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    setShowDropdown(true)
    setSelectedUser(null)
  }

  const handleUserClick = (user: User) => {
    setSelectedUser(user)
    setQuery(`${getDisplayName(user)} (${user.email})`)
    setShowDropdown(false)
  }

  const handleInviteClick = () => {
    if (selectedUser) {
      onUserSelect(selectedUser)
      setQuery("")
      setSelectedUser(null)
      setSearchResults([])
    }
  }

  const getDisplayName = (user: User): string => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`
    }
    if (user.first_name) {
      return user.first_name
    }
    return user.username
  }

  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((part) => part[0] || "")
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const displayUsers = query.trim() ? searchResults : friends
  const isLoading = query.trim() ? isSearching : isLoadingFriends

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={placeholder}
            className="pl-10"
            value={query}
            onChange={handleInputChange}
            onFocus={() => setShowDropdown(true)}
            disabled={disabled}
          />
        </div>
        {selectedUser && (
          <Button onClick={handleInviteClick} disabled={disabled} size="sm" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Invite
          </Button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border rounded-md shadow-lg max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-4">
              <LoadingSpinner size="sm" />
            </div>
          ) : displayUsers.length > 0 ? (
            <div className="py-2">
              {!query.trim() && showFriends && (
                <div className="px-3 py-1 text-xs font-medium text-muted-foreground border-b">Your Friends</div>
              )}
              {query.trim() && (
                <div className="px-3 py-1 text-xs font-medium text-muted-foreground border-b">Search Results</div>
              )}
              {displayUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-muted cursor-pointer"
                  onClick={() => handleUserClick(user)}
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage
                      src={user.avatar_url || "/placeholder.svg?height=32&width=32"}
                      alt={getDisplayName(user)}
                      className="rounded-lg"
                    />
                    <AvatarFallback className="rounded-lg bg-primary text-white text-xs">
                      {getInitials(getDisplayName(user))}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{getDisplayName(user)}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : query.trim() ? (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">No users found</div>
          ) : (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
              {showFriends ? "No friends available" : "Start typing to search"}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
