"use client"

import * as React from "react"
import { 
  Globe, 
  Sparkles, 
  Search, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Zap, 
  BarChart3, 
  RefreshCw, 
  Lightbulb, 
  Compass, 
  Layers, 
  ShieldCheck, 
  Gauge, 
  Cpu
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ThemeToggle } from "@/components/theme-toggle"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function Home() {
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
      }, 700)
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
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden font-sans">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none -z-10 dark:bg-indigo-500/5" />
      <div className="absolute top-[40%] right-[-10%] w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[150px] pointer-events-none -z-10 dark:bg-purple-500/5" />
      <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] bg-pink-500/10 rounded-full blur-[120px] pointer-events-none -z-10 dark:bg-pink-500/5" />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white font-bold shadow-md shadow-indigo-500/20">
              R
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full dark:border-zinc-950 animate-pulse"></span>
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-900 dark:from-zinc-100 dark:via-zinc-300 dark:to-zinc-100 bg-clip-text text-transparent">
              RankPilot<span className="text-indigo-500">.AI</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#demo" className="hover:text-foreground transition-colors">Interactive Demo</a>
            <a href="#workflow" className="hover:text-foreground transition-colors">Workflow</a>
            <span className="px-2 py-0.5 text-xs font-semibold text-emerald-600 bg-emerald-500/10 rounded-full dark:text-emerald-400 dark:bg-emerald-500/10">
              v1.0 Beta
            </span>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button className="hidden sm:inline-flex bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/10 border-0 rounded-lg">
              Launch App
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-24">
        <div className="container mx-auto px-4 md:px-8 text-center max-w-4xl">
          {/* Badge Announcement */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-xs font-medium text-indigo-500 dark:text-indigo-400 mb-6 animate-fade-in hover:bg-indigo-500/10 transition-colors">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Gen SEO Audit & Optimization</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-none mb-6">
            Supercharge Your Content with{" "}
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              AI-Powered SEO Audits
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Consolidate keyword scraping, SEO scoring, semantic structure evaluation, and AI-driven rewriting into a single, unified dashboard.
          </p>

          {/* Scan Interface */}
          <div id="demo" className="max-w-2xl mx-auto mb-12">
            <form onSubmit={handleScan} className="flex flex-col sm:flex-row gap-3 p-2 rounded-xl bg-card border border-border shadow-xl focus-within:ring-2 focus-within:ring-indigo-500/40 transition-all duration-300">
              <div className="relative flex-1">
                <Globe className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Enter URL to analyze (e.g. https://myblogsite.com/seo-tips)"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="pl-9 h-11 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-sm"
                  disabled={isScanning}
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
                  Load Sample
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
                    <span className="flex items-center gap-1.5">
                      <Search className="h-4 w-4" />
                      Scan Now
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Dynamic Loading State */}
          {isScanning && (
            <div className="max-w-xl mx-auto p-6 rounded-2xl border border-border bg-card/60 backdrop-blur-sm shadow-lg mb-12">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Processing SEO Audit Pipeline...</span>
                  <span>{Math.round(((scanStep + 1) / scanSteps.length) * 100)}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${((scanStep + 1) / scanSteps.length) * 100}%` }}
                  />
                </div>
                <p className="text-sm font-medium text-indigo-500 dark:text-indigo-400 animate-pulse">
                  {scanSteps[scanStep]}
                </p>
              </div>
            </div>
          )}

          {/* Scanned Dashboard Output */}
          {scanComplete && (
            <div className="text-left mt-4 animate-fade-in-up">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Score Panel */}
                <Card className="md:col-span-1 border-border/80 shadow-md bg-card/40 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Gauge className="w-4 h-4 text-indigo-500" />
                      Overall SEO Rating
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center pt-4 pb-6">
                    {/* Visual Score Ring */}
                    <div className="relative w-36 h-36 flex items-center justify-center mb-4">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          className="text-muted/20"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="url(#scoreGradient)"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={251.2}
                          strokeDashoffset={251.2 - (251.2 * seoScore) / 100}
                          className="transition-all duration-1000 ease-out"
                        />
                        <defs>
                          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#6366f1" />
                            <stop offset="50%" stopColor="#a855f7" />
                            <stop offset="100%" stopColor="#ec4899" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-4xl font-extrabold tracking-tight">{seoScore}</span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Good</span>
                      </div>
                    </div>
                    <p className="text-xs text-center text-muted-foreground max-w-[200px]">
                      Your page scored higher than 84% of competitor contents.
                    </p>
                  </CardContent>
                </Card>

                {/* Audit Brief Card */}
                <Card className="md:col-span-2 border-border/80 shadow-md bg-card/40 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-purple-500" />
                      Analysis Summary
                    </CardTitle>
                    <CardDescription className="truncate">
                      Scanned URL: <span className="font-mono text-xs text-indigo-500">{urlInput}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                      <div className="p-3 bg-muted/40 rounded-xl">
                        <span className="block text-[10px] text-muted-foreground uppercase tracking-wider">Word Count</span>
                        <span className="text-lg font-bold">1,842</span>
                      </div>
                      <div className="p-3 bg-muted/40 rounded-xl">
                        <span className="block text-[10px] text-muted-foreground uppercase tracking-wider">Readability</span>
                        <span className="text-lg font-bold text-indigo-500">62.8</span>
                      </div>
                      <div className="p-3 bg-muted/40 rounded-xl">
                        <span className="block text-[10px] text-muted-foreground uppercase tracking-wider">H1 - H3 Structure</span>
                        <span className="text-lg font-bold text-emerald-500">Optimal</span>
                      </div>
                      <div className="p-3 bg-muted/40 rounded-xl">
                        <span className="block text-[10px] text-muted-foreground uppercase tracking-wider">AI Suggestions</span>
                        <span className="text-lg font-bold text-amber-500">3 critical</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                        <span>Properly formatted H1 title tag with relevant target keywords.</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-muted-foreground">
                        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                        <span>Meta description length exceeds 160 characters, which may clip in SERP results.</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Advanced Results Tabs */}
              <Tabs defaultValue="suggestions" className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1 rounded-xl">
                  <TabsTrigger value="suggestions" className="rounded-lg text-xs font-semibold py-2">
                    AI Suggestions
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
                <TabsContent value="suggestions" className="mt-4 animate-fade-in">
                  <Card className="border-border/60 bg-card/20 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-1.5">
                        <Lightbulb className="w-4 h-4 text-amber-500" />
                        Key Opportunities
                      </CardTitle>
                      <CardDescription>
                        Direct actions proposed by RankPilot AI based on competitor scoring.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-300">Increase Semantic Keyword Variety</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            Competitors are ranking high by utilizing variations like "SEO optimization workflow" and "content audit criteria". Add these terms inside your H2 subheadings.
                          </p>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 dark:text-indigo-400">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">Shorten Meta Description</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            Current description has 184 characters. Reduce to 150-160 characters. Recommended AI rewrite: <i>"Boost organic visibility using our 2026 SEO Content Audit Guide. Explore steps to score content, scrape keywords, and dominate competitors easily."</i>
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* AI Re-writer Tab */}
                <TabsContent value="rewrite" className="mt-4 animate-fade-in">
                  <Card className="border-border/60 bg-card/20 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-1.5">
                        <Cpu className="w-4 h-4 text-purple-500" />
                        AI Re-writer Tool Sandbox
                      </CardTitle>
                      <CardDescription>
                        Generate optimized paraphrasing optimized for target density of <b>"SEO content analysis"</b>.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Original Input</span>
                          <div className="p-4 rounded-xl bg-muted/40 text-xs font-mono h-32 overflow-y-auto border border-border">
                            Writing articles is great but you must optimize them so search engines like Google can index your website properly and get traffic to your platform.
                          </div>
                        </div>
                        <div className="space-y-2">
                          <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-1">
                            <Sparkles className="w-3 h-3 animate-pulse" />
                            AI Recommended Version
                          </span>
                          <div className="p-4 rounded-xl bg-indigo-500/5 text-xs font-mono h-32 overflow-y-auto border border-indigo-500/20 text-indigo-900 dark:text-indigo-200">
                            Creating blog posts is highly beneficial, but executing a structural <span className="bg-indigo-500/20 px-1 py-0.5 rounded text-indigo-600 dark:text-indigo-300 font-bold">SEO content analysis</span> guarantees indexation and drives highly relevant search traffic.
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end mt-4">
                        <Button size="sm" className="bg-indigo-600 text-white hover:bg-indigo-500">
                          Apply Changes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Keywords Tab */}
                <TabsContent value="keywords" className="mt-4 animate-fade-in">
                  <Card className="border-border/60 bg-card/20 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-base">Target Keyword Performance</CardTitle>
                      <CardDescription>
                        Current keyword volume, volume opportunity, and calculated density indices.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
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
                <TabsContent value="competitors" className="mt-4 animate-fade-in">
                  <Card className="border-border/60 bg-card/20 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-base">Competitor Score Metrics</CardTitle>
                      <CardDescription>
                        Benchmarked against top SERP URLs for target keywords.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Competitor URL</TableHead>
                            <TableHead className="text-center">SEO Score</TableHead>
                            <TableHead className="text-right">Readability</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-mono text-xs truncate max-w-[200px]">https://semrush.com/blog/seo-best-practices</TableCell>
                            <TableCell className="text-center"><span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold text-xs">92</span></TableCell>
                            <TableCell className="text-right font-mono text-xs">74.2</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" className="h-7 text-xs">Analyze Diff</Button>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-mono text-xs truncate max-w-[200px]">https://ahrefs.com/blog/seo-basics-guide</TableCell>
                            <TableCell className="text-center"><span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold text-xs">88</span></TableCell>
                            <TableCell className="text-right font-mono text-xs">68.5</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" className="h-7 text-xs">Analyze Diff</Button>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-mono text-xs truncate max-w-[200px]">https://yoast.com/seo-friendly-blogpost</TableCell>
                            <TableCell className="text-center"><span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-bold text-xs">78</span></TableCell>
                            <TableCell className="text-right font-mono text-xs">81.0</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" className="h-7 text-xs">Analyze Diff</Button>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 bg-muted/30 border-y border-border">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Complete SEO Stack In One Application</h2>
            <p className="text-sm text-muted-foreground">
              Eliminate switching between Ahrefs, SEMrush, Grammarly, and ChatGPT. RankPilot combines these critical workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group p-6 rounded-2xl border border-border bg-card hover:border-indigo-500/40 hover:shadow-lg transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-5 group-hover:scale-110 transition-transform duration-200">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold mb-2">Web Content Scraping</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Directly retrieve HTML content or specify competitor URL targets. Extract body copy, schemas, headings structure, and meta elements effortlessly.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-6 rounded-2xl border border-border bg-card hover:border-purple-500/40 hover:shadow-lg transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-5 group-hover:scale-110 transition-transform duration-200">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold mb-2">AI Optimization & Rewriting</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Get real-time scoring upgrades and rewrite targeted portions directly in a rich text sandbox to match specific LSI search intent.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-6 rounded-2xl border border-border bg-card hover:border-pink-500/40 hover:shadow-lg transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-600 dark:text-pink-400 mb-5 group-hover:scale-110 transition-transform duration-200">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold mb-2">Competitor Diff Auditing</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Audit keyword density differences directly against top 10 search results on Google. Identify missing subheadings and topics instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="py-20">
        <div className="container mx-auto px-4 md:px-8 max-w-4xl">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">How RankPilot Operates</h2>
            <p className="text-sm text-muted-foreground">
              Our automated indexing pipeline delivers actionable marketing insights within 3 simple phases.
            </p>
          </div>

          <div className="relative border-l border-border pl-8 space-y-12 ml-4">
            <div className="relative">
              <div className="absolute -left-12 top-0 w-8 h-8 rounded-full bg-indigo-500/10 border-2 border-indigo-500 flex items-center justify-center text-xs font-bold text-indigo-500 dark:bg-zinc-950">
                1
              </div>
              <h4 className="text-base font-semibold mb-1">Crawl and Extract</h4>
              <p className="text-xs text-muted-foreground">
                Feed any target URL or raw text draft. The backend initiates async workers to pull DOM text, assets, headers, metadata, and active script layers.
              </p>
            </div>

            <div className="relative">
              <div className="absolute -left-12 top-0 w-8 h-8 rounded-full bg-purple-500/10 border-2 border-purple-500 flex items-center justify-center text-xs font-bold text-purple-500 dark:bg-zinc-950">
                2
              </div>
              <h4 className="text-base font-semibold mb-1">Analyze and Benchmark</h4>
              <p className="text-xs text-muted-foreground">
                We query search results, scrap competitor data, map target densities, calculate readability indices, and cross-examine keyword overlap.
              </p>
            </div>

            <div className="relative">
              <div className="absolute -left-12 top-0 w-8 h-8 rounded-full bg-pink-500/10 border-2 border-pink-500 flex items-center justify-center text-xs font-bold text-pink-500 dark:bg-zinc-950">
                3
              </div>
              <h4 className="text-base font-semibold mb-1">Optimize and Export</h4>
              <p className="text-xs text-muted-foreground">
                Adjust sentences via AI sandboxes, insert LSI keywords, download optimized rich text files or directly copy structural modifications.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border bg-card py-10">
        <div className="container mx-auto px-4 md:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2 mb-4 sm:mb-0">
            <div className="flex items-center justify-center w-6 h-6 rounded-md bg-indigo-500 text-white font-bold text-[10px]">
              R
            </div>
            <span className="font-semibold text-foreground">RankPilot AI</span>
          </div>
          <p>© {new Date().getFullYear()} RankPilot AI. All rights reserved.</p>
          <div className="flex items-center gap-4 mt-4 sm:mt-0">
            <a href="#" className="hover:text-foreground">Terms of Service</a>
            <a href="#" className="hover:text-foreground">Privacy Policy</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
