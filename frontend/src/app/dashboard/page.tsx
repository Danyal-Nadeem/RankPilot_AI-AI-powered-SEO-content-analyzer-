"use client"

import * as React from "react"
import { useAuth } from "@/context/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Sparkles, 
  Search, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  BarChart3, 
  RefreshCw, 
  Lightbulb, 
  Gauge, 
  Cpu, 
  History,
  TrendingUp,
  User as UserIcon,
  Crown
} from "lucide-react"

export default function Dashboard() {
  const { user } = useAuth()
  const [urlInput, setUrlInput] = React.useState("")
  const [isScanning, setIsScanning] = React.useState(false)
  const [scanStep, setScanStep] = React.useState(0)
  const [scanComplete, setScanComplete] = React.useState(false)
  const [seoScore, setSeoScore] = React.useState(0)

  const scanSteps = [
    "Scraping webpage contents...",
    "Extracting HTML headers & structured metadata...",
    "Checking keyword density and topic relevance...",
    "Measuring mobile-friendliness and speed metrics...",
    "Evaluating schema markup and rich snippet eligibility...",
    "Invoking RankPilot AI optimizer service...",
    "Generating actionable SEO recommendations..."
  ]

  React.useEffect(() => {
    let interval: NodeJS.Timeout
    if (isScanning) {
      interval = setInterval(() => {
        setScanStep((prev) => {
          if (prev < scanSteps.length - 1) {
            return prev + 1
          } else {
            clearInterval(interval)
            setIsScanning(false)
            setScanComplete(true)
            return 0
          }
        })
      }, 600)
    }
    return () => clearInterval(interval)
  }, [isScanning])

  React.useEffect(() => {
    let scoreInterval: NodeJS.Timeout
    if (scanComplete && seoScore < 86) {
      scoreInterval = setInterval(() => {
        setSeoScore((prev) => {
          if (prev < 86) {
            return prev + 1
          } else {
            clearInterval(scoreInterval)
            return prev
          }
        })
      }, 20)
    }
    return () => clearInterval(scoreInterval)
  }, [scanComplete, seoScore])

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault()
    if (!urlInput) return
    setIsScanning(true)
    setScanComplete(false)
    setSeoScore(0)
    setScanStep(0)
  }

  const loadSample = () => {
    setUrlInput("https://myblogsite.com/seo-optimization-guide-2026")
  }

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen bg-background text-foreground font-sans">
        <Navbar />

        {/* Orbs */}
        <div className="absolute top-[15%] left-[5%] w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="absolute bottom-[15%] right-[5%] w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />

        <main className="flex-1 container mx-auto px-4 md:px-8 py-8 max-w-6xl">
          {/* Header Grid */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                Welcome back, <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">{user?.name}</span>!
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your domains, crawl SEO performance, and deploy AI rewriters.
              </p>
            </div>
            
            {/* Account Card Brief */}
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <Card className="border-border/80 bg-card/30 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Scans Conducted</span>
                  <Search className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black">2</span>
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
                  <span className="text-3xl font-black text-indigo-500">81.5</span>
                  <span className="text-xs text-emerald-500 font-bold flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3" />
                    +4.2
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
                  <span className="text-3xl font-black text-amber-500">8</span>
                  <span className="text-xs text-muted-foreground">pending actions</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Audit URL Scanner Console */}
          <Card className="border-border/80 bg-card/50 backdrop-blur-sm shadow-lg mb-8">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="w-5 h-5 text-indigo-500 animate-pulse" />
                Live SEO Audit Console
              </CardTitle>
              <CardDescription>
                Paste your website URL below to execute scraping, content analysis, and AI optimization recommendations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleScan} className="flex flex-col sm:flex-row gap-3">
                <div className="flex-grow">
                  <Input
                    placeholder="e.g., https://myblog.com/seo-article-optimization"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    disabled={isScanning}
                    className="h-11 rounded-lg bg-background/50 border-border focus-visible:ring-indigo-500/50"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={loadSample}
                    disabled={isScanning}
                    className="h-11 px-4 text-xs font-semibold rounded-lg hover:bg-muted"
                  >
                    Sample URL
                  </Button>
                  <Button
                    type="submit"
                    disabled={isScanning || !urlInput}
                    className="h-11 px-6 font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg min-w-[120px]"
                  >
                    {isScanning ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Analyzing...
                      </span>
                    ) : (
                      "Run Audit"
                    )}
                  </Button>
                </div>
              </form>

              {/* Crawl Steps Loading */}
              {isScanning && (
                <div className="mt-6 p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 space-y-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Audit analysis workflow in execution...</span>
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
            </CardContent>
          </Card>

          {/* Results Summary and Tabs (Rendered upon scanComplete) */}
          {scanComplete && (
            <div className="space-y-6 animate-fade-in-up">
              {/* Score & Summary Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Score Chart */}
                <Card className="border-border/80 bg-card/30 shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Gauge className="w-4 h-4 text-indigo-500" />
                      Calculated Rating
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center py-4">
                    {/* Ring */}
                    <div className="relative w-32 h-32 flex items-center justify-center mb-2">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="currentColor"
                          strokeWidth="7"
                          fill="transparent"
                          className="text-muted/20"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="url(#dashScoreGradient)"
                          strokeWidth="7"
                          fill="transparent"
                          strokeDasharray={251.2}
                          strokeDashoffset={251.2 - (251.2 * seoScore) / 100}
                          className="transition-all duration-1000 ease-out"
                        />
                        <defs>
                          <linearGradient id="dashScoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#6366f1" />
                            <stop offset="100%" stopColor="#a855f7" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-3xl font-extrabold tracking-tight">{seoScore}</span>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Optimized</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Status List */}
                <Card className="md:col-span-2 border-border/80 bg-card/30 shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-purple-500" />
                      Content Audit Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-2">
                    <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold">
                      <div className="p-2 bg-muted/30 rounded-lg">
                        <span className="block text-[9px] text-muted-foreground">Word Count</span>
                        <span className="text-sm font-bold">1,842</span>
                      </div>
                      <div className="p-2 bg-muted/30 rounded-lg">
                        <span className="block text-[9px] text-muted-foreground">Readability</span>
                        <span className="text-sm font-bold text-indigo-500">62.8</span>
                      </div>
                      <div className="p-2 bg-muted/30 rounded-lg">
                        <span className="block text-[9px] text-muted-foreground">H1 structure</span>
                        <span className="text-sm font-bold text-emerald-500">Optimal</span>
                      </div>
                    </div>
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>H1 tags and title descriptions incorporate target focus keywords.</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>Meta description length of 184 chars exceeds recommended limits.</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tabs Sandbox */}
              <Tabs defaultValue="suggestions" className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1 rounded-xl">
                  <TabsTrigger value="suggestions" className="rounded-lg text-xs font-semibold py-2">
                    Suggestions
                  </TabsTrigger>
                  <TabsTrigger value="rewrite" className="rounded-lg text-xs font-semibold py-2">
                    AI Re-writer
                  </TabsTrigger>
                  <TabsTrigger value="keywords" className="rounded-lg text-xs font-semibold py-2">
                    Keywords
                  </TabsTrigger>
                  <TabsTrigger value="competitors" className="rounded-lg text-xs font-semibold py-2">
                    Competitors
                  </TabsTrigger>
                </TabsList>

                {/* Suggestions Tab */}
                <TabsContent value="suggestions" className="mt-4">
                  <Card className="border-border/60 bg-card/25 backdrop-blur-sm">
                    <CardContent className="pt-6 space-y-4">
                      <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                          <Sparkles className="w-4 h-4 animate-pulse" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold">Inject Semantically Related Keywords</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            To boost search score relevance, add terms like <b>"organic audit"</b> and <b>"competitor analysis pipelines"</b> inside your H2 structures.
                          </p>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold">Optimize Meta Tags Size</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            Your current description exceeds 160 characters. Recommended: <i>"Boost organic indexing with RankPilot AI content audits. Optimize keywords, re-write structure, and beat competitors easily."</i>
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* AI Re-writer Tab */}
                <TabsContent value="rewrite" className="mt-4">
                  <Card className="border-border/60 bg-card/25 backdrop-blur-sm">
                    <CardContent className="pt-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Original text</span>
                          <div className="p-4 rounded-xl bg-muted/40 text-xs font-mono h-32 overflow-y-auto border border-border">
                            Writing articles is great but you must optimize them so search engines like Google can index your website properly and get traffic to your platform.
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-1">
                            <Sparkles className="w-3 h-3 animate-pulse" />
                            AI Recommended Version
                          </span>
                          <div className="p-4 rounded-xl bg-indigo-500/5 text-xs font-mono h-32 overflow-y-auto border border-indigo-500/20 text-indigo-900 dark:text-indigo-200">
                            Creating blog posts is highly beneficial, but executing a structural <span className="bg-indigo-500/20 px-1 py-0.5 rounded text-indigo-600 dark:text-indigo-300 font-bold">SEO content analysis</span> guarantees indexation and drives highly relevant search traffic.
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Keywords Tab */}
                <TabsContent value="keywords" className="mt-4">
                  <Card className="border-border/60 bg-card/25 backdrop-blur-sm">
                    <CardContent className="pt-6">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Keyword</TableHead>
                            <TableHead className="text-right">Volume</TableHead>
                            <TableHead className="text-right">Current Density</TableHead>
                            <TableHead className="text-right">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-semibold text-indigo-500">SEO content analyzer</TableCell>
                            <TableCell className="text-right font-mono">14,200/mo</TableCell>
                            <TableCell className="text-right font-mono">1.2%</TableCell>
                            <TableCell className="text-right text-emerald-500 font-medium">Excellent</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-semibold text-indigo-500">Competitor SEO audit</TableCell>
                            <TableCell className="text-right font-mono">8,400/mo</TableCell>
                            <TableCell className="text-right font-mono">0.3%</TableCell>
                            <TableCell className="text-right text-amber-500 font-medium">Underused</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-semibold text-indigo-500">AI rewriting tool</TableCell>
                            <TableCell className="text-right font-mono">22,100/mo</TableCell>
                            <TableCell className="text-right font-mono">0.0%</TableCell>
                            <TableCell className="text-right text-rose-500 font-medium">Missing</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Competitors Tab */}
                <TabsContent value="competitors" className="mt-4">
                  <Card className="border-border/60 bg-card/25 backdrop-blur-sm">
                    <CardContent className="pt-6">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Competitor URL</TableHead>
                            <TableHead className="text-center">SEO Score</TableHead>
                            <TableHead className="text-right">Readability</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-mono text-xs truncate max-w-[250px]">https://semrush.com/blog/seo-best-practices</TableCell>
                            <TableCell className="text-center"><span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold text-xs">92</span></TableCell>
                            <TableCell className="text-right font-mono text-xs">74.2</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-mono text-xs truncate max-w-[250px]">https://ahrefs.com/blog/seo-basics-guide</TableCell>
                            <TableCell className="text-center"><span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold text-xs">88</span></TableCell>
                            <TableCell className="text-right font-mono text-xs">68.5</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}
