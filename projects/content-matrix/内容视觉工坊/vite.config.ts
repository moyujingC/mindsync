import { defineConfig } from 'vite'
import path from 'path'
import fs from 'node:fs'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import type { Connect } from 'vite'
import dotenv from 'dotenv'
import { planKnowledgeCardsFromArticle } from './src/app/lib/cardPlanning'
import { planCardsWithLLM } from './src/app/lib/llmPlanner'
import { generateCardImageWithModel, generateCoverImageWithModel, generateWechatInlineImageWithModel } from './src/app/lib/llmImage'

dotenv.config({ path: path.resolve(__dirname, '.env.local') })

const generatedAssetsRoot = path.resolve(__dirname, 'outputs')
const wechatEditorImportsRoot = path.resolve(generatedAssetsRoot, 'wechat-editor-imports')


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

function jsonBodyParser(req: Connect.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = ""
    req.on("data", (chunk) => {
      body += chunk
    })
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch (error) {
        reject(error)
      }
    })
    req.on("error", reject)
  })
}

function localPlanCardsApi() {
  return {
    name: 'local-plan-cards-api',
    configureServer(server: any) {
      server.middlewares.use('/api/plan-cards', async (req: Connect.IncomingMessage, res: any, next: any) => {
        if (req.method !== 'POST') {
          next()
          return
        }

        try {
          const body = await jsonBodyParser(req)
          let planned

          try {
            planned = await planCardsWithLLM(body)
          } catch (error) {
            console.warn('[plan-cards] falling back to local planner:', error instanceof Error ? error.message : error)
            planned = {
              provider: 'local-fallback',
              ...planKnowledgeCardsFromArticle(body.rawText || ''),
            }
          }

          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(planned))
        } catch (error) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({
            error: 'plan-cards-failed',
            message: error instanceof Error ? error.message : 'Unknown error',
          }))
        }
      })
    },
  }
}

function localGenerateCardImageApi() {
  return {
    name: 'local-generate-card-image-api',
    configureServer(server: any) {
      server.middlewares.use('/api/generate-card-image', async (req: Connect.IncomingMessage, res: any, next: any) => {
        if (req.method !== 'POST') {
          next()
          return
        }

        try {
          const body = await jsonBodyParser(req)
          const result = await generateCardImageWithModel(body)
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(result))
        } catch (error) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({
            error: 'generate-card-image-failed',
            message: error instanceof Error ? error.message : 'Unknown error',
          }))
        }
      })
    },
  }
}

function localGenerateCoverImageApi() {
  return {
    name: 'local-generate-cover-image-api',
    configureServer(server: any) {
      server.middlewares.use('/api/generate-cover-image', async (req: Connect.IncomingMessage, res: any, next: any) => {
        if (req.method !== 'POST') {
          next()
          return
        }

        try {
          const body = await jsonBodyParser(req)
          const result = await generateCoverImageWithModel(body)
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(result))
        } catch (error) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({
            error: 'generate-cover-image-failed',
            message: error instanceof Error ? error.message : 'Unknown error',
          }))
        }
      })
    },
  }
}

function localGenerateWechatInlineImageApi() {
  return {
    name: 'local-generate-wechat-inline-image-api',
    configureServer(server: any) {
      server.middlewares.use('/api/generate-wechat-inline-image', async (req: Connect.IncomingMessage, res: any, next: any) => {
        if (req.method !== 'POST') {
          next()
          return
        }

        try {
          const body = await jsonBodyParser(req)
          const result = await generateWechatInlineImageWithModel(body)
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(result))
        } catch (error) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({
            error: 'generate-wechat-inline-image-failed',
            message: error instanceof Error ? error.message : 'Unknown error',
          }))
        }
      })
    },
  }
}

function localGeneratedAssetsApi() {
  return {
    name: 'local-generated-assets-api',
    configureServer(server: any) {
      server.middlewares.use('/generated-assets', (req: Connect.IncomingMessage, res: any, next: any) => {
        const requestPath = decodeURIComponent((req.url || '').replace(/^\/+/, ''))
        const filePath = path.resolve(generatedAssetsRoot, requestPath)

        if (!filePath.startsWith(generatedAssetsRoot)) {
          res.statusCode = 403
          res.end('Forbidden')
          return
        }

        if (!filePath.endsWith('.png') || !fs.existsSync(filePath)) {
          next()
          return
        }

        res.setHeader('Content-Type', 'image/png')
        fs.createReadStream(filePath).pipe(res)
      })
    },
  }
}

function slugifyFilename(input: string) {
  return input
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'untitled'
}

function localSaveWechatEditorImportApi() {
  return {
    name: 'local-save-wechat-editor-import-api',
    configureServer(server: any) {
      server.middlewares.use('/api/save-wechat-editor-import', async (req: Connect.IncomingMessage, res: any, next: any) => {
        if (req.method !== 'POST') {
          next()
          return
        }

        try {
          const body = await jsonBodyParser(req)
          const timestamp = new Date()
          const stamp = `${timestamp.getFullYear()}-${String(timestamp.getMonth() + 1).padStart(2, '0')}-${String(timestamp.getDate()).padStart(2, '0')}_${String(timestamp.getHours()).padStart(2, '0')}-${String(timestamp.getMinutes()).padStart(2, '0')}-${String(timestamp.getSeconds()).padStart(2, '0')}`
          const slug = slugifyFilename(body.title || 'wechat-editor-import')
          const dir = wechatEditorImportsRoot
          fs.mkdirSync(dir, { recursive: true })

          const filePath = path.join(dir, `${stamp}_${slug}.json`)
          const payload = {
            savedAt: timestamp.toISOString(),
            title: body.title || '',
            html: body.html || '',
            plainText: body.plainText || '',
            summary: body.summary || {},
          }

          fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({
            savedAt: payload.savedAt,
            path: filePath,
          }))
        } catch (error) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({
            error: 'save-wechat-editor-import-failed',
            message: error instanceof Error ? error.message : 'Unknown error',
          }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    localPlanCardsApi(),
    localGenerateCardImageApi(),
    localGenerateCoverImageApi(),
    localGenerateWechatInlineImageApi(),
    localGeneratedAssetsApi(),
    localSaveWechatEditorImportApi(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
