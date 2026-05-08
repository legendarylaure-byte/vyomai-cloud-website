import { Users, Zap, Brain, Sparkles, Code, Briefcase, Palette, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

const PRESET_AVATARS = [
  { id: "user-blue", icon: Users, label: "User", color: "bg-blue-500" },
  { id: "zap-yellow", icon: Zap, label: "Zap", color: "bg-yellow-500" },
  { id: "brain-purple", icon: Brain, label: "Brain", color: "bg-purple-500" },
  { id: "sparkles-pink", icon: Sparkles, label: "Sparkles", color: "bg-pink-500" },
  { id: "code-green", icon: Code, label: "Code", color: "bg-green-500" },
  { id: "briefcase-orange", icon: Briefcase, label: "Briefcase", color: "bg-orange-500" },
  { id: "palette-indigo", icon: Palette, label: "Palette", color: "bg-indigo-500" },
  { id: "compass-cyan", icon: Compass, label: "Compass", color: "bg-cyan-500" },
];

interface AvatarSelectorProps {
  selectedAvatarId?: string;
  onAvatarSelect: (avatarId: string, iconHtml: string) => void;
}

export function AvatarSelector({ selectedAvatarId, onAvatarSelect }: AvatarSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium block">Select Avatar Icon</label>
      <div className="grid grid-cols-4 gap-2">
        {PRESET_AVATARS.map((avatar) => {
          const Icon = avatar.icon;
          const isSelected = selectedAvatarId === avatar.id;
          return (
            <Button
              key={avatar.id}
              type="button"
              onClick={() => {
                const iconHtml = `<div class="${avatar.color} w-12 h-12 rounded-lg flex items-center justify-center"><${Icon.name} className="w-6 h-6 text-white" /></div>`;
                onAvatarSelect(avatar.id, iconHtml);
              }}
              className={`h-auto p-3 flex flex-col items-center gap-2 transition-all ${
                isSelected 
                  ? `${avatar.color} text-white ring-2 ring-offset-2 ring-primary` 
                  : `${avatar.color} bg-opacity-20 text-foreground hover:bg-opacity-30`
              }`}
              data-testid={`button-avatar-${avatar.id}`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs text-center">{avatar.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
