import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface ComingSoonModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export function ComingSoonModal({
  open,
  onClose,
  title = "Coming Soon!",
  message = "We are coming soon to share Knowledge and grow together. Stay tuned for exciting updates!",
}: ComingSoonModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md border-0 bg-gradient-to-br from-primary/10 via-accent/10 to-primary/10">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative space-y-6 py-8"
        >

          <div className="flex justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-16 h-16 text-primary" />
            </motion.div>
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold gradient-text font-[Space_Grotesk]">
              {title}
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {message}
            </p>
          </div>

          <Button onClick={onClose} className="w-full" data-testid="button-got-it">
            Got It!
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            🇳🇵 Made with love in Nepal
          </p>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
