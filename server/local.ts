import { app } from './app.js'

const PORT = process.env.PORT || 8000

app.listen(PORT, () => {
  console.log(`🚀 Altrix Health Copilot TypeScript API running on http://127.0.0.1:${PORT}`)
})
