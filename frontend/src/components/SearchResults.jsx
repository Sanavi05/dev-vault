import { FileText, Image, Code, File, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import { useState } from 'react'

const FILE_ICON_MAP = { pdf: FileText, image: Image, code: Code, text: File }
const FILE_TYPE_COLORS = {
  pdf: { border: 'border-vault-red/30', text: 'text-vault-red', bg: 'bg-vault-red/5' },
  image: { border: 'border-vault-amber/30', text: 'text-vault-amber', bg: 'bg-vault-amber/5' },
  code: { border: 'border-vault-accent/30', text: 'text-vault-accent', bg: 'bg-vault-accent/5' },
  text: { border: 'border-vault-green/30', text: 'text-vault-green', bg: 'bg-vault-green/5' },
}

function SimilarityBadge({ score }) {
  const pct = Math.round(score * 100)
  const color = pct >= 80 ? 'text-vault-green' : pct >= 60 ? 'text-vault-accent' : 'text-vault-amber'
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1 bg-vault-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: pct >= 80
              ? 'linear-gradient(90deg, #22d3ee, #4ade80)'
              : pct >= 60
                ? 'linear-gradient(90deg, #0e7490, #22d3ee)'
                : 'linear-gradient(90deg, #92400e, #fbbf24)',
          }}
        />
      </div>
      <span className={`text-xs font-mono ${color}`}>{pct}%</span>
    </div>
  )
}

function ChunkCard({ chunk, index, query }) {
  const [expanded, setExpanded] = useState(index === 0) // first result expanded by default
  const Icon = FILE_ICON_MAP[chunk.file_type] || File
  const colors = FILE_TYPE_COLORS[chunk.file_type] || FILE_TYPE_COLORS.text
  const isCode = chunk.file_type === 'code'

  // Highlight query terms in the text
  const highlightedText = (text) => {
    const words = query.split(/\s+/).filter(w => w.length > 3)
    if (!words.length) return text
    const pattern = new RegExp(`(${words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi')
    const parts = text.split(pattern)
    return parts.map((part, i) =>
      pattern.test(part)
        ? <mark key={i} className="bg-vault-accent/20 text-vault-accent rounded px-0.5">{part}</mark>
        : part
    )
  }

  return (
    <div className={`rounded-xl border transition-all duration-200 overflow-hidden animate-slide-up
      ${index === 0 ? 'border-vault-accent/40 bg-vault-surface glow-cyan' : 'border-vault-border bg-vault-surface hover:border-vault-muted'}`}
      style={{ animationDelay: `${index * 60}ms` }}>

      {/* Header */}
      <div
        className="flex items-center gap-3 p-3 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Rank */}
        <span className={`flex-shrink-0 w-6 h-6 rounded flex items-center justify-center text-xs font-mono font-bold
          ${index === 0 ? 'bg-vault-accent/20 text-vault-accent' : 'bg-vault-muted text-vault-dim'}`}>
          {index + 1}
        </span>

        {/* Icon + source */}
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border ${colors.border} ${colors.bg}`}>
          <Icon size={11} className={colors.text} />
          <span className={`text-xs font-mono ${colors.text} max-w-[140px] truncate`}>
            {chunk.source}
          </span>
        </div>

        {/* chunk index */}
        <span className="text-xs text-vault-dim font-mono">chunk #{chunk.chunk_index}</span>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Similarity */}
        <SimilarityBadge score={chunk.similarity_score} />

        {/* Expand/collapse */}
        <button className="text-vault-dim hover:text-vault-text transition-colors ml-1">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Content */}
      {expanded && (
        <div className="px-3 pb-3 border-t border-vault-border/50">
          <div className={`mt-3 rounded-lg overflow-hidden ${
            isCode ? 'bg-black/40 border border-vault-border' : 'bg-black/20'
          }`}>
            <div className={`px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words max-h-48 overflow-y-auto
              ${isCode ? 'font-mono text-xs text-vault-text' : 'text-vault-text/90 font-sans'}`}>
              {highlightedText(chunk.text)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function SearchResults({ results, query, aiAnswer, isLoading }) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-14 rounded-xl bg-vault-surface border border-vault-border animate-pulse"
            style={{ animationDelay: `${i * 100}ms` }} />
        ))}
        <p className="text-xs text-vault-dim font-mono text-center pt-1 animate-pulse">
          embedding query · searching vectors…
        </p>
      </div>
    )
  }

  if (!results) return null

  if (results.length === 0) {
    return (
      <div className="text-center py-12 space-y-3">
        <div className="text-4xl">🔍</div>
        <p className="text-vault-dim font-mono text-sm">No matching chunks found.</p>
        <p className="text-vault-dim/60 text-xs">Try uploading some files first, or rephrase your query.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* AI Answer panel */}
      {aiAnswer && (
        <div className="p-4 rounded-xl border border-vault-accent/30 bg-vault-accent/5 space-y-2">
          <div className="flex items-center gap-2 text-xs text-vault-accent font-mono">
            <Sparkles size={12} />
            <span>AI synthesis</span>
          </div>
          <p className="text-sm text-vault-text leading-relaxed">{aiAnswer}</p>
        </div>
      )}

      {/* Results header */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-vault-dim font-mono uppercase tracking-wider">
          Retrieved chunks
        </span>
        <span className="text-xs text-vault-dim font-mono">
          {results.length} results · ranked by similarity
        </span>
      </div>

      {/* Chunk cards */}
      <div className="space-y-2">
        {results.map((chunk, i) => (
          <ChunkCard key={chunk.chunk_id} chunk={chunk} index={i} query={query} />
        ))}
      </div>
    </div>
  )
}
