"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts"
import { 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  Sparkles, 
  Trophy, 
  Zap, 
  Copy, 
  Check 
} from "lucide-react"

interface ComparisonMetrics {
  url: string
  overall_score: number
  word_count: number
  title_score: number
  meta_score: number
  headings_score: number
  readability_score: number
  density_score: number
  image_score: number
  link_score: number
}

interface ContentGap {
  keyword: string
  competitor_frequency: number
  user_frequency: number
  suggested_usage: string
}

interface CompetitorDashboardProps {
  data: {
    primary_metrics: ComparisonMetrics
    competitors_metrics: ComparisonMetrics[]
    content_gaps: ContentGap[]
  }
}

export function CompetitorDashboard({ data }: CompetitorDashboardProps) {
  const [mounted, setMounted] = React.useState(false)
  const [copiedText, setCopiedText] = React.useState<string | null>(null)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(id)
    setTimeout(() => setCopiedText(null), 2000)
  }

  const { primary_metrics, competitors_metrics, content_gaps } = data

  const getDomainName = (url: string) => {
    try {
      return new URL(url).hostname.replace("www.", "")
    } catch {
      return url
    }
  }

  // Format Recharts data
  const chartData = [
    {
      name: "Overall",
      "You (Primary)": primary_metrics.overall_score,
      ...competitors_metrics.reduce((acc, c, idx) => ({
        ...acc,
        [getDomainName(c.url)]: c.overall_score
      }), {})
    },
    {
      name: "Title",
      "You (Primary)": primary_metrics.title_score,
      ...competitors_metrics.reduce((acc, c, idx) => ({
        ...acc,
        [getDomainName(c.url)]: c.title_score
      }), {})
    },
    {
      name: "Meta",
      "You (Primary)": primary_metrics.meta_score,
      ...competitors_metrics.reduce((acc, c, idx) => ({
        ...acc,
        [getDomainName(c.url)]: c.meta_score
      }), {})
    },
    {
      name: "Headings",
      "You (Primary)": primary_metrics.headings_score,
      ...competitors_metrics.reduce((acc, c, idx) => ({
        ...acc,
        [getDomainName(c.url)]: c.headings_score
      }), {})
    },
    {
      name: "Readability",
      "You (Primary)": primary_metrics.readability_score,
      ...competitors_metrics.reduce((acc, c, idx) => ({
        ...acc,
        [getDomainName(c.url)]: c.readability_score
      }), {})
    },
    {
      name: "Density",
      "You (Primary)": primary_metrics.density_score,
      ...competitors_metrics.reduce((acc, c, idx) => ({
        ...acc,
        [getDomainName(c.url)]: c.density_score
      }), {})
    }
  ]

  // Dynamic colors for competitor bars
  const colors = ["#818cf8", "#c084fc", "#f472b6", "#fb7185"]

  // Highlight comparison checks
  const getComparisonStyles = (userScore: number, compScores: number[]) => {
    const maxComp = compScores.length > 0 ? Math.max(...compScores) : 0
    if (userScore >= maxComp) {
      return {
        badge: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        label: "Outperforming",
        icon: CheckCircle2
      }
    }
    return {
      badge: "bg-rose-500/10 text-rose-500 border-rose-500/20",
      label: "Lagging Behind",
      icon: AlertTriangle
    }
  }

  const overallCompScores = competitors_metrics.map(c => c.overall_score)
  const comparison = getComparisonStyles(primary_metrics.overall_score, overallCompScores)
  const CompIcon = comparison.icon

  return (
    <div className="space-y-8 animate-fade-in-up">
      
      {/* Benchmark Summary Header */}
      <Card className="border-border/80 bg-gradient-to-br from-card to-card/50 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        <CardContent className="pt-8 pb-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-center sm:text-left">
            <Badge variant="outline" className={`px-2.5 py-0.5 border ${comparison.badge}`}>
              <CompIcon className="w-3.5 h-3.5 mr-1" />
              {comparison.label} Competitors
            </Badge>
            <h2 className="text-3xl font-black tracking-tight">Competitor Benchmark</h2>
            <p className="text-sm text-muted-foreground max-w-lg">
              Side-by-side score comparison, content outlines, and semantic gap analysis.
            </p>
          </div>

          <div className="flex gap-4">
            <div className="p-4 rounded-xl border border-indigo-500/15 bg-indigo-500/5 text-center min-w-[100px]">
              <span className="block text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Your Score</span>
              <span className="text-3xl font-black text-indigo-500">{primary_metrics.overall_score}</span>
            </div>

            {competitors_metrics.length > 0 && (
              <div className="p-4 rounded-xl border border-border bg-muted/20 text-center min-w-[100px]">
                <span className="block text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Avg Competitor</span>
                <span className="text-3xl font-black text-foreground">
                  {Math.round(overallCompScores.reduce((a, b) => a + b, 0) / overallCompScores.length)}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Visual Chart and Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recharts Bar Chart */}
        <Card className="lg:col-span-2 border-border/60 bg-card/30 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              Score Benchmarks Chart
            </CardTitle>
            <CardDescription>
              SEO performance scores compared across core analysis categories.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80 pt-4">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/30" />
                  <XAxis dataKey="name" className="text-[10px] font-semibold text-muted-foreground" />
                  <YAxis domain={[0, 100]} className="text-[10px] font-semibold text-muted-foreground" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "rgba(15, 23, 42, 0.9)", 
                      borderColor: "rgba(255, 255, 255, 0.1)",
                      borderRadius: "8px",
                      fontSize: "11px"
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "10px", fontWeight: "bold" }} />
                  <Bar dataKey="You (Primary)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  {competitors_metrics.map((c, idx) => (
                    <Bar 
                      key={c.url} 
                      dataKey={getDomainName(c.url)} 
                      fill={colors[idx % colors.length]} 
                      radius={[4, 4, 0, 0]} 
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                Initializing charts...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Highlight Summary Card */}
        <Card className="border-border/60 bg-card/30 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-500 animate-pulse" />
              Quick Wins & Priorities
            </CardTitle>
            <CardDescription>
              Immediate recommendations based on competitor analysis.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            {/* Word count audit */}
            {(() => {
              const compAvgWords = competitors_metrics.reduce((a, b) => a + b.word_count, 0) / (competitors_metrics.length || 1)
              const difference = Math.round(compAvgWords - primary_metrics.word_count)

              if (difference > 100) {
                return (
                  <div className="p-3.5 rounded-xl border border-rose-500/10 bg-rose-500/5 text-xs space-y-1.5">
                    <span className="font-bold text-rose-500 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      Content is too thin
                    </span>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      Competitors write an average of <b>{Math.round(compAvgWords)} words</b>. Expand your page copy by adding at least <b>{difference} words</b> to match topical depth.
                    </p>
                  </div>
                )
              }
              return (
                <div className="p-3.5 rounded-xl border border-emerald-500/10 bg-emerald-500/5 text-xs space-y-1.5">
                  <span className="font-bold text-emerald-500 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    Optimal Content Length
                  </span>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    Your word count ({primary_metrics.word_count}) successfully outperforms or equals competitor averages.
                  </p>
                </div>
              )
            })()}

            {/* Readability audit */}
            {(() => {
              const minCompReadability = competitors_metrics.length > 0 ? Math.min(...competitors_metrics.map(c => c.readability_score)) : 0
              if (primary_metrics.readability_score < 50 && primary_metrics.readability_score < minCompReadability) {
                return (
                  <div className="p-3.5 rounded-xl border border-amber-500/10 bg-amber-500/5 text-xs space-y-1.5">
                    <span className="font-bold text-amber-500 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      Improve reading ease
                    </span>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      Your copy readability score ({primary_metrics.readability_score}) is low. Shorten paragraphs and simplify sentences to make reading easier.
                    </p>
                  </div>
                )
              }
              return (
                <div className="p-3.5 rounded-xl border border-emerald-500/10 bg-emerald-500/5 text-xs space-y-1.5">
                  <span className="font-bold text-emerald-500 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    Readability is good
                  </span>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    Your content flow is competitive and easy to scan.
                  </p>
                </div>
              )
            })()}
          </CardContent>
        </Card>
      </div>

      {/* Comparison scorecard Table */}
      <Card className="border-border/80 bg-card/40 backdrop-blur-sm shadow-xl">
        <CardHeader>
          <CardTitle className="text-sm font-bold">SEO Scorecard Matrix</CardTitle>
          <CardDescription>
            Detailed benchmark matrices mapping performance levels across pages.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Website Domain</TableHead>
                <TableHead className="text-center text-xs">Overall</TableHead>
                <TableHead className="text-right text-xs">Word Count</TableHead>
                <TableHead className="text-center text-xs">Title Tag</TableHead>
                <TableHead className="text-center text-xs">Meta Desc</TableHead>
                <TableHead className="text-center text-xs">Headings</TableHead>
                <TableHead className="text-center text-xs">Readability</TableHead>
                <TableHead className="text-center text-xs">Density</TableHead>
                <TableHead className="text-center text-xs">Images</TableHead>
                <TableHead className="text-center text-xs">Links</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* User row */}
              <TableRow className="bg-indigo-500/5 border-l-2 border-indigo-500 font-semibold">
                <TableCell className="text-xs text-indigo-500 font-bold truncate max-w-[180px]">
                  You ({getDomainName(primary_metrics.url)})
                </TableCell>
                <TableCell className="text-center text-xs font-black text-indigo-500">
                  {primary_metrics.overall_score}
                </TableCell>
                <TableCell className="text-right text-xs font-mono">
                  {primary_metrics.word_count}
                </TableCell>
                <TableCell className="text-center text-xs">{primary_metrics.title_score}</TableCell>
                <TableCell className="text-center text-xs">{primary_metrics.meta_score}</TableCell>
                <TableCell className="text-center text-xs">{primary_metrics.headings_score}</TableCell>
                <TableCell className="text-center text-xs">{primary_metrics.readability_score}</TableCell>
                <TableCell className="text-center text-xs">{primary_metrics.density_score}</TableCell>
                <TableCell className="text-center text-xs">{primary_metrics.image_score}</TableCell>
                <TableCell className="text-center text-xs">{primary_metrics.link_score}</TableCell>
              </TableRow>

              {/* Competitors rows */}
              {competitors_metrics.map((comp) => (
                <TableRow key={comp.url}>
                  <TableCell className="text-xs text-muted-foreground truncate max-w-[180px]" title={comp.url}>
                    {getDomainName(comp.url)}
                  </TableCell>
                  <TableCell className="text-center text-xs font-bold text-foreground">
                    {comp.overall_score}
                  </TableCell>
                  <TableCell className="text-right text-xs font-mono text-muted-foreground">
                    {comp.word_count}
                  </TableCell>
                  <TableCell className="text-center text-xs text-muted-foreground">{comp.title_score}</TableCell>
                  <TableCell className="text-center text-xs text-muted-foreground">{comp.meta_score}</TableCell>
                  <TableCell className="text-center text-xs text-muted-foreground">{comp.headings_score}</TableCell>
                  <TableCell className="text-center text-xs text-muted-foreground">{comp.readability_score}</TableCell>
                  <TableCell className="text-center text-xs text-muted-foreground">{comp.density_score}</TableCell>
                  <TableCell className="text-center text-xs text-muted-foreground">{comp.image_score}</TableCell>
                  <TableCell className="text-center text-xs text-muted-foreground">{comp.link_score}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Content Gap Keyword List */}
      <Card className="border-border/80 bg-card/40 backdrop-blur-sm shadow-xl">
        <CardHeader>
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Sparkles className="w-4.5 h-4.5 text-pink-500 animate-pulse" />
            Competitor Content Gaps
          </CardTitle>
          <CardDescription>
            Keywords that competitor websites use frequently but you are missing or underusing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {content_gaps.length === 0 ? (
            <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Perfect! No significant content keyword gaps identified.</span>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Missing Keyword</TableHead>
                    <TableHead className="text-center text-xs">Competitor Freq (avg)</TableHead>
                    <TableHead className="text-center text-xs">Your Freq</TableHead>
                    <TableHead className="text-right text-xs">AI Suggested Placement Strategy</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {content_gaps.map((gap, i) => {
                    const id = `gap-${i}`
                    return (
                      <TableRow key={id} className="group">
                        <TableCell className="font-bold text-xs text-indigo-500">
                          {gap.keyword}
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs">
                          {gap.competitor_frequency.toFixed(2)}%
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs text-rose-500 font-semibold">
                          {gap.user_frequency.toFixed(2)}%
                        </TableCell>
                        <TableCell className="text-right text-xs relative pr-10">
                          <span className="text-muted-foreground text-[11px] block leading-relaxed max-w-[400px] ml-auto">
                            {gap.suggested_usage}
                          </span>
                          
                          <button
                            onClick={() => handleCopy(gap.keyword, id)}
                            className="absolute top-2.5 right-2.5 p-1 rounded border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-all opacity-0 group-hover:opacity-100"
                            title="Copy Keyword"
                          >
                            {copiedText === id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
