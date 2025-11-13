"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Sparkles, 
  Copy, 
  Check, 
  Lightbulb, 
  AlertTriangle, 
  ArrowRight, 
  BookOpen, 
  FileText,
  FileEdit
} from "lucide-react"

interface TitleVariant {
  variant: string
  rationale: string
}

interface MetaVariant {
  variant: string
  rationale: string
}

interface RewriteSuggestion {
  section: string
  original_excerpt: string
  suggested_rewrite: string
  reason: string
}

interface AISuggestionsData {
  title_suggestions: TitleVariant[]
  meta_suggestions: MetaVariant[]
  rewrite_suggestions: RewriteSuggestion[]
  missing_keywords: string[]
  readability_tips: string[]
}

interface AISuggestionsProps {
  suggestions: AISuggestionsData
  currentTitle?: string
  currentMeta?: string
  isLoading?: boolean
}

export function AISuggestions({ 
  suggestions, 
  currentTitle = "None found", 
  currentMeta = "None found",
  isLoading = false 
}: AISuggestionsProps) {
  const [copiedText, setCopiedText] = React.useState<string | null>(null)

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(id)
    setTimeout(() => setCopiedText(null), 2000)
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Loading skeletons */}
        <div className="h-44 bg-muted/40 border border-border rounded-xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-60 bg-muted/40 border border-border rounded-xl"></div>
          <div className="h-60 bg-muted/40 border border-border rounded-xl"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Title & Description Suggestions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Title suggestions Card */}
        <Card className="border-border/60 bg-card/30 backdrop-blur-sm shadow-lg">
          <CardHeader className="border-b border-border/40 bg-muted/10 pb-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              AI Optimized Titles
            </CardTitle>
            <CardDescription className="text-xs truncate">
              Original: <span className="italic text-muted-foreground">"{currentTitle}"</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {suggestions.title_suggestions?.map((item, i) => {
              const id = `title-${i}`
              return (
                <div key={id} className="p-3.5 rounded-xl border border-border/60 bg-background/30 space-y-2 relative group hover:border-indigo-500/30 transition-all">
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-xs font-bold text-foreground pr-8 leading-relaxed">
                      {item.variant}
                    </span>
                    <button
                      onClick={() => handleCopy(item.variant, id)}
                      className="absolute top-3.5 right-3.5 p-1.5 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Copy variant to clipboard"
                    >
                      {copiedText === id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    <span className="font-bold text-indigo-500">Rationale:</span> {item.rationale}
                  </p>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Meta Description Suggestions Card */}
        <Card className="border-border/60 bg-card/30 backdrop-blur-sm shadow-lg">
          <CardHeader className="border-b border-border/40 bg-muted/10 pb-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <FileEdit className="w-4 h-4 text-purple-500" />
              AI Optimized Meta Descriptions
            </CardTitle>
            <CardDescription className="text-xs truncate">
              Original: <span className="italic text-muted-foreground">"{currentMeta}"</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {suggestions.meta_suggestions?.map((item, i) => {
              const id = `meta-${i}`
              return (
                <div key={id} className="p-3.5 rounded-xl border border-border/60 bg-background/30 space-y-2 relative group hover:border-purple-500/30 transition-all">
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-xs text-foreground pr-8 leading-relaxed font-medium">
                      {item.variant}
                    </span>
                    <button
                      onClick={() => handleCopy(item.variant, id)}
                      className="absolute top-3.5 right-3.5 p-1.5 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Copy variant to clipboard"
                    >
                      {copiedText === id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    <span className="font-bold text-purple-500">Rationale:</span> {item.rationale}
                  </p>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* Structured Content Rewrite Suggestions */}
      {suggestions.rewrite_suggestions?.length > 0 && (
        <Card className="border-border/80 bg-card/40 backdrop-blur-sm shadow-xl">
          <CardHeader className="border-b border-border/40 pb-4 bg-muted/10">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-500 animate-pulse" />
              Content Block Rewrites
            </CardTitle>
            <CardDescription>
              Suggestions for weaker, under-optimized, or structural sections of your content.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {suggestions.rewrite_suggestions.map((item, i) => {
              const id = `rewrite-${i}`
              return (
                <div key={id} className="space-y-4 pb-6 border-b border-border/45 last:border-b-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-indigo-500/20 text-indigo-500 bg-indigo-500/5">
                      {item.section}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-semibold leading-relaxed">
                      💡 {item.reason}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Before block */}
                    <div className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-lg text-xs leading-relaxed text-muted-foreground">
                      <span className="block text-[9px] font-bold text-rose-500/80 uppercase tracking-wider mb-1.5">Original copy excerpt</span>
                      {item.original_excerpt}
                    </div>

                    {/* After block */}
                    <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg text-xs leading-relaxed text-foreground relative group">
                      <span className="block text-[9px] font-bold text-emerald-500/80 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        AI Recommended rewrite
                      </span>
                      {item.suggested_rewrite}
                      
                      <button
                        onClick={() => handleCopy(item.suggested_rewrite, id)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all"
                        title="Copy rewrite"
                      >
                        {copiedText === id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Bottom Checklist and Keywords grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Missing Keywords Card */}
        <Card className="border-border/60 bg-card/30 backdrop-blur-sm shadow-md">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              Missing Keyword Gaps
            </CardTitle>
            <CardDescription>
              Semantically relevant terms Claude detected missing in your body text copy.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {suggestions.missing_keywords?.map((kw, i) => (
                <Badge key={i} variant="secondary" className="px-2.5 py-1 text-xs rounded-lg bg-background hover:bg-muted border border-border font-medium">
                  {kw}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Readability Tips Card */}
        <Card className="border-border/60 bg-card/30 backdrop-blur-sm shadow-md">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-500" />
              Readability & Flow Tips
            </CardTitle>
            <CardDescription>
              Specific layout or copy improvements targeting Flesch reading index ease.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {suggestions.readability_tips?.map((tip, i) => (
              <div key={i} className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                <ArrowRight className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>{tip}</span>
              </div>
            ))}
          </CardContent>
        </Card>

      </div>

    </div>
  )
}
