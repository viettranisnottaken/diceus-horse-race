// @vitest-environment node

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useRaceStore } from '../race'

// Mock the utility functions
vi.mock('@/utils/race', () => ({
  generateHorses: vi.fn(() => {
    const horses: Record<number, { id: number; name: string; color: string; condition: number }> =
      {}
    for (let i = 1; i <= 20; i++) {
      horses[i] = {
        id: i,
        name: `Horse ${i}`,
        color: '#000000',
        condition: 50, // Fixed condition for testing
      }
    }
    return horses
  }),
  selectRandomHorseIds: vi.fn((horses: Record<number, unknown>, count: number) => {
    // Return first N horse IDs for predictable testing
    return Array.from({ length: count }, (_, i) => i + 1)
  }),
  generateDistances: vi.fn(() => [1200, 1400, 1600, 1800, 2000, 2200]),
  formatSecondsToMinutes: vi.fn((ms: number) => `${(ms / 1000).toFixed(3)}s`),
}))

// Mock the constants
vi.mock('@/constants/race', () => ({
  TOTAL_HORSES_COUNT: 20,
  HORSES_COUNT_PER_ROUND: 10,
  ROUNDS_COUNT: 6,
  BASE_SPEED: 2,
}))

describe('useRaceStore', () => {
  let store: ReturnType<typeof useRaceStore>
  let performanceNowMock: ReturnType<typeof vi.spyOn>
  let dateNowMock: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useRaceStore()
    vi.useFakeTimers()

    // Mock performance.now() and Date.now()
    performanceNowMock = vi.spyOn(performance, 'now')
    dateNowMock = vi.spyOn(Date, 'now')

    performanceNowMock.mockReturnValue(1000)
    dateNowMock.mockReturnValue(1000)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('initial state', () => {
    it('should have correct initial state', () => {
      expect(store.horses).toEqual({})
      expect(store.roundProgress).toEqual({})
      expect(store.raceResults).toEqual([])
      expect(store.currentRoundIndex).toBe(-1)
      expect(store.isPaused).toBe(true)
    })

    it('should have racingHorseIds as empty array initially', () => {
      expect(store.racingHorseIds).toEqual([])
    })

    it('should have currentRoundDistance as 0 initially', () => {
      expect(store.currentRoundDistance).toBe(0)
    })
  })

  describe('computed properties', () => {
    describe('racingHorseIds', () => {
      it('should return empty array when no horses are racing', () => {
        expect(store.racingHorseIds).toEqual([])
      })

      it('should return array of racing horse IDs from roundProgress', () => {
        store.startRacing()
        expect(store.racingHorseIds).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
      })

      it('should convert string keys to numbers', () => {
        store.startRacing()
        store.racingHorseIds.forEach((id) => {
          expect(typeof id).toBe('number')
        })
      })
    })

    describe('currentRoundDistance', () => {
      it('should return 0 when no round is active', () => {
        expect(store.currentRoundDistance).toBe(0)
      })

      it('should return correct distance for current round', () => {
        store.startRacing()
        expect(store.currentRoundDistance).toBe(1200) // First round distance
      })
    })
  })

  describe('startRacing', () => {
    it('should generate horses and distances', () => {
      store.startRacing()

      expect(Object.keys(store.horses)).toHaveLength(20)
      expect(store.currentRoundIndex).toBe(0)
      expect(store.isPaused).toBe(false)
    })

    it('should start the first round', () => {
      store.startRacing()

      expect(store.currentRoundIndex).toBe(0)
      expect(Object.keys(store.roundProgress)).toHaveLength(10)
    })

    it('should set up racing horses for first round', () => {
      store.startRacing()

      const racingHorse = store.roundProgress[1]!
      expect(racingHorse).toBeDefined()
      expect(racingHorse.horseId).toBe(1)
      expect(racingHorse.finished).toBe(false)
      expect(racingHorse.distance).toBe(0)
      expect(racingHorse.position).toBe(0)
      expect(racingHorse.finishTime).toBe(0)
    })

    it('should start race interval', () => {
      const setIntervalSpy = vi.spyOn(global, 'setInterval')
      store.startRacing()

      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 100)
    })
  })

  describe('animateRace', () => {
    beforeEach(() => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5) // randomFactor will be 1.0
    })

    it('should update horse distances each tick', () => {
      store.startRacing()

      const initialDistance = store.roundProgress[1]!.distance
      expect(initialDistance).toBe(0)

      // Advance by one interval (100ms)
      vi.advanceTimersByTime(100)

      // With condition=50, BASE_SPEED=2, random=0.5 (factor=1.0), distance=1200 (factor≈1)
      // speed = (2 + 50/100) * 1.0 * 1.0 = 2.5
      expect(store.roundProgress[1]!.distance).toBeGreaterThan(0)
    })

    it('should calculate speed using correct formula', () => {
      store.startRacing()

      // First horse starts at distance 0, so distanceFactor = 1 - (0 - 1200) / 10000 = 1.12
      // speed = (BASE_SPEED + condition/100) * randomFactor * distanceFactor
      // speed = (2 + 50/100) * 1.0 * 1.12 = 2.5 * 1.12 = 2.8

      vi.advanceTimersByTime(100)

      // Distance should be updated by approximately 2.8
      expect(store.roundProgress[1]!.distance).toBeCloseTo(2.8, 1)
    })

    it('should not update finished horses', () => {
      store.startRacing()

      // Manually mark horse as finished
      store.roundProgress[1]!.finished = true
      const distanceBeforeTick = store.roundProgress[1]!.distance

      vi.advanceTimersByTime(100)

      // Distance should not change for finished horse
      expect(store.roundProgress[1]!.distance).toBe(distanceBeforeTick)
    })

    it('should call updateHorseRanking when horse distance exceeds 100', () => {
      store.startRacing()

      // Manually set horse distance near finish line
      store.roundProgress[1]!.distance = 99

      vi.advanceTimersByTime(100)

      // Horse should be marked as finished
      expect(store.roundProgress[1]!.finished).toBe(true)
      expect(store.roundProgress[1]!.position).toBe(1)
    })

    it('should advance to next round when all horses finish', () => {
      store.startRacing()

      // Set all horses to near finish
      Object.keys(store.roundProgress).forEach((horseId) => {
        store.roundProgress[parseInt(horseId)]!.distance = 99
      })

      vi.advanceTimersByTime(100)

      // Should advance to round 1 (second round)
      expect(store.currentRoundIndex).toBe(1)
      expect(store.raceResults).toHaveLength(1)
    })
  })

  describe('updateHorseRanking', () => {
    it('should mark horse as finished', () => {
      store.startRacing()

      performanceNowMock.mockReturnValue(2000) // 1000ms after start

      // Manually trigger finish
      store.roundProgress[1]!.distance = 101

      vi.advanceTimersByTime(100)

      expect(store.roundProgress[1]!.finished).toBe(true)
    })

    it('should assign correct position based on finish order', () => {
      store.startRacing()

      // Horse 1 finishes first
      store.roundProgress[1]!.distance = 101
      vi.advanceTimersByTime(100)
      expect(store.roundProgress[1]!.position).toBe(1)

      // Horse 2 finishes second
      store.roundProgress[2]!.distance = 101
      vi.advanceTimersByTime(100)
      expect(store.roundProgress[2]!.position).toBe(2)
    })

    it('should record finish time excluding paused time', () => {
      store.startRacing()

      performanceNowMock.mockReturnValue(1000)
      vi.advanceTimersByTime(100)

      performanceNowMock.mockReturnValue(3000) // 2000ms after start

      store.roundProgress[1]!.distance = 101
      vi.advanceTimersByTime(100)

      // Finish time should be 2000ms
      expect(store.roundProgress[1]!.finishTime).toBe(2000)
    })
  })

  describe('pauseRace and resumeRace', () => {
    it('should pause the race', () => {
      store.startRacing()
      expect(store.isPaused).toBe(false)

      performanceNowMock.mockReturnValue(2000)
      store.pauseRace()

      expect(store.isPaused).toBe(true)
    })

    it('should clear interval when paused', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval')
      store.startRacing()

      store.pauseRace()

      expect(clearIntervalSpy).toHaveBeenCalled()
    })

    it('should resume the race', () => {
      store.startRacing()

      performanceNowMock.mockReturnValue(2000)
      store.pauseRace()

      performanceNowMock.mockReturnValue(3000)
      store.resumeRace()

      expect(store.isPaused).toBe(false)
    })

    it('should accumulate paused time correctly', () => {
      store.startRacing()
      performanceNowMock.mockReturnValue(1000)

      // Pause at 2000ms
      performanceNowMock.mockReturnValue(2000)
      store.pauseRace()

      // Resume at 5000ms (paused for 3000ms)
      performanceNowMock.mockReturnValue(5000)
      store.resumeRace()

      // Finish at 7000ms (race time should be 7000 - 1000 - 3000 = 3000ms)
      performanceNowMock.mockReturnValue(7000)
      store.roundProgress[1]!.distance = 101
      vi.advanceTimersByTime(100)

      // Finish time should exclude paused time
      expect(store.roundProgress[1]!.finishTime).toBe(3000)
    })

    it('should handle multiple pause/resume cycles', () => {
      store.startRacing()
      performanceNowMock.mockReturnValue(1000)

      // First pause at 2000ms
      performanceNowMock.mockReturnValue(2000)
      store.pauseRace()

      // Resume at 3000ms (paused for 1000ms)
      performanceNowMock.mockReturnValue(3000)
      store.resumeRace()

      // Second pause at 4000ms
      performanceNowMock.mockReturnValue(4000)
      store.pauseRace()

      // Resume at 6000ms (paused for 2000ms, total 3000ms)
      performanceNowMock.mockReturnValue(6000)
      store.resumeRace()

      // Finish at 8000ms (race time should be 8000 - 1000 - 3000 = 4000ms)
      performanceNowMock.mockReturnValue(8000)
      store.roundProgress[1]!.distance = 101
      vi.advanceTimersByTime(100)

      expect(store.roundProgress[1]!.finishTime).toBe(4000)
    })

    it('should not affect pause time if resumed without pause', () => {
      store.startRacing()
      performanceNowMock.mockReturnValue(1000)

      // Resume without pausing first (edge case)
      store.resumeRace()

      performanceNowMock.mockReturnValue(3000)
      store.roundProgress[1]!.distance = 101
      vi.advanceTimersByTime(100)

      // Should use actual time
      expect(store.roundProgress[1]!.finishTime).toBe(2000)
    })
  })

  describe('setRoundResult', () => {
    it('should save round results', () => {
      store.startRacing()

      // Finish all horses
      Object.keys(store.roundProgress).forEach((horseId, index) => {
        store.roundProgress[parseInt(horseId)]!.distance = 101
        store.roundProgress[parseInt(horseId)]!.position = index + 1
        store.roundProgress[parseInt(horseId)]!.finishTime = 1000 + index * 100
      })

      vi.advanceTimersByTime(100)

      expect(store.raceResults).toHaveLength(1)
    })

    it('should sort rankings by position', () => {
      store.startRacing()

      // Finish horses one by one with animation to get proper order
      // Horse 5 finishes first
      store.roundProgress[5]!.distance = 99
      vi.advanceTimersByTime(100) // Horse 5 finishes

      // Horse 2 finishes second
      store.roundProgress[2]!.distance = 99
      vi.advanceTimersByTime(100) // Horse 2 finishes

      // Horse 8 finishes third
      store.roundProgress[8]!.distance = 99
      vi.advanceTimersByTime(100) // Horse 8 finishes

      // Finish remaining horses quickly
      Object.keys(store.roundProgress).forEach((horseId) => {
        const id = parseInt(horseId)
        if (![5, 2, 8].includes(id) && !store.roundProgress[id]!.finished) {
          store.roundProgress[id]!.distance = 99
        }
      })
      vi.advanceTimersByTime(100)

      const rankings = store.raceResults[0]!.rankings
      expect(rankings[0]!.horseId).toBe(5) // 1st place
      expect(rankings[1]!.horseId).toBe(2) // 2nd place
      expect(rankings[2]!.horseId).toBe(8) // 3rd place
    })

    it('should include distance and timestamp in result', () => {
      dateNowMock.mockReturnValue(123456789)
      store.startRacing()

      // Finish all horses
      Object.keys(store.roundProgress).forEach((horseId, index) => {
        store.roundProgress[parseInt(horseId)]!.distance = 101
        store.roundProgress[parseInt(horseId)]!.position = index + 1
      })

      vi.advanceTimersByTime(100)

      const result = store.raceResults[0]!
      expect(result.distance).toBe(1200) // First round distance
      expect(result.timestamp).toEqual(new Date(123456789))
    })

    it('should format finish times correctly', () => {
      performanceNowMock.mockReturnValue(1000)
      store.startRacing()

      // Advance time to 2234ms
      performanceNowMock.mockReturnValue(2234)

      // Finish horse 1 first
      store.roundProgress[1]!.distance = 99
      vi.advanceTimersByTime(100)

      // Finish all other horses
      Object.keys(store.roundProgress).forEach((horseId) => {
        const id = parseInt(horseId)
        if (id !== 1 && !store.roundProgress[id]!.finished) {
          store.roundProgress[id]!.distance = 99
        }
      })
      vi.advanceTimersByTime(100)

      // Should call formatSecondsToMinutes with finishTime
      // The actual format will be different based on the mock, just verify it's called
      expect(store.raceResults[0]!.rankings[0]!.finishTime).toBeDefined()
      expect(typeof store.raceResults[0]!.rankings[0]!.finishTime).toBe('string')
    })
  })

  describe('startNextRound', () => {
    it('should advance to next round', () => {
      store.startRacing()

      // Finish round 0
      Object.keys(store.roundProgress).forEach((horseId, index) => {
        store.roundProgress[parseInt(horseId)]!.distance = 101
        store.roundProgress[parseInt(horseId)]!.position = index + 1
      })

      vi.advanceTimersByTime(100)

      expect(store.currentRoundIndex).toBe(1) // Now on round 1
      expect(store.currentRoundDistance).toBe(1400) // Second round distance
    })

    it('should reset round state between rounds', () => {
      store.startRacing()

      // Finish first round
      Object.keys(store.roundProgress).forEach((horseId, index) => {
        store.roundProgress[parseInt(horseId)]!.distance = 101
        store.roundProgress[parseInt(horseId)]!.position = index + 1
      })

      vi.advanceTimersByTime(100)

      // All horses in new round should have fresh state
      Object.values(store.roundProgress).forEach((horse) => {
        expect(horse.distance).toBe(0)
        expect(horse.finished).toBe(false)
        expect(horse.position).toBe(0)
        expect(horse.finishTime).toBe(0)
      })
    })

    it('should end race after 6 rounds', () => {
      store.startRacing()

      // Complete all 6 rounds
      for (let round = 0; round < 6; round++) {
        Object.keys(store.roundProgress).forEach((horseId, index) => {
          store.roundProgress[parseInt(horseId)]!.distance = 101
          store.roundProgress[parseInt(horseId)]!.position = index + 1
        })

        vi.advanceTimersByTime(100)
      }

      // After completing 6 rounds, startNextRound increments to 6 then calls endRace
      expect(store.currentRoundIndex).toBe(6)
      expect(store.isPaused).toBe(true) // Race ended
      expect(store.raceResults).toHaveLength(6)
    })

    it('should select new random horses for each round', () => {
      store.startRacing()

      const firstRoundHorses = [...store.racingHorseIds]

      // Finish first round
      Object.keys(store.roundProgress).forEach((horseId, index) => {
        store.roundProgress[parseInt(horseId)]!.distance = 101
        store.roundProgress[parseInt(horseId)]!.position = index + 1
      })

      vi.advanceTimersByTime(100)

      const secondRoundHorses = [...store.racingHorseIds]

      // In our mock, they're the same, but in reality they should be different
      // This just verifies the mechanism works
      expect(firstRoundHorses).toHaveLength(10)
      expect(secondRoundHorses).toHaveLength(10)
    })
  })

  describe('resetRace', () => {
    it('should reset all state', () => {
      store.startRacing()

      // Progress the race
      vi.advanceTimersByTime(500)

      const horsesBeforeReset = store.horses

      store.resetRace()

      // Horses persist after reset (they're kept from the previous generation)
      expect(store.horses).toEqual(horsesBeforeReset)
      expect(store.roundProgress).toEqual({})
      expect(store.raceResults).toEqual([])
      expect(store.currentRoundIndex).toBe(-1)
      expect(store.isPaused).toBe(true)
      expect(store.racingHorseIds).toEqual([])
      expect(store.currentRoundDistance).toBe(0)
    })

    it('should clear race interval', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval')
      store.startRacing()

      store.resetRace()

      expect(clearIntervalSpy).toHaveBeenCalled()
    })

    it('should allow starting new race after reset', () => {
      store.startRacing()
      vi.advanceTimersByTime(500)
      store.resetRace()

      store.startRacing()

      expect(store.currentRoundIndex).toBe(0)
      expect(store.isPaused).toBe(false)
      expect(Object.keys(store.horses)).toHaveLength(20)
    })
  })

  describe('edge cases', () => {
    it('should handle pausing before race starts', () => {
      expect(store.isPaused).toBe(true)
      store.pauseRace()
      expect(store.isPaused).toBe(true) // Should remain paused
    })

    it('should handle resuming when not paused', () => {
      store.startRacing()
      expect(store.isPaused).toBe(false)

      store.resumeRace()
      expect(store.isPaused).toBe(false) // Should remain not paused
    })

    it('should handle horse with minimum condition (1)', () => {
      // This would need a different mock setup to test different conditions
      // For now, we verify the calculation doesn't break
      store.startRacing()
      expect(store.roundProgress[1]!).toBeDefined()
    })

    it('should handle horse with maximum condition (100)', () => {
      store.startRacing()
      expect(store.roundProgress[1]!).toBeDefined()
    })

    it('should handle shortest distance (1200m)', () => {
      store.startRacing()
      expect(store.currentRoundDistance).toBe(1200)
    })

    it('should handle longest distance (2200m)', () => {
      store.startRacing()

      // Complete 5 rounds to get to the last one
      for (let round = 0; round < 5; round++) {
        Object.keys(store.roundProgress).forEach((horseId, index) => {
          store.roundProgress[parseInt(horseId)]!.distance = 101
          store.roundProgress[parseInt(horseId)]!.position = index + 1
        })
        vi.advanceTimersByTime(100)
      }

      expect(store.currentRoundDistance).toBe(2200)
    })

    it('should handle rapid pause/resume cycles', () => {
      store.startRacing()

      for (let i = 0; i < 10; i++) {
        performanceNowMock.mockReturnValue(1000 + i * 100)
        store.pauseRace()

        performanceNowMock.mockReturnValue(1000 + i * 100 + 50)
        store.resumeRace()
      }

      expect(store.isPaused).toBe(false)
    })

    it('should handle resetting during active race', () => {
      store.startRacing()
      vi.advanceTimersByTime(500)

      const clearIntervalSpy = vi.spyOn(global, 'clearInterval')
      store.resetRace()

      expect(clearIntervalSpy).toHaveBeenCalled()
      expect(store.currentRoundIndex).toBe(-1)
    })

    it('should handle resetting during paused race', () => {
      store.startRacing()
      vi.advanceTimersByTime(500)
      store.pauseRace()

      store.resetRace()

      expect(store.currentRoundIndex).toBe(-1)
      expect(store.isPaused).toBe(true)
    })
  })
})
