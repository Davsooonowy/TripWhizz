import { motion } from "framer-motion"
import { LoadingSpinner } from "./loading-spinner"

export function AppLoader() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center"
      >
        <div className="w-24 h-24 mb-6">
          <img src="/logo.svg" alt="TripWhizz Logo" className="w-full h-auto" />
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.3 }}>
          <LoadingSpinner size="md" className="text-primary" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="mt-4 text-lg font-medium text-primary"
        >
          Loading your adventure...
        </motion.p>
      </motion.div>
    </div>
  )
}
