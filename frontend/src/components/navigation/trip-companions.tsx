import * as React from "react"
import { UserPlus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/components/ui/sidebar"

interface Companion {
  name: string
  avatar: string
  color: string
}

interface TripCompanionsProps {
  companions: Companion[]
}

export function TripCompanions({ companions }: TripCompanionsProps) {
  const [open, setOpen] = React.useState(false)
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <div className="space-y-3">
      <div className={cn("flex items-center justify-between px-1", isCollapsed && "flex-col items-center gap-2")}>
        <AvatarStack companions={companions} onClick={() => setOpen(true)} isCollapsed={isCollapsed} />
        {!isCollapsed && (
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-primary/10 hover:text-primary">
            <UserPlus className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Trip Companions</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {companions.map((companion, index) => (
              <CompanionItem key={index} companion={companion} />
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
  companions,
  onClick,
  isCollapsed,
}: {
  companions: Companion[]
  onClick: () => void
  isCollapsed: boolean
}) {
  const maxVisible = isCollapsed ? 3 : 4
  const visibleCompanions = companions.slice(0, maxVisible)
  const remainingCount = companions.length - visibleCompanions.length

  return (
    <div
      className={cn("flex cursor-pointer", isCollapsed ? "flex-col space-y-2" : "-space-x-2 overflow-hidden")}
      onClick={onClick}
    >
      {visibleCompanions.map((companion, index) => (
        <motion.div
          key={companion.name}
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
            <AvatarImage src={companion.avatar} alt={companion.name} className="rounded-lg" />
            <AvatarFallback className={cn(companion.color, "rounded-lg")}>{getInitials(companion.name)}</AvatarFallback>
          </Avatar>
        </motion.div>
      ))}

      {remainingCount > 0 && (
        <motion.div
          initial={{ opacity: 0, [isCollapsed ? "y" : "x"]: -5 }}
          animate={{ opacity: 1, [isCollapsed ? "y" : "x"]: 0 }}
          transition={{ duration: 0.3, delay: visibleCompanions.length * 0.1 }}
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

function CompanionItem({ companion }: { companion: Companion }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-center space-x-3 rounded-lg p-2 hover:bg-muted"
    >
      <Avatar className="h-10 w-10 rounded-lg">
        <AvatarImage src={companion.avatar} alt={companion.name} className="rounded-lg" />
        <AvatarFallback className={cn(companion.color, "rounded-lg")}>{getInitials(companion.name)}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <p className="text-sm font-medium">{companion.name}</p>
      </div>
    </motion.div>
  )
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0] || "")
    .join("")
    .toUpperCase()
}
