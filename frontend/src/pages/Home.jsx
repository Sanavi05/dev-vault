import { useState, useCallback } from 'react'
import { Upload, Search, BookOpen, GitBranch } from 'lucide-react'
import UploadBox from '../components/UploadBox'
import ChatWindow from '../components/ChatWindow'
import SearchResults from '../components/SearchResults'
import { queryKnowledge } from '../services/api'

export default function Home({ onDocCountChange }) {
  const [activeTab, setActiveTab] = useState('upload') // 'upload' | 'search'
  const [searchState, setSearchState] = useState({
    results: null,
    query: '',
    aiAnswer: null,
    isLoading: false,
    error: null,
  })

  const handleSearch = useCallback(async (query, opts = {}) => {
    setSearchState(prev => ({ ...prev, isLoading: true, error: null, query }))
    setActiveTab('search') // auto-switch to results

    try {
      const response = await queryKnowledge(query, opts)
      setSearchState({
        results: response.results,
        query: response.query,
        aiAnswer: response.ai_answer,
        isLoading: false,
        error: null,
      })
    } catch (err) {
      setSearchState(prev => ({
        ...prev,
        isLoading: false,
        error: err.message,
        results: [],
      }))
    }
  }, [])

  const tabs = [
    { id: 'upload', label: 'Ingest', icon: Upload },
    { id: 'search', label: 'Retrieve', icon: Search },
  ]

  return (
    <div className="min-h-screen grid-pattern">
      {/* Hero section */}
      <div className="border-b border-vault-border bg-gradient-to-b from-vault-surface/50 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-start gap-8">
            {/* Left: headline */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono text-vault-dim uppercase tracking-widest">
                <div className="w-8 h-px bg-vault-accent" />
                AI-powered technical memory
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-vault-text leading-tight">
                Your knowledge base,{' '}
                <span className="text-vault-accent text-glow-cyan">semantically searchable.</span>
              </h1>
              <p className="text-sm text-vault-dim leading-relaxed max-w-xl">
                Upload screenshots, PDFs, and code snippets. Ask natural language questions.
                DevVault finds the exact chunk you're thinking of.
              </p>
            </div>

            {/* Right: stats badges */}
            <div className="hidden lg:flex flex-col gap-2">
              {[
                { icon: BookOpen, label: 'all-MiniLM-L6-v2', sub: 'embedding model' },
                { icon: GitBranch, label: 'ChromaDB', sub: 'vector store' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-vault-border bg-vault-surface">
                  <Icon size={14} className="text-vault-accent flex-shrink-0" />
                  <div>
                    <div className="text-xs font-mono text-vault-text">{label}</div>
                    <div className="text-xs text-vault-dim">{sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">

          {/* Left column: always visible upload + search */}
          <div className="space-y-5">
            {/* Mobile tabs */}
            <div className="flex lg:hidden rounded-xl overflow-hidden border border-vault-border bg-vault-surface p-1 gap-1">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === id
                      ? 'bg-vault-accent text-vault-bg'
                      : 'text-vault-dim hover:text-vault-text'
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>

            {/* Upload section */}
            <div className={`${activeTab === 'search' ? 'hidden lg:block' : ''}`}>
              <div className="flex items-center gap-2 mb-3">
                <Upload size={14} className="text-vault-accent" />
                <span className="text-xs font-mono text-vault-dim uppercase tracking-wider">Ingest files</span>
              </div>
              <UploadBox onUploadComplete={onDocCountChange} />
            </div>

            {/* Search section */}
            <div className={`${activeTab === 'upload' ? 'hidden lg:block' : ''}`}>
              <div className="flex items-center gap-2 mb-3">
                <Search size={14} className="text-vault-accent" />
                <span className="text-xs font-mono text-vault-dim uppercase tracking-wider">Query knowledge</span>
              </div>
              <ChatWindow
                onSearch={handleSearch}
                isLoading={searchState.isLoading}
                hasResults={!!searchState.results}
              />
            </div>
          </div>

          {/* Right column: always visible results */}
          <div className="hidden lg:block space-y-4">
            {/* Results header */}
            <div className="flex items-center gap-2">
              <Search size={14} className="text-vault-accent" />
              <span className="text-xs font-mono text-vault-dim uppercase tracking-wider">
                {searchState.results ? `Results for "${searchState.query}"` : 'Retrieval output'}
              </span>
            </div>

            {!searchState.results && !searchState.isLoading && (
              <div className="rounded-xl border border-dashed border-vault-border bg-vault-surface/30 p-12 text-center space-y-3">
                <div className="text-3xl opacity-40">⚡</div>
                <p className="text-vault-dim text-sm font-mono">
                  Results appear here after you search.
                </p>
                <p className="text-vault-dim/50 text-xs">
                  Upload some files, then ask a question.
                </p>
              </div>
            )}

            {searchState.error && (
              <div className="p-4 rounded-xl border border-vault-red/30 bg-vault-red/5">
                <p className="text-sm text-vault-red font-mono">{searchState.error}</p>
              </div>
            )}

            <SearchResults
              results={searchState.results}
              query={searchState.query}
              aiAnswer={searchState.aiAnswer}
              isLoading={searchState.isLoading}
            />
          </div>

          {/* Mobile: results (shown below on mobile search tab) */}
          <div className={`lg:hidden ${activeTab !== 'search' ? 'hidden' : ''}`}>
            {searchState.error && (
              <div className="p-4 rounded-xl border border-vault-red/30 bg-vault-red/5 mb-4">
                <p className="text-sm text-vault-red font-mono">{searchState.error}</p>
              </div>
            )}
            <SearchResults
              results={searchState.results}
              query={searchState.query}
              aiAnswer={searchState.aiAnswer}
              isLoading={searchState.isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
