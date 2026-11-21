import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-[15px] font-semibold tracking-[-0.01em] cursor-pointer press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-[18px] [&_svg]:shrink-0 [&_svg]:stroke-[1.8]",
  {
    variants: {
      variant: {
        default: "bg-chrome",
        destructive: "bg-destructive/15 text-destructive border border-destructive/30",
        outline: "border border-border bg-white/[0.05] text-foreground",
        secondary: "bg-lime",
        ghost: "text-foreground/80 hover:bg-white/[0.06]",
        link: "text-foreground underline underline-offset-4",
        /* Primary call to action: polished chrome */
        hero: "bg-chrome text-[16px]",
        /* Secondary: quiet tinted fill */
        soft: "border border-border bg-white/[0.07] text-foreground",
        /* Tertiary accent: forest green */
        lime: "bg-lime border border-white/[0.08]",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-3.5 text-[13px]",
        lg: "h-12 px-8",
        xl: "h-14 px-8 text-[17px]",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
