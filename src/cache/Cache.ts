import fs from 'fs'
import { debounce } from 'lodash'
import { mkdirpSync } from 'mkdirp'
import path from 'path'

export class Cache<T> {
  private cache: Record<string, T> = {}
  private loaded = false
  private readonly filePath: string

  constructor(filePath: string) {
    this.filePath = `cache/${filePath}`
  }

  get(key: string): T | undefined {
    this.load()
    return this.cache[key]
  }

  set(key: string, value: T): void {
    this.load()
    this.cache[key] = value
    this.flush()
  }

  private load() {
    if (!fs.existsSync(this.filePath) || this.loaded) {
      return
    }
    const data = fs.readFileSync(this.filePath, 'utf8')
    const item = JSON.parse(data) as Record<string, T>
    this.cache = item
    this.loaded = true
  }

  private readonly flush = debounce(this.save.bind(this))

  private save() {
    mkdirpSync(path.dirname(this.filePath))
    fs.writeFileSync(this.filePath, JSON.stringify(this.cache, null, 2))
  }
}
