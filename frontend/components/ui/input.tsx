"use client"

import * as React from "react"

import { formatCep, formatPhone, toUppercaseValue } from "@/lib/form-formatters"
import { cn } from "@/lib/utils"

type InputMask = "phone" | "cep"

type InputProps = React.ComponentProps<"input"> & {
  forceUppercase?: boolean
  preserveCase?: boolean
  mask?: InputMask
}

function Input({
  className,
  type,
  onChange,
  forceUppercase,
  preserveCase,
  mask,
  ...props
}: InputProps) {
  const shouldUppercase =
    forceUppercase ??
    (!preserveCase &&
      !["email", "password", "url", "number", "date", "datetime-local", "time"].includes(type ?? "text"));

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let nextValue = event.target.value;

    if (mask === "phone") {
      nextValue = formatPhone(nextValue);
    }

    if (mask === "cep") {
      nextValue = formatCep(nextValue);
    }

    if (shouldUppercase) {
      nextValue = toUppercaseValue(nextValue);
    }

    if (nextValue !== event.target.value) {
      event.target.value = nextValue;
    }

    onChange?.(event);
  };

  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        shouldUppercase && "uppercase",
        className
      )}
      onChange={handleChange}
      {...props}
    />
  )
}

export { Input }
