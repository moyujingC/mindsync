
  # 内容视觉工坊原型设计

  This is a code bundle for 内容视觉工坊原型设计. The original project is available at https://www.figma.com/design/B1scQfZMhSZdFznxiMss1r/%E5%86%85%E5%AE%B9%E8%A7%86%E8%A7%89%E5%B7%A5%E5%9D%8A%E5%8E%9F%E5%9E%8B%E8%AE%BE%E8%AE%A1.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Real image generation

  The local dev server exposes `POST /api/generate-images`.

  To enable real image generation, create `.env.local` based on `.env.example` and provide:

  - `AITECHFLUX_API_KEY`
  - `AITECHFLUX_BASE_URL`
  - `AITECHFLUX_IMAGE_MODEL`

  Current integration assumes an OpenAI-compatible image endpoint and keeps the key on the local Node side of Vite.
  
