import { readdirSync, readFileSync, statSync } from "node:fs"
import { dirname, join, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const ignoredDirs = new Set([
  ".git",
  ".next",
  "coverage",
  "node_modules",
  "playwright-report",
  "test-results",
])
const ignoredSchemes = /^[a-z][a-z0-9+.-]*:/i
const linkPattern = /!?\[[^\]]*\]\(([^)]+)\)/g

function collectMarkdownFiles(dir) {
  const files = []
  for (const entry of readdirSync(dir)) {
    if (ignoredDirs.has(entry)) continue
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) {
      files.push(...collectMarkdownFiles(path))
    } else if (entry.endsWith(".md")) {
      files.push(path)
    }
  }
  return files
}

const errors = []

for (const file of collectMarkdownFiles(root)) {
  const text = readFileSync(file, "utf8")
  for (const match of text.matchAll(linkPattern)) {
    const target = match[1].trim()
    if (!target || target.startsWith("#") || ignoredSchemes.test(target)) continue

    const [path] = target.split("#", 1)
    if (!path) continue

    const resolved = resolve(dirname(file), decodeURIComponent(path))
    try {
      statSync(resolved)
    } catch {
      errors.push(`${relative(root, file)} -> ${target}`)
    }
  }
}

if (errors.length > 0) {
  console.error(`Broken relative links:\n${errors.map((error) => `  ${error}`).join("\n")}`)
  process.exit(1)
}

console.log("All relative documentation links resolve.")
