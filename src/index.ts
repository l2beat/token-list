import { Application } from './Application'
import { getConfig } from './config/getConfig'

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

async function main() {
  const config = getConfig()
  const app = new Application(config)
  await app.start()
}
