import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { type ProjectDiscussion } from "@shared/schema";
import { z } from "zod";
import { Loader2, Send } from "lucide-react";

const projectFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  projectDescription: z.string().min(10, "Project description must be at least 10 characters"),
  budget: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectFormSchema>;

export function ProjectDiscussionSection() {
  const { ref, isVisible } = useScrollAnimation();
  const { toast } = useToast();

  const { data: discussion, isLoading: discussionLoading } = useQuery<ProjectDiscussion>({
    queryKey: ["/api/project-discussion"],
  });

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
      email: "",
      projectDescription: "",
      budget: "",
    },
  });

  const onSubmit = async (data: ProjectFormData) => {
    try {
      const { apiRequest } = await import("@/lib/queryClient");
      await apiRequest("POST", "/api/inquiries", {
        inquiryType: "project_discussion",
        name: data.name,
        email: data.email,
        subject: "Project Discussion Request",
        message: `Budget: ${data.budget || "Not specified"}\n\n${data.projectDescription}`,
      });

      toast({
        title: "Success",
        description: "Your project inquiry has been sent. We'll get back to you soon!",
      });
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send your inquiry. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <section
      id="project-discussion"
      className="relative py-24 overflow-hidden"
      data-testid="section-project-discussion"
    >
      <div className="absolute inset-0 mandala-pattern opacity-10" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={ref}
          className={`scroll-fade-in ${isVisible ? "visible" : ""}`}
        >
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Custom Solutions
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 font-[Space_Grotesk]">
              <span className="text-foreground">Discuss Your </span>
              <span className="gradient-text">Project</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {discussion?.description || "Have a unique project in mind? Let's discuss how we can help you achieve your AI goals."}
            </p>
          </div>

          <Card className="glass-card border-0 hover-elevate">
            <CardContent className="p-8">
              {discussionLoading ? (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Your name"
                              {...field}
                              data-testid="input-project-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="your@email.com"
                              {...field}
                              data-testid="input-project-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., ₹50,000 - ₹1,00,000"
                            {...field}
                            data-testid="input-project-budget"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="projectDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell us about your project, goals, and requirements..."
                            className="min-h-32"
                            {...field}
                            data-testid="input-project-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={form.formState.isSubmitting}
                    data-testid="button-submit-project"
                  >
                    {form.formState.isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Inquiry
                      </>
                    )}
                  </Button>
                </form>
              </Form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
