import { useEffect, useMemo, useRef, useState } from 'react'
import { buildBeamSearchEntry } from '../modules/beamSearch'
import { cosineSimilarity } from '../modules/math'
import type { Beam } from '../types'

export type SimilarBeam = Beam & { score: number }

type ProgressMessage = {
  status?: string
  progress?: number
}

const buildSearchDescription = (beam: Beam) => {
  const fallback = buildBeamSearchEntry(beam).description
  const custom = beam.description?.trim()

  if (!custom) return fallback
  if (custom === fallback) return fallback
  return `${custom}. ${fallback}`
}

export const useBeamSimilarBeams = (targetBeam: Beam | null, beams: Beam[]) => {
  const [embeddings, setEmbeddings] = useState<Record<number, number[]>>({})
  const [ready, setReady] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const workerRef = useRef<Worker | null>(null)

  useEffect(() => {
    workerRef.current = new Worker(new URL('../workers/search.worker.ts', import.meta.url), { type: 'module' })

    workerRef.current.onmessage = (event) => {
      const { type, data } = event.data as { type: string; data: unknown }

      switch (type) {
        case 'progress': {
          const payload = data as ProgressMessage
          if (payload.status === 'progress' && typeof payload.progress === 'number') {
            setProgress(payload.progress)
          } else if (payload.status === 'ready') {
            setReady(true)
          }
          break
        }
        case 'text_embeddings_ready': {
          setEmbeddings((data || {}) as Record<number, number[]>)
          setReady(true)
          break
        }
        case 'error':
          setError(typeof data === 'string' ? data : 'Не удалось подготовить эмбеддинги.')
          break
      }
    }

    return () => workerRef.current?.terminate()
  }, [])

  useEffect(() => {
    setEmbeddings({})
    setReady(false)
    setProgress(0)
    setError(null)

    if (!workerRef.current || beams.length === 0) return

    const searchItems = beams.map((beam) => ({
      id: beam.id,
      description: buildSearchDescription(beam),
    }))

    workerRef.current.postMessage({ type: 'init', data: searchItems })
  }, [beams])

  const similarBeams = useMemo(() => {
    if (!targetBeam) return []
    const targetEmbedding = embeddings[targetBeam.id]
    if (!targetEmbedding) return []

    return beams
      .filter((beam) => beam.id !== targetBeam.id)
      .map((beam) => {
        const embedding = embeddings[beam.id]
        if (!embedding) return null
        return {
          ...beam,
          score: cosineSimilarity(targetEmbedding, embedding),
        }
      })
      .filter((item): item is SimilarBeam => Boolean(item))
      .sort((a, b) => b.score - a.score)
  }, [beams, embeddings, targetBeam])

  return {
    similarBeams,
    ready,
    progress,
    error,
  }
}
