import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";

interface TestimonialItem {
  id: string;
  name: string;
  company?: string;
  role?: string;
  avatarUrl?: string;
  content: string;
  rating?: number;
}

export function TestimonialsSection() {
  const [current, setCurrent] = useState(0);

  const { data: testimonials = [] } = useQuery<TestimonialItem[]>({
    queryKey: ["/api/testimonials"],
  });

  if (testimonials.length === 0) return null;

  const t = testimonials[current];

  const next = () => setCurrent((current + 1) % testimonials.length);
  const prev = () => setCurrent((current - 1 + testimonials.length) % testimonials.length);

  const avatarLetters = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <section className="py-20 bg-gradient-to-br from-purple-50 via-white to-orange-50">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent">
            What Our Clients Say
          </h2>
          <p className="text-muted-foreground mt-3">Trusted by businesses in Nepal and beyond</p>
        </div>

        <div className="relative">
          <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-8 md:p-12 text-center">
            <div className="flex justify-center mb-4">
              {t.avatarUrl ? (
                <img src={t.avatarUrl} alt={t.name} className="w-16 h-16 rounded-full object-cover border-2 border-purple-200" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-orange-400 flex items-center justify-center text-white font-bold text-lg">
                  {avatarLetters(t.name)}
                </div>
              )}
            </div>

            <div className="flex justify-center gap-1 mb-4">
              {Array.from({ length: t.rating || 5 }).map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>

            <blockquote className="text-lg text-gray-700 italic leading-relaxed mb-6">
              &ldquo;{t.content}&rdquo;
            </blockquote>

            <div>
              <p className="font-semibold text-gray-800">{t.name}</p>
              {[t.role, t.company].filter(Boolean).length > 0 && (
                <p className="text-sm text-purple-600">{[t.role, t.company].filter(Boolean).join(" · ")}</p>
              )}
            </div>
          </div>

          {testimonials.length > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={prev}
                className="w-10 h-10 rounded-full bg-white border border-purple-200 flex items-center justify-center hover:bg-purple-50 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-purple-600" />
              </button>
              <div className="flex gap-2">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                      i === current ? "bg-purple-600" : "bg-purple-200"
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={next}
                className="w-10 h-10 rounded-full bg-white border border-purple-200 flex items-center justify-center hover:bg-purple-50 transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-purple-600" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
