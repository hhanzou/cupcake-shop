import { env } from './env'
import { buildApp } from './app'

async function start() {
  const app = await buildApp()

  // Encerra com elegância quando a plataforma (Render, Docker) pede para parar
  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.once(signal, async () => {
      app.log.info(`Recebido ${signal}, encerrando...`)
      await app.close()
      process.exit(0)
    })
  }

  try {
    await app.listen({ port: env.PORT, host: env.HOST })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
