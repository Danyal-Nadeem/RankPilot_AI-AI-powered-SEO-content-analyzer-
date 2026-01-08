"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, Zap, CheckCircle2, AlertCircle, FileSpreadsheet, ArrowUpDown, ExternalLink } from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"

interface BulkScanProps {
  onLoadReport: (pageId: string) => void
}

interface ScanResultItem {
  url: string
  status: string
  page_id: string | null
  title: string
  score: number | null
  completed_at: string
  error: string | null
}

export function BulkScan({ onLoadReport }: BulkScanProps) {
  const [urlsInput, setUrlsInput] = React.useState("")
  const [focusKeyword, setFocusKeyword] = React.useState("")
  const [csvFile, setCsvFile] = React.useState<File | null>(null)
  
  // Job State
  const [jobId, setJobId] = React.useState<string | null>(null)
  const [jobStatus, setJobStatus] = React.useState<string>("idle") // idle, processing, completed, failed
  const [totalUrls, setTotalUrls] = React.useState(0)
  const [completedUrls, setCompletedUrls] = React.useState(0)
  const [results, setResults] = React.useState<ScanResultItem[]>([])
  
  // UI Helpers
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc" | null>(null)

  // Handle Poll Loop
  React.useEffect(() => {
    let timer: NodeJS.Timeout
    if (jobId && jobStatus === "processing") {
      const pollStatus = async () => {
        try {
          const res = await fetch(`${API_URL}/bulk/status/${jobId}`, {
            credentials: "include"
          })
          if (res.ok) {
            const data = await res.json()
            setJobStatus(data.status)
            setCompletedUrls(data.completed_urls)
            setTotalUrls(data.total_urls)
            setResults(data.results || [])
            
            if (data.status === "completed" || data.status === "failed") {
              setJobId(null)
            }
          }
        } catch (err) {
          console.error("Polling job status failed:", err)
        }
      }
      
      timer = setInterval(pollStatus, 1500)
    }
    
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [jobId, jobStatus])

  // Handle CSV file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null)
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith(".csv")) {
      setErrorMsg("Please upload a valid CSV file.")
      return
    }

    setCsvFile(file)
    
    // Parse CSV locally to preview or load into textarea
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const lines = text
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.length > 0 && line.startsWith("http"))
      
      if (lines.length > 20) {
        setErrorMsg("CSV contains more than 20 URLs. Only the first 20 will be imported.")
        setUrlsInput(lines.slice(0, 20).join("\n"))
      } else {
        setUrlsInput(lines.join("\n"))
      }
    }
    reader.readAsText(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setResults([])
    setJobId(null)
    setJobStatus("idle")

    const urls = urlsInput
      .split("\n")
      .map(url => url.trim())
      .filter(url => url.length > 0)

    if (urls.length === 0) {
      setErrorMsg("Please supply at least one target URL.")
      return
    }

    if (urls.length > 20) {
      setErrorMsg("Maximum batch size is 20 URLs. Please trim list.")
      return
    }

    if (!focusKeyword.trim()) {
      setErrorMsg("Please specify a primary focus keyword for comparisons.")
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch(`${API_URL}/bulk/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          urls,
          primary_keyword: focusKeyword
        }),
        credentials: "include"
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || "Failed to trigger bulk analysis.")
      }

      setJobId(data.job_id)
      setJobStatus("processing")
      setTotalUrls(urls.length)
      setCompletedUrls(0)
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSortByScore = () => {
    const nextOrder = sortOrder === "desc" ? "asc" : "desc"
    setSortOrder(nextOrder)
    
    const sorted = [...results].sort((a, b) => {
      const scoreA = a.score ?? -1
      const scoreB = b.score ?? -1
      return nextOrder === "asc" ? scoreA - scoreB : scoreB - scoreA
    })
    
    setResults(sorted)
  }

  const progressPercent = totalUrls > 0 ? Math.round((completedUrls / totalUrls) * 100) : 0

  return (
    <div className="space-y-6">
      
      <Card className="border-border/80 bg-card/50 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-500 animate-pulse" />
            Bulk URL Scoring Queue
          </CardTitle>
          <CardDescription>
            Audit up to 20 websites in parallel. Supply a line-separated list of URLs or upload a CSV file containing target websites.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  URLs to Analyze (One per line)
                </label>
                <textarea
                  placeholder="https://example.com/page-1&#13;https://example.com/page-2"
                  value={urlsInput}
                  onChange={(e) => setUrlsInput(e.target.value)}
                  disabled={jobStatus === "processing" || isSubmitting}
                  className="w-full min-h-[140px] p-3 text-xs font-mono rounded-lg bg-background/50 border border-border focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-y"
                />
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Upload URLs via CSV
                  </label>
                  <div className="relative group border border-dashed border-border/80 hover:border-indigo-500/60 rounded-lg p-6 text-center cursor-pointer transition-colors bg-background/20">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      disabled={jobStatus === "processing" || isSubmitting}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <FileSpreadsheet className="w-8 h-8 text-muted-foreground mx-auto mb-2 group-hover:text-indigo-500 transition-colors" />
                    <span className="block text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                      {csvFile ? csvFile.name : "Click to browse or drop CSV here"}
                    </span>
                    <span className="block text-[10px] text-muted-foreground/60 mt-1">
                      Reads all URL cells from file rows (max 20)
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Focus Target Keyword
                  </label>
                  <Input
                    placeholder="e.g. best SEO marketing practices"
                    value={focusKeyword}
                    onChange={(e) => setFocusKeyword(e.target.value)}
                    disabled={jobStatus === "processing" || isSubmitting}
                    className="h-10 rounded-lg bg-background/50 border border-border"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={isSubmitting || jobStatus === "processing" || !urlsInput.trim()}
                className="h-10 px-8 font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg min-w-[150px] shadow-lg shadow-indigo-500/10"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Initializing Queue...
                  </span>
                ) : (
                  "Execute Bulk Scans"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Progress Card */}
      {jobStatus === "processing" && (
        <Card className="border-border/80 bg-card/50 backdrop-blur-sm shadow-md animate-pulse">
          <CardContent className="pt-6 pb-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Processing Queue Batch Job
                </span>
              </div>
              <span className="text-xs font-black text-indigo-500">
                {completedUrls} / {totalUrls} Crawled ({progressPercent}%)
              </span>
            </div>

            {/* Progress Bar container */}
            <div className="w-full bg-muted rounded-full h-2 relative overflow-hidden">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Live activity log tracker */}
            <div className="max-h-40 overflow-y-auto space-y-2 border border-border/60 bg-background/30 rounded-lg p-3 text-xs font-mono">
              {results.length === 0 ? (
                <span className="italic text-muted-foreground">Waiting for worker process to lock tasks...</span>
              ) : (
                results.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center gap-4">
                    <span className="truncate max-w-sm" title={item.url}>{item.url}</span>
                    <span className="shrink-0 flex items-center gap-1">
                      {item.status === "success" ? (
                        <span className="text-emerald-500 flex items-center gap-1 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Scored: {item.score}
                        </span>
                      ) : item.status === "failed" ? (
                        <span className="text-rose-500 flex items-center gap-1 font-bold" title={item.error || ""}>
                          <AlertCircle className="w-3.5 h-3.5" /> Failed
                        </span>
                      ) : (
                        <span className="text-muted-foreground animate-pulse">Crawling...</span>
                      )}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Results Dashboard */}
      {results.length > 0 && jobStatus !== "processing" && (
        <Card className="border-border/80 bg-card/50 backdrop-blur-sm shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-md flex items-center gap-1.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              Batch Crawl Scoring Completed
            </CardTitle>
            <CardDescription>
              Review calculated ratings for the batch crawl list.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5 text-xs">Page Title</TableHead>
                  <TableHead className="text-xs">Destination URL</TableHead>
                  <TableHead className="text-center text-xs">Status</TableHead>
                  <TableHead className="text-center text-xs cursor-pointer select-none" onClick={handleSortByScore}>
                    <div className="flex items-center justify-center gap-1">
                      Score
                      <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                    </div>
                  </TableHead>
                  <TableHead className="text-center text-xs pr-5">Report</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((item, idx) => (
                  <TableRow key={idx} className="hover:bg-muted/10 transition-colors">
                    <TableCell className="pl-5 font-bold text-xs truncate max-w-[180px]" title={item.title}>
                      {item.title}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground truncate max-w-[200px]" title={item.url}>
                      {item.url}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={
                        item.status === "success" 
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                          : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                      }>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {item.score !== null ? (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          item.score >= 80 
                            ? "bg-emerald-500/10 text-emerald-500" 
                            : item.score >= 50 
                              ? "bg-amber-500/10 text-amber-500" 
                              : "bg-rose-500/10 text-rose-500"
                        }`}>
                          {item.score}
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground italic">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center pr-5">
                      {item.page_id ? (
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => onLoadReport(item.page_id!)}
                          className="h-8 w-8 p-0 rounded-lg hover:bg-indigo-600 hover:text-white"
                          title="Open SEO Report Details"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      ) : (
                        <span className="text-[10px] text-muted-foreground/60 italic hover:cursor-help" title={item.error || "Crawl interrupted"}>
                          Detail Error
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

    </div>
  )
}
