import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import type { Connect } from 'vite'
import dotenv from 'dotenv'
import { planKnowledgeCardsFromArticle } from './src/app/lib/cardPlanning'
import { planCardsWithLLM } from './src/app/lib/llmPlanner'
import { generateCardImageWithModel, generateCoverImageWithModel } from './src/app/lib/llmImage'

dotenv.config({ path: path.resolve(__dirname, '.env.local') })


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

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    localPlanCardsApi(),
    localGenerateCardImageApi(),
    localGenerateCoverImageApi(),
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
