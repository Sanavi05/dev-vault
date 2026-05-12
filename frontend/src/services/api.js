/**
 * api.js — All communication with the FastAPI backend.
 *
 * Centralizing API calls here makes it easy to swap the base URL,
 * add auth headers later, or mock during testing.
 */

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

/**
 * Upload a file to the backend ingestion pipeline.
 * @param {File} file
 * @param {(progress: number) => void} onProgress
 * @returns {Promise<UploadResponse>}
 */
export async function uploadFile(file, onProgress) {
  const formData = new FormData()
  formData.append('file', file)

  // Use XMLHttpRequest for upload progress tracking
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText))
      } else {
        let msg = `Upload failed (${xhr.status})`
        try {
          const err = JSON.parse(xhr.responseText)
          msg = err.detail || msg
        } catch {}
        reject(new Error(msg))
      }
    })

    xhr.addEventListener('error', () => reject(new Error('Network error during upload')))
    xhr.open('POST', `${BASE_URL}/upload`)
    xhr.send(formData)
  })
}

/**
 * Query the knowledge base semantically.
 * @param {string} query
 * @param {object} opts
 * @param {number} opts.topK
 * @param {boolean} opts.generateAnswer
 * @returns {Promise<QueryResponse>}
 */
export async function queryKnowledge(query, { topK = 5, generateAnswer = false } = {}) {
  const res = await fetch(`${BASE_URL}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      top_k: topK,
      generate_answer: generateAnswer,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `Query failed (${res.status})`)
  }

  return res.json()
}

/**
 * Health check — confirms backend is up and returns collection stats.
 * @returns {Promise<HealthResponse>}
 */
export async function checkHealth() {
  const res = await fetch(`${BASE_URL}/health`)
  if (!res.ok) throw new Error('Backend unreachable')
  return res.json()
}
