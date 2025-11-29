"use client"

import * as React from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Plus, 
  Trash2, 
  Search, 
  Loader2, 
  Users, 
  Globe 
} from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"

const competitorFormSchema = z.object({
  primaryKeyword: z.string().min(2, "Primary keyword must be at least 2 characters."),
  primaryUrl: z.string().url("Please enter a valid primary URL."),
  competitors: z.array(
    z.object({
      url: z.string().url("Please enter a valid competitor URL.")
    })
  ).max(3, "You can compare up to 3 competitors.")
})

type CompetitorFormValues = z.infer<typeof competitorFormSchema>

interface CompetitorFormProps {
  onComparisonSuccess: (data: any) => void
}

export function CompetitorForm({ onComparisonSuccess }: CompetitorFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<CompetitorFormValues>({
    resolver: zodResolver(competitorFormSchema),
    defaultValues: {
      primaryKeyword: "",
      primaryUrl: "",
      competitors: [{ url: "" }]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "competitors"
  })

  const onSubmit = async (values: CompetitorFormValues) => {
    setIsSubmitting(true)
    setFormError(null)

    const payload = {
      primary_url: values.primaryUrl,
      competitor_urls: values.competitors.map(c => c.url).filter(Boolean),
      primary_keyword: values.primaryKeyword
    }

    try {
      const res = await fetch(`${API_URL}/competitor/compare`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
        credentials: "include"
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || "Failed to execute competitor comparison.")
      }

      onComparisonSuccess(data)
    } catch (err: any) {
      setFormError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const loadSample = () => {
    setValue("primaryKeyword", "SEO content analyzer")
    setValue("primaryUrl", "https://example.com")
    setValue("competitors", [
      { url: "https://ahrefs.com" },
      { url: "https://semrush.com" }
    ])
  }

  return (
    <div className="w-full space-y-6">
      {formError && (
        <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 text-xs text-rose-600 dark:text-rose-400 font-semibold animate-fade-in">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        
        {/* Core parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Target Focus Keyword
            </label>
            <Input
              placeholder="e.g. SEO content analyzer"
              disabled={isSubmitting}
              className="h-10 rounded-lg bg-background/50 border-border focus-visible:ring-indigo-500/50"
              {...register("primaryKeyword")}
            />
            {errors.primaryKeyword && (
              <span className="text-[10px] text-rose-500 font-bold mt-1 block">
                {errors.primaryKeyword.message}
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Primary Website URL
            </label>
            <Input
              placeholder="e.g. https://myblog.com/seo-article"
              disabled={isSubmitting}
              className="h-10 rounded-lg bg-background/50 border-border focus-visible:ring-indigo-500/50"
              {...register("primaryUrl")}
            />
            {errors.primaryUrl && (
              <span className="text-[10px] text-rose-500 font-bold mt-1 block">
                {errors.primaryUrl.message}
              </span>
            )}
          </div>
        </div>

        {/* Competitor URLs section */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Users className="w-4 h-4 text-purple-500" />
              Competitor Websites
            </h4>
            
            {fields.length < 3 && (
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => append({ url: "" })}
                disabled={isSubmitting}
                className="h-8 text-xs font-semibold rounded-lg hover:bg-muted"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Competitor
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-3 animate-fade-in">
                <div className="flex-grow">
                  <Input
                    placeholder={`Competitor URL #${index + 1}`}
                    disabled={isSubmitting}
                    className="h-10 rounded-lg bg-background/50 border-border focus-visible:ring-indigo-500/50"
                    {...register(`competitors.${index}.url` as const)}
                  />
                  {errors.competitors?.[index]?.url && (
                    <span className="text-[10px] text-rose-500 font-bold mt-1 block">
                      {errors.competitors[index]?.url?.message}
                    </span>
                  )}
                </div>

                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="xs"
                    onClick={() => remove(index)}
                    disabled={isSubmitting}
                    className="h-10 w-10 p-0 rounded-lg shrink-0 flex items-center justify-center"
                    title="Remove competitor"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action strip */}
        <div className="flex justify-between items-center pt-4 border-t border-border/40">
          <Button
            type="button"
            variant="outline"
            onClick={loadSample}
            disabled={isSubmitting}
            className="h-10 px-4 text-xs font-semibold rounded-lg hover:bg-muted"
          >
            Load Sample Competitors
          </Button>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-10 px-8 font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg min-w-[150px] shadow-lg shadow-indigo-500/10"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Comparing domains...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Search className="w-4 h-4" />
                Compare Content
              </span>
            )}
          </Button>
        </div>

      </form>
    </div>
  )
}
