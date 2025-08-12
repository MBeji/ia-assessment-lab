import { describe, it, expect } from 'vitest'
import { toCSV } from '@/lib/export'

describe('export CSV', () => {
  it('handles empty', () => {
    expect(toCSV([])).toBe('')
  })
  it('creates header union and escapes quotes', () => {
    const rows = [
      { a: 1, b: 'x' },
      { b: 'y"z', c: null },
    ]
    const csv = toCSV(rows)
    const lines = csv.split('\n')
    expect(lines[0]).toBe('a,b,c')
    expect(lines[1]).toBe('"1","x",""')
    expect(lines[2]).toBe('"","y""z",""')
  })
})
