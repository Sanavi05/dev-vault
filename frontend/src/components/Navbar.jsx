import { useEffect, useState } from 'react'
import { Database, Zap } from 'lucide-react'
import { checkHealth } from '../services/api'

export default function Navbar({ docCount }) {
  const [health, setHealth] = useState(null)

  useEffect(() => {
    checkHealth()
      .then(setHealth)
      .catch(() => setHealth({ status: 'error' }))
  }, [docCount]) // re-check when uploads happen

  const isOnline = health?.status === 'ok'
  const count = health?.chroma_collection_count ?? 0

  return (
    <nav className="sticky top-0 z-50 border-b border-vault-border bg-vault-bg/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Database size={20} className="text-vault-accent" />
            <div className="absolute inset-0 blur-sm text-vault-accent">
              <Database size={20} />
            </div>
          </div>
          <span className="font-mono font-semibold text-base tracking-tight">
            <span className="text-vault-accent">Dev</span>
            <span className="text-vault-text">Vault</span>
          </span>
          <span className="hidden sm:inline text-xs text-vault-dim font-mono border border-vault-border rounded px-1.5 py-0.5">
            v1.0
          </span>
        </div>

        {/* Right: status indicators */}
        <div className="flex items-center gap-4">
          {/* Chunk count */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-vault-dim">
            <Zap size={12} className="text-vault-accent" />
            <span>
              <span className="text-vault-text font-medium">{count.toLocaleString()}</span>
              {' '}chunks indexed
            </span>
          </div>

          {/* Backend status pill */}
          <div className={`flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full border ${
            isOnline
              ? 'border-vault-green/30 text-vault-green bg-vault-green/5'
              : health === null
                ? 'border-vault-muted text-vault-dim'
                : 'border-vault-red/30 text-vault-red bg-vault-red/5'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${
              isOnline ? 'bg-vault-green animate-pulse' : health === null ? 'bg-vault-dim' : 'bg-vault-red'
            }`} />
            {isOnline ? 'backend online' : health === null ? 'connecting…' : 'backend offline'}
          </div>
        </div>
      </div>
    </nav>
  )
}
