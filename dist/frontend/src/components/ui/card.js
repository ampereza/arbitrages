import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
const cardVariants = cva("rounded-xl border bg-card text-card-foreground shadow", {
    variants: {},
    defaultVariants: {},
});
const Card = React.forwardRef(({ className, ...props }, ref) => (<div ref={ref} className={cn(cardVariants({ className }))} {...props}/>));
Card.displayName = "Card";
const CardHeader = React.forwardRef(({ className, ...props }, ref) => (<div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props}/>));
CardHeader.displayName = "CardHeader";
const CardTitle = React.forwardRef(({ className, ...props }, ref) => (<h3 ref={ref} className={cn("font-semibold leading-none tracking-tight", className)} {...props}/>));
CardTitle.displayName = "CardTitle";
const CardDescription = React.forwardRef(({ className, ...props }, ref) => (<p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props}/>));
CardDescription.displayName = "CardDescription";
const CardContent = React.forwardRef(({ className, ...props }, ref) => (<div ref={ref} className={cn("p-6 pt-0", className)} {...props}/>));
CardContent.displayName = "CardContent";
const CardFooter = React.forwardRef(({ className, ...props }, ref) => (<div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props}/>));
CardFooter.displayName = "CardFooter";
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
