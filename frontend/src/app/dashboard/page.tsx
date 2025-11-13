"use client"

import * as React from "react"
import { useAuth } from "@/context/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { Navbar } from "@/components/navbar"
import { ScrapeForm } from "@/components/scrape-form"
import { ScrapePreview } from "@/components/scrape-preview"
import { ScoreDashboard } from "@/components/score-dashboard"
import { AISuggestions } from "@/components/ai-suggestions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  Sparkles, 
  Search, 
  Zap, 
  Loader2, 
  Crown,
  Gauge,
  TrendingUp,
  Lightbulb
} from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"

export default function Dashboard() {
  const { user } = useAuth()
  const [scrapedData, setScrapedData] = React.useState<any>(null)
  
  // Scoring parameters
  const [primaryKeyword, setPrimaryKeyword] = React.useState("")
  const [lsiKeywordsInput, setLsiKeywordsInput] = React.useState("")
  const [isScoring, setIsScoring] = React.useState(false)
  const [scoreReport, setScoreReport] = React.useState<any>(null)
  const [scoringError, setScoringError] = React.useState<string | null>(null)

  // AI Suggestions parameters
  const [aiSuggestions, setAiSuggestions] = React.useState<any>(null)
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = React.useState(false)
  const [aiError, setAiError] = React.useState<string | null>(null)

  const handleScrapeSuccess = (data: any) => {
    setScrapedData(data)
    setScoreReport(null) // Reset past scores
    setAiSuggestions(null) // Reset past suggestions
    setScoringError(null)
    setAiError(null)
  }

  const handleCalculateScore = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!scrapedData?.id || !primaryKeyword) return

    setIsScoring(true)
    setScoringError(null)
    setAiSuggestions(null) // Reset suggestions as score changed
    
    // Split LSI terms by comma
    const lsiKeywords = lsiKeywordsInput
      .split(",")
      .map(k => k.trim())
      .filter(k => k.length > 0)

    try {
      const res = await fetch(`${API_URL}/score`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          page_id: scrapedData.id,
          primary_keyword: primaryKeyword,
          lsi_keywords: lsiKeywords
        }),
        credentials: "include",
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || "Failed to calculate SEO scoring breakdown.")
      }

      setScoreReport(data)
    } catch (err: any) {
      setScoringError(err.message)
    } finally {
      setIsScoring(false)
    }
  }

  const handleGenerateSuggestions = async () => {
    if (!scrapedData?.id || !primaryKeyword) return

    setIsGeneratingSuggestions(true)
    setAiError(null)

    try {
      const res = await fetch(`${API_URL}/analyze/ai-suggestions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          page_id: scrapedData.id,
          primary_keyword: primaryKeyword,
          score_audit_id: scoreReport?.id || scoreReport?._id || null
        }),
        credentials: "include",
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || "Failed to generate AI content suggestions.")
      }

      setAiSuggestions(data.suggestions)
    } catch (err: any) {
      setAiError(err.message)
    } finally {
      setIsGeneratingSuggestions(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen bg-background text-foreground font-sans">
        <Navbar />

        {/* Background Decorative Orbs */}
        <div className="absolute top-[15%] left-[5%] w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="absolute bottom-[15%] right-[5%] w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />

        <main className="flex-1 container mx-auto px-4 md:px-8 py-8 max-w-6xl space-y-8">
          {/* Header Grid */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                Welcome back, <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">{user?.name}</span>!
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your domains, crawl SEO performance, and deploy AI rewriters.
              </p>
            </div>
            
            {/* Subscription Badge */}
            <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card/60 backdrop-blur-sm self-start">
              <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-500">
                <Crown className="w-5 h-5 animate-pulse" />
              </div>
              <div className="text-left">
                <span className="block text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Subscription Plan</span>
                <span className="text-sm font-extrabold text-indigo-500 dark:text-indigo-400">
                  {user?.plan.toUpperCase()} Account
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Card className="border-border/80 bg-card/30 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Scans Conducted</span>
                  <Search className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black">{scrapedData ? "3" : "2"}</span>
                  <span className="text-xs text-muted-foreground">/ 5 scans left</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80 bg-card/30 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Average SEO Rating</span>
                  <Gauge className="w-4 h-4 text-purple-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-indigo-500">
                    {scoreReport ? scoreReport.overall_score : scrapedData ? "83.2" : "81.5"}
                  </span>
                  <span className="text-xs text-emerald-500 font-bold flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3" />
                    {scoreReport ? "+6.8" : scrapedData ? "+5.9" : "+4.2"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80 bg-card/30 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Optimize Suggestions</span>
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-amber-500">
                    {scoreReport 
                      ? Object.values(scoreReport.breakdown).reduce((acc: number, val: any) => acc + (val.suggestions?.length || 0), 0)
                      : scrapedData 
                        ? "5" 
                        : "8"
                    }
                  </span>
                  <span className="text-xs text-muted-foreground">pending actions</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Core URL / Content Scanner */}
          <Card className="border-border/80 bg-card/50 backdrop-blur-sm shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="w-5 h-5 text-indigo-500 animate-pulse" />
                Live SEO Audit Console
              </CardTitle>
              <CardDescription>
                Paste your website URL below or submit raw content/drafts directly for parsing and auditing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrapeForm onScrapeSuccess={handleScrapeSuccess} />
            </CardContent>
          </Card>

          {/* Render Preview Data */}
          {scrapedData && (
            <div className="space-y-6">
              <ScrapePreview data={scrapedData} />

              {/* Keyword Scoring Parameters Console */}
              <Card className="border-border/85 bg-card/65 backdrop-blur shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                <CardHeader>
                  <CardTitle className="text-md flex items-center gap-1.5">
                    <Sparkles className="w-4.5 h-4.5 text-indigo-500 animate-pulse" />
                    Configure Focus Keywords
                  </CardTitle>
                  <CardDescription>
                    To run the SEO Scoring Engine, specify the primary search term you target.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCalculateScore} className="space-y-4">
                    {scoringError && (
                      <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 text-xs text-rose-600 dark:text-rose-400 font-semibold animate-fade-in">
                        {scoringError}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          Primary Focus Keyword
                        </label>
                        <Input
                          placeholder="e.g. SEO optimization workflow"
                          value={primaryKeyword}
                          onChange={(e) => setPrimaryKeyword(e.target.value)}
                          disabled={isScoring}
                          className="h-10 rounded-lg bg-background/50 border-border focus-visible:ring-indigo-500/50"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          Semantic LSI Keywords (comma separated)
                        </label>
                        <Input
                          placeholder="e.g. keyword audit, scraping logs, domain rank"
                          value={lsiKeywordsInput}
                          onChange={(e) => setLsiKeywordsInput(e.target.value)}
                          disabled={isScoring}
                          className="h-10 rounded-lg bg-background/50 border-border focus-visible:ring-indigo-500/50"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button
                        type="submit"
                        disabled={isScoring || !primaryKeyword}
                        className="h-10 px-8 font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg min-w-[150px] shadow-lg shadow-indigo-500/10"
                      >
                        {isScoring ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Calculating...
                          </span>
                        ) : (
                          "Run Scoring Engine"
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Render real score dashboard once loaded */}
          {scoreReport && (
            <div className="space-y-8">
              <ScoreDashboard report={scoreReport} />

              {/* Generate AI Suggestions Control Panel */}
              <Card className="border-border/80 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-transparent backdrop-blur shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                <CardContent className="pt-8 pb-8 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-2 text-center md:text-left">
                    <h3 className="text-xl font-bold flex items-center justify-center md:justify-start gap-2">
                      <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
                      AI Content Optimization Engine
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-lg">
                      Generate optimized copy variants, block rewrites, and discover semantic keyword gaps with Claude.
                    </p>
                  </div>
                  <Button
                    onClick={handleGenerateSuggestions}
                    disabled={isGeneratingSuggestions}
                    className="h-11 px-8 font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg shadow-xl shadow-indigo-500/15"
                  >
                    {isGeneratingSuggestions ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating recommendations...
                      </span>
                    ) : (
                      "Generate AI Suggestions"
                    )}
                  </Button>
                </CardContent>
              </Card>

              {aiError && (
                <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 text-xs text-rose-600 dark:text-rose-400 font-semibold">
                  {aiError}
                </div>
              )}

              {/* Suggestions results display */}
              {(aiSuggestions || isGeneratingSuggestions) && (
                <div className="space-y-4">
                  <h3 className="text-lg font-extrabold tracking-tight">AI Optimization Recommendations</h3>
                  <AISuggestions 
                    suggestions={aiSuggestions} 
                    currentTitle={scrapedData?.title} 
                    currentMeta={scrapedData?.meta_description} 
                    isLoading={isGeneratingSuggestions} 
                  />
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}
