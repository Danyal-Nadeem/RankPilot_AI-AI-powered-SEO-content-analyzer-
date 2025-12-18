"use client"

import * as React from "react"
import { useAuth } from "@/context/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { Navbar } from "@/components/navbar"
import { ScrapeForm } from "@/components/scrape-form"
import { ScrapePreview } from "@/components/scrape-preview"
import { ScoreDashboard } from "@/components/score-dashboard"
import { AISuggestions } from "@/components/ai-suggestions"
import { CompetitorForm } from "@/components/competitor-form"
import { CompetitorDashboard } from "@/components/competitor-dashboard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { 
  LayoutDashboard, 
  Globe, 
  Users, 
  Search, 
  Settings as SettingsIcon, 
  Trash2, 
  Loader2, 
  TrendingUp, 
  Lightbulb, 
  Gauge, 
  Sparkles,
  ExternalLink,
  History as HistoryIcon,
  Crown,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Zap
} from "lucide-react"
import Link from "next/link"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"

interface HistoryItem {
  page_id: string
  url: string | null
  title: string
  latest_score: number | null
  scraped_at: string
}

export default function Dashboard() {
  const { user } = useAuth()
  const [activeView, setActiveView] = React.useState<"home" | "audit" | "compare" | "settings">("home")

  // Stats State
  const [stats, setStats] = React.useState<any>(null)
  const [loadingStats, setLoadingStats] = React.useState(true)

  // History State
  const [historyItems, setHistoryItems] = React.useState<HistoryItem[]>([])
  const [loadingHistory, setLoadingHistory] = React.useState(true)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [searchQuery, setSearchQuery] = React.useState("")
  const historyLimit = 6

  // Audit state
  const [scrapedData, setScrapedData] = React.useState<any>(null)
  const [primaryKeyword, setPrimaryKeyword] = React.useState("")
  const [lsiKeywordsInput, setLsiKeywordsInput] = React.useState("")
  const [isScoring, setIsScoring] = React.useState(false)
  const [scoreReport, setScoreReport] = React.useState<any>(null)
  const [scoringError, setScoringError] = React.useState<string | null>(null)
  const [aiSuggestions, setAiSuggestions] = React.useState<any>(null)
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = React.useState(false)
  const [aiError, setAiError] = React.useState<string | null>(null)

  // Competitor state
  const [competitorReport, setCompetitorReport] = React.useState<any>(null)

  // Expanded report view
  const [viewingReportDetails, setViewingReportDetails] = React.useState<any>(null)
  const [loadingReportDetails, setLoadingReportDetails] = React.useState(false)

  // Fetch stats and history on view change or pagination
  React.useEffect(() => {
    if (activeView === "home") {
      fetchStats()
      fetchHistory(currentPage)
    }
  }, [activeView, currentPage])

  const fetchStats = async () => {
    setLoadingStats(true)
    try {
      const res = await fetch(`${API_URL}/dashboard/stats`, {
        credentials: "include"
      })
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (err) {
      console.error("Failed to load dashboard metrics stats:", err)
    } finally {
      setLoadingStats(false)
    }
  }

  const fetchHistory = async (page: number) => {
    setLoadingHistory(true)
    try {
      const res = await fetch(`${API_URL}/dashboard/history?page=${page}&limit=${historyLimit}`, {
        credentials: "include"
      })
      if (res.ok) {
        const data = await res.json()
        setHistoryItems(data.items)
        setTotalPages(Math.ceil(data.total_count / historyLimit) || 1)
      }
    } catch (err) {
      console.error("Failed to load history list:", err)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleDeleteReport = async (pageId: string) => {
    if (!confirm("Are you sure you want to delete this analysis report?")) return

    try {
      const res = await fetch(`${API_URL}/dashboard/report/${pageId}`, {
        method: "DELETE",
        credentials: "include"
      })

      if (res.ok) {
        setHistoryItems(prev => prev.filter(item => item.page_id !== pageId))
        fetchStats()
      }
    } catch (err) {
      console.error("Failed to delete report:", err)
    }
  }

  const handleLoadFullReport = async (pageId: string) => {
    setLoadingReportDetails(true)
    setViewingReportDetails(null)
    try {
      const res = await fetch(`${API_URL}/dashboard/report/${pageId}`, {
        credentials: "include"
      })
      if (res.ok) {
        const data = await res.json()
        setViewingReportDetails(data)
      }
    } catch (err) {
      console.error("Failed to load full report details:", err)
    } finally {
      setLoadingReportDetails(false)
    }
  }

  const handleScrapeSuccess = (data: any) => {
    setScrapedData(data)
    setScoreReport(null)
    setAiSuggestions(null)
    setScoringError(null)
    setAiError(null)
  }

  const handleCalculateScore = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!scrapedData?.id || !primaryKeyword) return

    setIsScoring(true)
    setScoringError(null)
    setAiSuggestions(null)

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
        throw new Error(data.detail || "Failed to calculate score.")
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
        throw new Error(data.detail || "Failed to generate suggestions.")
      }

      setAiSuggestions(data.suggestions)
    } catch (err: any) {
      setAiError(err.message)
    } finally {
      setIsGeneratingSuggestions(false)
    }
  }

  // Filter history items by search query
  const filteredHistory = historyItems.filter(item => {
    const term = searchQuery.toLowerCase()
    return (
      item.title.toLowerCase().includes(term) ||
      (item.url && item.url.toLowerCase().includes(term))
    )
  })

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen bg-background text-foreground font-sans">
        <Navbar />

        {/* Decorative background orbs */}
        <div className="absolute top-[15%] left-[5%] w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="absolute bottom-[15%] right-[5%] w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />

        <div className="flex-1 container mx-auto px-4 md:px-8 py-8 max-w-6xl flex flex-col md:flex-row gap-8">
          
          {/* Sidebar Nav section */}
          <aside className="w-full md:w-56 shrink-0 space-y-2">
            <h3 className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">
              Workspace navigation
            </h3>
            
            <button
              onClick={() => { setActiveView("home"); setViewingReportDetails(null); }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all text-left ${
                activeView === "home" && !viewingReportDetails
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/10" 
                  : "hover:bg-muted/15 text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard Home
            </button>

            <button
              onClick={() => { setActiveView("audit"); setViewingReportDetails(null); }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all text-left ${
                activeView === "audit"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/10" 
                  : "hover:bg-muted/15 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Globe className="w-4 h-4" />
              New SEO Audit
            </button>

            <button
              onClick={() => { setActiveView("compare"); setViewingReportDetails(null); }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all text-left ${
                activeView === "compare"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/10" 
                  : "hover:bg-muted/15 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="w-4 h-4" />
              Competitor Analysis
            </button>

            <Link
              href="/keywords"
              className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all text-left text-muted-foreground hover:text-foreground hover:bg-muted/15"
            >
              <BookOpen className="w-4 h-4" />
              Keyword Research
            </Link>

            <button
              onClick={() => { setActiveView("settings"); setViewingReportDetails(null); }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all text-left ${
                activeView === "settings"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/10" 
                  : "hover:bg-muted/15 text-muted-foreground hover:text-foreground"
              }`}
            >
              <SettingsIcon className="w-4 h-4" />
              Portal Settings
            </button>
          </aside>

          {/* Core Contents Viewport */}
          <div className="flex-grow space-y-6">
            
            {/* VIEW 1: Full Report Details Expanded */}
            {viewingReportDetails ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-border/40 pb-4">
                  <div>
                    <h2 className="text-xl font-black">Analysis Archive Report</h2>
                    <span className="text-xs text-muted-foreground font-mono">ID: {viewingReportDetails.page.id}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => setViewingReportDetails(null)}
                    className="h-9 px-4 rounded-lg font-semibold hover:bg-muted"
                  >
                    Back to History list
                  </Button>
                </div>

                <ScrapePreview data={viewingReportDetails.page} />

                {viewingReportDetails.audit ? (
                  <ScoreDashboard report={viewingReportDetails.audit} />
                ) : (
                  <Card className="border-border/80 bg-card/30 text-center py-8">
                    <span className="text-xs text-muted-foreground">This scraped draft was never scored. Run scoring from the Audit Console.</span>
                  </Card>
                )}
              </div>
            ) : activeView === "home" ? (
              /* VIEW 2: Dashboard stats and historical lists */
              <div className="space-y-6">
                
                {/* Stats Cards Section */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <Card className="border-border/80 bg-card/30 backdrop-blur-sm">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Scans</span>
                        <Search className="w-4 h-4 text-indigo-500" />
                      </div>
                      <div className="flex items-baseline gap-2">
                        {loadingStats ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <span className="text-3xl font-black">{stats?.total_analyses || 0}</span>
                        )}
                        <span className="text-xs text-muted-foreground">/ 5 scans left</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/80 bg-card/30 backdrop-blur-sm">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Avg SEO Rating</span>
                        <Gauge className="w-4 h-4 text-purple-500" />
                      </div>
                      <div className="flex items-baseline gap-2">
                        {loadingStats ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <span className="text-3xl font-black text-indigo-500">{stats?.average_score || 0}</span>
                        )}
                        <span className="text-xs text-muted-foreground">overall average</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/80 bg-card/30 backdrop-blur-sm">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Top Domain</span>
                        <Globe className="w-4 h-4 text-pink-500" />
                      </div>
                      <div className="flex items-baseline gap-2">
                        {loadingStats ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <span className="text-base font-extrabold truncate max-w-[200px]" title={stats?.most_analyzed_domain}>
                            {stats?.most_analyzed_domain || "None"}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground block">most analyzed</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* History list Card */}
                <Card className="border-border/80 bg-card/50 backdrop-blur-sm shadow-lg">
                  <CardHeader className="pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <CardTitle className="text-md flex items-center gap-1.5">
                        <HistoryIcon className="w-4.5 h-4.5 text-indigo-500" />
                        Analysis Auditing History
                      </CardTitle>
                      <CardDescription>
                        Review all past crawl indexes and scores.
                      </CardDescription>
                    </div>

                    <div className="w-full sm:w-60 relative">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Filter reports by URL..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-9 pl-9 text-xs rounded-lg bg-background/50 border-border"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {loadingHistory ? (
                      <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                        Loading history...
                      </div>
                    ) : filteredHistory.length === 0 ? (
                      <div className="py-12 text-center text-xs text-muted-foreground italic">
                        No search results or history logged. Run your first scan from the Audit Console.
                      </div>
                    ) : (
                      <>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="pl-5 text-xs">Crawl Title</TableHead>
                              <TableHead className="text-xs">Crawl URL</TableHead>
                              <TableHead className="text-center text-xs">Score</TableHead>
                              <TableHead className="text-center text-xs">Scraped At</TableHead>
                              <TableHead className="text-center text-xs pr-5">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredHistory.map((item) => (
                              <TableRow key={item.page_id} className="hover:bg-muted/10 transition-colors">
                                <TableCell 
                                  onClick={() => handleLoadFullReport(item.page_id)}
                                  className="pl-5 font-bold text-xs text-indigo-500 cursor-pointer truncate max-w-[150px]"
                                  title={item.title}
                                >
                                  {item.title}
                                </TableCell>
                                <TableCell 
                                  onClick={() => handleLoadFullReport(item.page_id)}
                                  className="text-xs text-muted-foreground cursor-pointer truncate max-w-[180px]"
                                  title={item.url || "Pasted Draft"}
                                >
                                  {item.url || <span className="italic text-muted-foreground/60">Pasted Draft</span>}
                                </TableCell>
                                <TableCell className="text-center">
                                  {item.latest_score !== null ? (
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                      item.latest_score >= 80 
                                        ? "bg-emerald-500/10 text-emerald-500" 
                                        : item.latest_score >= 50 
                                          ? "bg-amber-500/10 text-amber-500" 
                                          : "bg-rose-500/10 text-rose-500"
                                    }`}>
                                      {item.latest_score}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-muted-foreground italic">Unscored</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-center text-xs text-muted-foreground">
                                  {new Date(item.scraped_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-center pr-5">
                                  <div className="flex justify-center gap-1.5">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="xs"
                                      onClick={() => handleLoadFullReport(item.page_id)}
                                      className="h-8 w-8 p-0 rounded-lg"
                                      title="Open report"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="xs"
                                      onClick={() => handleDeleteReport(item.page_id)}
                                      className="h-8 w-8 p-0 rounded-lg hover:bg-rose-500 hover:text-white"
                                      title="Delete report"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>

                        {/* Pagination Strip */}
                        {totalPages > 1 && (
                          <div className="p-4 border-t border-border/40 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">
                              Page {currentPage} of {totalPages}
                            </span>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="xs"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => prev - 1)}
                                className="h-8 w-8 p-0 rounded-lg"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="xs"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(prev => prev + 1)}
                                className="h-8 w-8 p-0 rounded-lg"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>

              </div>
            ) : activeView === "audit" ? (
              /* VIEW 3: Live SEO Audit runner console */
              <div className="space-y-6">
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

                {scrapedData && (
                  <div className="space-y-6">
                    <ScrapePreview data={scrapedData} />

                    <Card className="border-border/85 bg-card/65 backdrop-blur shadow-lg relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                      <CardHeader>
                        <CardTitle className="text-md flex items-center gap-1.5">
                          <Sparkles className="w-4.5 h-4.5 text-indigo-500 animate-pulse" />
                          Configure Focus Keywords
                        </CardTitle>
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

                {scoreReport && (
                  <div className="space-y-8">
                    <ScoreDashboard report={scoreReport} />

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
              </div>
            ) : activeView === "compare" ? (
              /* VIEW 4: Competitor comparison tab results */
              <div className="space-y-6">
                <Card className="border-border/80 bg-card/50 backdrop-blur-sm shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-500" />
                      Competitor Analysis Center
                    </CardTitle>
                    <CardDescription>
                      Compare your page structure and content metrics with up to 3 competitors in parallel.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CompetitorForm onComparisonSuccess={(data) => setCompetitorReport(data)} />
                  </CardContent>
                </Card>

                {competitorReport && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-extrabold tracking-tight">Benchmark Insights</h3>
                    <CompetitorDashboard data={competitorReport} />
                  </div>
                )}
              </div>
            ) : (
              /* VIEW 5: Settings dashboard details card */
              <div className="space-y-6">
                <Card className="border-border/80 bg-card/50 backdrop-blur-sm shadow-lg overflow-hidden relative">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <SettingsIcon className="w-5 h-5 text-indigo-500" />
                      Portal Settings & Account Options
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="p-4 rounded-xl border border-border bg-muted/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Crown className="w-5 h-5 text-amber-500 animate-pulse" />
                        <div>
                          <span className="block text-xs font-bold">Subscription Status</span>
                          <span className="text-xs text-muted-foreground">Account tier linked to active profile.</span>
                        </div>
                      </div>
                      <Badge className="bg-indigo-600 hover:bg-indigo-500 text-white capitalize">
                        {user?.plan} Tier
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">API Credentials Configuration</h4>
                      <p className="text-xs text-muted-foreground">
                        RankPilot AI utilizes cloud server connections. Ensure your target variables are supplied in the backend configuration (`.env`).
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-xs font-mono bg-background/50 border border-border/80 p-3.5 rounded-lg">
                        <div>
                          <span className="block text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Database API</span>
                          <span className="text-emerald-500 font-semibold">MongoDB Atlas Linked</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Rate Limiting</span>
                          <span className="text-emerald-500 font-semibold">Upstash Redis Configured</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
          </div>

        </div>
      </div>
    </ProtectedRoute>
  )
}
