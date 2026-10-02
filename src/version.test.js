import { describe, it, expect } from 'vitest'
import pkg from '../package.json' with { type: 'json' }
import { APP_VERSION } from './version.js'

describe('versjon', () => {
  it('APP_VERSION matcher package.json', () => {
    expect(APP_VERSION).toBe(pkg.version)
  })
})
