import { describe, it, expect } from 'vitest'
import { formatPct, Money } from './utils/format.js'

describe('formatPct', () => {
  it('formats percentage correctly', () => {
    expect(formatPct(43.92)).toBe('43.9%')
  })

  it('handles zero', () => {
    expect(formatPct(0)).toBe('0.0%')
  })
})
