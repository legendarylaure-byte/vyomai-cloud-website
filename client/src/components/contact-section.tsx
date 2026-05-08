import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, MapPin, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { NepaliFlag } from "./nepali-flag";
import { SocialMediaIcons } from "./social-media-icons";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { apiRequest } from "@/lib/queryClient";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormData = z.infer<typeof contactSchema>;

export function ContactSection() {
  const { ref, isVisible } = useScrollAnimation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/inquiries", {
        inquiryType: "contact",
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message,
      });
      toast({
        title: "Message Sent!",
        description: "Thank you for reaching out. We'll get back to you soon.",
      });
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="contact"
      className="relative py-24 overflow-hidden"
      data-testid="section-contact"
    >
      <div className="absolute inset-0 mandala-pattern opacity-10" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={ref}
          className={`scroll-fade-in ${isVisible ? "visible" : ""}`}
        >
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Get in Touch
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 font-[Space_Grotesk]">
              <span className="gradient-text">Contact</span>
              <span className="text-foreground"> Us</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Ready to transform your business with AI? Let's discuss how we can help.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            <div className="glass-card rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-6 font-[Space_Grotesk]">
                Send us a Message
              </h3>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Your name" 
                              {...field}
                              data-testid="input-name"
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
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="your@email.com" 
                              type="email"
                              {...field}
                              data-testid="input-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="What's this about?" 
                            {...field}
                            data-testid="input-subject"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell us about your project or inquiry..."
                            className="min-h-32 resize-none"
                            {...field}
                            data-testid="input-message"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full"
                    disabled={isSubmitting}
                    data-testid="button-send-message"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </div>

            <div className="space-y-8">
              <div className="glass-card rounded-2xl p-8">
                <h3 className="text-xl font-bold mb-6 font-[Space_Grotesk]">
                  Company Information
                </h3>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Location</h4>
                      <p className="text-muted-foreground">
                        Tokha, Kathmandu, Nepal
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <NepaliFlag className="w-4 h-6 animate-windy" />
                        <span className="text-sm text-muted-foreground">Nepal Based, Global Reach</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Email</h4>
                      <a
                        href="mailto:info@vyomai.cloud"
                        className="text-primary hover:underline"
                        data-testid="link-email"
                      >
                        info@vyomai.cloud
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-2xl p-8">
                <h3 className="text-xl font-bold mb-4 font-[Space_Grotesk]">
                  Connect With Us
                </h3>
                <p className="text-muted-foreground mb-6">
                  Follow us on social media for updates, AI insights, and more.
                </p>
                <SocialMediaIcons size="lg" />
              </div>

              <div className="glass-card rounded-2xl p-8 bg-gradient-to-br from-primary/10 to-accent/10">
                <h3 className="text-xl font-bold mb-2 font-[Space_Grotesk]">
                  VyomAi Cloud Pvt. Ltd
                </h3>
                <p className="text-muted-foreground text-sm">
                  Pioneering AI technology from the heart of the Himalayas. 
                  Bringing intelligent solutions to businesses worldwide.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
