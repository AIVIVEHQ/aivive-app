# Homepage Generation Component Usage

## Overview
The `HomepageGeneration` component provides an interactive AI image generation experience on the homepage, designed to convert visitors into users by showcasing the core product value immediately.

## Installation
The component is already integrated into the homepage at `src/app/[locale]/(default)/page.tsx`.

## Structure
```
src/components/blocks/homepage-generation/
├── index.tsx          # Server component (auth + data fetching)
├── client.tsx         # Client component (UI + interactions)
└── README.md          # This documentation
```

## Props
The server component accepts no props. It handles:
- User authentication detection via NextAuth
- Credit balance fetching for authenticated users
- Error handling for credit service failures

## Usage Examples

### Basic Usage (Already Implemented)
```tsx
// src/app/[locale]/(default)/page.tsx
import HomepageGeneration from "@/components/blocks/homepage-generation";

export default function LandingPage() {
  return (
    <>
      <HomepageGeneration />
      {/* Other page sections */}
    </>
  );
}
```

### Custom Implementation
```tsx
import HomepageGeneration from "@/components/blocks/homepage-generation";

export default function CustomPage() {
  return (
    <section className="py-16">
      <HomepageGeneration />
    </section>
  );
}
```

## User Experience

### Guest Users
- Interactive example prompts with click-to-select
- Copy-to-clipboard functionality
- Visual feedback for selected prompts
- Sign-in CTA with credit bonus information
- Prompt persistence across authentication

### Authenticated Users
- Full generation form integration
- Credit balance display
- Error handling for credit issues
- Quick access to gallery and history

## Features
- **Responsive Design**: Mobile-first approach with progressive enhancement
- **Performance Optimized**: Code splitting with dynamic imports
- **Internationalization**: Full i18n support for English and Chinese
- **Error Handling**: Graceful degradation and user-friendly error messages
- **Accessibility**: Semantic HTML and keyboard navigation support

## Translations
The component uses the following translation keys:
- `homepage.generation.title`
- `homepage.generation.subtitle`
- `homepage.generation.try_these`
- `homepage.generation.example_1/2/3`
- `homepage.generation.cta_guest/bonus`
- `homepage.generation.credit_balance/buy_credits`
- `homepage.generation.view_history/gallery`

## Dependencies
- NextAuth.js (authentication)
- Sonner (toast notifications)
- Lucide React (icons)
- Tailwind CSS (styling)
- next-intl (internationalization)

## Browser Support
- Chrome 90+
- Safari 14+
- Firefox 88+
- Edge 90+

## Performance
- Initial load: ~50KB gzipped
- Dynamic loading: GenerationForm loads on-demand
- Skeleton states: Perceived performance optimization
- Error boundaries: Graceful error handling