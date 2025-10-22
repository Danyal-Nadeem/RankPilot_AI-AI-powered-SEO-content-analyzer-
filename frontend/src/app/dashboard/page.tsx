"use client"

import * as React from "react"
import { useAuth } from "@/context/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { Navbar } from "@/components/navbar"
import { ScrapeForm } from "@/components/scrape-form"
import { ScrapePreview } from "@/components/scrape-preview"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  Lightbulb, 
  Gauge, 
  Cpu, 
  TrendingUp,
  Crown
} from "lucide-react"

export default function Dashboard() {
  const { user } = useAuth()
  const [scrapedData, setScrapedData] = React.useState<any>(null)
  const [seoScore, setSeoScore] = React.useState(0)
  const [scanComplete, setScanComplete] = React.useState(false)

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

  const handleScrapeSuccess = (data: any) => {
    setScrapedData(data)
    setSeoScore(0)
    setScanComplete(true)
  }

  // Calculate H1 error or warnings
  const h1Count = scrapedData?.headings?.h1?.length || 0
  const metaDescLength = scrapedData?.meta_description?.length || 0

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen bg-background text-foreground font-sans">
        <Navbar />

        {/* Background Decorative Orbs */}
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
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
                  <span className="text-3xl font-black text-indigo-500">{scrapedData ? "83.2" : "81.5"}</span>
                  <span className="text-xs text-emerald-500 font-bold flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3" />
                    {scrapedData ? "+5.9" : "+4.2"}
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
                  <span className="text-3xl font-black text-amber-500">{scrapedData ? "5" : "8"}</span>
                  <span className="text-xs text-muted-foreground">pending actions</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Core URL / Content Scanner */}
          <Card className="border-border/80 bg-card/50 backdrop-blur-sm shadow-lg mb-8">
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
          {scrapedData && <ScrapePreview data={scrapedData} />}

          {/* Simulated SEO Audits and tab sandboxes if scanComplete */}
          {scanComplete && scrapedData && (
            <div className="space-y-6 mt-8 animate-fade-in-up">
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

                {/* Status Summary */}
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
                        <span className="text-sm font-bold">{scrapedData.word_count}</span>
                      </div>
                      <div className="p-2 bg-muted/30 rounded-lg">
                        <span className="block text-[9px] text-muted-foreground">Readability</span>
                        <span className="text-sm font-bold text-indigo-500">65.3</span>
                      </div>
                      <div className="p-2 bg-muted/30 rounded-lg">
                        <span className="block text-[9px] text-muted-foreground">H1 Tags</span>
                        <span className={`text-sm font-bold ${h1Count === 1 ? "text-emerald-500" : "text-rose-500"}`}>
                          {h1Count} tag(s)
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      {h1Count === 1 ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>Standard structure: Page has exactly one H1 tag.</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                          <span>SEO Warning: Ensure page has exactly 1 H1 heading tag. (Found {h1Count}).</span>
                        </div>
                      )}

                      {metaDescLength > 50 && metaDescLength < 160 ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>Optimal meta description size ({metaDescLength} chars).</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                          <span>Meta description size: {metaDescLength} characters. Optimal is 50-160 characters.</span>
                        </div>
                      )}
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
                      {h1Count !== 1 && (
                        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500">
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-rose-700 dark:text-rose-300">Resolve H1 Tag Structure</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              Your page must declare exactly one &lt;h1&gt; tag to signify the main keyword focus to crawlers.
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                          <Sparkles className="w-4 h-4 animate-pulse" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold">Semantic Suggestions</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            Your copy contains {scrapedData.word_count} words. Inject keywords like <b>"SEO content analyzer"</b> and <b>"audit dashboard"</b> to improve topic relevance density by 1.5%.
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
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Original Excerpt</span>
                          <div className="p-4 rounded-xl bg-muted/40 text-xs font-mono h-32 overflow-y-auto border border-border leading-relaxed">
                            {scrapedData.body_text ? scrapedData.body_text.slice(0, 300) + "..." : "No body text extracted."}
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-1">
                            <Sparkles className="w-3 h-3 animate-pulse" />
                            AI Rewritten Suggestion
                          </span>
                          <div className="p-4 rounded-xl bg-indigo-500/5 text-xs font-mono h-32 overflow-y-auto border border-indigo-500/20 text-indigo-900 dark:text-indigo-200 leading-relaxed">
                            Implementing an advanced <b>SEO content analysis workflow</b> facilitates faster indexing of key web structures, thereby driving targeted keyword growth metrics.
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
                            <TableHead className="text-right">Estimated Density</TableHead>
                            <TableHead className="text-right">Recommendation</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-semibold text-indigo-500">SEO analyzer</TableCell>
                            <TableCell className="text-right font-mono">14,200/mo</TableCell>
                            <TableCell className="text-right font-mono">0.4%</TableCell>
                            <TableCell className="text-right text-amber-500 font-medium">Underused (Goal: 1.2%)</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-semibold text-indigo-500">Competitor SEO audit</TableCell>
                            <TableCell className="text-right font-mono">8,400/mo</TableCell>
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
                            <TableHead className="text-right">Word Count Difference</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-mono text-xs truncate max-w-[250px]">https://semrush.com/blog/seo-best-practices</TableCell>
                            <TableCell className="text-center"><span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold text-xs">92</span></TableCell>
                            <TableCell className="text-right font-mono text-xs">
                              {scrapedData.word_count > 2500 ? "Optimal" : `-${2500 - scrapedData.word_count} words`}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-mono text-xs truncate max-w-[250px]">https://ahrefs.com/blog/seo-basics-guide</TableCell>
                            <TableCell className="text-center"><span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold text-xs">88</span></TableCell>
                            <TableCell className="text-right font-mono text-xs">
                              {scrapedData.word_count > 2100 ? "Optimal" : `-${2100 - scrapedData.word_count} words`}
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
        </main>
      </div>
    </ProtectedRoute>
  )
}
