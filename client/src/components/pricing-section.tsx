import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Check, Zap, Globe, Sparkles, Send } from "lucide-react";
import { SectionHeader } from "@/components/text-reveal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type PricingPackage } from "@shared/schema";

const featureEmojis: Record<string, string> = {
  "API": "🔌", "API access": "🔌", "API calls": "🔌",
  "support": "🎯", "Support": "🎯", "priority": "⚡",
  "user": "👤", "users": "👥", "team": "👥", "Team": "👥",
  "storage": "💾", "Storage": "💾", "data": "📊", "Data": "📊",
  "ai": "🤖", "AI": "🤖", "model": "🧠", "Model": "🧠",
  "integration": "🔗", "Integration": "🔗", "integrations": "🔗",
  "custom": "✨", "Custom": "✨",
  "advanced": "🚀", "Advanced": "🚀",
  "unlimited": "∞", "Unlimited": "∞",
  "training": "📚", "Training": "📚",
  "analytics": "📈", "Analytics": "📈",
  "dashboard": "📊", "Dashboard": "📊",
  "report": "📄", "Report": "📄",
  "security": "🔒", "Security": "🔒",
  "monitor": "👁️", "Monitoring": "👁️",
  "uptime": "✅", "Uptime": "✅",
  "sla": "📋", "SLA": "📋",
}

const getFeatureEmoji = (feature: string): string => {
  for (const [key, emoji] of Object.entries(featureEmojis)) {
    if (feature.toLowerCase().includes(key.toLowerCase())) {
      return emoji;
    }
  }
  return "⭐";
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: [0.32, 0.72, 0, 1] },
  },
  };

interface ExchangeRatesData {
  rates: { USD: number; EUR: number; INR: number; NPR: number };
  lastUpdated: string;
}

export function PricingSection() {
  const { toast } = useToast();
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [selectedCurrency, setSelectedCurrency] = useState<"USD" | "EUR" | "INR" | "NPR">("NPR");
  const [subscriptionType, setSubscriptionType] = useState<"monthly" | "yearly">("monthly");
  const [isOneTimeDialogOpen, setIsOneTimeDialogOpen] = useState(false);
  const [selectedOneTimePackage, setSelectedOneTimePackage] = useState<PricingPackage | null>(null);
  const [oneTimeFormData, setOneTimeFormData] = useState({
    name: "",
    email: "",
    mobileNumber: "",
    request: "",
    estimatedPrice: "",
  });

  const { data: packages = [], isLoading: packagesLoading } = useQuery<PricingPackage[]>({
    queryKey: ["/api/pricing"],
  });

  const { data: exchangeData, isLoading: ratesLoading } = useQuery<ExchangeRatesData>({
    queryKey: ["/api/exchange-rates"],
  });

  const { data: settings } = useQuery<any>({
    queryKey: ["/api/settings"],
  });

  // Use default currency from settings, or fall back to NPR
  const defaultCurrency = (settings?.defaultCurrency as "USD" | "EUR" | "INR" | "NPR") || "NPR";
  
  // Initialize selected currency from settings
  useEffect(() => {
    if (defaultCurrency) {
      setSelectedCurrency(defaultCurrency);
    }
  }, [defaultCurrency]);

  const getPriceBySubscriptionType = (pkg: PricingPackage): number => {
    // Prioritize monthlyPrice for monthly, yearlyPrice for yearly
    // All prices in backend are stored in NPR
    if (subscriptionType === "monthly") {
      if (pkg.monthlyPrice !== undefined && pkg.monthlyPrice !== 0) return pkg.monthlyPrice;
      if (pkg.monthlyPrice === 0) return 0; // Explicitly 0 is valid
    }
    if (subscriptionType === "yearly") {
      if (pkg.yearlyPrice !== undefined && pkg.yearlyPrice !== 0) return pkg.yearlyPrice;
      if (pkg.yearlyPrice === 0) return 0; // Explicitly 0 is valid
    }
    // Fallback to price field for backwards compatibility
    return pkg.price || 0;
  };

  const hasOneTimePricing = (pkg: PricingPackage): boolean => {
    return !!pkg.oneTimeContactEmail && pkg.enabled !== false;
  };

  const getConvertedPrice = (basePrice: number, baseCurrency: string = "NPR"): number => {
    if (!exchangeData?.rates) return basePrice;
    if (selectedCurrency === baseCurrency) return basePrice;
    
    // Convert from base currency to target currency via USD
    // Rates provided are relative to USD (USD=1)
    const baseRate = exchangeData.rates[baseCurrency as keyof typeof exchangeData.rates] || 1;
    const targetRate = exchangeData.rates[selectedCurrency as keyof typeof exchangeData.rates] || 1;
    
    // Convert base currency to USD, then USD to target currency
    const baseToUsd = basePrice / baseRate;
    const convertedPrice = baseToUsd * targetRate;
    return Math.round(convertedPrice * 100) / 100;
  };

  const getNPRPrice = (basePrice: number, baseCurrency: string = "NPR"): number => {
    if (!exchangeData?.rates) return basePrice * (exchangeData?.rates?.NPR || 142.5995);
    if (baseCurrency === "NPR") return Math.round(basePrice * 100) / 100;
    
    // Convert from base currency to NPR
    const baseRate = exchangeData.rates[baseCurrency as keyof typeof exchangeData.rates] || 1;
    const nprRate = exchangeData.rates.NPR || 142.5995;
    const baseToUsd = basePrice / baseRate;
    const nprPrice = baseToUsd * nprRate;
    return Math.round(nprPrice * 100) / 100;
  };

  const getCurrencySymbol = (currency: string): string => {
    const symbols: Record<string, string> = { USD: "$", EUR: "€", INR: "₹", NPR: "₨" };
    return symbols[currency] || "$";
  };

  const toggleExpanded = (pkgId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(pkgId)) {
      newExpanded.delete(pkgId);
    } else {
      newExpanded.add(pkgId);
    }
    setExpandedCards(newExpanded);
  };

  const oneTimeRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/inquiries", {
        inquiryType: "custom_solution",
        name: data.name,
        email: data.email,
        phone: data.mobileNumber,
        subject: selectedOneTimePackage?.name || "Custom Solution Request",
        message: `Estimated Budget: ${data.estimatedPrice || "Not specified"}\n\nRequest: ${data.request}`,
      });
    },
    onSuccess: () => {
      toast({ title: "Success!", description: "Your request has been submitted. We'll contact you soon!" });
      setIsOneTimeDialogOpen(false);
      setOneTimeFormData({ name: "", email: "", mobileNumber: "", request: "", estimatedPrice: "" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to submit request", variant: "destructive" });
    },
  });

  return (
    <section
      id="pricing"
      className="relative pb-20 pt-16 sm:pt-24 overflow-hidden section-b tint-warm"
      data-testid="section-pricing"
    >
      <div className="absolute inset-0 mandala-pattern opacity-[0.03]" />
      <div className="dark-glow-orb top-1/4 -right-40" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 60, filter: "blur(12px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-8%" }}
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
        >
          <SectionHeader
            badge="Flexible Pricing"
            title={<>Choose Your Perfect <span className="gradient-brand-text">AI Plan</span></>}
            subtitle="Scale your AI journey from startup to enterprise. All plans include core features with premium support and advanced capabilities as you grow."
            direction="right"
          />

          <div className="text-center mb-12">
            {/* Subscription Type Tabs */}
            <div className="flex justify-center mb-8">
              <Tabs value={subscriptionType} onValueChange={(val: any) => setSubscriptionType(val)} className="w-full max-w-md">
                <TabsList className="grid w-full grid-cols-2 bg-card/5 border border-border/10">
                  <TabsTrigger value="monthly" data-testid="tab-monthly">Monthly</TabsTrigger>
                  <TabsTrigger value="yearly" data-testid="tab-yearly">Yearly</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Currency Selector */}
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground font-medium">Currency:</span>
              </div>
              <div className="flex gap-2">
                {["USD", "EUR", "INR", "NPR"].map((currency) => (
                  <button
                    key={currency}
                    onClick={() => setSelectedCurrency(currency as "USD" | "EUR" | "INR" | "NPR")}
                    aria-pressed={selectedCurrency === currency}
                    aria-label={`Select ${currency} currency`}
                    className={`px-3 min-h-[44px] py-1.5 rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                      selectedCurrency === currency
                        ? "bg-gradient-to-r from-primary/20 to-accent/15 text-foreground ring-1 ring-primary/30"
                        : "bg-card/5 text-foreground/50 hover:bg-card/10 hover:text-foreground/70 hover:ring-1 hover:ring-border/20"
                    }`}
                    data-testid={`button-currency-${currency}`}
                  >
                    {currency}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Smart responsive grid based on package count */}
          <div className={`relative grid gap-6 lg:gap-8 ${
            packages.length === 2 
              ? 'md:grid-cols-2 md:max-w-4xl md:mx-auto'
              : packages.length === 1
              ? 'md:grid-cols-1 md:max-w-2xl md:mx-auto'
              : packages.length === 4
              ? 'md:grid-cols-2 lg:grid-cols-4'
              : packages.length >= 5
              ? 'md:grid-cols-2 lg:grid-cols-3'
              : 'md:grid-cols-2 lg:grid-cols-3'
          }          `}>
            {packagesLoading ? (
              // Loading skeleton cards
              [...Array(3)].map((_, idx) => (
                <Card key={idx} className="glass-card border-0 flex flex-col">
                  <CardContent className="flex-1 flex flex-col gap-6 p-6">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <div className="space-y-2 flex-1">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-4 w-full" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <motion.div
                className={`contents`}
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-5%" }}
              >
              {packages.filter(pkg => pkg.enabled !== false).map((pkg, index) => (
              <motion.div
                key={pkg.id}
                variants={itemVariants}
                className={`relative overflow-hidden flex flex-col transition-all duration-300 group pricing-card-tilt ${
                  pkg.highlighted ? "md:scale-105" : ""
                }`}
                data-testid={`card-pricing-${pkg.id}`}
              >
                {/* Curved pod container */}
                <div className="relative flex-1 flex flex-col rounded-3xl overflow-hidden bg-card/[0.03] backdrop-blur-md border border-border/[0.08] card-hover-glow shimmer-hover">
                  
                  {/* Glowing top header accent - curved */}
                  <div className="relative h-1 bg-gradient-to-r from-transparent via-primary to-transparent group-hover:via-accent transition-colors duration-500 rounded-full" />
                  
                  {/* Top accent bar with glow */}
                  <motion.div
                    className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-primary/20 via-primary/5 to-transparent rounded-t-3xl group-hover:from-primary/40 group-hover:via-primary/15 transition-all duration-300"
                    animate={{ opacity: [0.6, 0.8, 0.6] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />

                  {/* Glow ring effect on hover */}
                  <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{
                    background: "radial-gradient(ellipse at top, rgba(138, 80, 232, 0.15) 0%, transparent 70%)",
                    pointerEvents: "none"
                  }} />

                  {/* Most Popular Badge */}
                  {pkg.highlighted && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20">
                      <Badge className="bg-gradient-to-r from-primary to-accent text-white border-0 shadow-lg shadow-primary/20">
                        <Zap className="w-3 h-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  {/* Card content */}
                  <div className="relative z-10 flex flex-col flex-1 p-6 pt-8">
                    {/* Header */}
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold text-foreground font-display group-hover:text-primary transition-colors mb-2">
                        {pkg.name}
                      </h3>
                      <p className="text-sm text-foreground/60 line-clamp-2">{pkg.description}</p>
                    </div>

                    {/* Pricing */}
                    <div className="relative mb-6">
                      <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 group-hover:from-primary/15 group-hover:to-primary/10 transition-colors">
                        <div className="flex items-baseline gap-2 mb-2">
                          <span className="text-5xl font-bold gradient-text">
                            {getCurrencySymbol(selectedCurrency)}
                          </span>
                           <span className="text-4xl font-bold text-foreground font-display tracking-tight">
                            {getConvertedPrice(getPriceBySubscriptionType(pkg), pkg.baseCurrency || "NPR").toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-foreground/50">{selectedCurrency}</span>
                          <span className="text-xs px-2 py-1 rounded-lg bg-card/5 text-foreground/50">
                            {subscriptionType === "monthly" ? "/month" : "/year"}
                          </span>
                        </div>
                        {selectedCurrency !== "NPR" && (
                          <div className="text-sm text-foreground/50 border-t border-border/10 pt-2 mt-2">
                            ₨{getNPRPrice(getPriceBySubscriptionType(pkg), pkg.baseCurrency || "NPR").toLocaleString()} NPR
                          </div>
                        )}
                      </div>
                    </div>

                    {/* CTA Button */}
                    <Button
                      variant={pkg.highlighted ? "default" : "outline"}
                      className="w-full min-h-11 group/btn mb-6"
                      data-testid={`button-pricing-${pkg.id}`}
                      onClick={() => {
                        setSelectedOneTimePackage(pkg);
                        setIsOneTimeDialogOpen(true);
                      }}
                    >
                      <span className="group-hover/btn:translate-x-1 transition-transform">
                        Get Started
                      </span>
                    </Button>

                    {/* Features */}
                    <div className="flex-1 flex flex-col">
                      <h4 className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-3">
                        What's Included
                      </h4>
                      <div className="space-y-2">
                        {pkg.features.slice(0, 3).map((feature, idx) => {
                          const emoji = getFeatureEmoji(feature);
                          return (
                            <div 
                              key={idx} 
                              className="flex items-start gap-2.5 group/feature p-2 rounded-lg hover:bg-card/5 transition-all duration-200"
                              data-testid={`item-feature-${pkg.id}-${idx}`}
                            >
                              <div className="flex-shrink-0 text-base mt-0.5 transform group-hover/feature:scale-110 group-hover/feature:rotate-12 transition-transform duration-300">
                                {emoji}
                              </div>
                              <span className="text-sm text-foreground group-hover/feature:text-primary group-hover/feature:font-medium transition-all duration-200 leading-snug">
                                {feature}
                              </span>
                            </div>
                          );
                        })}
                        
                        {/* Expandable Section */}
                        {pkg.features.length > 3 && (
                          <div className="pt-2 mt-2 border-t border-border/10">
                            <AnimatePresence mode="wait">
                            {expandedCards.has(pkg.id) && (
                              <motion.div
                                key="expanded-features"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                                className="overflow-hidden"
                              >
                              <div className="space-y-2 mb-3 pt-2">
                                {pkg.features.slice(3).map((feature, idx) => {
                                  const emoji = getFeatureEmoji(feature);
                                  return (
                                    <div 
                                      key={idx + 3} 
                                      className="flex items-start gap-2.5 group/feature p-2 rounded-lg hover:bg-card/5 transition-all duration-200 animate-in fade-in slide-in-from-top-2"
                                      data-testid={`item-feature-${pkg.id}-${idx + 3}`}
                                    >
                                      <div className="flex-shrink-0 text-base mt-0.5 transform group-hover/feature:scale-110 group-hover/feature:rotate-12 transition-transform duration-300">
                                        {emoji}
                                      </div>
                              <span className="text-sm text-foreground/70 group-hover/feature:text-foreground group-hover/feature:font-medium transition-all duration-200 leading-snug">
                                        {feature}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                              </motion.div>
                            )}
                            </AnimatePresence>
                            
                            <button
                              onClick={() => toggleExpanded(pkg.id)}
                              className="w-full text-center py-2 text-xs font-medium text-primary/80 hover:text-primary transition-colors group/readmore mt-1"
                              data-testid={`button-read-more-${pkg.id}`}
                            >
                              <span className="flex items-center justify-center gap-1.5 group-hover/readmore:gap-2 transition-all">
                                {expandedCards.has(pkg.id) ? (
                                  <>
                                    <span>Show Less</span>
                                    <span className="text-lg transform transition-transform group-hover/readmore:rotate-180">↑</span>
                                  </>
                                ) : (
                                  <>
                                    <span>Read More Features</span>
                                    <span className="text-lg transform transition-transform group-hover/readmore:rotate-180">↓</span>
                                  </>
                                )}
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
              ))
              }
              </motion.div>
            )}
          </div>

          {/* One-Time Pricing Request Modal */}
          <Dialog open={isOneTimeDialogOpen} onOpenChange={setIsOneTimeDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  {selectedOneTimePackage?.name === "Enterprise" || selectedOneTimePackage?.oneTimeContactEmail 
                    ? "Request Your Personalized Quote" 
                    : "Book Your Plan"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Tell us about your custom needs and we'll create a personalized quote just for you!
                </p>
                
                <div>
                  <label className="text-sm font-medium block mb-2">Your Name</label>
                  <Input
                    placeholder="John Doe"
                    value={oneTimeFormData.name}
                    onChange={(e) => setOneTimeFormData({ ...oneTimeFormData, name: e.target.value })}
                    data-testid="input-onetime-name"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium block mb-2">Email</label>
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={oneTimeFormData.email}
                      onChange={(e) => setOneTimeFormData({ ...oneTimeFormData, email: e.target.value })}
                      data-testid="input-onetime-email"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-2">Mobile Number</label>
                    <Input
                      type="tel"
                      placeholder="+977-9800000000"
                      value={oneTimeFormData.mobileNumber}
                      onChange={(e) => setOneTimeFormData({ ...oneTimeFormData, mobileNumber: e.target.value })}
                      data-testid="input-onetime-mobile"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-2">Tell us your requirements</label>
                  <Textarea
                    placeholder="What specific features or customizations do you need? Tell us your vision..."
                    value={oneTimeFormData.request}
                    onChange={(e) => setOneTimeFormData({ ...oneTimeFormData, request: e.target.value })}
                    data-testid="input-onetime-request"
                    className="min-h-24"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium block mb-2">Expected Budget (Optional)</label>
                  <div className="relative flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{getCurrencySymbol(selectedCurrency)}</span>
                    <Input
                      type="number"
                      placeholder="Enter your budget range"
                      value={oneTimeFormData.estimatedPrice}
                      onChange={(e) => setOneTimeFormData({ ...oneTimeFormData, estimatedPrice: e.target.value })}
                      data-testid="input-onetime-budget"
                    />
                    <span className="text-sm text-muted-foreground">{selectedCurrency}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">This helps us provide a more accurate quote</p>
                </div>

                <div className="bg-primary/5 rounded-lg p-4">
                  <p className="text-xs text-muted-foreground">Pricing</p>
                  <p className="text-lg font-bold text-primary">Fully Customized</p>
                  <p className="text-xs text-muted-foreground mt-2">We'll create a personalized quote based on your exact needs.</p>
                </div>

                <Button
                  onClick={() => {
                    if (!oneTimeFormData.name || !oneTimeFormData.email || !oneTimeFormData.mobileNumber || !oneTimeFormData.request) {
                      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
                      return;
                    }
                    if (selectedOneTimePackage) {
                      const estimatedPrice = oneTimeFormData.estimatedPrice ? parseInt(oneTimeFormData.estimatedPrice) : 0;
                      oneTimeRequestMutation.mutate({
                        packageId: selectedOneTimePackage.id,
                        packageName: selectedOneTimePackage.name,
                        name: oneTimeFormData.name,
                        email: oneTimeFormData.email,
                        mobileNumber: oneTimeFormData.mobileNumber,
                        request: oneTimeFormData.request,
                        estimatedPrice: estimatedPrice,
                        currency: selectedCurrency,
                      });
                    }
                  }}
                  disabled={oneTimeRequestMutation.isPending}
                  className="w-full"
                  data-testid="button-submit-onetime"
                >
                  {oneTimeRequestMutation.isPending ? (
                    <>Submitting...</>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Custom Request
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Custom plan CTA */}
          <div className="mt-12 sm:mt-20 gradient-brand-subtle rounded-2xl p-8 sm:p-12 text-center border border-black/5 dark:border-white/8 relative overflow-hidden group hover-elevate">
            <div className="absolute inset-0 gradient-brand opacity-5 group-hover:opacity-10 transition-all duration-300" />
            <div className="relative z-10">
              <h3 className="text-2xl sm:text-3xl font-bold mb-3 font-display group-hover:text-primary transition-colors">
                Need a Custom Solution?
              </h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Can't find the perfect fit? Our team builds custom AI solutions tailored to your unique business needs.
              </p>
              <Button 
                size="lg" 
                data-testid="button-contact-sales"
                onClick={() => {
                  const customPackage = packages.find((p) => p.floatingCloudEnabled !== false && p.oneTimeContactEmail && p.enabled !== false);
                  if (customPackage) {
                    setSelectedOneTimePackage(customPackage);
                    setIsOneTimeDialogOpen(true);
                  } else {
                    toast({ title: "Info", description: "No custom pricing packages available. Please contact us directly at info@vyomai.cloud" });
                  }
                }}
                className="bg-gradient-to-r from-primary via-[#c060d0] to-accent text-white border-0 shadow-lg shadow-brand-start/25"
              >
                <Zap className="w-4 h-4 mr-2" />
                Contact Our Team
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
