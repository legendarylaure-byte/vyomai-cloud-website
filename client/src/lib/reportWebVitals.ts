import { onLCP, onINP, onCLS, onFCP, onTTFB } from "web-vitals";

type MetricName = "LCP" | "INP" | "CLS" | "FCP" | "TTFB";

function sendToGA(name: MetricName, value: number, delta: number) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", name, {
    event_category: "Web Vitals",
    event_label: name,
    value: Math.round(name === "CLS" ? delta * 1000 : delta),
    non_interaction: true,
  });
}

export function reportWebVitals() {
  onLCP((m) => sendToGA("LCP", m.value, m.delta));
  onINP((m) => sendToGA("INP", m.value, m.delta));
  onCLS((m) => sendToGA("CLS", m.value, m.delta));
  onFCP((m) => sendToGA("FCP", m.value, m.delta));
  onTTFB((m) => sendToGA("TTFB", m.value, m.delta));
}
