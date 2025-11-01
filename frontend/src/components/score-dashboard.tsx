"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  CheckCircle2, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  Lightbulb, 
  Gauge, 
  Type, 
  AlignLeft, 
  Heading1, 
  Search, 
  Sparkles,
  Image as ImageIcon, 
  Link as LinkIcon 
} from "lucide-react"

interface CategoryData {
  score: number
  details: string
  suggestions: string[]
}

interface ScoreReport {
  overall_score: number
  primary_keyword: string
  lsi_keywords: string[]
  breakdown: {
    title_tag: CategoryData
    meta_description: CategoryData
    headings: CategoryData
    readability: CategoryData
    keyword_density: CategoryData
    image_optimization: CategoryData
    link_ratio: CategoryData
  }
}

interface ScoreDashboardProps {
  report: ScoreReport
}

export function ScoreDashboard({ report }: ScoreDashboardProps) {
  const [expandedSection, setExpandedSection] = React.useState<string | null>(null)

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "emerald"
    if (score >= 50) return "amber"
    return "rose"
  }

  const getScoreStyles = (score: number) => {
    if (score >= 80) {
      return {
        text: "text-emerald-500 dark:text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
        progress: "bg-emerald-500",
      }
    }
    if (score >= 50) {
      return {
        text: "text-amber-500 dark:text-amber-400",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
        progress: "bg-amber-500",
      }
    }
    return {
      text: "text-rose-500 dark:text-rose-400",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
      progress: "bg-rose-500",
    }
  }

  const categories = [
    {
      key: "title_tag",
      name: "Title Tag",
      icon: Type,
      data: report.breakdown.title_tag,
    },
    {
      key: "meta_description",
      name: "Meta Description",
      icon: AlignLeft,
      data: report.breakdown.meta_description,
    },
    {
      key: "headings",
      name: "Heading Structure",
      icon: Heading1,
      data: report.breakdown.headings,
    },
    {
      key: "readability",
      name: "Readability & Length",
      icon: Gauge,
      data: report.breakdown.readability,
    },
    {
      key: "keyword_density",
      name: "Keyword Density",
      icon: Search,
      data: report.breakdown.keyword_density,
    },
    {
      key: "image_optimization",
      name: "Image Optimization",
      icon: ImageIcon,
      data: report.breakdown.image_optimization,
    },
    {
      key: "link_ratio",
      name: "Link Structure",
      icon: LinkIcon,
      data: report.breakdown.link_ratio,
    },
  ]

  const overallStyles = getScoreStyles(report.overall_score)

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Overall Score Header */}
      <Card className="border-border/80 bg-gradient-to-br from-card to-card/50 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        <CardContent className="pt-8 pb-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-500">
              <Sparkles className="w-3.5 h-3.5" />
              SEO Scoring Complete
            </div>
            <h2 className="text-3xl font-black tracking-tight">Audit Report Overview</h2>
            <p className="text-sm text-muted-foreground max-w-lg">
              Scored against target focus keyword: <b className="text-foreground">"{report.primary_keyword}"</b>
              {report.lsi_keywords?.length > 0 && (
                <span> and LSI support terms: {report.lsi_keywords.map(kw => `"${kw}"`).join(", ")}</span>
              )}
            </p>
          </div>

          {/* Large Overall Circle Gauge */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-muted/15"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="url(#overallScoreGrad)"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={263.89}
                  strokeDashoffset={263.89 - (263.89 * report.overall_score) / 100}
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="overallScoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="50%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-black tracking-tighter">{report.overall_score}</span>
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                  {report.overall_score >= 80 ? "Excellent" : report.overall_score >= 50 ? "Average" : "Poor"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid of Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map((cat) => {
          const styles = getScoreStyles(cat.data.score)
          const Icon = cat.icon
          const isExpanded = expandedSection === cat.key

          return (
            <Card 
              key={cat.key} 
              className={`border-border/60 bg-card/30 backdrop-blur-sm shadow-md overflow-hidden transition-all duration-300 ${
                isExpanded ? "ring-2 ring-indigo-500/20" : ""
              }`}
            >
              <CardContent className="p-0">
                {/* Header block (Click to toggle) */}
                <button
                  onClick={() => toggleSection(cat.key)}
                  className="w-full p-5 flex items-center justify-between hover:bg-muted/15 transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl ${styles.bg} ${styles.text} border ${styles.border}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold">{cat.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {cat.data.details}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                      <span className={`text-lg font-black ${styles.text}`}>{cat.data.score}</span>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Score</span>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </button>

                {/* Expanded suggestion contents */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-3 border-t border-border/40 bg-muted/10 space-y-4 animate-fade-in">
                    {/* Details explanation */}
                    <div className="text-xs leading-relaxed text-muted-foreground bg-background/40 p-3 rounded-lg border border-border/50">
                      {cat.data.details}
                    </div>

                    {/* Suggestions list */}
                    <div className="space-y-2.5">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                        Optimization Checklist
                      </h4>
                      {cat.data.suggestions.length === 0 ? (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>No issues found. Fully optimized!</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {cat.data.suggestions.map((sug, index) => (
                            <div 
                              key={index}
                              className={`p-3 rounded-lg border flex items-start gap-2.5 text-xs ${
                                cat.data.score >= 80 
                                  ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                  : cat.data.score >= 50
                                    ? "bg-amber-500/5 border-amber-500/10 text-amber-700 dark:text-amber-300"
                                    : "bg-rose-500/5 border-rose-500/10 text-rose-700 dark:text-rose-300"
                              }`}
                            >
                              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                              <span>{sug}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
