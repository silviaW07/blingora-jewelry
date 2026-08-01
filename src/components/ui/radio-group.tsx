"use client"

import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { CircleIcon } from "lucide-react"
import { clsx, type ClassValue } from "clsx"

import { cn } from "@/lib/utils"

/** sr-only 与默认的 size-4 不会被 tailwind-merge 去重；合并后尺寸类会压过 sr-only，留下 absolute + 16px 圆，叠在自定义卡片文案上。 */
function hasSrOnly(className: ClassValue) {
  return /\bsr-only\b/.test(clsx(className))
}

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("grid gap-3", className)}
      {...props}
    />
  )
}

function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  const visuallyHidden = hasSrOnly(className)
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        "text-primary outline-none focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        !visuallyHidden &&
          "border-input aspect-square size-4 shrink-0 rounded-full border shadow-xs transition-[color,box-shadow]",
        className
      )}
      {...props}
    >
      {/* sr-only 场景由页面自己做选中态（如右侧小圆点），不要再画 Indicator，否则会与自定义装饰重复成「两个点」 */}
      {!visuallyHidden && (
        <RadioGroupPrimitive.Indicator
          data-slot="radio-group-indicator"
          className="relative flex items-center justify-center"
        >
          <CircleIcon className="fill-primary absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2" />
        </RadioGroupPrimitive.Indicator>
      )}
    </RadioGroupPrimitive.Item>
  )
}

export { RadioGroup, RadioGroupItem }
