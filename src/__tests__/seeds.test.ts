import { describe, it, expect } from 'vitest'
import { SEED_CATEGORIES, SEED_DEPARTMENTS, SEED_QUESTIONS, SEED_RULES } from '@/data/seeds'

describe('seeds integrity', () => {
  it('has non-empty departments and categories', () => {
    expect(SEED_DEPARTMENTS.length).toBeGreaterThan(0)
    expect(SEED_CATEGORIES.length).toBeGreaterThan(0)
  })

  it('questions reference valid categories and departments', () => {
    const catIds = new Set(SEED_CATEGORIES.map(c => c.id))
    const deptIds = new Set(SEED_DEPARTMENTS.map(d => d.id))

    for (const q of SEED_QUESTIONS) {
      expect(catIds.has(q.categoryId)).toBe(true)
      for (const d of q.appliesToDepartments) {
        if (d === 'ALL') continue
        expect(deptIds.has(d)).toBe(true)
      }
      expect(q.choices.every(c => c>=0 && c<=5)).toBe(true)
    }
  })

  it('rules reference existing category/question ids', () => {
    const catIds = new Set(SEED_CATEGORIES.map(c => c.id))
    const qIds = new Set(SEED_QUESTIONS.map(q => q.id))

    for (const r of SEED_RULES) {
      if (r.scope === 'category') {
        expect(r.categoryId && catIds.has(r.categoryId)).toBe(true)
      }
      if (r.scope === 'question') {
        expect(r.questionId && qIds.has(r.questionId)).toBe(true)
      }
      expect(r.threshold).toBeGreaterThanOrEqual(0)
      expect(r.actions.length).toBeGreaterThan(0)
    }
  })
})
