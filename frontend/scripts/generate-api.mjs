import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { generateApi } from 'swagger-typescript-api'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const projectRoot = path.resolve(__dirname, '..')
const schemaPath = path.resolve(projectRoot, '..', 'swagger', 'v1', 'swagger.yaml')

await generateApi({
  name: 'Api.ts',
  output: path.resolve(projectRoot, 'src', 'api'),
  input: schemaPath,
  httpClientType: 'axios',
})
