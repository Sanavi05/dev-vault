import { useState, useRef, useEffect } from 'react'
import { Search, Sparkles, ArrowRight, X, Clock } from 'lucide-react'

const EXAMPLE_QUERIES = [
  'Where was that JWT auth issue?',
  'How did I fix the CORS problem?',
  'What was the Redis configuration?',
  'Which file had the async bug?',
  'Show me the database migration notes',
]

export default function ChatWindow({ onSearch, isLoading, hasResults }) {
  const [query, setQuery] = useState('')
  const [generateAnswer, setGenerateAnswer] = useState(false)
  const [history, setHistory] = useState([])
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = (q = query) => {
    if (!q.trim() || isLoading) return
    setHistory(prev => [q, ...prev.slice(0, 4)])
    onSearch(q.trim(), { generateAnswer })
    setQuery('')
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className={`relative rounded-xl border transition-all duration-200 overflow-hidden
        ${isLoading
          ? 'border-vault-accent/40 bg-vault-surface/80 glow-cyan'
          : 'border-vault-border bg-vault-surface focus-within:border-vault-accent/50 focus-within:glow-cyan'
        }`}>
        {/* Loading scan line */}
        {isLoading && <div className="scan-line" />}

        <div className="flex items-start gap-3 p-3">
          <div className="mt-0.5 flex-shrink-0">
            <Search size={16} className={`transition-colors ${isLoading ? 'text-vault-accent' : 'text-vault-dim'}`} />
          </div>

          <textarea
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder='Ask your knowledge base anything… "where was that JWT bug?"'
            rows={2}
            disabled={isLoading}
            className="flex-1 bg-transparent text-sm text-vault-text placeholder-vault-dim/50 resize-none outline-none font-sans leading-relaxed"
          />

          {/* Clear */}
          {query && (
            <button
              onClick={() => setQuery('')}
              className="mt-0.5 text-vault-dim hover:text-vault-text transition-colors flex-shrink-0"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between px-3 pb-3 gap-3">
          {/* AI answer toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none group">
            <div
              onClick={() => setGenerateAnswer(!generateAnswer)}
              className={`w-7 h-4 rounded-full transition-colors relative flex-shrink-0 ${
                generateAnswer ? 'bg-vault-accent' : 'bg-vault-muted'
              }`}
            >
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${
                generateAnswer ? 'translate-x-3.5' : 'translate-x-0.5'
              }`} />
            </div>
            <span className="text-xs font-mono text-vault-dim group-hover:text-vault-text transition-colors flex items-center gap-1">
              <Sparkles size={10} />
              AI answer
            </span>
          </label>

          <div className="flex items-center gap-2">
            <span className="text-xs text-vault-dim/50 font-mono hidden sm:inline">↵ enter</span>
            <button
              onClick={() => handleSubmit()}
              disabled={!query.trim() || isLoading}
              className={`flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg transition-all ${
                query.trim() && !isLoading
                  ? 'bg-vault-accent text-vault-bg hover:bg-vault-accent/90 font-medium'
                  : 'bg-vault-muted text-vault-dim cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                  searching
                </>
              ) : (
                <>
                  <ArrowRight size={12} />
                  search
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Example queries (shown when no results yet) */}
      {!hasResults && (
        <div className="space-y-2">
          <p className="text-xs text-vault-dim font-mono uppercase tracking-wider">
            Example queries
          </p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_QUERIES.map((ex) => (
              <button
                key={ex}
                onClick={() => { setQuery(ex); handleSubmit(ex) }}
                disabled={isLoading}
                className="text-xs text-vault-dim border border-vault-border rounded-lg px-2.5 py-1.5
                  hover:border-vault-accent/40 hover:text-vault-accent hover:bg-vault-accent/5
                  transition-all font-mono disabled:opacity-50"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent history */}
      {history.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-vault-dim font-mono uppercase tracking-wider">Recent</p>
          {history.map((h, i) => (
            <button
              key={i}
              onClick={() => { setQuery(h); handleSubmit(h) }}
              disabled={isLoading}
              className="flex items-center gap-2 w-full text-left text-xs text-vault-dim hover:text-vault-text
                font-mono transition-colors py-0.5 disabled:opacity-50"
            >
              <Clock size={10} className="flex-shrink-0" />
              <span className="truncate">{h}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
