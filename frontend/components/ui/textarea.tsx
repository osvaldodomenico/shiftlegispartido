"use client"

import * as React from "react"

import { toUppercaseValue } from "@/lib/form-formatters"
import { cn } from "@/lib/utils"

type TextareaProps = React.ComponentProps<"textarea"> & {
  forceUppercase?: boolean
  preserveCase?: boolean
}

function Textarea({
  className,
  onChange,
  forceUppercase,
  preserveCase,
  ...props
}: TextareaProps) {
  const shouldUppercase = forceUppercase ?? !preserveCase;

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (shouldUppercase) {
      const nextValue = toUppercaseValue(event.target.value);
      if (nextValue !== event.target.value) {
        event.target.value = nextValue;
      }
    }

    onChange?.(event);
  };

  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        shouldUppercase && "uppercase",
        className
      )}
      onChange={handleChange}
      {...props}
    />
  )
}

export { Textarea }
