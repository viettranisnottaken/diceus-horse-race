import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import HorseList from '../HorseList.vue'
import { useRaceStore } from '@/stores/race'

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
      horses[i] = {
        id: i,
        name: `Horse ${i}`,
        color: `#FF${i < 10 ? '0' : ''}${i}00`,
        condition: 40 + i * 2, // Conditions: 42, 44, 46...80 (spans all categories)
      }
    }
    return horses
  }),
  selectRandomHorseIds: vi.fn((horses: Record<number, unknown>, count: number) =>
    Array.from({ length: count }, (_, i) => i + 1),
  ),
  generateDistances: vi.fn(() => [1200, 1400, 1600, 1800, 2000, 2200]),
  formatSecondsToMinutes: vi.fn((ms: number) => `${(ms / 1000).toFixed(3)}s`),
}))

describe('HorseList', () => {
  let wrapper: VueWrapper
  let store: ReturnType<typeof useRaceStore>
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    vi.useFakeTimers()
    pinia = createPinia()
    setActivePinia(pinia)

    wrapper = mount(HorseList, {
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
    it('should render the horse list component', () => {
      expect(wrapper.find('.horse-list').exists()).toBe(true)
      expect(wrapper.find('.section-title').text()).toBe('Horses')
    })

    it('should show empty state when no horses', () => {
      expect(wrapper.find('.empty-state').exists()).toBe(true)
      expect(wrapper.find('.empty-state').text()).toContain('No horses generated yet')
    })

    it('should not show horses grid when empty', () => {
      expect(wrapper.find('.horses-grid').exists()).toBe(false)
    })
  })

  describe('when horses are generated', () => {
    beforeEach(async () => {
      store.startRacing()
      await wrapper.vm.$nextTick()
    })

    it('should hide empty state', () => {
      expect(wrapper.find('.empty-state').exists()).toBe(false)
    })

    it('should show horses grid', () => {
      expect(wrapper.find('.horses-grid').exists()).toBe(true)
    })

    it('should display all 20 horses', () => {
      const horseCards = wrapper.findAll('.horse-card')
      expect(horseCards).toHaveLength(20)
    })

    it('should display horse names', () => {
      const horseCards = wrapper.findAll('.horse-card')
      expect(horseCards[0]!.find('.horse-name').text()).toBe('Horse 1')
      expect(horseCards[19]!.find('.horse-name').text()).toBe('Horse 20')
    })

    it('should display horse IDs', () => {
      const horseCards = wrapper.findAll('.horse-card')
      expect(horseCards[0]!.find('.horse-id').text()).toBe('ID: 1')
      expect(horseCards[19]!.find('.horse-id').text()).toBe('ID: 20')
    })

    it('should display horse color indicators', () => {
      const indicators = wrapper.findAll('.horse-indicator')
      expect(indicators).toHaveLength(20)
      expect(indicators[0]!.attributes('style')).toContain('background-color')
    })

    it('should display horse conditions', () => {
      const horseCards = wrapper.findAll('.horse-card')
      expect(horseCards[0]!.find('.condition-value').text()).toBe('42')
    })

    it('should display condition status badges', () => {
      const horseCards = wrapper.findAll('.horse-card')
      expect(horseCards[0]!.find('.condition-status').exists()).toBe(true)
    })
  })

  describe('condition status logic', () => {
    beforeEach(async () => {
      store.startRacing()
      await wrapper.vm.$nextTick()
    })

    it('should show "Excellent" for condition >= 80', () => {
      // Horse 20 has condition 80
      const lastHorse = wrapper.findAll('.horse-card')[19]!
      const status = lastHorse.find('.condition-status')

      expect(status.text()).toBe('Excellent')
      expect(status.classes()).toContain('excellent')
    })

    it('should show "Good" for condition >= 60 and < 80', () => {
      // Horse 10 has condition 62
      const horse10 = wrapper.findAll('.horse-card')[9]!
      const status = horse10.find('.condition-status')

      expect(status.text()).toBe('Good')
      expect(status.classes()).toContain('good')
    })

    it('should show "Fair" for condition >= 40 and < 60', () => {
      // Horse 1 has condition 42
      const firstHorse = wrapper.findAll('.horse-card')[0]!
      const status = firstHorse.find('.condition-status')

      expect(status.text()).toBe('Fair')
      expect(status.classes()).toContain('fair')
    })

    it('should apply correct CSS classes to status badges', () => {
      const horseCards = wrapper.findAll('.horse-card')

      // Horse 1 (condition 42) - Fair
      expect(horseCards[0]!.find('.condition-status').classes()).toContain('fair')

      // Horse 10 (condition 62) - Good
      expect(horseCards[9]!.find('.condition-status').classes()).toContain('good')

      // Horse 20 (condition 80) - Excellent
      expect(horseCards[19]!.find('.condition-status').classes()).toContain('excellent')
    })
  })

  describe('racing horse highlighting', () => {
    beforeEach(async () => {
      store.startRacing()
      await wrapper.vm.$nextTick()
    })

    it('should highlight racing horses', () => {
      // First 10 horses are racing (based on selectRandomHorseIds mock)
      const horseCards = wrapper.findAll('.horse-card')

      expect(horseCards[0]!.classes()).toContain('racing')
      expect(horseCards[9]!.classes()).toContain('racing')
    })

    it('should not highlight non-racing horses', () => {
      const horseCards = wrapper.findAll('.horse-card')

      expect(horseCards[10]!.classes()).not.toContain('racing')
      expect(horseCards[19]!.classes()).not.toContain('racing')
    })

    it('should update highlighting when new horses are selected', async () => {
      const horseCards = wrapper.findAll('.horse-card')

      // Initially, first 10 horses are racing
      expect(horseCards[0]!.classes()).toContain('racing')

      // Complete first round to trigger new horse selection
      Object.keys(store.roundProgress).forEach((horseId, index) => {
        store.roundProgress[parseInt(horseId)]!.distance = 101
        store.roundProgress[parseInt(horseId)]!.position = index + 1
      })
      vi.advanceTimersByTime(100)
      await wrapper.vm.$nextTick()

      // Check if racing class is still applied (will be to first 10 due to our mock)
      expect(horseCards[0]!.classes()).toContain('racing')
    })
  })

  describe('computed properties', () => {
    it('horsesList should be empty initially', () => {
      const horseCards = wrapper.findAll('.horse-card')
      expect(horseCards).toHaveLength(0)
    })

    it('horsesList should contain 20 horses after start', async () => {
      store.startRacing()
      await wrapper.vm.$nextTick()

      const horseCards = wrapper.findAll('.horse-card')
      expect(horseCards).toHaveLength(20)
    })

    it('hasHorses should be false initially', () => {
      expect(wrapper.find('.empty-state').exists()).toBe(true)
    })

    it('hasHorses should be true after generation', async () => {
      store.startRacing()
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.empty-state').exists()).toBe(false)
      expect(wrapper.find('.horses-grid').exists()).toBe(true)
    })

    it('isRacing should correctly identify racing horses', async () => {
      store.startRacing()
      await wrapper.vm.$nextTick()

      const horseCards = wrapper.findAll('.horse-card')

      // Check racing horses
      for (let i = 0; i < 10; i++) {
        expect(horseCards[i]!.classes()).toContain('racing')
      }

      // Check non-racing horses
      for (let i = 10; i < 20; i++) {
        expect(horseCards[i]!.classes()).not.toContain('racing')
      }
    })
  })

  describe('edge cases', () => {
    it('should handle reset', async () => {
      store.startRacing()
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.horses-grid').exists()).toBe(true)

      store.resetRace()
      await wrapper.vm.$nextTick()

      // After reset, horses should still be visible (they persist)
      expect(wrapper.find('.horses-grid').exists()).toBe(true)
    })

    it('should handle condition edge values', () => {
      // Test getConditionStatus with manual values
      const component = wrapper.vm as unknown as {
        getConditionStatus: (condition: number) => { label: string; class: string }
      }

      expect(component.getConditionStatus(80).label).toBe('Excellent')
      expect(component.getConditionStatus(79).label).toBe('Good')
      expect(component.getConditionStatus(60).label).toBe('Good')
      expect(component.getConditionStatus(59).label).toBe('Fair')
      expect(component.getConditionStatus(40).label).toBe('Fair')
      expect(component.getConditionStatus(39).label).toBe('Poor')
      expect(component.getConditionStatus(1).label).toBe('Poor')
    })

    it('should display all horses in grid format', async () => {
      store.startRacing()
      await wrapper.vm.$nextTick()

      const grid = wrapper.find('.horses-grid')
      expect(grid.exists()).toBe(true)

      const horseCards = grid.findAll('.horse-card')
      expect(horseCards).toHaveLength(20)

      // Each card should have all required elements
      horseCards.forEach((card) => {
        expect(card.find('.horse-indicator').exists()).toBe(true)
        expect(card.find('.horse-name').exists()).toBe(true)
        expect(card.find('.horse-id').exists()).toBe(true)
        expect(card.find('.condition-value').exists()).toBe(true)
        expect(card.find('.condition-status').exists()).toBe(true)
      })
    })
  })
})
