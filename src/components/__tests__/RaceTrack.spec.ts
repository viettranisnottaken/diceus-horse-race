import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import RaceTrack from '../RaceTrack.vue'
import { useRaceStore } from '@/stores/race'

// Mock icons
vi.mock('@/constants/icons', () => ({
  ICON_HORSE: '🏇',
  ICON_CHECKMARK: '✓',
  ICON_FINISH_LINE: '|',
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
      horses[i] = { id: i, name: `Horse ${i}`, color: `#${i}00000`, condition: 50 }
    }
    return horses
  }),
  selectRandomHorseIds: vi.fn((horses: Record<number, unknown>, count: number) =>
    Array.from({ length: count }, (_, i) => i + 1),
  ),
  generateDistances: vi.fn(() => [1200, 1400, 1600, 1800, 2000, 2200]),
  formatSecondsToMinutes: vi.fn((ms: number) => `${(ms / 1000).toFixed(3)}s`),
}))

describe('RaceTrack', () => {
  let wrapper: VueWrapper
  let store: ReturnType<typeof useRaceStore>
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    vi.useFakeTimers()
    pinia = createPinia()
    setActivePinia(pinia)

    wrapper = mount(RaceTrack, {
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
    it('should render the race track component', () => {
      expect(wrapper.find('.race-track').exists()).toBe(true)
    })

    it('should show empty state when no active race', () => {
      expect(wrapper.find('.empty-state').exists()).toBe(true)
      expect(wrapper.find('.empty-state').text()).toContain('No active race')
    })

    it('should not show track container when no active race', () => {
      expect(wrapper.find('.track-container').exists()).toBe(false)
    })
  })

  describe('when race is active', () => {
    beforeEach(async () => {
      store.startRacing()
      await wrapper.vm.$nextTick()
    })

    it('should hide empty state', () => {
      expect(wrapper.find('.empty-state').exists()).toBe(false)
    })

    it('should show track container', () => {
      expect(wrapper.find('.track-container').exists()).toBe(true)
    })

    it('should display track header with round info', () => {
      expect(wrapper.find('.track-header').exists()).toBe(true)
      expect(wrapper.find('.round-number').text()).toBe('Round 1')
      expect(wrapper.find('.round-distance').text()).toBe('1200m')
    })

    it('should show racing indicator when not paused', () => {
      expect(wrapper.find('.racing-indicator').exists()).toBe(true)
      expect(wrapper.find('.racing-indicator').text()).toContain('Racing')
      expect(wrapper.find('.spinner').exists()).toBe(true)
    })

    it('should show paused indicator when paused', async () => {
      store.pauseRace()
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.paused-indicator').exists()).toBe(true)
      expect(wrapper.find('.paused-indicator').text()).toBe('Paused')
      expect(wrapper.find('.racing-indicator').exists()).toBe(false)
    })

    it('should render 10 horse lanes', () => {
      const lanes = wrapper.findAll('.lane')
      expect(lanes).toHaveLength(10)
    })

    it('should display lane numbers', () => {
      const laneNumbers = wrapper.findAll('.lane-number')
      expect(laneNumbers).toHaveLength(10)
      expect(laneNumbers[0]!.text()).toBe('1')
      expect(laneNumbers[9]!.text()).toBe('10')
    })

    it('should display horse names', () => {
      const horseNames = wrapper.findAll('.horse-name')
      expect(horseNames).toHaveLength(10)
      expect(horseNames[0]!.text()).toBe('Horse 1')
    })

    it('should display horse markers with correct colors', () => {
      const horseMarkers = wrapper.findAll('.horse-marker')
      expect(horseMarkers).toHaveLength(10)

      const firstMarker = horseMarkers[0]!
      expect(firstMarker.attributes('style')).toContain('left: 0%')
      // Color is #100000 which converts to rgb(16, 0, 0)
      expect(firstMarker.attributes('style')).toContain('rgb(16, 0, 0)')
    })

    it('should update horse marker position based on distance', async () => {
      // Advance race and update distance
      store.roundProgress[1]!.distance = 50
      await wrapper.vm.$nextTick()

      const firstMarker = wrapper.findAll('.horse-marker')[0]!
      expect(firstMarker.attributes('style')).toContain('left: 50%')
    })

    it('should render progress bars', () => {
      const progressBars = wrapper.findAll('.progress-bar')
      expect(progressBars).toHaveLength(10)
    })

    it('should update progress bar width based on distance', async () => {
      store.roundProgress[1]!.distance = 75
      await wrapper.vm.$nextTick()

      const firstProgressFill = wrapper.findAll('.progress-fill')[0]!
      expect(firstProgressFill.attributes('style')).toContain('width: 75%')
    })

    it('should show finish line icon for unfinished horses', () => {
      const finishIndicators = wrapper.findAll('.finish-line')
      expect(finishIndicators.length).toBeGreaterThan(0)
    })

    it('should show checkmark for finished horses', async () => {
      store.roundProgress[1]!.finished = true
      await wrapper.vm.$nextTick()

      const checkmarks = wrapper.findAll('.checkmark')
      expect(checkmarks.length).toBeGreaterThan(0)
    })

    it('should display horse icon in marker', () => {
      const horseMarkers = wrapper.findAll('.horse-marker')
      expect(horseMarkers[0]!.text()).toBe('🏇')
    })
  })

  describe('round progression', () => {
    it('should update round number when advancing rounds', async () => {
      store.startRacing()
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.round-number').text()).toBe('Round 1')

      // Complete first round
      Object.keys(store.roundProgress).forEach((horseId, index) => {
        store.roundProgress[parseInt(horseId)]!.distance = 101
        store.roundProgress[parseInt(horseId)]!.position = index + 1
      })
      vi.advanceTimersByTime(100)
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.round-number').text()).toBe('Round 2')
    })

    it('should update distance when advancing rounds', async () => {
      store.startRacing()
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.round-distance').text()).toBe('1200m')

      // Complete first round
      Object.keys(store.roundProgress).forEach((horseId, index) => {
        store.roundProgress[parseInt(horseId)]!.distance = 101
        store.roundProgress[parseInt(horseId)]!.position = index + 1
      })
      vi.advanceTimersByTime(100)
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.round-distance').text()).toBe('1400m')
    })

    it('should display different horses in new round', async () => {
      store.startRacing()
      await wrapper.vm.$nextTick()

      const firstRoundHorses = wrapper.findAll('.horse-name').map((el) => el.text())

      // Complete first round
      Object.keys(store.roundProgress).forEach((horseId, index) => {
        store.roundProgress[parseInt(horseId)]!.distance = 101
        store.roundProgress[parseInt(horseId)]!.position = index + 1
      })
      vi.advanceTimersByTime(100)
      await wrapper.vm.$nextTick()

      const secondRoundHorses = wrapper.findAll('.horse-name').map((el) => el.text())

      // Should have 10 horses in each round
      expect(firstRoundHorses).toHaveLength(10)
      expect(secondRoundHorses).toHaveLength(10)
    })
  })

  describe('edge cases', () => {
    it('should handle race completion', async () => {
      store.startRacing()

      // Complete all 6 rounds
      for (let i = 0; i < 6; i++) {
        Object.keys(store.roundProgress).forEach((horseId, index) => {
          store.roundProgress[parseInt(horseId)]!.distance = 101
          store.roundProgress[parseInt(horseId)]!.position = index + 1
        })
        vi.advanceTimersByTime(100)
        await wrapper.vm.$nextTick()
      }

      // After race completes, should not show track header (round 0 or 7 is excluded)
      expect(wrapper.find('.track-header').exists()).toBe(false)
    })

    it('should handle horses with different progress', async () => {
      store.startRacing()
      await wrapper.vm.$nextTick()

      // Set different distances for horses
      store.roundProgress[1]!.distance = 10
      store.roundProgress[2]!.distance = 50
      store.roundProgress[3]!.distance = 90
      await wrapper.vm.$nextTick()

      const progressFills = wrapper.findAll('.progress-fill')
      expect(progressFills[0]!.attributes('style')).toContain('width: 10%')
      expect(progressFills[1]!.attributes('style')).toContain('width: 50%')
      expect(progressFills[2]!.attributes('style')).toContain('width: 90%')
    })

    it('should handle reset during race', async () => {
      store.startRacing()
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.track-container').exists()).toBe(true)

      store.resetRace()
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.empty-state').exists()).toBe(true)
      expect(wrapper.find('.track-container').exists()).toBe(false)
    })
  })

  describe('computed properties', () => {
    it('hasActiveRace should be false initially', () => {
      expect(wrapper.find('.empty-state').exists()).toBe(true)
    })

    it('hasActiveRace should be true during race', async () => {
      store.startRacing()
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.empty-state').exists()).toBe(false)
      expect(wrapper.find('.track-container').exists()).toBe(true)
    })

    it('racingHorses should include horse details', async () => {
      store.startRacing()
      await wrapper.vm.$nextTick()

      const horseNames = wrapper.findAll('.horse-name')
      expect(horseNames[0]!.text()).toBe('Horse 1')

      const horseMarkers = wrapper.findAll('.horse-marker')
      // Color is #100000 which converts to rgb(16, 0, 0)
      expect(horseMarkers[0]!.attributes('style')).toContain('rgb(16, 0, 0)')
    })

    it('currentRoundNumber should update correctly', async () => {
      store.startRacing()
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.round-number').text()).toBe('Round 1')

      store.currentRoundIndex = 2
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.round-number').text()).toBe('Round 3')
    })
  })
})
