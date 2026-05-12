import { useState, useRef, useCallback } from 'react'
import { Upload, FileText, Image, Code, File, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import { uploadFile } from '../services/api'

const ACCEPTED_TYPES = [
  'image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/bmp',
  'application/pdf',
  'text/plain', 'text/markdown',
]

const FILE_ICON_MAP = {
  pdf: FileText,
  image: Image,
  code: Code,
  text: File,
}

const FILE_TYPE_COLORS = {
  pdf: 'text-vault-red',
  image: 'text-vault-amber',
  code: 'text-vault-accent',
  text: 'text-vault-green',
}

function FileRow({ upload }) {
  const Icon = FILE_ICON_MAP[upload.file_type] || File
  const color = FILE_TYPE_COLORS[upload.file_type] || 'text-vault-dim'

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-vault-surface border border-vault-border animate-fade-in">
      <Icon size={16} className={`mt-0.5 flex-shrink-0 ${color}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-mono text-vault-text truncate">{upload.filename}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded font-mono uppercase border ${
            upload.file_type === 'pdf' ? 'border-vault-red/30 text-vault-red bg-vault-red/5' :
            upload.file_type === 'image' ? 'border-vault-amber/30 text-vault-amber bg-vault-amber/5' :
            upload.file_type === 'code' ? 'border-vault-accent/30 text-vault-accent bg-vault-accent/5' :
            'border-vault-green/30 text-vault-green bg-vault-green/5'
          }`}>
            {upload.file_type}
          </span>
        </div>
        {upload.status === 'uploading' && (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-vault-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-vault-accent to-vault-green rounded-full transition-all duration-300"
                style={{ width: `${upload.progress}%` }}
              />
            </div>
            <span className="text-xs text-vault-dim font-mono">{upload.progress}%</span>
          </div>
        )}
        {upload.status === 'done' && (
          <div className="flex items-center gap-2">
            <CheckCircle size={12} className="text-vault-green" />
            <span className="text-xs text-vault-dim">
              {upload.chunks_stored} chunks · {(upload.characters_extracted / 1000).toFixed(1)}k chars
            </span>
          </div>
        )}
        {upload.status === 'error' && (
          <div className="flex items-center gap-2">
            <AlertCircle size={12} className="text-vault-red" />
            <span className="text-xs text-vault-red">{upload.error}</span>
          </div>
        )}
      </div>
      {upload.status === 'uploading' && (
        <Loader size={14} className="text-vault-accent animate-spin flex-shrink-0 mt-0.5" />
      )}
      {upload.status === 'done' && (
        <CheckCircle size={14} className="text-vault-green flex-shrink-0 mt-0.5" />
      )}
    </div>
  )
}

export default function UploadBox({ onUploadComplete }) {
  const [uploads, setUploads] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef(null)

  const processFile = useCallback(async (file) => {
    const id = `${file.name}-${Date.now()}`
    const ext = file.name.split('.').pop().toLowerCase()
    const codeExts = ['py','js','ts','jsx','tsx','java','cpp','c','go','rs','sh','yaml','yml','json','sql','css','html']
    const fileType = file.type.startsWith('image/') ? 'image'
      : file.type === 'application/pdf' ? 'pdf'
      : codeExts.includes(ext) ? 'code' : 'text'

    // Add to state immediately
    setUploads(prev => [...prev, {
      id, filename: file.name, file_type: fileType,
      status: 'uploading', progress: 0,
    }])

    try {
      const result = await uploadFile(file, (progress) => {
        setUploads(prev => prev.map(u => u.id === id ? { ...u, progress } : u))
      })
      setUploads(prev => prev.map(u => u.id === id ? {
        ...u, status: 'done',
        chunks_stored: result.chunks_stored,
        characters_extracted: result.characters_extracted,
        file_type: result.file_type,
      } : u))
      onUploadComplete?.()
    } catch (err) {
      setUploads(prev => prev.map(u => u.id === id ? {
        ...u, status: 'error', error: err.message,
      } : u))
    }
  }, [onUploadComplete])

  const handleFiles = useCallback((files) => {
    Array.from(files).forEach(processFile)
  }, [processFile])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true) }
  const onDragLeave = () => setIsDragging(false)

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        className={`relative rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer overflow-hidden
          ${isDragging
            ? 'border-vault-accent bg-vault-accent/5 glow-cyan'
            : 'border-vault-border hover:border-vault-muted bg-vault-surface hover:bg-vault-muted/20'
          }`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => inputRef.current?.click()}
      >
        {isDragging && <div className="scan-line" />}

        <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
            isDragging ? 'bg-vault-accent/20' : 'bg-vault-muted/50'
          }`}>
            <Upload size={20} className={isDragging ? 'text-vault-accent' : 'text-vault-dim'} />
          </div>
          <div>
            <p className="text-sm font-medium text-vault-text">
              {isDragging ? 'Drop to ingest' : 'Drop files here or click to browse'}
            </p>
            <p className="text-xs text-vault-dim mt-1 font-mono">
              Screenshots · PDFs · Code · Text notes
            </p>
          </div>

          {/* File type badges */}
          <div className="flex gap-2 mt-1">
            {[
              { label: '.png/.jpg', color: 'amber' },
              { label: '.pdf', color: 'red' },
              { label: '.py/.js/…', color: 'accent' },
              { label: '.txt/.md', color: 'green' },
            ].map(({ label, color }) => (
              <span key={label} className={`text-xs font-mono px-2 py-0.5 rounded border
                border-vault-${color}/20 text-vault-${color} bg-vault-${color}/5`}>
                {label}
              </span>
            ))}
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          accept=".png,.jpg,.jpeg,.gif,.webp,.pdf,.txt,.md,.py,.js,.ts,.jsx,.tsx,.java,.cpp,.go,.rs,.sh,.yaml,.yml,.json,.sql,.css,.html"
        />
      </div>

      {/* Upload history */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-vault-dim font-mono uppercase tracking-wider">
              Ingested files
            </span>
            <span className="text-xs text-vault-dim font-mono">
              {uploads.filter(u => u.status === 'done').length}/{uploads.length}
            </span>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {uploads.map(u => <FileRow key={u.id} upload={u} />)}
          </div>
        </div>
      )}
    </div>
  )
}
