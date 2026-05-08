import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { type PricingPackage } from "@shared/schema";

export default function PricingPage() {
  const { data: packages = [], isLoading } = useQuery<PricingPackage[]>({
    queryKey: ["/api/pricing"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/50 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4" data-testid="heading-pricing">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="text-pricing-description">
            Choose the perfect plan for your business needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {packages.map((pkg) => (
            <Card
              key={pkg.id}
              className={`flex flex-col p-8 relative ${
                pkg.highlighted ? "border-primary shadow-lg scale-105" : ""
              }`}
              data-testid={`card-pricing-${pkg.id}`}
            >
              {pkg.highlighted && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <h3 className="text-2xl font-bold mb-2" data-testid={`text-package-name-${pkg.id}`}>
                {pkg.name}
              </h3>
              <p className="text-muted-foreground mb-6" data-testid={`text-package-description-${pkg.id}`}>
                {pkg.description}
              </p>

              <div className="mb-6">
                <span className="text-4xl font-bold" data-testid={`text-package-price-${pkg.id}`}>
                  ${pkg.price}
                </span>
                <span className="text-muted-foreground">/month</span>
              </div>

              <Button
                className="w-full mb-8"
                variant={pkg.highlighted ? "default" : "outline"}
                data-testid={`button-select-pricing-${pkg.id}`}
              >
                Get Started
              </Button>

              <div className="space-y-4 flex-1">
                {pkg.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3" data-testid={`item-feature-${pkg.id}-${idx}`}>
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-sm" data-testid={`text-feature-${pkg.id}-${idx}`}>
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-16 bg-card rounded-lg p-12 text-center border">
          <h2 className="text-3xl font-bold mb-4" data-testid="heading-faq">
            Need a Custom Plan?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto" data-testid="text-custom-plan">
            Contact our sales team to discuss custom solutions tailored to your specific requirements.
          </p>
          <Button size="lg" data-testid="button-contact-sales">
            Contact Sales
          </Button>
        </div>
      </div>
    </div>
  );
}
