/* // src/components/ui/button-variants.js */
import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  // The base outline-none is important to prevent default browser outlines
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-2 focus-visible:ring-destructive",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground " +
          "outline-2 outline-offset-2 outline-transparent transition-all " + 
          "hover:outline-[hsl(var(--ring)/0.5)] focus-visible:outline-[hsl(var(--ring)/0.5)]",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80 focus-visible:ring-2 focus-visible:ring-ring",
        ghost:
          "hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring",
        link: "text-primary underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring",
        holographic:
          "holographic-border border border-transparent bg-transparent text-white hover:bg-black/30 focus-visible:ring-2 focus-visible:ring-ring",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)