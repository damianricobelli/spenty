import { Toolbar as ToolbarPrimitive } from "@base-ui/react/toolbar";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/cn";

const toolbarButtonVariants = cva(
  "focus-visible:border-ring focus-visible:ring-ring/50 rounded-4xl border border-transparent bg-clip-padding text-sm font-medium focus-visible:ring-[3px] inline-flex items-center justify-center whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 outline-none select-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        ghost:
          "bg-muted/70 hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
      },
      size: {
        default:
          "h-9 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        lg: "h-10 gap-1.5 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Toolbar({ className, ...props }: ToolbarPrimitive.Root.Props) {
  return (
    <ToolbarPrimitive.Root
      data-slot="toolbar"
      className={cn("flex min-w-0 items-center justify-center", className)}
      {...props}
    />
  );
}

function ToolbarButton({
  className,
  variant,
  size,
  ...props
}: ToolbarPrimitive.Button.Props & VariantProps<typeof toolbarButtonVariants>) {
  return (
    <ToolbarPrimitive.Button
      data-slot="toolbar-button"
      className={cn(toolbarButtonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

function ToolbarGroup({ className, ...props }: ToolbarPrimitive.Group.Props) {
  return (
    <ToolbarPrimitive.Group
      data-slot="toolbar-group"
      className={cn("flex items-center", className)}
      {...props}
    />
  );
}

function ToolbarSeparator({
  className,
  ...props
}: ToolbarPrimitive.Separator.Props) {
  return (
    <ToolbarPrimitive.Separator
      data-slot="toolbar-separator"
      className={cn("bg-border mx-1 h-6 w-px", className)}
      {...props}
    />
  );
}

function ToolbarLink({ className, ...props }: ToolbarPrimitive.Link.Props) {
  return (
    <ToolbarPrimitive.Link
      data-slot="toolbar-link"
      className={cn(
        "focus-visible:border-ring focus-visible:ring-ring/50 rounded-4xl px-3 py-2 text-sm outline-none focus-visible:ring-[3px]",
        className,
      )}
      {...props}
    />
  );
}

export {
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarLink,
  ToolbarSeparator,
};
