# CLAUDE.md - K4MERA Website

## Project Overview

Marketing/product showcase website for **K4MERA**, a digital wigglegram camera. The site showcases the product with rich media, interactive components, and device-orientation features.

**Live site:** https://k4mera.world

## Tech Stack

- **Framework:** Astro 5.x (static site generator)
- **Styling:** Tailwind CSS 4.x
- **Build tool:** Vite (integrated with Astro)
- **TypeScript:** Strict mode enabled

## Commands

```bash
npm run dev      # Start dev server (localhost:4321)
npm run build    # Build to ./dist/
npm run preview  # Preview production build
```

## Project Structure

```
src/
├── pages/           # Route pages (.astro files)
│   ├── index.astro  # Homepage with product showcase
│   ├── faq.astro    # FAQ page
│   └── m4gic.astro  # Interactive tilt-based demo
├── components/      # Reusable components
├── layouts/         # BaseLayout.astro (main wrapper)
└── styles/          # global.css (custom theme)

public/
├── assets/          # Images, videos, icons, posts
├── fluid.js         # WebGL fluid background animation
└── m4gic.js         # Device orientation handling
```

## Key Components

| Component | Purpose |
|-----------|---------|
| `Card.astro` | Image/video carousel with auto-advance (10s) |
| `Header.astro` | Fixed navigation header |
| `Footer.astro` | Footer with interactive text expansion |
| `MultiGif.astro` | Rotating GIF display (4s interval) |
| `FaqItem.astro` | FAQ question/answer display |
| `InstagramPost.astro` | Instagram-style post card |
| `InfiniteInstagramPostScroll.astro` | Infinite scrolling feed |

## Styling Conventions

**Prefer Tailwind CSS utility classes** for all styling and layout. Only use custom CSS in global.css when Tailwind utilities are insufficient.

### Custom Colors (defined in global.css)
- `.text-custom-white` - #fffefd
- `.bg-custom-black` / `.text-custom-black` - #2e2e2e
- `.accent-blue` - #3c3e8c
- `.accent-orange` - #ff8a5c
- `.bg-custom-gradient` - Radial gradient with noise overlay

### Fonts
- **Aileron** (`.font-aileron-bold`, `.font-aileron-regular`) - Headlines/branding
- **Inter** (`.font-inter`) - Body text

## Component Patterns

### Type-Safe Props
All components use TypeScript interfaces for props:
```astro
interface Props {
  title: string;
  sources: MediaItem[];
}
```

### Client-Side Interactivity
Use `define:vars` to pass props to inline scripts:
```astro
<script define:vars={{ cardId, slideCount }}>
  // Client-side JS with access to props
</script>
```

### Unique IDs
Generate unique IDs for components that may appear multiple times:
```javascript
const cardId = Math.random().toString(36).substring(2, 9);
```

## Important Notes

- Mobile-first responsive design with media queries for desktop
- Device orientation API used in m4gic.astro for tilt-based image switching
- WebGL fluid animation runs on canvas in BaseLayout
- Google Analytics integrated (GA-GHEF0B28WX)
- Assets organized in public/assets/ by type (images, icons, posts, tilt)