import { useEffect, useRef, useState } from 'react'

const BACKEND = import.meta.env.VITE_BACKEND_URL || ''

export default function App() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [chunks, setChunks] = useState(0)
  const [question, setQuestion] = useState('What are the key topics covered?')
  const [answer, setAnswer] = useState('')
  const [contexts, setContexts] = useState([])
  const [error, setError] = useState('')
  const [topK, setTopK] = useState(4)

  const handleIngest = async () => {
    setError('')
    if (!files || files.length === 0) {
      setError('Please select one or more files to ingest')
      return
    }
    setLoading(true)
    try {
      const form = new FormData()
      for (const f of files) form.append('files', f)
      const res = await fetch(`${BACKEND}/api/ingest`, { method: 'POST', body: form })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setChunks((c) => c + (data?.chunks || 0))
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  const handleAsk = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${BACKEND}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, top_k: Number(topK) || 4 })
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setAnswer(data.answer)
      setContexts(data.contexts)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    setLoading(true)
    setError('')
    try {
      await fetch(`${BACKEND}/api/reset`, { method: 'POST' })
      setChunks(0)
      setAnswer('')
      setContexts([])
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-slate-800">Course Notes RAG Chatbot</h1>
        <p className="text-slate-600 mt-2">Upload notes (PDF, TXT, MD), then ask questions. Uses embeddings + vector search with an open model.</p>

        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow p-5">
            <h2 className="font-semibold text-slate-800">1) Ingest your notes</h2>
            <input
              type="file"
              multiple
              className="mt-4 block w-full text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
            />
            <button onClick={handleIngest} disabled={loading} className="mt-4 px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">
              {loading ? 'Processing…' : 'Ingest Files'}
            </button>
            <button onClick={handleReset} disabled={loading} className="mt-4 ml-3 px-4 py-2 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50">
              Reset
            </button>
            <p className="text-sm text-slate-600 mt-3">Total chunks indexed: <span className="font-semibold">{chunks}</span></p>
          </div>

          <div className="bg-white rounded-xl shadow p-5">
            <h2 className="font-semibold text-slate-800">2) Ask a question</h2>
            <div className="mt-3 flex gap-3">
              <input
                className="flex-1 border border-slate-200 rounded px-3 py-2"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask about your course notes…"
              />
              <input
                className="w-20 border border-slate-200 rounded px-3 py-2"
                type="number"
                value={topK}
                onChange={(e) => setTopK(e.target.value)}
                min={1}
                max={10}
                title="Top K"
              />
              <button onClick={handleAsk} disabled={loading} className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">Ask</button>
            </div>

            {error && <p className="text-red-600 text-sm mt-3">{String(error)}</p>}

            {answer && (
              <div className="mt-5">
                <h3 className="font-semibold text-slate-800">Answer</h3>
                <p className="mt-2 whitespace-pre-wrap text-slate-700">{answer}</p>
              </div>
            )}

            {contexts?.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold text-slate-800">Sources</h4>
                <ol className="list-decimal ml-5 mt-2 space-y-2 text-slate-700">
                  {contexts.map((c, i) => (
                    <li key={i}>{c.slice(0, 280)}{c.length > 280 ? '…' : ''}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 text-xs text-slate-500">
          Backend URL: {BACKEND || 'not set'}
        </div>
      </div>
    </div>
  )
}
