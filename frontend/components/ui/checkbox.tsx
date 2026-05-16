"use client"

import * as React from "react"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  checked,
  defaultChecked,
  onCheckedChange,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "onChange"> & {
  onCheckedChange?: (checked: boolean) => void
}) {
  return (
    <label
      data-slot="checkbox"
      className={cn(
        "peer relative inline-flex size-4 shrink-0 items-center justify-center overflow-hidden rounded-[4px] border border-neutral-500 bg-white dark:bg-slate-900",
        "focus-within:ring-[3px] focus-within:ring-ring/50 focus-within:border-ring",
        "has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50",
        className
      )}
    >
      <input
        type="checkbox"
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        checked={checked}
        defaultChecked={defaultChecked}
        onChange={(event) => onCheckedChange?.(event.target.checked)}
        {...props}
      />
      <CheckIcon
        className={cn(
          "pointer-events-none size-3 text-primary transition-opacity",
          checked || defaultChecked ? "opacity-100" : "opacity-0"
        )}
      />
    </label>
  )
}

export { Checkbox }
