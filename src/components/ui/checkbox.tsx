"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type CheckboxProps = React.ComponentPropsWithoutRef<
  typeof CheckboxPrimitive.Root
> &
  Pick<
    React.InputHTMLAttributes<HTMLInputElement>,
    "name" | "value" | "onChange" | "onBlur"
  >

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className,
      name,
      value,
      onChange,
      onBlur,
      onCheckedChange,
      checked,
      defaultChecked,
      ...props
    },
    ref
  ) => {
    const inputRef = React.useRef<HTMLInputElement | null>(null)

    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement)

    const handleCheckedChange = (state: CheckboxPrimitive.CheckedState) => {
      onCheckedChange?.(state)
      if (!inputRef.current) return

      const isChecked = state === true
      inputRef.current.checked = isChecked
      inputRef.current.indeterminate = state === "indeterminate"

      if (onChange) {
        const syntheticEvent = {
          target: inputRef.current,
          currentTarget: inputRef.current,
        } as React.ChangeEvent<HTMLInputElement>
        onChange(syntheticEvent)
      }
    }

    const handleBlur = () => {
      if (!inputRef.current || !onBlur) return
      const syntheticEvent = {
        target: inputRef.current,
        currentTarget: inputRef.current,
      } as React.FocusEvent<HTMLInputElement>
      onBlur(syntheticEvent)
    }

    return (
      <>
        <CheckboxPrimitive.Root
          data-slot="checkbox"
          className={cn(
            "peer border-input dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          checked={checked}
          defaultChecked={defaultChecked}
          onCheckedChange={handleCheckedChange}
          onBlur={handleBlur}
          {...props}
        >
          <CheckboxPrimitive.Indicator
            data-slot="checkbox-indicator"
            className="flex items-center justify-center text-current transition-none"
          >
            <CheckIcon className="size-3.5" />
          </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
        <input
          type="checkbox"
          ref={(node) => {
            inputRef.current = node
            if (typeof ref === "function") {
              ref(node)
            } else if (ref) {
              ref.current = node
            }
          }}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          checked={typeof checked === "boolean" ? checked : undefined}
          defaultChecked={
            typeof checked === "boolean" ? undefined : (defaultChecked as boolean | undefined)
          }
        />
      </>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
