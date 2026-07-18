import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Copy, Check, Shield, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QRAuthModalProps {
  open: boolean;
  onClose: () => void;
  onAuthenticate: (token: string) => void;
}

export function QRAuthModal({ open, onClose, onAuthenticate }: QRAuthModalProps) {
  const { toast } = useToast();
  const [qrData, setQrData] = useState<{ secret: string; qrCode: string; message?: string } | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadQrCode();
    }
  }, [open]);

  const loadQrCode = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("vyomai-admin-token");
      const res = await fetch("/api/admin/setup-2fa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setQrData(data);
      } else {
        toast({ title: "Error", description: data.error || "Failed to load QR code", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to connect to server", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCopySecret = () => {
    if (!qrData?.secret) return;
    navigator.clipboard.writeText(qrData.secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerifyCode = async () => {
    if (!manualCode.trim() || manualCode.length !== 6 || !qrData) return;
    setVerifying(true);
    try {
      const token = localStorage.getItem("vyomai-admin-token");
      const res = await fetch("/api/admin/enable-2fa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ secret: qrData.secret, token: manualCode }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({ title: "Success", description: "Authenticator app configured successfully!" });
        onAuthenticate(qrData.secret);
        onClose();
      } else {
        toast({ title: "Verification Failed", description: data.error || "Invalid code. Try again.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Verification failed", variant: "destructive" });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Setup Authenticator App
          </DialogTitle>
          <DialogDescription>
            Scan this QR code with Google Authenticator, Microsoft Authenticator, or any TOTP app.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : qrData ? (
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-4 p-4 rounded-lg bg-primary/5 border border-primary/10">
              <div className="bg-background p-3 rounded-lg border border-border/50">
                <img src={qrData.qrCode} alt="QR Code" className="w-[200px] h-[200px]" />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Scan this QR code with your authenticator app
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Or enter this key manually:</p>
              <div className="flex gap-2">
                <Input
                  value={qrData.secret}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button variant="outline" size="sm" onClick={handleCopySecret}>
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium block mb-2">
                  Enter 6-digit code from app to verify
                </label>
                <Input
                  placeholder="000000"
                  maxLength={6}
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="text-center text-2xl tracking-widest font-mono"
                  onKeyDown={(e) => e.key === "Enter" && handleVerifyCode()}
                />
              </div>

              <Button
                onClick={handleVerifyCode}
                disabled={manualCode.length !== 6 || verifying}
                className="w-full"
              >
                {verifying ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</>
                ) : (
                  <><Smartphone className="w-4 h-4 mr-2" /> Verify & Enable</>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            Failed to load QR code. Please try again.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
