import { Application } from './Application'

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

async function main() {
  const app = new Application()
  await app.start()
}
