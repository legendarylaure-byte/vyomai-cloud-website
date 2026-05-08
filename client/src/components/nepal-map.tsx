import { useScrollAnimation } from "@/hooks/use-scroll-animation";

export function NepalMap() {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <div
      ref={ref}
      className={`scroll-fade-in ${isVisible ? "visible" : ""}`}
    >
      <div className="glass-card rounded-2xl p-8 overflow-hidden">
        <h3 className="text-2xl font-bold mb-6 font-[Space_Grotesk] gradient-text">
          Our Location
        </h3>
        
        {/* Embedded Nepal Map using OpenStreetMap/Leaflet style */}
        <div className="relative w-full h-96 rounded-xl overflow-hidden border border-border/50">
          <iframe
            width="100%"
            height="100%"
            frameBorder="0"
            src="https://www.openstreetmap.org/export/embed.html?bbox=85.2645,27.6945,85.3645,27.7445&layer=mapnik&marker=27.719,85.314"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Nepal Map - VyomAi Location"
          />
        </div>
        
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-muted/50">
            <h4 className="font-medium mb-2">Location</h4>
            <p className="text-sm text-muted-foreground">Tokha, Kathmandu, Nepal</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <h4 className="font-medium mb-2">Email</h4>
            <a href="mailto:info@vyomai.cloud" className="text-sm text-primary hover:underline">
              info@vyomai.cloud
            </a>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <h4 className="font-medium mb-2">Region</h4>
            <p className="text-sm text-muted-foreground">Bagmati, Nepal</p>
          </div>
        </div>
      </div>
    </div>
  );
}
