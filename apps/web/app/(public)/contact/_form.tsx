"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "convex/react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { api } from "@repo/backend/convex/_generated/api"
import { Button } from "@repo/ui/components/button"
import { Input } from "@repo/ui/components/input"
import { Label } from "@repo/ui/components/label"
import { Textarea } from "@repo/ui/components/textarea"
import { cn } from "@repo/ui/lib/utils"

import { contact } from "../_content/fr"

const FORM = contact.form

const schema = z.object({
  category: z.enum(FORM.categories.map((c) => c.value) as [string, ...string[]]),
  name: z.string().trim().min(2, FORM.validation.nameMin),
  email: z.string().trim().email(FORM.validation.emailInvalid),
  subject: z.string().trim().min(3, FORM.validation.subjectMin),
  message: z.string().trim().min(10, FORM.validation.messageMin),
})

type FormValues = z.infer<typeof schema>

export function ContactForm() {
  const submitContact = useMutation(api.contact.submitContactRequest)
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: FORM.categories[0].value,
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  })

  const selectedCategory = watch("category")

  const onSubmit = handleSubmit(async (values) => {
    try {
      await submitContact({
        category: values.category as
          | "citoyen"
          | "administration"
          | "presse"
          | "securite",
        name: values.name,
        email: values.email,
        subject: values.subject,
        message: values.message,
      })
      toast.success(FORM.successTitle, { description: FORM.successDescription })
      reset()
    } catch (err) {
      toast.error(FORM.errorTitle, {
        description:
          err instanceof Error && err.message
            ? err.message
            : FORM.errorDescription,
      })
    }
  })

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      className="space-y-5"
      aria-label={FORM.title}
    >
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-foreground">
          {FORM.categoryLabel}
        </legend>
        <div
          role="radiogroup"
          aria-label={FORM.categoryLabel}
          className="flex flex-wrap gap-2"
        >
          {FORM.categories.map((category) => {
            const active = selectedCategory === category.value
            return (
              <button
                key={category.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() =>
                  setValue("category", category.value, {
                    shouldValidate: true,
                  })
                }
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  active
                    ? "border-idn-green bg-idn-green text-white"
                    : "border-border bg-card text-foreground/80 hover:border-idn-green/40 hover:text-foreground",
                )}
              >
                {category.label}
              </button>
            )
          })}
        </div>
      </fieldset>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="contact-name">{FORM.nameLabel}</Label>
          <Input
            id="contact-name"
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "contact-name-error" : undefined}
            {...register("name")}
          />
          {errors.name && (
            <p id="contact-name-error" className="text-xs text-destructive">
              {errors.name.message}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact-email">{FORM.emailLabel}</Label>
          <Input
            id="contact-email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "contact-email-error" : undefined}
            {...register("email")}
          />
          {errors.email && (
            <p id="contact-email-error" className="text-xs text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contact-subject">{FORM.subjectLabel}</Label>
        <Input
          id="contact-subject"
          aria-invalid={Boolean(errors.subject)}
          aria-describedby={
            errors.subject ? "contact-subject-error" : undefined
          }
          {...register("subject")}
        />
        {errors.subject && (
          <p id="contact-subject-error" className="text-xs text-destructive">
            {errors.subject.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contact-message">{FORM.messageLabel}</Label>
        <Textarea
          id="contact-message"
          rows={6}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={
            errors.message ? "contact-message-error" : undefined
          }
          {...register("message")}
        />
        {errors.message && (
          <p id="contact-message-error" className="text-xs text-destructive">
            {errors.message.message}
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? FORM.submitting : FORM.submit}
        </Button>
      </div>
    </form>
  )
}
