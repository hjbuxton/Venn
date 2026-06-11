import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full h-11 rounded-xl border border-line bg-white px-4 text-sm text-ink placeholder:text-ink-3 outline-none transition-shadow focus:border-brand focus:ring-4 focus:ring-brand-light",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-3 outline-none transition-shadow focus:border-brand focus:ring-4 focus:ring-brand-light resize-none",
        className
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export function Label({
  children,
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("block text-sm font-semibold text-ink mb-2", className)}
      {...props}
    >
      {children}
    </label>
  );
}
