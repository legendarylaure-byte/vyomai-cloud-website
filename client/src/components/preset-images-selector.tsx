import { Button } from "@/components/ui/button";

const PRESET_IMAGES = [
  { id: "male-engineer", label: "Male Engineer", src: "/generated_images/professional_male_engineer_portrait.png" },
  { id: "female-ai", label: "Female AI Specialist", src: "/generated_images/professional_female_ai_specialist.png" },
  { id: "male-tech", label: "Male Tech Lead", src: "/generated_images/professional_male_tech_team_member.png" },
  { id: "female-business", label: "Female Business Leader", src: "/generated_images/professional_female_business_tech_lead.png" },
];

interface PresetImagesSelectorProps {
  selectedImageId?: string;
  onImageSelect: (imageId: string, imageSrc: string) => void;
}

export function PresetImagesSelector({ selectedImageId, onImageSelect }: PresetImagesSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium block">Select Preset Team Avatar</label>
      <div className="grid grid-cols-2 gap-3">
        {PRESET_IMAGES.map((preset) => (
          <Button
            key={preset.id}
            type="button"
            onClick={() => onImageSelect(preset.id, preset.src)}
            variant={selectedImageId === preset.id ? "default" : "outline"}
            className="h-auto p-2 flex flex-col items-center gap-2 transition-all"
            data-testid={`button-preset-image-${preset.id}`}
          >
            <img 
              src={preset.src} 
              alt={preset.label}
              className="w-16 h-16 rounded-lg object-cover border-2 border-current"
            />
            <span className="text-xs text-center leading-tight">{preset.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
