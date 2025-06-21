import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { UserSearchInput } from "@/components/util/user-search-input"
import { TripsApiClient } from "@/lib/api/trips"
import { authenticationProviderInstance } from "@/lib/authentication-provider"
import type { TripParticipant } from "@/lib/api/trips"
import type { User } from "@/lib/api/users"

import * as React from "react"

import { motion } from "framer-motion"
import { UserPlus, Clock } from "lucide-react"

interface ParticipantsListProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  participants: TripParticipant[]
  tripId?: number
  onParticipantsUpdate?: () => void
}

export function ParticipantsList({
  open,
  onOpenChange,
  participants,
  tripId,
  onParticipantsUpdate,
}: ParticipantsListProps) {
  const [addCompanionOpen, setAddCompanionOpen] = React.useState(false)
  const [isInviting, setIsInviting] = React.useState(false)
  const { toast } = useToast()

  const handleInviteUser = async (user: User) => {
    if (!tripId) return

    setIsInviting(true)
    try {
      const tripsApiClient = new TripsApiClient(authenticationProviderInstance)
      await tripsApiClient.inviteToTrip(tripId, user.id)

      // Refresh participants data
      onParticipantsUpdate?.()

      toast({
        title: "Invitation Sent",
        description: `Invitation sent to ${getDisplayName(user)} successfully.`,
      })

      setAddCompanionOpen(false)
    } catch (error) {
      toast({
        title: "Failed to Send Invitation",
        description: "Could not send the invitation. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsInviting(false)
    }
  }

  const handleAddCompanionClick = () => {
    setAddCompanionOpen(true)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Trip Companions ({participants.length})</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-96 overflow-y-auto">
            {participants.map((participant) => (
              <ParticipantItem key={participant.id} participant={participant} />
            ))}
          </div>
          <DialogFooter className="flex justify-between items-center">
            {tripId && (
              <Button variant="outline" className="gap-2" onClick={handleAddCompanionClick}>
                <UserPlus className="h-4 w-4" />
                <span>Add Companion</span>
              </Button>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addCompanionOpen} onOpenChange={setAddCompanionOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Invite Companion</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <UserSearchInput
              placeholder="Search users to invite..."
              onUserSelect={handleInviteUser}
              excludeUserIds={participants.map((p) => p.id)}
              disabled={isInviting}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddCompanionOpen(false)} disabled={isInviting}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function ParticipantItem({ participant }: { participant: TripParticipant }) {
  const displayName = getDisplayName(participant)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-center space-x-3 rounded-lg p-2 hover:bg-muted"
    >
      <div className="relative">
        <Avatar className="h-10 w-10 rounded-lg">
          <AvatarImage
            src={participant.avatar_url || "/placeholder.svg?height=40&width=40"}
            alt={displayName}
            className="rounded-lg"
          />
          <AvatarFallback className="rounded-lg bg-primary text-white">{getInitials(displayName)}</AvatarFallback>
        </Avatar>
        {participant.invitation_status === "pending" && (
          <div className="absolute -top-1 -right-1 h-4 w-4 bg-yellow-500 rounded-full flex items-center justify-center">
            <Clock className="h-2.5 w-2.5 text-white" />
          </div>
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{displayName}</p>
          {participant.invitation_status === "pending" && (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">Pending</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{participant.email}</p>
      </div>
    </motion.div>
  )
}

function getDisplayName(participant: TripParticipant | User): string {
  if (participant.first_name && participant.last_name) {
    return `${participant.first_name} ${participant.last_name}`
  }
  if (participant.first_name) {
    return participant.first_name
  }
  return participant.username
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0] || "")
    .join("")
    .toUpperCase()
    .slice(0, 2)
}
