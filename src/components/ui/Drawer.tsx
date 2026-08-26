"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const Drawer = DialogPrimitive.Root;
export const DrawerTrigger = DialogPrimitive.Trigger;
export const DrawerClose = DialogPrimitive.Close;

const drawerVariants = cva(
  "fixed z-(--z-modal) flex flex-col gap-4 border-border bg-surface-raised p-6 shadow-xl",
  {
    variants: {
      side: {
        right: "inset-y-0 right-0 h-full w-full max-w-sm border-l animate-fade-in",
        left: "inset-y-0 left-0 h-full w-full max-w-sm border-r animate-fade-in",
        bottom: "inset-x-0 bottom-0 max-h-[85vh] border-t rounded-t-xl animate-slide-up",
      },
    },
    defaultVariants: { side: "right" },
  },
);

export interface DrawerContentProps
  extends
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
    VariantProps<typeof drawerVariants> {}

export const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DrawerContentProps
>(({ className, side, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="animate-fade-in fixed inset-0 z-(--z-overlay) bg-black/50" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(drawerVariants({ side }), className)}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute top-4 right-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus-ring)">
        <X className="size-4" />
        <span className="sr-only">Fechar</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
DrawerContent.displayName = "DrawerContent";

export const DrawerTitle = DialogPrimitive.Title;
export const DrawerDescription = DialogPrimitive.Description;
