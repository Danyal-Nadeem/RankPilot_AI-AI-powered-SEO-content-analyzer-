"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { ProtectedRoute } from "@/components/protected-route"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Search, 
  Loader2, 
  Download, 
  Trash2, 
  Bookmark, 
  Sparkles, 
  Lightbulb, 
  CheckCircle2, 
  TrendingUp,
  FileSpreadsheet
} from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"

const keywordSchema = z.object({
  seedKeyword: z.string().min(2, "Seed keyword must be at least 2 characters.")
})

type KeywordFormValues = z.infer<typeof keywordSchema>

interface KeywordIdea {
  keyword: string
  intent: string
  content_angle: string
}

interface SavedKeyword {
  _id: string
  keyword: string
  intent: string
  content_angle: string
  created_at: string
}

export default function KeywordResearchPage() {
  const [isSearching, setIsSearching] = React.useState(false)
  const [researchResult, setResearchResult] = React.useState<any>(null)
  const [savedKeywords, setSavedKeywords] = React.useState<SavedKeyword[]>([])
  const [isSaving, setIsSaving] = React.useState<Record<string, boolean>>({})
  const [isDeleting, setIsDeleting] = React.useState<Record<string, boolean>>({})
  const [researchError, setResearchError] = React.useState<string | null>(null)
  const [actionError, setActionError] = React.useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<KeywordFormValues>({
    resolver: zodResolver(keywordSchema)
  })

  // Load saved keyword list on mount
  React.useEffect(() => {
    fetchSavedKeywords()
  }, [])

  const fetchSavedKeywords = async () => {
    try {
      const res = await fetch(`${API_URL}/keyword/list`, {
        credentials: "include"
      })
      if (res.ok) {
        const data = await res.json()
        setSavedKeywords(data)
      }
    } catch (err) {
      console.error("Failed to fetch saved keyword list:", err)
    }
  }

  const onSubmit = async (values: KeywordFormValues) => {
    setIsSearching(true)
    setResearchError(null)
    setResearchResult(null)

    try {
      const res = await fetch(`${API_URL}/keyword/research`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ seed_keyword: values.seedKeyword }),
        credentials: "include"
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || "Failed to query keyword suggestions.")
      }

      setResearchResult(data)
    } catch (err: any) {
      setResearchError(err.message)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSaveKeyword = async (keyword: string, intent: string, contentAngle: string) => {
    setIsSaving(prev => ({ ...prev, [keyword]: true }))
    setActionError(null)

    try {
      const res = await fetch(`${API_URL}/keyword/list`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          keyword,
          intent,
          content_angle: contentAngle
        }),
        credentials: "include"
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.detail || "Failed to save keyword.")
      }

      await fetchSavedKeywords()
    } catch (err: any) {
      setActionError(err.message)
    } finally {
      setIsSaving(prev => ({ ...prev, [keyword]: false }))
    }
  }

  const handleDeleteKeyword = async (id: string) => {
    setIsDeleting(prev => ({ ...prev, [id]: true }))
    setActionError(null)

    try {
      const res = await fetch(`${API_URL}/keyword/list/${id}`, {
        method: "DELETE",
        credentials: "include"
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.detail || "Failed to remove keyword.")
      }

      setSavedKeywords(prev => prev.filter(item => item._id !== id))
    } catch (err: any) {
      setActionError(err.message)
    } finally {
      setIsDeleting(prev => ({ ...prev, [id]: false }))
    }
  }

  const handleExportCSV = () => {
    if (savedKeywords.length === 0) return
    
    // Format rows safely with double quotes for comma cells
    const headers = "Keyword,Search Intent,Content Angle,Saved At\n"
    const rows = savedKeywords
      .map(k => `"${k.keyword.replace(/"/g, '""')}","${k.intent}","${k.content_angle.replace(/"/g, '""')}","${k.created_at}"`)
      .join("\n")
      
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `rankpilot_saved_keywords_${new Date().toISOString().slice(0, 10)}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const loadSample = () => {
    setValue("seedKeyword", "AI SEO platform")
  }

  const getIntentBadgeStyles = (intent: string) => {
    switch (intent.toLowerCase()) {
      case "transactional":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
      case "informational":
        return "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
      case "navigational":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen bg-background text-foreground font-sans">
        <Navbar />

        {/* Orbs */}
        <div className="absolute top-[15%] left-[5%] w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="absolute bottom-[15%] right-[5%] w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />

        <main className="flex-1 container mx-auto px-4 md:px-8 py-8 max-w-6xl space-y-8">
          
          {/* Header section */}
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Keyword Research Hub
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Enter a search query to identify semantic search variations, intent mappings, and outline angles.
            </p>
          </div>

          {actionError && (
            <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 text-xs text-rose-600 dark:text-rose-400 font-semibold">
              {actionError}
            </div>
          )}

          {/* Research controls and Saved panels split grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Search form controls column */}
            <div className="lg:col-span-3 space-y-6">
              <Card className="border-border/80 bg-card/50 backdrop-blur-sm shadow-md">
                <CardHeader>
                  <CardTitle className="text-md flex items-center gap-1.5">
                    <TrendingUp className="w-4.5 h-4.5 text-indigo-500" />
                    Query Parameters
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-grow">
                      <Input
                        placeholder="e.g. SEO metrics tracker"
                        disabled={isSearching}
                        className="h-11 rounded-lg bg-background/50 border-border focus-visible:ring-indigo-500/50"
                        {...register("seedKeyword")}
                      />
                      {errors.seedKeyword && (
                        <span className="text-[10px] text-rose-500 font-bold mt-1 block">
                          {errors.seedKeyword.message}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={loadSample}
                        disabled={isSearching}
                        className="h-11 px-4 text-xs font-semibold rounded-lg hover:bg-muted"
                      >
                        Sample seed
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSearching}
                        className="h-11 px-6 font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg min-w-[130px]"
                      >
                        {isSearching ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Researching...
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5">
                            <Search className="w-4 h-4" />
                            Query Ideas
                          </span>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {researchError && (
                <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 text-xs text-rose-600 dark:text-rose-400 font-semibold">
                  {researchError}
                </div>
              )}

              {/* Research results suggestions view */}
              {researchResult && (
                <div className="space-y-6">
                  {/* Related keywords scorecard list */}
                  <Card className="border-border/80 bg-card/30 backdrop-blur-sm shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        Related Semantic Keywords
                      </CardTitle>
                      <CardDescription>
                        Search suggestions closely related to: "{researchResult.seed_keyword}"
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-40 pl-5 text-xs">Keyword Suggestion</TableHead>
                            <TableHead className="text-center w-28 text-xs">Search Intent</TableHead>
                            <TableHead className="text-xs">Content Focus Angle</TableHead>
                            <TableHead className="text-center w-20 text-xs pr-5">Save</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {researchResult.related_keywords?.map((item: KeywordIdea, idx: number) => {
                            const isAlreadySaved = savedKeywords.some(s => s.keyword.toLowerCase() === item.keyword.toLowerCase())
                            return (
                              <TableRow key={idx}>
                                <TableCell className="font-semibold text-xs pl-5 text-indigo-500">
                                  {item.keyword}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant="outline" className={`px-2 py-0.5 text-[9px] uppercase font-black ${getIntentBadgeStyles(item.intent)}`}>
                                    {item.intent}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground leading-relaxed">
                                  {item.content_angle}
                                </TableCell>
                                <TableCell className="text-center pr-5">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="xs"
                                    disabled={isSaving[item.keyword] || isAlreadySaved}
                                    onClick={() => handleSaveKeyword(item.keyword, item.intent, item.content_angle)}
                                    className="h-8 w-8 p-0 rounded-lg"
                                  >
                                    {isSaving[item.keyword] ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : isAlreadySaved ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                    ) : (
                                      <Bookmark className="w-3.5 h-3.5" />
                                    )}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  {/* Long-tail variations scorecard list */}
                  <Card className="border-border/80 bg-card/30 backdrop-blur-sm shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-pink-500 animate-pulse" />
                        Long-Tail Variations
                      </CardTitle>
                      <CardDescription>
                        Specific low-competition questions or search queries.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-48 pl-5 text-xs">Long-Tail keyword</TableHead>
                            <TableHead className="text-center w-28 text-xs">Search Intent</TableHead>
                            <TableHead className="text-xs">Content Focus Angle</TableHead>
                            <TableHead className="text-center w-20 text-xs pr-5">Save</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {researchResult.long_tail_variations?.map((item: KeywordIdea, idx: number) => {
                            const isAlreadySaved = savedKeywords.some(s => s.keyword.toLowerCase() === item.keyword.toLowerCase())
                            return (
                              <TableRow key={idx}>
                                <TableCell className="font-semibold text-xs pl-5 text-indigo-500">
                                  {item.keyword}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant="outline" className={`px-2 py-0.5 text-[9px] uppercase font-black ${getIntentBadgeStyles(item.intent)}`}>
                                    {item.intent}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground leading-relaxed">
                                  {item.content_angle}
                                </TableCell>
                                <TableCell className="text-center pr-5">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="xs"
                                    disabled={isSaving[item.keyword] || isAlreadySaved}
                                    onClick={() => handleSaveKeyword(item.keyword, item.intent, item.content_angle)}
                                    className="h-8 w-8 p-0 rounded-lg"
                                  >
                                    {isSaving[item.keyword] ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : isAlreadySaved ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                    ) : (
                                      <Bookmark className="w-3.5 h-3.5" />
                                    )}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  {/* Content title ideas */}
                  <Card className="border-border/80 bg-card/30 backdrop-blur-sm shadow-md">
                    <CardHeader>
                      <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                        <Lightbulb className="w-4 h-4 text-amber-500" />
                        AI Recommended Content Title Angles
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {researchResult.content_ideas?.map((idea: string, idx: number) => (
                        <div key={idx} className="p-3 bg-background/50 border border-border/60 rounded-lg text-xs leading-relaxed font-semibold">
                          💡 {idea}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            {/* Saved keywords permanent list panel */}
            <div className="lg:col-span-1">
              <Card className="border-border/80 bg-card/60 backdrop-blur-md shadow-lg sticky top-24">
                <CardHeader className="pb-3 border-b border-border/40 bg-muted/10">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Bookmark className="w-4 h-4 text-indigo-500 fill-indigo-500/20" />
                    Saved Keywords List ({savedKeywords.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {savedKeywords.length === 0 ? (
                    <div className="text-center py-6 text-xs text-muted-foreground italic">
                      No keywords saved yet. Search seed queries and add ideas.
                    </div>
                  ) : (
                    <>
                      <div className="max-h-[350px] overflow-y-auto pr-1 space-y-2">
                        {savedKeywords.map((item) => (
                          <div 
                            key={item._id}
                            className="p-3 rounded-lg border border-border bg-background/50 flex flex-col gap-2 relative group hover:border-indigo-500/20 transition-all"
                          >
                            <div className="flex justify-between items-start gap-3">
                              <span className="text-xs font-bold text-foreground leading-relaxed pr-6">
                                {item.keyword}
                              </span>
                              
                              <button
                                onClick={() => handleDeleteKeyword(item._id)}
                                disabled={isDeleting[item._id]}
                                className="absolute top-2.5 right-2.5 p-1 rounded hover:bg-muted text-muted-foreground hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                                title="Remove keyword"
                              >
                                {isDeleting[item._id] ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3 h-3" />
                                )}
                              </button>
                            </div>

                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className={`px-1.5 py-0 text-[8px] uppercase font-black shrink-0 ${getIntentBadgeStyles(item.intent)}`}>
                                {item.intent}
                              </Badge>
                              <span className="text-[8px] text-muted-foreground font-semibold">
                                {new Date(item.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <Button
                        type="button"
                        onClick={handleExportCSV}
                        className="w-full h-10 font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center justify-center gap-1.5 text-xs shadow-md shadow-emerald-500/10"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        Export Saved (CSV)
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

          </div>

        </main>
      </div>
    </ProtectedRoute>
  )
}
