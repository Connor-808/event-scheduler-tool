# Event Scheduler Style Guide

This document outlines the styling conventions used in the Event Scheduler application. Adhering to this guide ensures a consistent and professional user experience across all pages and components.

## Color Palette

The application uses a dynamic color system that adapts between light and dark modes, with vibrant accent colors for interactive elements.

### Base Colors

- **Background**: 
  - Light: `#ffffff` (White)
  - Dark: `#0a0a0a` (Near Black)
  
- **Foreground**: 
  - Light: `#171717` (Near Black)
  - Dark: `#ededed` (Off White)

### Accent Colors

- **Blue (Primary Action)**: 
  - Primary: `bg-blue-600` / `#2563eb`
  - Hover: `bg-blue-700` / `#1d4ed8`
  - Active: `bg-blue-800` / `#1e40af`
  - Light tints: `blue-50/30`, `blue-400`, `blue-500`
  - Used for primary CTAs, active states, and key UI elements

- **Purple (Accent)**: 
  - Primary: `bg-purple-500` / `#a855f7`
  - Variants: `purple-400`, `purple-600`, `purple-950`
  - Used in gradients and decorative elements

- **Pink (Accent)**: 
  - Primary: `bg-pink-500` / `#ec4899`
  - Variants: `pink-400`
  - Used for tertiary accents and visual interest

### Opacity Scale

The application uses foreground color with opacity for text hierarchy:
- **Primary text**: `text-foreground` (100%)
- **Secondary text**: `text-foreground/90` (90%)
- **Tertiary text**: `text-foreground/70` (70%)
- **Muted text**: `text-foreground/60` (60%)
- **Placeholder text**: `text-foreground/40` (40%)
- **Borders**: `border-foreground/10`, `border-foreground/20`, `border-foreground/30`

### Status Colors

- **Destructive/Error**: 
  - Text: `text-red-600`
  - Background: `bg-red-600`, `bg-red-700`, `bg-red-800`

## Typography

The application uses **Geist Sans** for UI elements and **Geist Mono** for monospace text. This modern font stack provides excellent readability across all devices.

### Font Families

- **Sans-serif**: `var(--font-geist-sans)`, `system-ui`, `-apple-system`, `sans-serif`
- **Monospace**: `var(--font-geist-mono)` (for code or technical content)

### Font Sizes and Weights

Typography follows a responsive, mobile-first approach with breakpoints at `640px` (sm) and `1024px` (lg).

| Element               | Mobile Size | Tablet+ Size | Desktop Size | Weight | Line Height | Usage                        |
| --------------------- | ----------- | ------------ | ------------ | ------ | ----------- | ---------------------------- |
| `h1`                  | `2rem`      | `2.5rem`     | `3rem`       | `700`  | `1.1-1.2`   | Main page headings           |
| `h2`                  | `1.5rem`    | `1.875rem`   | —            | `700`  | `1.2`       | Section headings             |
| `h3`                  | `1.25rem`   | `1.5rem`     | —            | `700`  | `1.2`       | Card titles                  |
| Card Title            | `1.25rem`   | `1.5rem`     | —            | `700`  | `tight`     | Component headings           |
| Body Large            | `1.125rem`  | —            | —            | `400`  | `1.6`       | Hero subheadings             |
| Body / Base           | `1rem`      | —            | —            | `400`  | `1.6`       | Default body text            |
| Small                 | `0.875rem`  | —            | —            | `400`  | `1.5`       | Secondary text, labels       |
| Extra Small           | `0.75rem`   | —            | —            | `400`  | `1.5`       | Captions, helper text        |

### Font Weight Scale

- **Regular**: `400` (default body text)
- **Medium**: `500` (emphasized text)
- **Semibold**: `600` (buttons, labels)
- **Bold**: `700` (headings)
- **Black**: `900` (hero headings)

### Letter Spacing

- Headings use `-0.02em` (tight tracking) for modern appearance
- Body text uses normal letter spacing

## Spacing

The application uses a consistent spacing scale based on Tailwind's default scale, with custom CSS variables for specific use cases.

### Custom Spacing Variables

| Variable          | Value   | Usage                                  |
| ----------------- | ------- | -------------------------------------- |
| `--spacing-xs`    | `4px`   | Minimal spacing between tight elements |
| `--spacing-sm`    | `8px`   | Small gaps                             |
| `--spacing-md`    | `16px`  | Standard spacing between elements      |
| `--spacing-lg`    | `24px`  | Larger gaps between sections           |
| `--spacing-xl`    | `32px`  | Extra large section spacing            |
| `--spacing-2xl`   | `48px`  | Maximum spacing for major sections     |

### Responsive Padding & Margins

- **Horizontal page padding**: `px-4 sm:px-6 lg:px-8`
- **Vertical page padding**: `py-8 sm:py-12`
- **Card padding**: `p-4 sm:p-6`
- **Component spacing**: `space-y-6 sm:space-y-8`
- **Button padding**: 
  - Small: `px-4` with `min-h-[44px]`
  - Medium: `px-6` with `min-h-[44px]`
  - Large: `px-8` with `min-h-[48px]`

### Layout

- **Max Width**: `max-w-7xl` (main content), `max-w-3xl` (forms), `max-w-4xl` (hero)
- **Minimum Touch Targets**: 44-48px for mobile accessibility

## Border Radius

Consistent rounded corners create a modern, friendly interface.

### Border Radius Scale

| Variable         | Value  | Tailwind Class | Usage                          |
| ---------------- | ------ | -------------- | ------------------------------ |
| `--radius-sm`    | `8px`  | `rounded-lg`   | Inputs, small elements         |
| `--radius-md`    | `12px` | `rounded-xl`   | Buttons, cards (mobile)        |
| `--radius-lg`    | `16px` | `rounded-2xl`  | Cards (desktop), modals        |
| `--radius-xl`    | `20px` | —              | Large containers               |
| `--radius-2xl`   | `24px` | —              | Extra large rounded elements   |

### Common Patterns

- **Buttons**: `rounded-xl` (12px)
- **Cards**: `rounded-xl sm:rounded-2xl` (12px mobile, 16px desktop)
- **Inputs**: `rounded-lg` (8px)
- **Pills/Badges**: `rounded-full` (fully rounded)
- **Modals**: `rounded-t-2xl sm:rounded-2xl` (top rounded on mobile, all sides on desktop)

## Shadows

The shadow system creates subtle depth and hierarchy.

### Shadow Variables

| Variable       | Light Mode Value                                                        | Usage                    |
| -------------- | ----------------------------------------------------------------------- | ------------------------ |
| `--shadow-sm`  | `0 1px 2px 0 rgb(0 0 0 / 0.05)`                                         | Subtle elevation         |
| `--shadow-md`  | `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`     | Card hover states        |
| `--shadow-lg`  | `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`   | Modals, elevated content |

**Note**: Dark mode uses higher opacity (0.5) for better visibility.

### Usage in Components

- **Cards**: `shadow-sm` default, `hover:shadow-md` on hover
- **Buttons**: `shadow-sm` on primary buttons, `shadow-lg` on CTAs
- **Modals**: `shadow-2xl`
- **Fixed elements**: Use backdrop-blur with shadows

## Components

### Buttons

Buttons follow a semantic variant system with mobile-first sizing.

#### Variants

- **`primary`**:
  - **Background**: `bg-foreground` (inverted)
  - **Text**: `text-background` (inverted)
  - **Hover**: `hover:bg-foreground/90`, `hover:shadow-md`
  - **Active**: `active:scale-[0.98]`, `active:bg-foreground/80`
  - **Focus**: Ring with `focus-visible:ring-foreground`
  - **Usage**: Primary actions, important CTAs

- **`secondary`**:
  - **Background**: `bg-transparent`
  - **Border**: `border-2 border-foreground/20`
  - **Text**: `text-foreground`
  - **Hover**: `hover:bg-foreground/5`, `hover:border-foreground/30`
  - **Usage**: Secondary actions, cancel buttons

- **`tertiary`**:
  - **Background**: Transparent
  - **Text**: `text-foreground`
  - **Hover**: `hover:bg-foreground/10`
  - **Usage**: Less prominent actions, text links

- **`destructive`**:
  - **Background**: `bg-red-600`
  - **Text**: `text-white`
  - **Hover**: `hover:bg-red-700`
  - **Usage**: Delete, remove, or other destructive actions

#### Sizes

| Size   | Height     | Min Height  | Padding | Text Size    | Usage                        |
| ------ | ---------- | ----------- | ------- | ------------ | ---------------------------- |
| `sm`   | `h-10`     | `44px`      | `px-4`  | `text-sm`    | Compact buttons              |
| `md`   | `h-12`     | `44px`      | `px-6`  | `text-base`  | Default buttons              |
| `lg`   | `h-14`     | `48px`      | `px-8`  | `text-base`  | Primary CTAs                 |

**Note**: All buttons have minimum touch targets (44-48px) on mobile for accessibility.

#### Button States

- **Loading**: Shows spinner icon with "Loading..." text
- **Disabled**: `opacity-50`, `pointer-events-none`
- **Active**: Slight scale reduction (`scale-[0.98]`) for tactile feedback

### Cards

Cards are the primary container for grouping related content.

#### Base Card

- **Background**: `bg-background`
- **Border**: `border border-foreground/10`
- **Border Radius**: `rounded-xl sm:rounded-2xl`
- **Padding**: `p-4 sm:p-6`
- **Shadow**: Default `shadow-sm`, hover `shadow-md`
- **Transition**: `transition-shadow duration-200`

#### Card Sub-components

- **CardHeader**: `flex flex-col space-y-2 sm:space-y-1.5`
- **CardTitle**: `text-xl sm:text-2xl font-bold leading-tight tracking-tight`
- **CardDescription**: `text-sm sm:text-base text-foreground/60 leading-relaxed`
- **CardContent**: `pt-3 sm:pt-4`
- **CardFooter**: `flex items-center pt-3 sm:pt-4 gap-2`

### Forms

Form elements prioritize clarity, accessibility, and mobile usability.

#### Input Fields

- **Background**: `bg-background`
- **Border**: `border-2 border-foreground/20`
- **Border Radius**: `rounded-lg`
- **Padding**: `px-4 py-3`
- **Min Height**: `48px` for touch accessibility
- **Placeholder**: `placeholder:text-foreground/40`
- **Focus State**: 
  - `focus:outline-none`
  - `focus:ring-2 focus:ring-foreground/20`
  - `focus:border-foreground`
- **Hover State**: `hover:border-foreground/30`
- **Error State**: `border-red-600`, `focus:ring-red-600/20`

#### Labels

- **Style**: `text-sm font-semibold mb-2 text-foreground`
- **Required indicator**: Red asterisk `text-red-600 ml-1`

#### Helper Text

- **Normal**: `text-sm text-foreground/60 mt-1.5`
- **Error**: `text-sm font-medium text-red-600 mt-2`

#### Date/Time Inputs

- Uses `datetime-local` input type
- Calendar icon positioned absolutely on the left (`left-4`)
- Custom styling to hide native picker indicator (made transparent)

### Modals

Modals follow a mobile-first approach with slide-up animation on mobile and zoom-in on desktop.

- **Backdrop**: `bg-black/60 backdrop-blur-sm`
- **Container**: 
  - Mobile: `rounded-t-2xl` (bottom sheet style)
  - Desktop: `rounded-2xl` (centered modal)
- **Padding**: `p-5 sm:p-6`
- **Max Height**: `max-h-[90vh]` with scroll
- **Animation**: `fade-in-0 slide-in-from-bottom-4 sm:zoom-in-95`
- **Close Button**: Minimum 44px touch target

## Visual Effects

### Background Gradients

The app uses a layered background approach:

1. **Base Gradient**: 
   ```
   Light: from-white via-blue-50/30 to-purple-50/40
   Dark: from-gray-950 via-blue-950/20 to-purple-950/20
   ```

2. **Halftone Dot Pattern**: Overlaid radial gradients with blue and purple dots
3. **Gradient Halftone Effect**: Multiple radial gradients for depth
4. **Soft Gradient Orbs**: Large blurred circles with blue, purple, and pink colors

### Animations

| Animation        | Duration | Easing             | Usage                          |
| ---------------- | -------- | ------------------ | ------------------------------ |
| `animate-spin`   | `1s`     | `linear infinite`  | Loading spinners               |
| `animate-in`     | `0.3s`   | `ease-in`          | Fade in elements               |
| `animate-bounce-in` | `0.6s` | `ease-in-out`     | Hero elements, emphasis        |

**Global Easing**: `cubic-bezier(0.4, 0, 0.2, 1)` on all transitions

### Backdrop Effects

- **Fixed Bottom CTAs**: `bg-background/95 backdrop-blur-md`
- **Modal Backdrop**: `bg-black/60 backdrop-blur-sm`

## Mobile-First Design Principles

### Touch Targets

All interactive elements have minimum 44px height on mobile (48px for primary CTAs) per Apple Human Interface Guidelines.

### Responsive Patterns

- **Bottom-Fixed CTAs**: Primary actions fixed to bottom on mobile, inline on desktop
- **Horizontal Scrolling**: Use `scrollbar-hide` class with touch-friendly scrolling
- **Safe Area Insets**: iOS safe area support with `env(safe-area-inset-*)`
- **Input Font Size**: Minimum 16px to prevent iOS zoom on focus

### Breakpoints

- **Mobile**: Default (< 640px)
- **Tablet**: `sm:` (≥ 640px)
- **Desktop**: `lg:` (≥ 1024px)

## Accessibility

### Focus States

- **Visible Focus**: `focus-visible:outline-none focus-visible:ring-2`
- **Ring Color**: Matches variant (foreground, blue, red, etc.)
- **Ring Offset**: `focus-visible:ring-offset-2`

### Text Contrast

All text maintains WCAG AA contrast ratios:
- Foreground on background meets 4.5:1 minimum
- Muted text (foreground/60) used only for secondary content
- Interactive elements have clear hover and active states

### Keyboard Navigation

- All interactive elements are keyboard accessible
- Modal closes on Escape key
- Focus traps implemented in modals

## Implementation

This style guide is implemented using **Tailwind CSS v4** with the `@tailwindcss/postcss` plugin. Custom CSS variables are defined in `globals.css` and components are built with Tailwind utility classes.

### Key Files

- **`/app/globals.css`**: CSS variables, custom animations, base styles
- **`/components/ui/`**: Reusable component library
- **`/app/layout.tsx`**: Global layout with font loading and background effects

When creating new components, please adhere to these guidelines and use existing Tailwind classes and components to ensure consistency.
