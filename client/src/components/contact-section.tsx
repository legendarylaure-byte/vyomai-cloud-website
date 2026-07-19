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
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";
import { SectionHeader } from "@/components/text-reveal";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormData = z.infer<typeof contactSchema>;

const formFieldVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
};

const fieldVariant = {
  hidden: { opacity: 0, y: 60, filter: "blur(12px)", scale: 0.92 },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", scale: 1, transition: { duration: 0.7, ease: [0.32, 0.72, 0, 1] } },
};

export function ContactSection() {
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

  const infoCards = [
    {
      icon: <MapPin className="w-5 h-5 text-primary" />,
      title: "Location",
      content: (
        <div>
          <p className="text-foreground/60 text-sm">Tokha, Kathmandu, Nepal</p>
          <div className="flex items-center gap-2 mt-2">
            <NepaliFlag className="w-4 h-6 animate-windy" />
            <span className="text-xs text-foreground/40">Nepal Based, Global Reach</span>
          </div>
        </div>
      ),
    },
    {
      icon: <Mail className="w-5 h-5 text-primary" />,
      title: "Email",
      content: (
        <a href="mailto:info@vyomai.cloud" className="text-primary hover:underline text-sm" data-testid="link-email">
          info@vyomai.cloud
        </a>
      ),
    },
  ];

  return (
    <section
      id="contact"
      className="relative pb-20 pt-16 sm:pt-24 overflow-hidden section-b tint-cool"
      data-testid="section-contact"
    >
      {/* Brand glow orb */}
      <div className="dark-glow-orb bottom-0 right-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <SectionHeader
            badge="Get in Touch"
            title={<>Contact <span className="gradient-brand-text">Us</span></>}
            subtitle="Ready to transform your business with AI? Let's discuss how we can help."
            dark
          />

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            {/* Left: Info cards */}
            <motion.div
              variants={formFieldVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-5%" }}
            >
              {infoCards.map((card, i) => (
                <motion.div key={i} variants={fieldVariant} className="mb-6">
                  <div className="metallic-card rounded-2xl p-6 card-hover-glow shimmer-hover group">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl gradient-brand-subtle flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform value-icon-hover">
                        {card.icon}
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1 text-foreground">{card.title}</h4>
                        {card.content}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              <motion.div variants={fieldVariant} className="mb-6">
                <div className="metallic-card rounded-2xl p-6 card-hover-glow shimmer-hover group">
                  <h4 className="font-semibold mb-3 text-foreground">Connect With Us</h4>
                  <SocialMediaIcons size="lg" />
                </div>
              </motion.div>

              <motion.div variants={fieldVariant}>
                <div className="metallic-card rounded-2xl p-6 gradient-brand-subtle border border-border/5 card-hover-glow shimmer-hover group">
                  <h4 className="font-semibold mb-1 font-display text-foreground group-hover:text-primary transition-colors">VyomAi Cloud Pvt. Ltd</h4>
                  <p className="text-foreground/50 text-sm">
                    Pioneering AI technology from the heart of the Himalayas.
                    Bringing intelligent solutions to businesses worldwide.
                  </p>
                </div>
              </motion.div>
            </motion.div>

            {/* Right: Form */}
            <motion.div
              initial={{ opacity: 0, x: 60, filter: "blur(12px)" }}
              whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              viewport={{ once: true, margin: "-8%" }}
              transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
            >
              <div className="metallic-card rounded-2xl p-8">
                <h3 className="text-2xl font-bold mb-6 font-display text-foreground">
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
                            <FormLabel htmlFor="booking-name" className="text-foreground/70">Name</FormLabel>
                            <FormControl>
                               <Input
                                id="booking-name"
                                placeholder="Your name"
                                {...field}
                                aria-required="true"
                                className="rounded-xl bg-card/50 dark:bg-card/5 border-border/10 text-foreground placeholder:text-foreground/30 focus:border-primary input-focus-glow"
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
                            <FormLabel htmlFor="booking-email" className="text-foreground/70">Email</FormLabel>
                            <FormControl>
                               <Input
                                id="booking-email"
                                placeholder="your@email.com"
                                type="email"
                                {...field}
                                aria-required="true"
                                className="rounded-xl bg-card/50 dark:bg-card/5 border-border/10 text-foreground placeholder:text-foreground/30 focus:border-primary input-focus-glow"
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
                          <FormLabel htmlFor="booking-subject" className="text-foreground/70">Subject</FormLabel>
                          <FormControl>
                               <Input
                                id="booking-subject"
                                placeholder="What's this about?"
                                {...field}
                                aria-required="true"
                                className="rounded-xl bg-card/50 dark:bg-card/5 border-border/10 text-foreground placeholder:text-foreground/30 focus:border-primary input-focus-glow"
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
                          <FormLabel htmlFor="booking-message" className="text-foreground/70">Message</FormLabel>
                          <FormControl>
                            <Textarea
                              id="booking-message"
                              placeholder="Tell us about your project or inquiry..."
                              className="min-h-32 resize-none rounded-xl bg-card/50 dark:bg-card/5 border-border/10 text-foreground placeholder:text-foreground/30 focus:border-primary input-focus-glow"
                              {...field}
                              aria-required="true"
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
                      className="w-full rounded-xl gradient-brand text-white border-0 shadow-lg shadow-brand-start/25"
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
          </motion.div>
      </div>
      </div>
    </section>
  );
}
