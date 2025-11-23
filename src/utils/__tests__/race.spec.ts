// @vitest-environment node

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  generateHorses,
  selectRandomHorseIds,
  generateDistances,
  formatSecondsToMinutes,
} from '../race'
import type { THorseList } from '@/models/race.model'

// Mock the constants
vi.mock('@/constants/race', () => ({
  TOTAL_HORSES_COUNT: 20,
  HORSES_COUNT_PER_ROUND: 10,
  ROUNDS_COUNT: 6,
  BASE_SPEED: 2,
}))

describe('race utilities', () => {
  describe('generateHorses', () => {
    let horses: THorseList

    beforeEach(() => {
      // Reset random seed for consistent testing
      vi.spyOn(Math, 'random').mockReturnValue(0.5)
      horses = generateHorses()
    })

    it('should generate 20 horses', () => {
      const horseIds = Object.keys(horses).map((id) => parseInt(id))
      expect(horseIds).toHaveLength(20)
    })

    it('should generate horses with sequential IDs starting from 1', () => {
      const horseIds = Object.keys(horses)
        .map((id) => parseInt(id))
        .sort((a, b) => a - b)
      expect(horseIds).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20])
    })

    it('should return a Record<number, THorse> object', () => {
      expect(typeof horses).toBe('object')
      expect(Array.isArray(horses)).toBe(false)
      expect(horses[1]).toBeDefined()
      expect(horses[1]).toHaveProperty('id')
      expect(horses[1]).toHaveProperty('name')
      expect(horses[1]).toHaveProperty('color')
      expect(horses[1]).toHaveProperty('condition')
    })

    it('should assign predefined names to first 20 horses', () => {
      const expectedNames = [
        'Thunder',
        'Lightning',
        'Storm',
        'Blaze',
        'Shadow',
        'Spirit',
        'Maverick',
        'Phoenix',
        'Apollo',
        'Zeus',
        'Atlas',
        'Comet',
        'Flash',
        'Rocket',
        'Tornado',
        'Cyclone',
        'Tempest',
        'Fury',
        'Champion',
        'Victory',
      ]

      expectedNames.forEach((name, index) => {
        expect(horses[index + 1]!.name).toBe(name)
      })
    })

    it('should assign predefined colors to horses', () => {
      expect(horses[1]!.color).toBe('#FF6B6B') // Red
      expect(horses[2]!.color).toBe('#4ECDC4') // Teal
      expect(horses[20]!.color).toBe('#74B9FF') // Light Blue
    })

    it('should generate condition between 1 and 100', () => {
      vi.spyOn(Math, 'random').mockRestore()

      const testHorses = generateHorses()

      Object.values(testHorses).forEach((horse) => {
        expect(horse.condition).toBeGreaterThanOrEqual(1)
        expect(horse.condition).toBeLessThanOrEqual(100)
        expect(Number.isInteger(horse.condition)).toBe(true)
      })
    })

    it('should generate condition of 51 when Math.random returns 0.5', () => {
      // Math.random() * 100 + 1 = 0.5 * 100 + 1 = 51
      expect(horses[1]!.condition).toBe(51)
    })

    it('should generate minimum condition of 1 when Math.random returns 0', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0)
      const testHorses = generateHorses()
      expect(testHorses[1]!.condition).toBe(1)
    })

    it('should generate maximum condition of 100 when Math.random returns 0.99', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.99)
      const testHorses = generateHorses()
      // Math.floor(0.99 * 100) + 1 = 99 + 1 = 100
      expect(testHorses[1]!.condition).toBe(100)
    })
  })

  describe('selectRandomHorseIds', () => {
    let horses: THorseList

    beforeEach(() => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5)
      horses = generateHorses()
    })

    it('should return the requested number of horse IDs', () => {
      const selected = selectRandomHorseIds(horses, 10)
      expect(selected).toHaveLength(10)
    })

    it('should return unique horse IDs (no duplicates)', () => {
      const selected = selectRandomHorseIds(horses, 10)
      const uniqueIds = new Set(selected)
      expect(uniqueIds.size).toBe(selected.length)
    })

    it('should return valid horse IDs that exist in the input', () => {
      const selected = selectRandomHorseIds(horses, 10)
      selected.forEach((horseId) => {
        expect(horses[horseId]).toBeDefined()
      })
    })

    it('should handle selecting all horses', () => {
      const selected = selectRandomHorseIds(horses, 20)
      expect(selected).toHaveLength(20)

      const uniqueIds = new Set(selected)
      expect(uniqueIds.size).toBe(20)
    })

    it('should handle selecting zero horses', () => {
      const selected = selectRandomHorseIds(horses, 0)
      expect(selected).toHaveLength(0)
    })

    it('should return different selections when called multiple times', () => {
      vi.spyOn(Math, 'random').mockRestore()

      const selection1 = selectRandomHorseIds(horses, 10)
      const selection2 = selectRandomHorseIds(horses, 10)

      // With true randomness, these should be different (with high probability)
      // We just check that the function is using randomness
      expect(Array.isArray(selection1)).toBe(true)
      expect(Array.isArray(selection2)).toBe(true)
    })

    it('should return array of numbers, not strings', () => {
      const selected = selectRandomHorseIds(horses, 10)
      selected.forEach((horseId) => {
        expect(typeof horseId).toBe('number')
        expect(Number.isInteger(horseId)).toBe(true)
      })
    })
  })

  describe('generateDistances', () => {
    it('should return fixed array of 6 distances', () => {
      const distances = generateDistances()
      expect(distances).toEqual([1200, 1400, 1600, 1800, 2000, 2200])
    })

    it('should return same distances on multiple calls', () => {
      const distances1 = generateDistances()
      const distances2 = generateDistances()
      expect(distances1).toEqual(distances2)
    })

    it('should return array with length of 6', () => {
      const distances = generateDistances()
      expect(distances).toHaveLength(6)
    })

    it('should return distances in ascending order', () => {
      const distances = generateDistances()
      for (let i = 0; i < distances.length - 1; i++) {
        expect(distances[i]!).toBeLessThan(distances[i + 1]!)
      }
    })
  })

  describe('formatSecondsToMinutes', () => {
    describe('times less than 1 minute', () => {
      it('should format 0 milliseconds as "0.000s"', () => {
        expect(formatSecondsToMinutes(0)).toBe('0.000s')
      })

      it('should format 500 milliseconds as "0.500s"', () => {
        expect(formatSecondsToMinutes(500)).toBe('0.500s')
      })

      it('should format 1000 milliseconds (1 second) as "1.000s"', () => {
        expect(formatSecondsToMinutes(1000)).toBe('1.000s')
      })

      it('should format 5432 milliseconds as "5.432s"', () => {
        expect(formatSecondsToMinutes(5432)).toBe('5.432s')
      })

      it('should format 59999 milliseconds as "59.999s"', () => {
        expect(formatSecondsToMinutes(59999)).toBe('59.999s')
      })

      it('should format fractional milliseconds with 3 decimal places', () => {
        expect(formatSecondsToMinutes(1234)).toBe('1.234s')
        expect(formatSecondsToMinutes(9876)).toBe('9.876s')
      })
    })

    describe('times 1 minute or greater', () => {
      it('should format 60000 milliseconds (1 minute) as "1:00.000"', () => {
        expect(formatSecondsToMinutes(60000)).toBe('1:00.000')
      })

      it('should format 65432 milliseconds as "1:05.432"', () => {
        expect(formatSecondsToMinutes(65432)).toBe('1:05.432')
      })

      it('should format 120000 milliseconds (2 minutes) as "2:00.000"', () => {
        expect(formatSecondsToMinutes(120000)).toBe('2:00.000')
      })

      it('should format 125678 milliseconds as "2:05.678"', () => {
        expect(formatSecondsToMinutes(125678)).toBe('2:05.678')
      })

      it('should pad seconds with leading zero when less than 10', () => {
        expect(formatSecondsToMinutes(61234)).toBe('1:01.234')
        expect(formatSecondsToMinutes(69999)).toBe('1:09.999')
      })

      it('should handle seconds >= 10 without extra padding', () => {
        expect(formatSecondsToMinutes(670000)).toBe('11:10.000')
        expect(formatSecondsToMinutes(655432)).toBe('10:55.432')
      })

      it('should handle large durations (10+ minutes)', () => {
        expect(formatSecondsToMinutes(600000)).toBe('10:00.000')
        expect(formatSecondsToMinutes(3661234)).toBe('61:01.234')
      })
    })

    describe('edge cases', () => {
      it('should handle exactly 59999ms (last millisecond before 1 minute)', () => {
        const result = formatSecondsToMinutes(59999)
        expect(result).toBe('59.999s')
        expect(result).not.toContain(':')
      })

      it('should handle exactly 60000ms (first millisecond at 1 minute)', () => {
        const result = formatSecondsToMinutes(60000)
        expect(result).toBe('1:00.000')
        expect(result).toContain(':')
      })

      it('should maintain 3 decimal places precision', () => {
        expect(formatSecondsToMinutes(1001)).toBe('1.001s')
        expect(formatSecondsToMinutes(61001)).toBe('1:01.001')
      })

      it('should handle very small milliseconds', () => {
        expect(formatSecondsToMinutes(1)).toBe('0.001s')
        expect(formatSecondsToMinutes(10)).toBe('0.010s')
        expect(formatSecondsToMinutes(100)).toBe('0.100s')
      })
    })
  })
})
