import { useEffect, useRef, useState } from 'react'
import type { Beam } from '../types'
import { buildBeamSearchEntry } from '../modules/beamSearch'
import { cosineSimilarity } from '../modules/math'

export type ProcessedBeam = Beam & {
  score: number
  isVisible: boolean
  embedding?: number[]
}

type ProgressMessage = {
  status?: string
  progress?: number
}

export const useBeamImageSearch = (initialBeams: Beam[]) => {
  const [items, setItems] = useState<ProcessedBeam[]>(
    initialBeams.map((beam) => ({ ...beam, score: 0, isVisible: true })),
  )
  const [imageEmbedding, setImageEmbedding] = useState<number[] | null>(null)
  const [ready, setReady] = useState(false)
  const [progress, setProgress] = useState(0)
  const [textReady, setTextReady] = useState(false)

  const workerRef = useRef<Worker | null>(null)
  const orderRef = useRef<Map<number, number>>(new Map())

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
          const embeddings = (data || {}) as Record<number, number[]>
          setItems((prev) =>
            prev.map((item) => ({
              ...item,
              embedding: embeddings[item.id],
            })),
          )
          setTextReady(true)
          setReady(true)
          break
        }
        case 'image_embedding_ready':
          setImageEmbedding(data as number[])
          break
        case 'error':
          console.error('SigLIP worker error:', data)
          break
      }
    }

    return () => workerRef.current?.terminate()
  }, [])

  useEffect(() => {
    orderRef.current = new Map(initialBeams.map((beam, index) => [beam.id, index]))
    setItems(initialBeams.map((beam) => ({ ...beam, score: 0, isVisible: true })))
    setTextReady(false)
    setReady(false)
    setProgress(0)

    if (!workerRef.current) return
    const searchItems = initialBeams.map(buildBeamSearchEntry)
    workerRef.current.postMessage({ type: 'init', data: searchItems })
  }, [initialBeams])

  useEffect(() => {
    if (!imageEmbedding || !textReady) return

    setItems((prevItems) => {
      if (!prevItems[0]?.embedding) return prevItems

      const threshold = 0.005
      const processed = prevItems.map((item) => {
        if (!item.embedding) return item

        const similarity = cosineSimilarity(imageEmbedding, item.embedding)
        return {
          ...item,
          score: similarity,
          isVisible: similarity > threshold,
        }
      })

      processed.sort((a, b) => b.score - a.score)
      return processed
    })
  }, [imageEmbedding, textReady])

  const searchByImage = (file: File) => {
    workerRef.current?.postMessage({ type: 'image', data: file })
  }

  const resetSearch = () => {
    setImageEmbedding(null)
    setItems((prev) => {
      const order = orderRef.current
      const sorted = [...prev].sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
      return sorted.map((item) => ({
        ...item,
        score: 0,
        isVisible: true,
      }))
    })
  }

  return {
    items,
    ready,
    progress,
    imageEmbedding,
    searchByImage,
    resetSearch,
  }
}
