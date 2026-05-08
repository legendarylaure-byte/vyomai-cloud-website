# VyomAi Pvt Ltd - Design Guidelines

## Design Approach

**Hybrid Cultural-Tech Fusion**: Blend futuristic tech aesthetics (inspired by modern AI companies like OpenAI, Anthropic, Vercel) with traditional Nepali/Sanskrit design elements. Create a distinctive visual identity that bridges ancient wisdom and cutting-edge technology.

**Key References**: 
- Tech aesthetic: Linear's minimalism + Stripe's sophistication + Apple's polish
- Cultural elements: Traditional Nepali mandala patterns, Sanskrit typography influences, ceremonial color accents

## Typography

**Font Stack**:
- Primary: 'Inter' (body text, UI elements) - weights 400, 500, 600
- Display: 'Space Grotesk' (headings, hero) - weights 500, 700
- Accent: 'Poppins' (Devanagari-compatible for Nepali elements) - weight 600

**Hierarchy**:
- Hero headline: text-6xl/text-7xl, font-bold, tracking-tight
- Section headings: text-4xl/text-5xl, font-semibold
- Subsection titles: text-2xl/text-3xl, font-medium
- Body text: text-base/text-lg, leading-relaxed
- Captions/labels: text-sm, font-medium

## Layout System

**Spacing Primitives**: Tailwind units of 4, 6, 8, 12, 16, 20, 24 (e.g., p-4, gap-8, py-16, mb-24)

**Section Structure**:
- Hero: Full viewport (min-h-screen) with centered content
- Content sections: py-20 on desktop, py-12 on mobile
- Container: max-w-7xl for full sections, max-w-4xl for text-focused content

**Multi-Column Strategy**:
- Services grid: 3 columns desktop (lg:grid-cols-3), 2 tablet (md:grid-cols-2), 1 mobile
- AI Solutions showcase: 2 columns desktop (lg:grid-cols-2)
- Articles/Media: 3-column masonry grid desktop, 1 mobile
- Feature highlights: 4-column stats row (grid-cols-4), collapse to 2 on tablet

## Component Library

**Navigation**:
- Fixed header with blur backdrop (backdrop-blur-lg)
- Logo left, navigation center, social icons + visitor counter right
- Smooth scroll anchor links with progress indicator

**Hero Section**:
- Large background: Abstract particle field animation or gradient mesh (think neural network visualization)
- Centered content: Company name, tagline, dual CTAs
- Nepali flag icon integrated tastefully (top-right corner or alongside company info)
- Floating AI chatbot trigger (bottom-right, pulsing indicator)

**Services Cards**:
- Glass morphism effect (bg-white/10, backdrop-blur-md, border)
- Icon at top (tech-inspired), title, description
- Hover effect: subtle lift + glow

**AI Solutions Showcase**:
- Alternating layout: image left/text right, then reversed
- Platform integration icons (Google, Microsoft, etc.) displayed prominently
- Each solution includes key capabilities list

**Articles/Media Gallery**:
- Card-based layout with thumbnail, title, date
- Filter tabs for Articles vs Videos vs Demos
- Click to expand modal view

**Contact Section**:
- 2-column layout: Contact form left, company info + map placeholder right
- Social media icons row (LinkedIn, Instagram, Facebook, WhatsApp, Viber) with vibrant hover states
- Office address, email prominently displayed

**AI Chatbot Widget**:
- Floating button: bottom-right, circular, gradient background
- Expands to chat panel: rounded corners, modern message bubbles
- Traditional pattern subtle background in chat interface

**Visitor Counter**:
- Displayed in header or footer
- Format: "Visitors: 12,345" with animated number counting
- Subtle glow effect

## Visual Elements

**Nepali Cultural Integration**:
- Subtle mandala patterns as section dividers or background overlays (low opacity)
- Sanskrit-inspired decorative elements in section headers
- Traditional color accents: Deep saffron, temple red, Himalayan blue (used sparingly)
- Nepali flag: Small, respectful placement in header or footer

**Futuristic Tech Aesthetic**:
- Gradient backgrounds: Purple-to-blue, cyan-to-indigo
- Glass morphism cards throughout
- Particle effects in hero (subtle, not distracting)
- Grid patterns suggesting AI/data (low opacity backgrounds)
- Smooth scroll-triggered animations (fade-in, slide-up) - limit to 2-3 types

**Interactive Elements**:
- Buttons: Rounded (rounded-lg), gradient backgrounds, slight shadow, blur background when over images
- Links: Underline on hover, smooth color transition
- Cards: Transform scale on hover (scale-105), shadow increase
- Animations: Keep subtle - entrance animations on scroll, no constant motion

## Images

**Hero Section**: 
- Large background image or animation: Abstract AI visualization, neural network, or particle field (futuristic, not generic stock photo)
- Alternative: Gradient mesh with geometric patterns

**Services Section**:
- Icon illustrations for each service (use icon library or simple SVG)
- Platform logos: Google, Microsoft O365 displayed as badges

**Articles/Media**:
- Thumbnail images for each article/video (16:9 ratio)
- Placeholder for video embeds

**About/Company Section**:
- Optional: Team working photo or office space image showing professional environment
- Kathmandu/Nepal landscape subtle background overlay (very low opacity)

## Accessibility & Quality

- Consistent focus states on all interactive elements (ring-2, ring-offset-2)
- ARIA labels for icon-only buttons
- High contrast text (avoid low-opacity text on busy backgrounds)
- Keyboard navigation support throughout
- Form inputs: Clear labels, validation states, helpful error messages

## Critical Notes

- **No pricing information anywhere** on the frontend
- Payment gateway integration exists in backend but invisible to users
- Maintain balance: Futuristic without being cold, traditional without being dated
- Animations enhance, never distract - limit to essential moments
- Every section must feel purposeful and complete - no sparse layouts