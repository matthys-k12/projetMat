# Intégration React · Tailwind · shadcn/ui

Les tokens de ce système se branchent sur les variables standard de shadcn/ui : les composants générés par `npx shadcn@latest add button input select textarea tabs switch table dialog alert-dialog sonner skeleton avatar badge dropdown-menu sheet pagination` prennent directement les bonnes couleurs. Les extensions (`success`, `warning`, `*-subtle`, `*-text`, `*-border`, `panel`) servent aux statuts.

## Correspondance tokens → shadcn

| Token IT Request | Variable shadcn | Classe Tailwind |
| --- | --- | --- |
| `background` | `--background` | `bg-background` |
| `surface` | `--card`, `--popover` | `bg-card` |
| `subtle` | `--muted`, `--accent`, `--secondary` | `bg-muted` |
| `border` | `--border` | `border-border` |
| `border-input` | `--input` | `border-input` |
| `text` | `--foreground` | `text-foreground` |
| `muted` | `--muted-foreground` | `text-muted-foreground` |
| `muted-strong` | `--muted-strong` | `text-muted-strong` |
| `primary` / `on-primary` | `--primary` / `--primary-foreground` | `bg-primary text-primary-foreground` |
| `danger` | `--destructive` | `bg-destructive` |
| focus | `--ring` = primary | `ring-2 ring-ring ring-offset-2` |

## globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* shadcn/ui */
    --background: 210 40% 98%; /* #f8fafc */
    --foreground: 222.2 47.4% 11.2%; /* #0f172a */
    --card: 0 0% 100%; /* #ffffff */
    --card-foreground: 222.2 47.4% 11.2%; /* #0f172a */
    --popover: 0 0% 100%; /* #ffffff */
    --popover-foreground: 222.2 47.4% 11.2%; /* #0f172a */
    --primary: 221.2 83.2% 53.3%; /* #2563eb */
    --primary-foreground: 0 0% 100%; /* #ffffff */
    --secondary: 210 40% 96.1%; /* #f1f5f9 */
    --secondary-foreground: 222.2 47.4% 11.2%; /* #0f172a */
    --muted: 210 40% 96.1%; /* #f1f5f9 */
    --muted-foreground: 215.4 16.3% 46.9%; /* #64748b */
    --accent: 210 40% 96.1%; /* #f1f5f9 */
    --accent-foreground: 222.2 47.4% 11.2%; /* #0f172a */
    --destructive: 0 72.2% 50.6%; /* #dc2626 */
    --destructive-foreground: 0 0% 100%; /* #ffffff */
    --border: 214.3 31.8% 91.4%; /* #e2e8f0 */
    --input: 216 16.4% 58.2%; /* #8391a6 */
    --ring: 221.2 83.2% 53.3%; /* #2563eb */
    /* IT Request — extensions */
    --primary-hover: 224.3 76.3% 48%; /* #1d4ed8 */
    --primary-subtle: 213.8 100% 96.9%; /* #eff6ff */
    --primary-text: 224.3 76.3% 48%; /* #1d4ed8 */
    --primary-border: 213.3 96.9% 87.3%; /* #bfdbfe */
    --muted-strong: 215.3 19.3% 34.5%; /* #475569 */
    --success: 142.1 76.2% 36.3%; /* #16a34a */
    --success-subtle: 138.5 76.5% 96.7%; /* #f0fdf4 */
    --success-text: 142.4 71.8% 29.2%; /* #15803d */
    --success-border: 141 78.9% 85.1%; /* #bbf7d0 */
    --warning: 32.1 94.6% 43.7%; /* #d97706 */
    --warning-subtle: 48 100% 96.1%; /* #fffbeb */
    --warning-text: 26 90.5% 37.1%; /* #b45309 */
    --warning-border: 48 96.6% 76.7%; /* #fde68a */
    --danger-subtle: 0 85.7% 97.3%; /* #fef2f2 */
    --danger-text: 0 73.7% 41.8%; /* #b91c1c */
    --danger-border: 0 96.3% 89.4%; /* #fecaca */
    --neutral-dot: 215 20.2% 65.1%; /* #94a3b8 */
    --panel: 222.2 47.4% 11.2%; /* #0f172a */
    --panel-foreground: 210 40% 98%; /* #f8fafc */
    --panel-muted: 215 20.2% 65.1%; /* #94a3b8 */
    --radius: 0.625rem; /* 10px : cartes, dialogs (rounded-lg) ; rounded-md = 6px */
  }

  * { @apply border-border; }
  body { @apply bg-background text-foreground font-sans text-sm antialiased; font-feature-settings: "cv11", "ss01"; }
  :focus-visible { @apply outline-none ring-2 ring-ring ring-offset-2 ring-offset-background; }
}
```

## tailwind.config.ts

```ts
import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "2rem", screens: { "2xl": "1256px" } },
    extend: {
      fontFamily: {
        sans: ["Inter", ...fontFamily.sans],
        mono: ["JetBrains Mono", ...fontFamily.mono],
      },
      fontSize: {
        h1: ["24px", { lineHeight: "32px", fontWeight: "600", letterSpacing: "-0.012em" }],
        h2: ["20px", { lineHeight: "28px", fontWeight: "600", letterSpacing: "-0.01em" }],
        h3: ["16px", { lineHeight: "24px", fontWeight: "600" }],
        body: ["14px", { lineHeight: "20px" }],
        small: ["13px", { lineHeight: "18px" }],
        caption: ["12px", { lineHeight: "16px" }],
        label: ["13px", { lineHeight: "18px", fontWeight: "500" }],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))", hover: "hsl(var(--primary-hover))", subtle: "hsl(var(--primary-subtle))", text: "hsl(var(--primary-text))", border: "hsl(var(--primary-border))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))", strong: "hsl(var(--muted-strong))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))", subtle: "hsl(var(--danger-subtle))", text: "hsl(var(--danger-text))", border: "hsl(var(--danger-border))" },
        success: { DEFAULT: "hsl(var(--success))", subtle: "hsl(var(--success-subtle))", text: "hsl(var(--success-text))", border: "hsl(var(--success-border))" },
        warning: { DEFAULT: "hsl(var(--warning))", subtle: "hsl(var(--warning-subtle))", text: "hsl(var(--warning-text))", border: "hsl(var(--warning-border))" },
        neutral: { dot: "hsl(var(--neutral-dot))" },
        panel: { DEFAULT: "hsl(var(--panel))", foreground: "hsl(var(--panel-foreground))", muted: "hsl(var(--panel-muted))" },
      },
      borderRadius: {
        lg: "var(--radius)",               /* 10px — cartes, dialogs, toasts */
        md: "calc(var(--radius) - 4px)",   /* 6px — boutons, inputs */
        sm: "calc(var(--radius) - 6px)",   /* 4px — segmented items, miniatures */
      },
      boxShadow: {
        sm: "0 1px 2px rgba(15, 23, 42, 0.06)",
        DEFAULT: "0 1px 2px rgba(15, 23, 42, 0.06)",
      },
      spacing: { sidebar: "248px", header: "64px", touch: "44px" },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
```

## Badge de statut (exemple)

```tsx
const requestStatus = {
  PENDING:   { label: "En attente", className: "bg-warning-subtle text-warning-text border-warning-border", dot: "bg-warning" },
  APPROVED:  { label: "Approuvée",  className: "bg-primary-subtle text-primary-text border-primary-border", dot: "bg-primary" },
  DELIVERED: { label: "Remise",     className: "bg-success-subtle text-success-text border-success-border", dot: "bg-success" },
  REFUSED:   { label: "Refusée",    className: "bg-destructive-subtle text-destructive-text border-destructive-border", dot: "bg-destructive" },
  CANCELLED: { label: "Annulée",    className: "bg-muted text-muted-strong border-border", dot: "bg-neutral-dot" },
} as const;

export function StatusBadge({ status }: { status: keyof typeof requestStatus }) {
  const s = requestStatus[status];
  return (
    <Badge variant="outline" className={cn("h-[22px] gap-1.5 rounded-full px-2 text-caption font-medium", s.className)}>
      <span aria-hidden className={cn("size-1.5 rounded-full", s.dot)} />
      {s.label}
    </Badge>
  );
}
```

## Conventions

- Boutons : `size="default"` (h-9) sur desktop, `size="lg"` (h-11) en mobile. Variante `destructive` réservée aux confirmations ; « Refuser » = `variant="outline"` + `border-destructive text-destructive-text hover:bg-destructive-subtle`.
- Cartes : `rounded-lg border bg-card shadow-sm`, en-tête `px-5 py-4 border-b`.
- Tableaux : `TableHead` en `h-10 text-caption font-medium text-muted-foreground bg-background`, `TableCell` en `h-[52px]` (`h-12` pour l’admin).
- Toasts : `sonner` en `position="bottom-right"`, `richColors` désactivé (seule l'icône est colorée).
- Icônes : `lucide-react`, `className="size-4"` (16px) par défaut.
