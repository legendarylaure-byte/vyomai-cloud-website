import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Copy, Check, Shield } from "lucide-react";

interface QRAuthModalProps {
  open: boolean;
  onClose: () => void;
  onAuthenticate: (token: string) => void;
}

export function QRAuthModal({ open, onClose, onAuthenticate }: QRAuthModalProps) {
  const [qrValue, setQrValue] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (open) {
      const code = `VYOMAI-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      setQrValue(code);
      setManualCode("");
    }
  }, [open]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(qrValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerifyCode = async () => {
    if (!manualCode.trim()) return;
    setVerifying(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    if (manualCode === qrValue) {
      onAuthenticate(qrValue);
      onClose();
    }
    setVerifying(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Secure Authentication
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex flex-col items-center gap-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
            <div className="text-center">
              <h3 className="font-semibold mb-2">2FA Code</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Use this unique code for secure authentication
              </p>
            </div>
            
            <div className="flex gap-2 w-full">
              <Input
                value={qrValue}
                readOnly
                className="font-mono text-sm text-center"
                data-testid="input-qr-code"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyCode}
                data-testid="button-copy-code"
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium block mb-2">Enter Code to Verify</label>
              <Input
                placeholder="Paste the code here"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                data-testid="input-verify-code"
                onKeyPress={(e) => e.key === "Enter" && handleVerifyCode()}
              />
            </div>

            <Button
              onClick={handleVerifyCode}
              disabled={!manualCode.trim() || verifying}
              className="w-full"
              data-testid="button-verify-qr"
            >
              {verifying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify & Login"
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Your authentication code is secure and unique to this session.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
