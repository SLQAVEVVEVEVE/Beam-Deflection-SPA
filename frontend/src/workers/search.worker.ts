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
  static textInitPromise: Promise<void> | null = null
  static visionInitPromise: Promise<void> | null = null

  static async ensureText(progress_callback?: (data: unknown) => void) {
    if (this.tokenizer && this.textModel) return
    if (this.textInitPromise) return this.textInitPromise

    const options = { device: 'wasm', dtype: 'q8' } as const
    this.textInitPromise = (async () => {
      try {
        if (!this.tokenizer) {
          this.tokenizer = await AutoTokenizer.from_pretrained(MODEL_ID, { progress_callback })
        }
        if (!this.textModel) {
          this.textModel = await SiglipTextModel.from_pretrained(MODEL_ID, { ...options, progress_callback })
        }
      } catch (error) {
        this.tokenizer = null
        this.textModel = null
        throw error
      } finally {
        this.textInitPromise = null
      }
    })()

    return this.textInitPromise
  }

  static async ensureVision(progress_callback?: (data: unknown) => void) {
    if (this.processor && this.visionModel) return
    if (this.visionInitPromise) return this.visionInitPromise

    const options = { device: 'wasm', dtype: 'q8' } as const
    this.visionInitPromise = (async () => {
      try {
        if (!this.processor) {
          this.processor = await AutoProcessor.from_pretrained(MODEL_ID, { progress_callback })
        }
        if (!this.visionModel) {
          this.visionModel = await SiglipVisionModel.from_pretrained(MODEL_ID, { ...options, progress_callback })
        }
      } catch (error) {
        this.processor = null
        this.visionModel = null
        throw error
      } finally {
        this.visionInitPromise = null
      }
    })()

    return this.visionInitPromise
  }
}

const ctx: DedicatedWorkerGlobalScope = self as DedicatedWorkerGlobalScope

ctx.addEventListener('message', async (event) => {
  const { type, data } = event.data as { type: string; data: unknown }

  try {
    if (type === 'init') {
      await SiglipService.ensureText((msg) => {
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
      await SiglipService.ensureVision()
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
