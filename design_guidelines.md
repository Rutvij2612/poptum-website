# Poptum Makhana Website - Design Guidelines

## Design Approach
**Reference-Based Approach**: Premium food brand websites like Hippeas, Popchips, and modern snack brands with emphasis on natural ingredients and lifestyle appeal. Clean, organic aesthetic that balances premium positioning with approachable warmth.

## Core Design Principles
- Premium snack brand aesthetic emphasizing natural, wholesome ingredients
- Indian heritage meets German market sophistication
- Warm, inviting, health-conscious visual language
- Interactive product storytelling through modals and animations

## Typography
**Font Families** (via Google Fonts):
- Primary (Headlines): "Poppins" - modern, geometric, clean
- Secondary (Body): "Inter" - excellent readability, professional
- Accent (Special): "Playfair Display" - elegant touch for taglines

**Hierarchy**:
- Hero Headline: text-5xl to text-6xl, font-bold
- Section Headers: text-4xl, font-semibold
- Subheadings: text-2xl, font-medium
- Body Text: text-base to text-lg, font-normal
- Small Text/Captions: text-sm

## Color Palette
- **Primary**: Cream (#F5F1E8), Beige (#E8DCC4)
- **Accent**: Olive Green (#8B9556), Gold (#D4AF37)
- **Neutrals**: Warm Gray (#A8A196), Deep Brown (#4A4238)
- **Background**: Soft White (#FDFCF9)
- **Text**: Dark Brown (#2C2417) for readability

## Layout System
**Spacing Units**: Tailwind scale - primarily use 4, 8, 12, 16, 20, 24, 32 units
- Section padding: py-16 to py-24 (desktop), py-12 to py-16 (mobile)
- Card padding: p-6 to p-8
- Gap spacing: gap-6 to gap-8 for grids
- Container: max-w-7xl with px-4 to px-8

## Component Library

### 1. Hero Section (Full Viewport)
- Height: min-h-screen with centered content
- Background: Gradient overlay on product lifestyle image
- Content: Centered with max-w-4xl
- Tagline: Large, bold typography
- Subtext: text-xl with subtle opacity
- Two CTAs: Primary (solid) + Secondary (outline) with backdrop-blur
- Buttons on image: Use backdrop-blur-md with bg-white/20 or bg-olive/30

### 2. Navigation
- Sticky header with backdrop-blur
- Logo left, menu items center, language toggle right
- Mobile: Hamburger menu with slide-in drawer
- Smooth scroll behavior to sections
- Active state highlighting current section

### 3. Flavour Cards (Interactive Grid)
- Grid: 2 columns (mobile), 4 columns (desktop)
- Card design: Rounded-2xl, shadow-lg, hover:shadow-2xl transition
- Image: aspect-square, object-cover, rounded-t-2xl
- Content: p-6, centered text
- CTA button: "View Details" → opens modal
- Hover: Subtle scale (scale-105) and shadow increase

### 4. Modals (Flavour Details)
- Full-screen overlay with backdrop-blur-sm
- Modal container: max-w-4xl, centered, rounded-3xl
- Two-column layout: Image left (40%), content right (60%)
- Sections: Description, Ingredients, Nutrition table, Taste profile, Serving ideas
- Close button: top-right with hover states
- Scrollable content area if needed

### 5. Process Timeline
- Horizontal on desktop, vertical on mobile
- Icons above each step (use Heroicons)
- Connected with dotted/dashed lines
- Steps: Bihar Farms → Roasting → Flavouring → Packaging → Export
- Icons in circular containers with olive green background

### 6. Benefits Grid
- 4x2 grid (desktop), 2x4 (tablet), 1 column (mobile)
- Icon cards with rounded-xl backgrounds
- Icons: Use Heroicons for health/quality symbols
- Icon size: w-12 h-12 in circular olive green containers
- Text below: Benefit name + brief description

### 7. Gallery
- Masonry or 3-column grid layout
- Mix of product shots and lifestyle imagery
- Rounded corners (rounded-lg)
- Hover: Slight zoom effect with overlay showing caption
- Lightbox functionality for full-screen view

### 8. Contact Section
- Two-column split: Form left, info right
- Form fields: Rounded inputs with focus states (ring-2 ring-olive)
- Submit button: Full-width, primary styling
- Info side: Company details, contact numbers, map placeholder

### 9. Language Switcher
- Toggle in top-right of navbar
- EN | DE format with active state
- Smooth content transition when switching
- Store all content in JS objects for instant switching

### 10. Footer
- Three-column layout: Brand info, Quick links, Social/Contact
- Social icons with hover effects
- "A Brand by Moforce Exim" tagline
- Warm beige background

## Animations & Interactions
**Scroll Animations**:
- Fade-in-up for sections as they enter viewport
- Stagger animations for card grids
- Use Intersection Observer API

**Hover States**:
- Cards: scale-105, shadow increase
- Buttons: Background darkening, subtle scale
- Links: Underline slide-in effect

**Transitions**:
- Default: transition-all duration-300 ease-in-out
- Modals: Fade + scale entrance/exit
- Keep animations subtle and premium-feeling

## Images
**Hero Section**: Full-width background image showing Makhana snacks in premium lifestyle setting (bowl of roasted makhana, natural setting, warm lighting)

**Flavour Cards**: Product photography for each of 4 flavours (close-up shots of seasoned makhana with flavour name visible)

**About Section**: Image of Bihar farms/traditional sourcing, premium packaging shots

**Gallery**: 9-12 images mixing product shots, lifestyle scenes, serving suggestions, texture close-ups

**Process Icons**: Use Heroicons for farm, fire/roasting, spice/flavour, box, airplane symbols

## Responsive Breakpoints
- Mobile: < 640px (single column, stacked layouts)
- Tablet: 640px - 1024px (2-column grids)
- Desktop: > 1024px (full multi-column layouts)

## Accessibility
- High contrast between text and backgrounds
- Focus visible states on all interactive elements
- Proper heading hierarchy (h1 → h6)
- Alt text for all images
- Keyboard navigation support
- ARIA labels for language toggle and modals