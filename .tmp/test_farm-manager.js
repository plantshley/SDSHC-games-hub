/**
 * Tests for Farm Manager Simulator content and game module structure.
 * Focuses on data integrity — no browser DOM required.
 */

import { strict as assert } from 'node:assert'
import { test, describe } from 'node:test'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'

// ── Load the content module directly (pure data, no DOM deps) ──
const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(__dirname, '..')
const contentPath = join(repoRoot, 'src/data/content/farm-manager.js')

// Dynamically import the content file
const { LEVELS, INSTRUCTIONS } = await import(contentPath)

// ── Actual SVG paths on disk ──
const svgDir = join(repoRoot, 'public/assets/svg')

// ─────────────────────────────────────────────────────────────────
// LEVELS array — top-level shape
// ─────────────────────────────────────────────────────────────────

describe('LEVELS array', () => {
  test('exports exactly 8 levels', () => {
    assert.strictEqual(LEVELS.length, 8)
  })

  test('every level has a unique id', () => {
    const ids = LEVELS.map(l => l.id)
    const unique = new Set(ids)
    assert.strictEqual(unique.size, ids.length, `Duplicate level ids: ${ids.join(', ')}`)
  })
})

// ─────────────────────────────────────────────────────────────────
// Per-level required fields
// ─────────────────────────────────────────────────────────────────

const REQUIRED_FIELDS = ['id', 'title', 'scenario', 'correctId', 'image', 'description', 'options', 'fact', 'source']

for (const [i, level] of LEVELS.entries()) {
  describe(`Level ${i + 1}: "${level.id}"`, () => {
    test('has all required fields', () => {
      for (const field of REQUIRED_FIELDS) {
        assert.ok(
          Object.prototype.hasOwnProperty.call(level, field),
          `Missing field: "${field}"`
        )
      }
    })

    test('all string fields are non-empty strings', () => {
      const stringFields = ['id', 'title', 'scenario', 'correctId', 'image', 'description', 'fact', 'source']
      for (const field of stringFields) {
        assert.strictEqual(typeof level[field], 'string', `"${field}" should be a string`)
        assert.ok(level[field].trim().length > 0, `"${field}" should not be blank`)
      }
    })

    test('has exactly 4 options', () => {
      assert.strictEqual(level.options.length, 4, `Expected 4 options, got ${level.options.length}`)
    })

    test('each option has id and label', () => {
      for (const [j, opt] of level.options.entries()) {
        assert.ok(typeof opt.id === 'string' && opt.id.trim().length > 0, `Option ${j} missing id`)
        assert.ok(typeof opt.label === 'string' && opt.label.trim().length > 0, `Option ${j} missing label`)
      }
    })

    test('no duplicate option ids within the level', () => {
      const optIds = level.options.map(o => o.id)
      const unique = new Set(optIds)
      assert.strictEqual(unique.size, optIds.length, `Duplicate option ids: ${optIds.join(', ')}`)
    })

    test('correctId matches one of the options ids', () => {
      const optIds = level.options.map(o => o.id)
      assert.ok(
        optIds.includes(level.correctId),
        `correctId "${level.correctId}" not found in options [${optIds.join(', ')}]`
      )
    })

    test('image path references an existing SVG file on disk', () => {
      // image is e.g. "/assets/svg/cons practices-buffer.svg"
      // strip leading slash and resolve relative to public/
      const relativePath = level.image.replace(/^\//, '')
      const fullPath = join(repoRoot, 'public', relativePath)
      assert.ok(
        existsSync(fullPath),
        `SVG not found on disk: ${fullPath}`
      )
    })

    test('image path matches expected patterns (cons practices-*, soil-functions-*, or polyculture.svg)', () => {
      const validPattern = /\/assets\/svg\/(cons practices-[^/]+\.svg|soil-functions-[^/]+\.svg|polyculture\.svg)$/
      assert.ok(
        validPattern.test(level.image),
        `Image path "${level.image}" does not match expected pattern`
      )
    })
  })
}

// ─────────────────────────────────────────────────────────────────
// INSTRUCTIONS object
// ─────────────────────────────────────────────────────────────────

describe('INSTRUCTIONS object', () => {
  const REQUIRED_KEYS = ['intro', 'gameplay', 'complete', 'wrongHint']

  test('exports INSTRUCTIONS object', () => {
    assert.strictEqual(typeof INSTRUCTIONS, 'object')
    assert.ok(INSTRUCTIONS !== null)
  })

  for (const key of REQUIRED_KEYS) {
    test(`has non-empty string key: "${key}"`, () => {
      assert.ok(
        Object.prototype.hasOwnProperty.call(INSTRUCTIONS, key),
        `Missing key: "${key}"`
      )
      assert.strictEqual(typeof INSTRUCTIONS[key], 'string', `"${key}" should be a string`)
      assert.ok(INSTRUCTIONS[key].trim().length > 0, `"${key}" should not be blank`)
    })
  }

  test('has no unexpected keys (no typos or extras)', () => {
    const knownKeys = new Set(REQUIRED_KEYS)
    const actualKeys = Object.keys(INSTRUCTIONS)
    for (const k of actualKeys) {
      assert.ok(knownKeys.has(k), `Unexpected key in INSTRUCTIONS: "${k}"`)
    }
  })
})

// ─────────────────────────────────────────────────────────────────
// Game module structural test (DOM-free)
// ─────────────────────────────────────────────────────────────────

describe('game module exports', () => {
  test('farm-manager.js exports createFarmManagerGame function', async () => {
    // We cannot execute it without a DOM, but we can check it is exported
    // by reading the source file for the export declaration
    const src = readFileSync(join(repoRoot, 'src/games/farm-manager.js'), 'utf8')
    assert.ok(
      /export\s+function\s+createFarmManagerGame/.test(src),
      'createFarmManagerGame is not exported from the game module'
    )
  })

  test('game module imports from router.js', () => {
    const src = readFileSync(join(repoRoot, 'src/games/farm-manager.js'), 'utf8')
    assert.ok(
      /from\s+['"]\.\.\/router\.js['"]/.test(src),
      'Game module should import from ../router.js'
    )
  })

  test('game module imports LEVELS and INSTRUCTIONS from content file', () => {
    const src = readFileSync(join(repoRoot, 'src/games/farm-manager.js'), 'utf8')
    assert.ok(/LEVELS/.test(src), 'LEVELS should be imported')
    assert.ok(/INSTRUCTIONS/.test(src), 'INSTRUCTIONS should be imported')
  })

  test('LEVEL_ICONS array length matches LEVELS length', () => {
    // Extract LEVEL_ICONS from source via regex count
    const src = readFileSync(join(repoRoot, 'src/games/farm-manager.js'), 'utf8')
    const iconListMatch = src.match(/const LEVEL_ICONS\s*=\s*\[([\s\S]*?)\]/)
    assert.ok(iconListMatch, 'LEVEL_ICONS array not found')
    // Count entries by counting lines with .png
    const pngCount = (iconListMatch[1].match(/\.png/g) || []).length
    assert.strictEqual(
      pngCount,
      LEVELS.length,
      `LEVEL_ICONS has ${pngCount} entries but LEVELS has ${LEVELS.length}`
    )
  })
})

// ─────────────────────────────────────────────────────────────────
// Edge / boundary checks
// ─────────────────────────────────────────────────────────────────

describe('edge cases', () => {
  test('last level index is within bounds for "Next Level" logic (levelIdx + 1 < LEVELS.length)', () => {
    // showCompletion uses: isLastLevel = levelIdx >= LEVELS.length - 1
    // This means index 7 (0-based) is the last. Verify LEVELS[7] exists.
    assert.ok(LEVELS[LEVELS.length - 1] !== undefined, 'Last level is undefined')
    assert.strictEqual(LEVELS[LEVELS.length - 1], LEVELS[7])
  })

  test('no level has a correctId pointing to a non-existent option (cross-check all levels)', () => {
    const failures = []
    for (const level of LEVELS) {
      const found = level.options.some(o => o.id === level.correctId)
      if (!found) failures.push(`${level.id}: correctId="${level.correctId}"`)
    }
    assert.strictEqual(failures.length, 0, `Broken correctId references:\n${failures.join('\n')}`)
  })

  test('all fact strings are at least 50 characters (substantive content)', () => {
    for (const level of LEVELS) {
      assert.ok(
        level.fact.length >= 50,
        `Level "${level.id}" fact is too short (${level.fact.length} chars)`
      )
    }
  })

  test('all source strings are non-trivially short (not empty filler)', () => {
    for (const level of LEVELS) {
      assert.ok(
        level.source.length >= 5,
        `Level "${level.id}" source is suspiciously short: "${level.source}"`
      )
    }
  })
})
