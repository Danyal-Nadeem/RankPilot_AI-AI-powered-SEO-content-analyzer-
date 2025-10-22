"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Globe, FileText, Loader2, Sparkles, RefreshCw } from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"

const urlSchema = z.object({
  url: z.string().url("Please enter a valid URL starting with http:// or https://"),
})

const contentSchema = z.object({
  rawContent: z.string().min(10, "Content must be at least 10 characters long."),
  isHtml: z.boolean(),
})

type UrlFormValues = z.infer<typeof urlSchema>
type ContentFormValues = z.infer<typeof contentSchema>

interface ScrapeFormProps {
  onScrapeSuccess: (data: any) => void
}

export function ScrapeForm({ onScrapeSuccess }: ScrapeFormProps) {
  const [activeTab, setActiveTab] = React.useState<"url" | "content">("url")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [scanStep, setScanStep] = React.useState(0)
  const [formError, setFormError] = React.useState<string | null>(null)

  const scanSteps = [
    "Contacting target server...",
    "Verifying robots.txt permissions...",
    "Downloading HTML payload...",
    "Extracting page headings & title data...",
    "Evaluating inline images and alt descriptions...",
    "Generating local content preview indices..."
  ]

  React.useEffect(() => {
    let interval: NodeJS.Timeout
    if (isSubmitting && activeTab === "url") {
      interval = setInterval(() => {
        setScanStep((prev) => {
          if (prev < scanSteps.length - 1) {
            return prev + 1
          }
          return prev
        })
      }, 900)
    }
    return () => clearInterval(interval)
  }, [isSubmitting, activeTab])

  const {
    register: registerUrl,
    handleSubmit: handleSubmitUrl,
    formState: { errors: urlErrors },
    setValue: setUrlValue,
  } = useForm<UrlFormValues>({
    resolver: zodResolver(urlSchema),
  })

  const {
    register: registerContent,
    handleSubmit: handleSubmitContent,
    formState: { errors: contentErrors },
    setValue: setContentValue,
  } = useForm<ContentFormValues>({
    resolver: zodResolver(contentSchema),
    defaultValues: {
      rawContent: "",
      isHtml: false,
    }
  })

  const onUrlSubmit = async (values: UrlFormValues) => {
    setIsSubmitting(true)
    setFormError(null)
    setScanStep(0)
    try {
      const res = await fetch(`${API_URL}/scrape/url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: values.url }),
        credentials: "include",
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || "Failed to parse target URL.")
      }

      onScrapeSuccess(data)
    } catch (err: any) {
      setFormError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const onContentSubmit = async (values: ContentFormValues) => {
    setIsSubmitting(true)
    setFormError(null)
    try {
      const res = await fetch(`${API_URL}/scrape/content`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          raw_content: values.rawContent,
          is_html: values.isHtml,
        }),
        credentials: "include",
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || "Failed to process raw text.")
      }

      onScrapeSuccess(data)
    } catch (err: any) {
      setFormError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const loadSampleUrl = () => {
    setUrlValue("url", "https://example.com")
  }

  const loadSampleContent = () => {
    setContentValue(
      "rawContent",
      `<h1>Optimize your site structure</h1>
<p>SEO content analysis is highly crucial for modern search ranking processes. You should construct clear structural titles, use distinct header tags, and ensure image descriptions include focus terms.</p>
<h2>Key competitor metrics</h2>
<p>Audit competitor domains to evaluate missing topics. Integrate relevant LSI search intent inside your subheadings.</p>`
    )
    setContentValue("isHtml", true)
  }

  return (
    <div className="w-full space-y-6">
      {formError && (
        <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 text-xs text-rose-600 dark:text-rose-400 font-semibold">
          {formError}
        </div>
      )}

      <Tabs defaultValue="url" onValueChange={(val) => setActiveTab(val as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-xl mb-4">
          <TabsTrigger value="url" className="rounded-lg text-xs font-semibold py-2">
            <Globe className="w-3.5 h-3.5 mr-2" />
            Analyze URL
          </TabsTrigger>
          <TabsTrigger value="content" className="rounded-lg text-xs font-semibold py-2">
            <FileText className="w-3.5 h-3.5 mr-2" />
            Paste Content
          </TabsTrigger>
        </TabsList>

        <TabsContent value="url" className="focus-visible:ring-0 focus-visible:ring-offset-0">
          <form onSubmit={handleSubmitUrl(onUrlSubmit)} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-grow">
              <Input
                placeholder="e.g. https://myblogsite.com/seo-guide"
                disabled={isSubmitting}
                className="h-11 rounded-lg bg-background/50 border-border focus-visible:ring-indigo-500/50"
                {...registerUrl("url")}
              />
              {urlErrors.url && (
                <span className="text-[10px] text-rose-500 font-bold mt-1 block">
                  {urlErrors.url.message}
                </span>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={loadSampleUrl}
                disabled={isSubmitting}
                className="h-11 px-4 text-xs font-semibold rounded-lg hover:bg-muted"
              >
                Sample URL
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-11 px-6 font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg min-w-[120px]"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Fetching...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Search className="h-4 w-4" />
                    Scan URL
                  </span>
                )}
              </Button>
            </div>
          </form>

          {isSubmitting && activeTab === "url" && (
            <div className="mt-4 p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Auditing server and pipeline configuration...</span>
                <span>{Math.round(((scanStep + 1) / scanSteps.length) * 100)}%</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${((scanStep + 1) / scanSteps.length) * 100}%` }}
                />
              </div>
              <p className="text-xs font-bold text-indigo-500 dark:text-indigo-400 animate-pulse">
                {scanSteps[scanStep]}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="content" className="focus-visible:ring-0 focus-visible:ring-offset-0">
          <form onSubmit={handleSubmitContent(onContentSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <textarea
                placeholder="Paste your raw HTML page body or draft plain text here..."
                disabled={isSubmitting}
                className="w-full h-44 p-3 text-sm rounded-lg bg-background/50 border border-border focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all font-sans"
                {...registerContent("rawContent")}
              />
              {contentErrors.rawContent && (
                <span className="text-[10px] text-rose-500 font-bold mt-1 block">
                  {contentErrors.rawContent.message}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isHtml"
                  disabled={isSubmitting}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  {...registerContent("isHtml")}
                />
                <label htmlFor="isHtml" className="text-xs text-muted-foreground font-semibold">
                  This content contains raw HTML tags
                </label>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={loadSampleContent}
                  disabled={isSubmitting}
                  className="h-10 px-4 text-xs font-semibold rounded-lg hover:bg-muted"
                >
                  Load Sample draft
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 px-6 font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg min-w-[120px]"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Parsing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4" />
                      Parse Content
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  )
}
