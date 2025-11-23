import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import RaceResults from '../RaceResults.vue'
import { useRaceStore } from '@/stores/race'

// Mock icons
vi.mock('@/constants/icons', () => ({
  ICON_MEDAL_GOLD: '🥇',
  ICON_MEDAL_SILVER: '🥈',
  ICON_MEDAL_BRONZE: '🥉',
}))

// Mock the constants
vi.mock('@/constants/race', () => ({
  TOTAL_HORSES_COUNT: 20,
  HORSES_COUNT_PER_ROUND: 10,
  ROUNDS_COUNT: 6,
  BASE_SPEED: 2,
}))

// Mock the utility functions
vi.mock('@/utils/race', () => ({
  generateHorses: vi.fn(() => {
    const horses: Record<number, { id: number; name: string; color: string; condition: number }> =
      {}
    for (let i = 1; i <= 20; i++) {
      horses[i] = { id: i, name: `Horse ${i}`, color: `#FF${i}000`, condition: 50 }
    }
    return horses
  }),
  selectRandomHorseIds: vi.fn((horses: Record<number, unknown>, count: number) =>
    Array.from({ length: count }, (_, i) => i + 1),
  ),
  generateDistances: vi.fn(() => [1200, 1400, 1600, 1800, 2000, 2200]),
  formatSecondsToMinutes: vi.fn((ms: number) => `${(ms / 1000).toFixed(3)}s`),
}))

describe('RaceResults', () => {
  let wrapper: VueWrapper
  let store: ReturnType<typeof useRaceStore>
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    vi.useFakeTimers()
    pinia = createPinia()
    setActivePinia(pinia)

    wrapper = mount(RaceResults, {
      global: {
        plugins: [pinia],
      },
    })

    store = useRaceStore()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('initial render', () => {
    it('should render the race results component', () => {
      expect(wrapper.find('.race-results').exists()).toBe(true)
      expect(wrapper.find('.section-title').text()).toBe('Race Results')
    })

    it('should show empty state when no results', () => {
      expect(wrapper.find('.empty-state').exists()).toBe(true)
      expect(wrapper.find('.empty-state').text()).toContain('No results yet')
    })

    it('should not show results grid when empty', () => {
      expect(wrapper.find('.results-grid').exists()).toBe(false)
    })
  })

  describe('when race results exist', () => {
    beforeEach(async () => {
      store.startRacing()
      await wrapper.vm.$nextTick()

      // Complete first round
      Object.keys(store.roundProgress).forEach((horseId, index) => {
        store.roundProgress[parseInt(horseId)]!.distance = 101
        store.roundProgress[parseInt(horseId)]!.position = index + 1
        store.roundProgress[parseInt(horseId)]!.finishTime = 1000 + index * 100
      })
      vi.advanceTimersByTime(100)
      await wrapper.vm.$nextTick()
    })

    it('should hide empty state', () => {
      expect(wrapper.find('.empty-state').exists()).toBe(false)
    })

    it('should show results grid', () => {
      expect(wrapper.find('.results-grid').exists()).toBe(true)
    })

    it('should display result cards', () => {
      const resultCards = wrapper.findAll('.result-card')
      expect(resultCards.length).toBeGreaterThan(0)
    })

    it('should display round badge', () => {
      const roundBadge = wrapper.find('.round-badge')
      expect(roundBadge.text()).toBe('Round 1')
    })

    it('should display race distance', () => {
      const distance = wrapper.find('.distance')
      expect(distance.text()).toBe('1200m')
    })

    it('should display timestamp', () => {
      const timestamp = wrapper.find('.timestamp')
      expect(timestamp.exists()).toBe(true)
      expect(timestamp.text()).toBeTruthy()
    })

    it('should display 10 ranking rows per round', () => {
      const rankingRows = wrapper.findAll('.ranking-row')
      expect(rankingRows).toHaveLength(10)
    })

    it('should display horse names in rankings', () => {
      const horseNames = wrapper.findAll('.horse-name')
      expect(horseNames.length).toBeGreaterThan(0)
      expect(horseNames[0]!.text()).toBe('Horse 1')
    })

    it('should display horse IDs in rankings', () => {
      const horseIds = wrapper.findAll('.horse-id')
      expect(horseIds.length).toBeGreaterThan(0)
      expect(horseIds[0]!.text()).toContain('ID:')
    })

    it('should display finish times', () => {
      const finishTimes = wrapper.findAll('.finish-time')
      expect(finishTimes.length).toBeGreaterThan(0)
      expect(finishTimes[0]!.text()).toBeTruthy()
    })

    it('should display horse color indicators', () => {
      const colorIndicators = wrapper.findAll('.horse-color-indicator')
      expect(colorIndicators).toHaveLength(10)
      expect(colorIndicators[0]!.attributes('style')).toContain('background-color')
    })
  })

  describe('medal icons', () => {
    beforeEach(async () => {
      store.startRacing()
      await wrapper.vm.$nextTick()

      // Complete first round with horses finishing sequentially
      for (let i = 0; i < 10; i++) {
        const horseId = i + 1
        store.roundProgress[horseId]!.distance = 99
        vi.advanceTimersByTime(100) // Each horse finishes one tick apart
        await wrapper.vm.$nextTick()
      }
    })

    it('should show medals for top 3 positions', () => {
      const medals = wrapper.findAll('.medal')
      expect(medals.length).toBe(3)

      // Check that we have gold, silver, bronze medals (in some order due to grid layout)
      const medalTexts = medals.map((m) => m.text())
      expect(medalTexts).toContain('🥇')
      expect(medalTexts).toContain('🥈')
      expect(medalTexts).toContain('🥉')
    })

    it('should show position numbers for places 4-10', () => {
      const positionNumbers = wrapper.findAll('.position-number')
      expect(positionNumbers.length).toBe(7) // positions 4-10

      const numbers = positionNumbers.map((p) => p.text())
      ;['4', '5', '6', '7', '8', '9', '10'].forEach((num) => {
        expect(numbers).toContain(num)
      })
    })

    it('should display correct medals based on position', () => {
      // Check getMedalIcon function logic
      const rankingRows = wrapper.findAll('.ranking-row')

      let goldCount = 0
      let silverCount = 0
      let bronzeCount = 0

      rankingRows.forEach((row) => {
        const medal = row.find('.medal')
        if (medal.exists()) {
          const text = medal.text()
          if (text === '🥇') goldCount++
          if (text === '🥈') silverCount++
          if (text === '🥉') bronzeCount++
        }
      })

      expect(goldCount).toBe(1)
      expect(silverCount).toBe(1)
      expect(bronzeCount).toBe(1)
    })
  })

  describe('position styling', () => {
    beforeEach(async () => {
      store.startRacing()
      await wrapper.vm.$nextTick()

      // Complete first round with horses finishing sequentially
      for (let i = 0; i < 10; i++) {
        const horseId = i + 1
        store.roundProgress[horseId]!.distance = 99
        vi.advanceTimersByTime(100) // Each horse finishes one tick apart
        await wrapper.vm.$nextTick()
      }
    })

    it('should apply position-based styling classes', () => {
      const rankingRows = wrapper.findAll('.ranking-row')

      let firstCount = 0
      let secondCount = 0
      let thirdCount = 0
      let noStyleCount = 0

      rankingRows.forEach((row) => {
        const classes = row.classes()
        if (classes.includes('first')) firstCount++
        else if (classes.includes('second')) secondCount++
        else if (classes.includes('third')) thirdCount++
        else noStyleCount++
      })

      expect(firstCount).toBe(1)
      expect(secondCount).toBe(1)
      expect(thirdCount).toBe(1)
      expect(noStyleCount).toBe(7) // positions 4-10
    })

    it('should have exactly 3 rows with special styling', () => {
      const rankingRows = wrapper.findAll('.ranking-row')
      const specialRows = rankingRows.filter(
        (row) =>
          row.classes().includes('first') ||
          row.classes().includes('second') ||
          row.classes().includes('third'),
      )

      expect(specialRows).toHaveLength(3)
    })

    it('should apply correct styling based on getPositionClass function', () => {
      const component = wrapper.vm as unknown as {
        getPositionClass: (position: number) => string
      }

      expect(component.getPositionClass(1)).toBe('first')
      expect(component.getPositionClass(2)).toBe('second')
      expect(component.getPositionClass(3)).toBe('third')
      expect(component.getPositionClass(4)).toBe('')
    })
  })

  describe('multiple rounds', () => {
    beforeEach(async () => {
      store.startRacing()
      await wrapper.vm.$nextTick()

      // Complete 3 rounds
      for (let round = 0; round < 3; round++) {
        Object.keys(store.roundProgress).forEach((horseId, index) => {
          store.roundProgress[parseInt(horseId)]!.distance = 101
          store.roundProgress[parseInt(horseId)]!.position = index + 1
        })
        vi.advanceTimersByTime(100)
        await wrapper.vm.$nextTick()
      }
    })

    it('should display multiple result cards', () => {
      const resultCards = wrapper.findAll('.result-card')
      expect(resultCards).toHaveLength(3)
    })

    it('should display correct round numbers', () => {
      const roundBadges = wrapper.findAll('.round-badge')
      expect(roundBadges[0]!.text()).toBe('Round 1')
      expect(roundBadges[1]!.text()).toBe('Round 2')
      expect(roundBadges[2]!.text()).toBe('Round 3')
    })

    it('should display correct distances for each round', () => {
      const distances = wrapper.findAll('.distance')
      expect(distances[0]!.text()).toBe('1200m')
      expect(distances[1]!.text()).toBe('1400m')
      expect(distances[2]!.text()).toBe('1600m')
    })

    it('should display all 10 horses per round', () => {
      const resultCards = wrapper.findAll('.result-card')
      resultCards.forEach((card) => {
        const rankings = card.findAll('.ranking-row')
        expect(rankings).toHaveLength(10)
      })
    })
  })

  describe('computed properties', () => {
    it('hasResults should be false initially', () => {
      expect(wrapper.find('.empty-state').exists()).toBe(true)
    })

    it('hasResults should be true after completing a round', async () => {
      store.startRacing()
      await wrapper.vm.$nextTick()

      Object.keys(store.roundProgress).forEach((horseId, index) => {
        store.roundProgress[parseInt(horseId)]!.distance = 101
        store.roundProgress[parseInt(horseId)]!.position = index + 1
      })
      vi.advanceTimersByTime(100)
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.empty-state').exists()).toBe(false)
      expect(wrapper.find('.results-grid').exists()).toBe(true)
    })

    it('getMedalIcon should return correct icons', () => {
      const component = wrapper.vm as unknown as {
        getMedalIcon: (position: number) => string
      }

      expect(component.getMedalIcon(1)).toBe('🥇')
      expect(component.getMedalIcon(2)).toBe('🥈')
      expect(component.getMedalIcon(3)).toBe('🥉')
      expect(component.getMedalIcon(4)).toBe('')
      expect(component.getMedalIcon(10)).toBe('')
    })

    it('getPositionClass should return correct classes', () => {
      const component = wrapper.vm as unknown as {
        getPositionClass: (position: number) => string
      }

      expect(component.getPositionClass(1)).toBe('first')
      expect(component.getPositionClass(2)).toBe('second')
      expect(component.getPositionClass(3)).toBe('third')
      expect(component.getPositionClass(4)).toBe('')
      expect(component.getPositionClass(10)).toBe('')
    })

    it('formatTimestamp should format date correctly', () => {
      const component = wrapper.vm as unknown as {
        formatTimestamp: (timestamp: Date) => string
      }

      const testDate = new Date('2024-01-01T12:00:00')
      const formatted = component.formatTimestamp(testDate)

      expect(formatted).toBeTruthy()
      expect(typeof formatted).toBe('string')
    })
  })

  describe('edge cases', () => {
    it('should handle empty round results', () => {
      expect(wrapper.find('.empty-state').exists()).toBe(true)
      expect(wrapper.findAll('.result-card')).toHaveLength(0)
    })

    it('should handle race with all 6 rounds completed', async () => {
      store.startRacing()
      await wrapper.vm.$nextTick()

      // Complete all 6 rounds
      for (let round = 0; round < 6; round++) {
        Object.keys(store.roundProgress).forEach((horseId, index) => {
          store.roundProgress[parseInt(horseId)]!.distance = 101
          store.roundProgress[parseInt(horseId)]!.position = index + 1
        })
        vi.advanceTimersByTime(100)
        await wrapper.vm.$nextTick()
      }

      const resultCards = wrapper.findAll('.result-card')
      expect(resultCards).toHaveLength(6)
    })

    it('should handle reset after completing rounds', async () => {
      store.startRacing()
      await wrapper.vm.$nextTick()

      Object.keys(store.roundProgress).forEach((horseId, index) => {
        store.roundProgress[parseInt(horseId)]!.distance = 101
        store.roundProgress[parseInt(horseId)]!.position = index + 1
      })
      vi.advanceTimersByTime(100)
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.results-grid').exists()).toBe(true)

      store.resetRace()
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.empty-state').exists()).toBe(true)
      expect(wrapper.find('.results-grid').exists()).toBe(false)
    })

    it('should display correct structure for each result card', async () => {
      store.startRacing()
      await wrapper.vm.$nextTick()

      Object.keys(store.roundProgress).forEach((horseId, index) => {
        store.roundProgress[parseInt(horseId)]!.distance = 101
        store.roundProgress[parseInt(horseId)]!.position = index + 1
      })
      vi.advanceTimersByTime(100)
      await wrapper.vm.$nextTick()

      const resultCard = wrapper.find('.result-card')
      expect(resultCard.find('.result-header').exists()).toBe(true)
      expect(resultCard.find('.result-title').exists()).toBe(true)
      expect(resultCard.find('.round-badge').exists()).toBe(true)
      expect(resultCard.find('.distance').exists()).toBe(true)
      expect(resultCard.find('.timestamp').exists()).toBe(true)
      expect(resultCard.find('.rankings').exists()).toBe(true)
    })
  })
})
