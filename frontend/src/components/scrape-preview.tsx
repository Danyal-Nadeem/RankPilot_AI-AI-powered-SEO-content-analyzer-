"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle2, AlertTriangle, FileText, Globe, Image as ImageIcon, Link as LinkIcon, ChevronDown, ChevronUp } from "lucide-react"

interface ScrapedData {
  source_url?: string
  title?: string
  meta_description?: string
  headings: {
    h1: string[]
    h2: string[]
    h3: string[]
    h4: string[]
    h5: string[]
    h6: string[]
  }
  body_text: string
  word_count: number
  images: { src: string; alt: string }[]
  internal_links: string[]
  external_links: string[]
  scraped_at: string
}

interface ScrapePreviewProps {
  data: ScrapedData
}

export function ScrapePreview({ data }: ScrapePreviewProps) {
  const [expandHeadings, setExpandHeadings] = React.useState(false)
  const [expandImages, setExpandImages] = React.useState(false)
  const [expandLinks, setExpandLinks] = React.useState(false)
  const [expandBody, setExpandBody] = React.useState(false)

  const headingsCount =
    (data.headings.h1?.length || 0) +
    (data.headings.h2?.length || 0) +
    (data.headings.h3?.length || 0) +
    (data.headings.h4?.length || 0) +
    (data.headings.h5?.length || 0) +
    (data.headings.h6?.length || 0)

  return (
    <Card className="border-border/80 bg-card/40 backdrop-blur-sm shadow-xl mt-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          Ingested Raw Preview
        </CardTitle>
        <CardDescription className="truncate">
          Successfully ingested content at {new Date(data.scraped_at).toLocaleTimeString()}. URL:{" "}
          <span className="font-mono text-xs text-indigo-500">{data.source_url || "Direct Raw Input"}</span>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Core Metadata Brief */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-muted/30 border border-border">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">
              Metadata Title
            </span>
            <p className="text-sm font-semibold">
              {data.title ? data.title : <span className="text-rose-500 font-normal italic">None found</span>}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-muted/30 border border-border">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">
              Meta Description
            </span>
            <p className="text-sm">
              {data.meta_description ? (
                data.meta_description
              ) : (
                <span className="text-amber-500 italic">No meta description tags found</span>
              )}
            </p>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl text-center">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Word Count</span>
            <span className="text-lg font-black text-indigo-500">{data.word_count}</span>
          </div>

          <div className="p-3 bg-purple-500/5 border border-purple-500/10 rounded-xl text-center">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Headings Found</span>
            <span className="text-lg font-black text-purple-500">{headingsCount}</span>
          </div>

          <div className="p-3 bg-pink-500/5 border border-pink-500/10 rounded-xl text-center">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Images Count</span>
            <span className="text-lg font-black text-pink-500">{data.images?.length || 0}</span>
          </div>

          <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-center">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Total Links</span>
            <span className="text-lg font-black text-emerald-500">
              {(data.internal_links?.length || 0) + (data.external_links?.length || 0)}
            </span>
          </div>
        </div>

        {/* Expandable Body Excerpt */}
        <div className="border border-border rounded-xl overflow-hidden">
          <button
            onClick={() => setExpandBody(!expandBody)}
            className="w-full px-4 py-3 flex items-center justify-between bg-muted/20 hover:bg-muted/30 transition-colors text-xs font-bold uppercase tracking-wider"
          >
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              Body copy text
            </span>
            {expandBody ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {expandBody && (
            <div className="p-4 bg-background/50 text-xs text-muted-foreground leading-relaxed max-h-60 overflow-y-auto font-mono">
              {data.body_text ? data.body_text : "No plain body text scraped."}
            </div>
          )}
        </div>

        {/* Expandable Headings Listing */}
        <div className="border border-border rounded-xl overflow-hidden">
          <button
            onClick={() => setExpandHeadings(!expandHeadings)}
            className="w-full px-4 py-3 flex items-center justify-between bg-muted/20 hover:bg-muted/30 transition-colors text-xs font-bold uppercase tracking-wider"
          >
            <span className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-purple-500" />
              Headings outline
            </span>
            {expandHeadings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {expandHeadings && (
            <div className="p-4 bg-background/50 space-y-3 max-h-60 overflow-y-auto">
              {headingsCount === 0 ? (
                <span className="text-xs text-rose-500">No heading tags (H1-H6) detected.</span>
              ) : (
                <>
                  {data.headings.h1?.map((h, i) => (
                    <div key={`h1-${i}`} className="pl-2 border-l-2 border-indigo-500 text-sm font-bold text-foreground">
                      <span className="text-[9px] uppercase tracking-wider text-indigo-500 mr-2">H1</span> {h}
                    </div>
                  ))}
                  {data.headings.h2?.map((h, i) => (
                    <div key={`h2-${i}`} className="pl-4 border-l-2 border-purple-500 text-xs font-semibold text-foreground">
                      <span className="text-[9px] uppercase tracking-wider text-purple-500 mr-2">H2</span> {h}
                    </div>
                  ))}
                  {data.headings.h3?.map((h, i) => (
                    <div key={`h3-${i}`} className="pl-6 border-l-2 border-pink-500 text-xs text-muted-foreground">
                      <span className="text-[9px] uppercase tracking-wider text-pink-500 mr-2">H3</span> {h}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* Expandable Images Alt list */}
        <div className="border border-border rounded-xl overflow-hidden">
          <button
            onClick={() => setExpandImages(!expandImages)}
            className="w-full px-4 py-3 flex items-center justify-between bg-muted/20 hover:bg-muted/30 transition-colors text-xs font-bold uppercase tracking-wider"
          >
            <span className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-pink-500" />
              Images & Alt Attributes
            </span>
            {expandImages ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {expandImages && (
            <div className="p-4 bg-background/50 max-h-60 overflow-y-auto">
              {!data.images || data.images.length === 0 ? (
                <span className="text-xs text-rose-500">No image elements detected.</span>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Source Link</TableHead>
                      <TableHead className="text-xs text-right">Alt Text description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.images.map((img, i) => (
                      <TableRow key={`img-${i}`}>
                        <TableCell className="font-mono text-[10px] truncate max-w-[200px]" title={img.src}>
                          {img.src}
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {img.alt ? (
                            <span className="text-emerald-500 font-semibold">{img.alt}</span>
                          ) : (
                            <span className="text-rose-500 flex items-center justify-end gap-1 font-medium">
                              <AlertTriangle className="w-3.5 h-3.5" /> Missing
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </div>

        {/* Expandable Links list */}
        <div className="border border-border rounded-xl overflow-hidden">
          <button
            onClick={() => setExpandLinks(!expandLinks)}
            className="w-full px-4 py-3 flex items-center justify-between bg-muted/20 hover:bg-muted/30 transition-colors text-xs font-bold uppercase tracking-wider"
          >
            <span className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-emerald-500" />
              Extracted Hyperlinks
            </span>
            {expandLinks ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {expandLinks && (
            <div className="p-4 bg-background/50 space-y-4 max-h-60 overflow-y-auto">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">
                  Internal Links ({data.internal_links?.length || 0})
                </span>
                {data.internal_links?.length === 0 ? (
                  <span className="text-xs text-muted-foreground italic">None extracted</span>
                ) : (
                  <div className="space-y-1">
                    {data.internal_links.map((link, i) => (
                      <div key={`int-${i}`} className="text-xs font-mono truncate text-indigo-500" title={link}>
                        {link}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">
                  External Links ({data.external_links?.length || 0})
                </span>
                {data.external_links?.length === 0 ? (
                  <span className="text-xs text-muted-foreground italic">None extracted</span>
                ) : (
                  <div className="space-y-1">
                    {data.external_links.map((link, i) => (
                      <div key={`ext-${i}`} className="text-xs font-mono truncate text-emerald-500" title={link}>
                        {link}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
