import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useSidebar } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { useTripContext } from "@/components/util/trip-context"
import type { TripParticipant } from "@/lib/api/trips"

import * as React from "react"

import { motion } from "framer-motion"
import { UserPlus, Users } from "lucide-react"

export function TripCompanions() {
  const [open, setOpen] = React.useState(false)
  const { state } = useSidebar()
  const { selectedTrip, isLoading } = useTripContext()
  const isCollapsed = state === "collapsed"

  const participants: TripParticipant[] = React.useMemo(() => {
    if (!selectedTrip?.participants) return []
    return selectedTrip.participants
  }, [selectedTrip])

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className={cn("flex items-center justify-between px-1", isCollapsed && "flex-col items-center gap-2")}>
          <div className="flex animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className={cn("h-8 w-8 rounded-lg bg-muted", isCollapsed ? "mb-2" : i > 1 && "-ml-2")} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!selectedTrip || participants.length === 0) {
    return (
      <div className="space-y-3">
        <div className={cn("flex items-center justify-center px-1 py-2", isCollapsed && "flex-col")}>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            {!isCollapsed && <span className="text-sm">No participants</span>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className={cn("flex items-center justify-between px-1", isCollapsed && "flex-col items-center gap-2")}>
        <AvatarStack participants={participants} onClick={() => setOpen(true)} isCollapsed={isCollapsed} />
        {!isCollapsed && (
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-primary/10 hover:text-primary">
            <UserPlus className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
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
            <Button variant="outline" className="gap-2">
              <UserPlus className="h-4 w-4" />
              <span>Add Companion</span>
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AvatarStack({
  participants,
  onClick,
  isCollapsed,
}: {
  participants: TripParticipant[]
  onClick: () => void
  isCollapsed: boolean
}) {
  const maxVisible = isCollapsed ? 3 : 4
  const visibleParticipants = participants.slice(0, maxVisible)
  const remainingCount = participants.length - visibleParticipants.length

  return (
    <div
      className={cn("flex cursor-pointer", isCollapsed ? "flex-col space-y-2" : "-space-x-2 overflow-hidden")}
      onClick={onClick}
    >
      {visibleParticipants.map((participant, index) => (
        <motion.div
          key={participant.id}
          initial={{ opacity: 0, [isCollapsed ? "y" : "x"]: -5 }}
          animate={{ opacity: 1, [isCollapsed ? "y" : "x"]: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          whileHover={{ [isCollapsed ? "x" : "y"]: -2 }}
          className="relative"
        >
          <Avatar
            className={cn(
              "h-8 w-8 border-2 border-background transition-transform rounded-lg",
              isCollapsed ? "mx-auto" : index === 0 && "hover:z-10",
            )}
          >
            <AvatarImage
              src={participant.avatar_url || "/placeholder.svg?height=32&width=32"}
              alt={getDisplayName(participant)}
              className="rounded-lg"
            />
            <AvatarFallback className="rounded-lg bg-primary text-white">
              {getInitials(getDisplayName(participant))}
            </AvatarFallback>
          </Avatar>
        </motion.div>
      ))}

      {remainingCount > 0 && (
        <motion.div
          initial={{ opacity: 0, [isCollapsed ? "y" : "x"]: -5 }}
          animate={{ opacity: 1, [isCollapsed ? "y" : "x"]: 0 }}
          transition={{ duration: 0.3, delay: visibleParticipants.length * 0.1 }}
          className={cn(
            "relative flex h-8 w-8 items-center justify-center border-2 border-background bg-muted text-xs font-medium",
            "rounded-lg",
            isCollapsed && "mx-auto",
          )}
        >
          +{remainingCount}
        </motion.div>
      )}
    </div>
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
      <Avatar className="h-10 w-10 rounded-lg">
        <AvatarImage
          src={participant.avatar_url || "/placeholder.svg?height=40&width=40"}
          alt={displayName}
          className="rounded-lg"
        />
        <AvatarFallback className="rounded-lg bg-primary text-white">{getInitials(displayName)}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <p className="text-sm font-medium">{displayName}</p>
        <p className="text-xs text-muted-foreground">{participant.email}</p>
      </div>
    </motion.div>
  )
}

function getDisplayName(participant: TripParticipant): string {
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
