> 状态：current


  # 内容视觉工坊工作台设计

  This is a code bundle for 内容视觉工坊工作台设计. The original project is available at https://www.figma.com/design/GI9BXs5r67ap2VsQDrIMrw/%E5%86%85%E5%AE%B9%E8%A7%86%E8%A7%89%E5%B7%A5%E5%9D%8A%E5%B7%A5%E4%BD%9C%E5%8F%B0%E8%AE%BE%E8%AE%A1.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## LLM planning

  The local dev server exposes `POST /api/plan-cards`.

  By default it falls back to the local planner.
  To enable real LLM planning, create a `.env` file based on `.env.example` and provide:

  - `AITECHFLUX_API_KEY`
  - `AITECHFLUX_BASE_URL`
  - `AITECHFLUX_PLAN_MODEL`

  Current integration assumes an OpenAI-compatible API endpoint.

  ## Account visual input

  `墨予镜` 的账号定位、封面、长文配图、小红书知识卡片、头像和公众号排版规范见：

  - [墨予镜账号定位与视觉规范](../accounts/墨予镜/账号定位与视觉规范.md)
  - [金句卡程序化叠字与二维码后置方案](../specs/2026-06-09-内容视觉工坊-金句卡程序化叠字与二维码后置方案.md)
  
