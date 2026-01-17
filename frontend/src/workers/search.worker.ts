/// <reference lib="webworker" />

import {
  env,
  AutoTokenizer,
  AutoProcessor,
  SiglipTextModel,
  SiglipVisionModel,
  RawImage,
} from '@huggingface/transformers'

env.allowLocalModels = false
env.allowRemoteModels = true

const MODEL_ID = 'Xenova/siglip-base-patch16-224'
const EMBEDDING_SIZE = 768

type SearchItem = {
  id: number
  description: string
}

class SiglipService {
  static tokenizer: Awaited<ReturnType<typeof AutoTokenizer.from_pretrained>> | null = null
  static processor: Awaited<ReturnType<typeof AutoProcessor.from_pretrained>> | null = null
  static textModel: Awaited<ReturnType<typeof SiglipTextModel.from_pretrained>> | null = null
  static visionModel: Awaited<ReturnType<typeof SiglipVisionModel.from_pretrained>> | null = null

  static async init(progress_callback?: (data: unknown) => void) {
    if (this.tokenizer) return
    const options = { device: 'wasm', dtype: 'q8' } as const

    this.tokenizer = await AutoTokenizer.from_pretrained(MODEL_ID, { progress_callback })
    this.processor = await AutoProcessor.from_pretrained(MODEL_ID, { progress_callback })
    this.textModel = await SiglipTextModel.from_pretrained(MODEL_ID, { ...options, progress_callback })
    this.visionModel = await SiglipVisionModel.from_pretrained(MODEL_ID, { ...options, progress_callback })
  }
}

const ctx: DedicatedWorkerGlobalScope = self as DedicatedWorkerGlobalScope

ctx.addEventListener('message', async (event) => {
  const { type, data } = event.data as { type: string; data: unknown }

  try {
    if (type === 'init') {
      await SiglipService.init((msg) => {
        ctx.postMessage({ type: 'progress', data: msg })
      })

      const items = Array.isArray(data) ? (data as SearchItem[]) : []
      if (items.length === 0) {
        ctx.postMessage({ type: 'text_embeddings_ready', data: {} })
        return
      }

      if (!SiglipService.tokenizer || !SiglipService.textModel) {
        throw new Error('SigLIP tokenizer or text model is unavailable')
      }

      const descriptions = items.map((item) => item.description)
      const textInputs = await SiglipService.tokenizer(descriptions, {
        padding: 'max_length',
        truncation: true,
      })

      const { pooler_output: textOutput } = await SiglipService.textModel(textInputs)
      const embeddings: Record<number, number[]> = {}

      for (let i = 0; i < items.length; i += 1) {
        const start = i * EMBEDDING_SIZE
        const end = start + EMBEDDING_SIZE
        const vector = textOutput.data.slice(start, end)
        embeddings[items[i].id] = Array.from(vector)
      }

      ctx.postMessage({ type: 'text_embeddings_ready', data: embeddings })
    }

    if (type === 'image') {
      await SiglipService.init()
      if (!SiglipService.processor || !SiglipService.visionModel) {
        throw new Error('SigLIP processor or vision model is unavailable')
      }
      const blob = data as Blob
      const imageUrl = URL.createObjectURL(blob)

      try {
        const image = await RawImage.read(imageUrl)
        const imageInputs = await SiglipService.processor(image)
        const { pooler_output } = await SiglipService.visionModel(imageInputs)

        ctx.postMessage({
          type: 'image_embedding_ready',
          data: Array.from(pooler_output.data),
        })
      } finally {
        URL.revokeObjectURL(imageUrl)
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    ctx.postMessage({ type: 'error', data: message })
  }
})
