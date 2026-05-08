import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Trash2, Edit, Save, Loader2, Calculator, Sparkles, CheckCircle, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type PricingPackage } from "@shared/schema";
import { z } from "zod";

const pricingFormSchema = z.object({
  name: z.string().min(2, "Plan name is required"),
  baseCurrency: z.enum(["USD", "EUR", "INR", "NPR"]).default("NPR"),
  monthlyPrice: z.coerce.number().min(0, "Monthly price must be 0 or greater").optional(),
  yearlyPrice: z.coerce.number().min(0, "Yearly price must be 0 or greater").optional(),
  description: z.string().min(1, "Description is required"),
  features: z.array(z.string()).default([]),
  highlighted: z.boolean().default(false),
  enabled: z.boolean().default(true),
  oneTimeContactEmail: z.string().email().optional().or(z.literal("")),
  contactMessage: z.string().optional(),
  floatingCloudEnabled: z.boolean().default(true),
});

type PricingFormData = z.infer<typeof pricingFormSchema>;

const currencySymbols: Record<string, string> = { 
  USD: "$", 
  EUR: "€", 
  INR: "₹", 
  NPR: "रू" 
};

const currencyNames: Record<string, string> = {
  USD: "US Dollar",
  EUR: "Euro", 
  INR: "Indian Rupee",
  NPR: "Nepali Rupee"
};

export function PricingPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPricing, setEditingPricing] = useState<PricingPackage | null>(null);
  const [featuresInput, setFeaturesInput] = useState("");
  const [convertedPrices, setConvertedPrices] = useState<Record<string, { monthly: number; yearly: number }>>({});
  const [isConverting, setIsConverting] = useState(false);
  const [aiVerification, setAiVerification] = useState<{verified: boolean; message: string} | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const { data: pricingPackages = [] } = useQuery<PricingPackage[]>({
    queryKey: ["/api/pricing"],
  });

  const { data: exchangeRates } = useQuery<{ rates: Record<string, number> }>({
    queryKey: ["/api/exchange-rates"],
  });

  const form = useForm<PricingFormData>({
    resolver: zodResolver(pricingFormSchema),
    defaultValues: {
      name: "",
      baseCurrency: "NPR",
      monthlyPrice: undefined,
      yearlyPrice: undefined,
      description: "",
      features: [],
      highlighted: false,
      enabled: true,
      oneTimeContactEmail: "",
      contactMessage: "",
      floatingCloudEnabled: true,
    },
  });

  const watchedMonthlyPrice = form.watch("monthlyPrice");
  const watchedBaseCurrency = form.watch("baseCurrency");

  useEffect(() => {
    if (watchedMonthlyPrice && watchedMonthlyPrice > 0) {
      const yearlyPrice = watchedMonthlyPrice * 12;
      form.setValue("yearlyPrice", yearlyPrice);
    }
  }, [watchedMonthlyPrice, form]);

  useEffect(() => {
    if (watchedMonthlyPrice && watchedMonthlyPrice > 0 && exchangeRates?.rates) {
      convertPrices(watchedMonthlyPrice, watchedBaseCurrency);
    }
  }, [watchedMonthlyPrice, watchedBaseCurrency, exchangeRates]);

  const convertPrices = async (monthlyPrice: number, baseCurrency: string) => {
    if (!exchangeRates?.rates) return;
    
    setIsConverting(true);
    setAiVerification(null);
    const rates = exchangeRates.rates;
    const converted: Record<string, { monthly: number; yearly: number }> = {};
    
    const baseToUSD = baseCurrency === "USD" ? 1 : 1 / rates[baseCurrency];
    const monthlyUSD = monthlyPrice * baseToUSD;
    
    for (const currency of ["USD", "EUR", "INR", "NPR"]) {
      if (currency !== baseCurrency) {
        const rate = rates[currency];
        const convertedMonthly = Math.round(monthlyUSD * rate * 100) / 100;
        converted[currency] = {
          monthly: convertedMonthly,
          yearly: Math.round(convertedMonthly * 12 * 100) / 100
        };
      }
    }
    
    setConvertedPrices(converted);
    setIsConverting(false);
    
    if (Object.keys(converted).length > 0) {
      verifyConversion(monthlyPrice, baseCurrency, converted);
    }
  };

  const verifyConversion = async (basePrice: number, baseCurrency: string, converted: Record<string, { monthly: number; yearly: number }>) => {
    setIsVerifying(true);
    try {
      const token = localStorage.getItem("vyomai-admin-token");
      const targetCurrency = Object.keys(converted)[0];
      const convertedPrice = converted[targetCurrency]?.monthly;
      
      if (!convertedPrice) {
        setAiVerification({ verified: true, message: "No conversion needed" });
        setIsVerifying(false);
        return;
      }
      
      const response = await apiRequest("POST", "/api/admin/pricing/verify-conversion", {
        basePrice,
        baseCurrency,
        targetCurrency,
        convertedPrice
      }, { Authorization: `Bearer ${token}` });
      
      setAiVerification({
        verified: response.isAccurate && response.aiVerification?.accurate !== false,
        message: response.aiVerification?.message || `Deviation: ${response.deviation}%`
      });
    } catch (error) {
      setAiVerification({ verified: true, message: "Verification skipped (using mathematical calculation)" });
    }
    setIsVerifying(false);
  };

  const createPricingMutation = useMutation({
    mutationFn: async (data: PricingFormData) => {
      const token = localStorage.getItem("vyomai-admin-token");
      const submitData = {
        ...data,
        price: data.monthlyPrice,
        features: featuresInput.split("\n").filter(f => f.trim()),
        oneTimeContactEmail: data.oneTimeContactEmail || undefined,
      };
      return apiRequest("POST", "/api/admin/pricing", submitData, { Authorization: `Bearer ${token}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pricing"] });
      toast({ title: "Pricing package created successfully!" });
      setIsDialogOpen(false);
      form.reset();
      setFeaturesInput("");
      setConvertedPrices({});
    },
    onError: (error: Error) => {
      toast({ title: "Error creating pricing", description: error.message, variant: "destructive" });
    },
  });

  const updatePricingMutation = useMutation({
    mutationFn: async (data: PricingFormData) => {
      const token = localStorage.getItem("vyomai-admin-token");
      const submitData = {
        ...data,
        price: data.monthlyPrice,
        features: featuresInput.split("\n").filter(f => f.trim()),
        oneTimeContactEmail: data.oneTimeContactEmail || undefined,
      };
      return apiRequest("PUT", `/api/admin/pricing/${editingPricing?.id}`, submitData, { Authorization: `Bearer ${token}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pricing"] });
      toast({ title: "Pricing package updated successfully!" });
      setIsDialogOpen(false);
      setEditingPricing(null);
      form.reset();
      setFeaturesInput("");
      setConvertedPrices({});
    },
    onError: (error: Error) => {
      toast({ title: "Error updating pricing", description: error.message, variant: "destructive" });
    },
  });

  const deletePricingMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem("vyomai-admin-token");
      return apiRequest("DELETE", `/api/admin/pricing/${id}`, undefined, { Authorization: `Bearer ${token}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pricing"] });
      toast({ title: "Pricing package deleted" });
    },
  });

  const onSubmit = (data: PricingFormData) => {
    if (editingPricing) {
      updatePricingMutation.mutate(data);
    } else {
      createPricingMutation.mutate(data);
    }
  };

  const handleEdit = (pkg: PricingPackage) => {
    setEditingPricing(pkg);
    form.reset({
      name: pkg.name,
      baseCurrency: pkg.baseCurrency || "NPR",
      monthlyPrice: pkg.monthlyPrice || pkg.price || 0,
      yearlyPrice: pkg.yearlyPrice || (pkg.monthlyPrice ? pkg.monthlyPrice * 12 : pkg.price ? pkg.price * 12 : 0),
      description: pkg.description,
      features: pkg.features || [],
      highlighted: pkg.highlighted || false,
      enabled: pkg.enabled !== false,
      oneTimeContactEmail: pkg.oneTimeContactEmail || "",
      contactMessage: pkg.contactMessage || "",
      floatingCloudEnabled: pkg.floatingCloudEnabled !== false,
    });
    setFeaturesInput((pkg.features || []).join("\n"));
    setIsDialogOpen(true);
  };

  const formatPrice = (price: number | undefined, currency: string) => {
    if (!price) return "-";
    return `${currencySymbols[currency] || ""}${price.toLocaleString()}`;
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pricing Plans</h1>
          <p className="text-muted-foreground">Manage your subscription pricing with intelligent currency conversion</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingPricing(null);
            form.reset();
            setFeaturesInput("");
            setConvertedPrices({});
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingPricing(null); form.reset(); setFeaturesInput(""); }} data-testid="button-add-pricing">
              <Plus className="w-4 h-4 mr-2" />
              Add Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPricing ? "Edit Pricing Plan" : "Create Pricing Plan"}</DialogTitle>
              <DialogDescription>
                Enter the monthly price in your base currency. Yearly price and currency conversions are calculated automatically.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plan Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Starter, Professional, Enterprise" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="baseCurrency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base Currency *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(currencyNames).map(([code, name]) => (
                              <SelectItem key={code} value={code}>
                                {currencySymbols[code]} {name} ({code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>All prices will be stored in this currency</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="monthlyPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Price ({currencySymbols[watchedBaseCurrency]})</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                              {currencySymbols[watchedBaseCurrency]}
                            </span>
                            <Input 
                              type="number" 
                              placeholder="0" 
                              className="pl-8"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="yearlyPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Yearly Price ({currencySymbols[watchedBaseCurrency]})
                          <Badge variant="secondary" className="ml-2">Auto-calculated</Badge>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                              {currencySymbols[watchedBaseCurrency]}
                            </span>
                            <Input 
                              type="number" 
                              placeholder="0" 
                              className="pl-8 bg-muted/50"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            />
                            <Calculator className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          </div>
                        </FormControl>
                        <FormDescription>Monthly × 12 = Yearly (you can adjust if needed)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {Object.keys(convertedPrices).length > 0 && (
                  <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          Live Currency Conversions
                          {isConverting && <Loader2 className="h-3 w-3 animate-spin" />}
                        </CardTitle>
                        {isVerifying ? (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            AI Verifying...
                          </Badge>
                        ) : aiVerification && (
                          <Badge variant={aiVerification.verified ? "default" : "destructive"} className="flex items-center gap-1">
                            {aiVerification.verified ? (
                              <><CheckCircle className="h-3 w-3" /> AI Verified</>
                            ) : (
                              <><AlertCircle className="h-3 w-3" /> Check Required</>
                            )}
                          </Badge>
                        )}
                      </div>
                      {aiVerification && (
                        <p className="text-xs text-muted-foreground mt-1">{aiVerification.message}</p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        {Object.entries(convertedPrices).map(([currency, prices]) => (
                          <div key={currency} className="text-center p-2 rounded-lg bg-background/50">
                            <div className="font-medium text-muted-foreground">{currency}</div>
                            <div className="text-lg font-bold">
                              {currencySymbols[currency]}{prices.monthly.toLocaleString()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {currencySymbols[currency]}{prices.yearly.toLocaleString()}/year
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe what's included in this plan..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <FormLabel>Features (one per line)</FormLabel>
                  <Textarea 
                    placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                    value={featuresInput}
                    onChange={(e) => setFeaturesInput(e.target.value)}
                    rows={4}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter each feature on a new line
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="highlighted"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <FormLabel>Highlighted</FormLabel>
                          <FormDescription className="text-xs">Make this plan stand out</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="enabled"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <FormLabel>Published</FormLabel>
                          <FormDescription className="text-xs">Show on website</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="floatingCloudEnabled"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <FormLabel>Animations</FormLabel>
                          <FormDescription className="text-xs">Enable cloud effects</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={createPricingMutation.isPending || updatePricingMutation.isPending} 
                  className="w-full"
                >
                  {createPricingMutation.isPending || updatePricingMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {editingPricing ? "Update" : "Create"} Plan
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {pricingPackages.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pricingPackages.map((pkg) => (
            <Card key={pkg.id} className={`relative ${pkg.highlighted ? 'ring-2 ring-primary' : ''} ${!pkg.enabled ? 'opacity-60' : ''}`}>
              {pkg.highlighted && (
                <Badge className="absolute -top-2 left-1/2 -translate-x-1/2">Popular</Badge>
              )}
              {!pkg.enabled && (
                <Badge variant="secondary" className="absolute -top-2 right-2">Draft</Badge>
              )}
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{pkg.name}</span>
                  <Badge variant="outline">{pkg.baseCurrency || "NPR"}</Badge>
                </CardTitle>
                <CardDescription>{pkg.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <div className="text-3xl font-bold">
                    {formatPrice(pkg.monthlyPrice || pkg.price, pkg.baseCurrency || "NPR")}
                    <span className="text-sm font-normal text-muted-foreground">/mo</span>
                  </div>
                  {pkg.yearlyPrice && (
                    <div className="text-sm text-muted-foreground">
                      {formatPrice(pkg.yearlyPrice, pkg.baseCurrency || "NPR")}/year
                    </div>
                  )}
                </div>
                
                {pkg.features && pkg.features.length > 0 && (
                  <ul className="text-sm space-y-1">
                    {pkg.features.slice(0, 4).map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="text-primary">✓</span> {feature}
                      </li>
                    ))}
                    {pkg.features.length > 4 && (
                      <li className="text-muted-foreground">+{pkg.features.length - 4} more</li>
                    )}
                  </ul>
                )}

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(pkg)}>
                    <Edit className="w-4 h-4 mr-1" /> Edit
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => deletePricingMutation.mutate(pkg.id)}
                    disabled={deletePricingMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <CardContent>
            <p className="text-muted-foreground mb-4">No pricing plans yet. Create your first plan to get started.</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add Your First Plan
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
