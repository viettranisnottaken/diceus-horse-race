import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ControlPanel from '../ControlPanel.vue'
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
      horses[i] = { id: i, name: `Horse ${i}`, color: '#000000', condition: 50 }
    }
    return horses
  }),
  selectRandomHorseIds: vi.fn((horses: Record<number, unknown>, count: number) =>
    Array.from({ length: count }, (_, i) => i + 1),
  ),
  generateDistances: vi.fn(() => [1200, 1400, 1600, 1800, 2000, 2200]),
  formatSecondsToMinutes: vi.fn((ms: number) => `${(ms / 1000).toFixed(3)}s`),
}))

describe('ControlPanel', () => {
  let wrapper: VueWrapper
  let store: ReturnType<typeof useRaceStore>
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    vi.useFakeTimers()
    pinia = createPinia()
    setActivePinia(pinia)

    wrapper = mount(ControlPanel, {
      global: {
        plugins: [pinia],
      },
    })

    // Get the store instance that the component is using
    store = useRaceStore()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('initial render', () => {
    it('should render the control panel', () => {
      expect(wrapper.find('.control-panel').exists()).toBe(true)
    })

    it('should render Start Racing button', () => {
      const startButton = wrapper.find('button.btn-primary')
      expect(startButton.exists()).toBe(true)
      expect(startButton.text()).toBe('Start Racing')
    })

    it('should render Reset button', () => {
      const resetButton = wrapper.find('button.btn-danger')
      expect(resetButton.exists()).toBe(true)
      expect(resetButton.text()).toBe('Reset')
    })

    it('should not render Pause/Resume button initially', () => {
      const pauseResumeButton = wrapper.find('button.btn-warning')
      expect(pauseResumeButton.exists()).toBe(false)
    })

    it('should render info cards', () => {
      const infoCards = wrapper.findAll('.info-card')
      expect(infoCards).toHaveLength(4)
    })
  })

  describe('computed properties', () => {
    describe('hasStarted', () => {
      it('should be false when race has not started', () => {
        expect(store.currentRoundIndex).toBe(-1)
        const startButton = wrapper.find('button.btn-primary')
        expect(startButton.attributes('disabled')).toBeUndefined()
      })

      it('should be true when race has started', async () => {
        store.startRacing()
        await wrapper.vm.$nextTick()

        expect(store.currentRoundIndex).toBeGreaterThanOrEqual(0)
        const startButton = wrapper.find('button.btn-primary')
        expect(startButton.attributes('disabled')).toBe('')
      })
    })

    describe('isFinished', () => {
      it('should be false when race is in progress', async () => {
        store.startRacing()
        await wrapper.vm.$nextTick()

        expect(store.currentRoundIndex).toBeLessThan(6)
      })

      it('should be true when all rounds are completed', async () => {
        store.startRacing()

        // Complete all 6 rounds
        for (let i = 0; i < 6; i++) {
          Object.keys(store.roundProgress).forEach((horseId, index) => {
            store.roundProgress[parseInt(horseId)]!.distance = 101
            store.roundProgress[parseInt(horseId)]!.position = index + 1
          })
          vi.advanceTimersByTime(100) // Advance timer to trigger animateRace
          await wrapper.vm.$nextTick()
        }

        expect(store.currentRoundIndex).toBe(6)
      })
    })

    describe('raceStatus', () => {
      it('should show "Not Started" initially', () => {
        const statusValue = wrapper.find('.info-card:nth-child(4) .info-value')
        expect(statusValue.text()).toBe('Not Started')
      })

      it('should show "Racing" when race is active', async () => {
        store.startRacing()
        await wrapper.vm.$nextTick()

        const statusValue = wrapper.find('.info-card:nth-child(4) .info-value')
        expect(statusValue.text()).toBe('Racing')
      })

      it('should show "Paused" when race is paused', async () => {
        store.startRacing()
        await wrapper.vm.$nextTick()

        store.pauseRace()
        await wrapper.vm.$nextTick()

        const statusValue = wrapper.find('.info-card:nth-child(4) .info-value')
        expect(statusValue.text()).toBe('Paused')
      })

      it('should show "Completed" when race is finished', async () => {
        store.startRacing()

        // Manually set to finished state
        store.currentRoundIndex = 6
        await wrapper.vm.$nextTick()

        const statusValue = wrapper.find('.info-card:nth-child(4) .info-value')
        expect(statusValue.text()).toBe('Completed')
      })

      it('should apply correct CSS class based on status', async () => {
        // Not Started
        let statusValue = wrapper.find('.info-card:nth-child(4) .info-value')
        expect(statusValue.classes()).toContain('status-not')

        // Racing
        store.startRacing()
        await wrapper.vm.$nextTick()
        statusValue = wrapper.find('.info-card:nth-child(4) .info-value')
        expect(statusValue.classes()).toContain('status-racing')

        // Paused
        store.pauseRace()
        await wrapper.vm.$nextTick()
        statusValue = wrapper.find('.info-card:nth-child(4) .info-value')
        expect(statusValue.classes()).toContain('status-paused')

        // Completed
        store.currentRoundIndex = 6
        await wrapper.vm.$nextTick()
        statusValue = wrapper.find('.info-card:nth-child(4) .info-value')
        expect(statusValue.classes()).toContain('status-completed')
      })
    })

    describe('currentRoundNumber', () => {
      it('should show "-" when race has not started', () => {
        const roundValue = wrapper.find('.info-card:nth-child(2) .info-value')
        expect(roundValue.text()).toBe('-')
      })

      it('should show current round number during race', async () => {
        store.startRacing()
        await wrapper.vm.$nextTick()

        const roundValue = wrapper.find('.info-card:nth-child(2) .info-value')
        expect(roundValue.text()).toBe('1')
      })

      it('should show "-" when race is completed', async () => {
        store.startRacing()
        store.currentRoundIndex = 6
        await wrapper.vm.$nextTick()

        const roundValue = wrapper.find('.info-card:nth-child(2) .info-value')
        expect(roundValue.text()).toBe('-')
      })
    })
  })

  describe('button states and interactions', () => {
    describe('Start Racing button', () => {
      it('should be enabled initially', () => {
        const startButton = wrapper.find('button.btn-primary')
        expect(startButton.attributes('disabled')).toBeUndefined()
      })

      it('should be disabled after race starts', async () => {
        const startButton = wrapper.find('button.btn-primary')
        await startButton.trigger('click')
        await wrapper.vm.$nextTick()

        expect(startButton.attributes('disabled')).toBe('')
      })

      it('should call store.startRacing() when clicked', async () => {
        const startRacingSpy = vi.spyOn(store, 'startRacing')
        const startButton = wrapper.find('button.btn-primary')

        await startButton.trigger('click')

        expect(startRacingSpy).toHaveBeenCalledOnce()
      })
    })

    describe('Pause/Resume button', () => {
      it('should not be visible before race starts', () => {
        const pauseResumeButton = wrapper.find('button.btn-warning')
        expect(pauseResumeButton.exists()).toBe(false)
      })

      it('should be visible during race', async () => {
        store.startRacing()
        await wrapper.vm.$nextTick()

        const pauseResumeButton = wrapper.find('button.btn-warning')
        expect(pauseResumeButton.exists()).toBe(true)
      })

      it('should show "Pause" when race is running', async () => {
        store.startRacing()
        await wrapper.vm.$nextTick()

        const pauseResumeButton = wrapper.find('button.btn-warning')
        expect(pauseResumeButton.text()).toBe('Pause')
      })

      it('should show "Resume" when race is paused', async () => {
        store.startRacing()
        await wrapper.vm.$nextTick()

        store.pauseRace()
        await wrapper.vm.$nextTick()

        const pauseResumeButton = wrapper.find('button.btn-warning')
        expect(pauseResumeButton.text()).toBe('Resume')
      })

      it('should call store.pauseRace() when clicked while racing', async () => {
        const pauseRaceSpy = vi.spyOn(store, 'pauseRace')
        store.startRacing()
        await wrapper.vm.$nextTick()

        const pauseResumeButton = wrapper.find('button.btn-warning')
        await pauseResumeButton.trigger('click')

        expect(pauseRaceSpy).toHaveBeenCalledOnce()
      })

      it('should call store.resumeRace() when clicked while paused', async () => {
        const resumeRaceSpy = vi.spyOn(store, 'resumeRace')
        store.startRacing()
        store.pauseRace()
        await wrapper.vm.$nextTick()

        const pauseResumeButton = wrapper.find('button.btn-warning')
        await pauseResumeButton.trigger('click')

        expect(resumeRaceSpy).toHaveBeenCalledOnce()
      })

      it('should not be visible when race is finished', async () => {
        store.startRacing()
        store.currentRoundIndex = 6
        await wrapper.vm.$nextTick()

        const pauseResumeButton = wrapper.find('button.btn-warning')
        expect(pauseResumeButton.exists()).toBe(false)
      })
    })

    describe('Reset button', () => {
      it('should be visible at all times', async () => {
        // Before start
        expect(wrapper.find('button.btn-danger').exists()).toBe(true)

        // During race
        store.startRacing()
        await wrapper.vm.$nextTick()
        expect(wrapper.find('button.btn-danger').exists()).toBe(true)

        // After finish
        store.currentRoundIndex = 6
        await wrapper.vm.$nextTick()
        expect(wrapper.find('button.btn-danger').exists()).toBe(true)
      })

      it('should show reset confirmation modal when clicked', async () => {
        const resetButton = wrapper.find('button.btn-danger')
        await resetButton.trigger('click')
        await wrapper.vm.$nextTick()

        expect(wrapper.find('.modal-overlay').exists()).toBe(true)
        expect(wrapper.find('.modal').exists()).toBe(true)
      })
    })
  })

  describe('reset confirmation modal', () => {
    beforeEach(async () => {
      const resetButton = wrapper.find('button.btn-danger')
      await resetButton.trigger('click')
      await wrapper.vm.$nextTick()
    })

    it('should render modal with correct content', () => {
      expect(wrapper.find('.modal-title').text()).toBe('Confirm Reset')
      expect(wrapper.find('.modal-text').text()).toContain('Are you sure')
    })

    it('should render Cancel and Reset buttons', () => {
      const buttons = wrapper.findAll('.modal-actions .btn')
      expect(buttons).toHaveLength(2)
      expect(buttons[0]!.text()).toBe('Cancel')
      expect(buttons[1]!.text()).toBe('Reset')
    })

    it('should close modal when Cancel is clicked', async () => {
      const cancelButton = wrapper.find('.modal-actions .btn-secondary')
      await cancelButton.trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.modal-overlay').exists()).toBe(false)
    })

    it('should close modal when overlay is clicked', async () => {
      const overlay = wrapper.find('.modal-overlay')
      await overlay.trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.modal-overlay').exists()).toBe(false)
    })

    it('should not close modal when modal itself is clicked', async () => {
      const modal = wrapper.find('.modal')
      await modal.trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.modal-overlay').exists()).toBe(true)
    })

    it('should call store.resetRace() when Reset is confirmed', async () => {
      const resetRaceSpy = vi.spyOn(store, 'resetRace')
      const resetButton = wrapper.find('.modal-actions .btn-danger')
      await resetButton.trigger('click')
      await wrapper.vm.$nextTick()

      expect(resetRaceSpy).toHaveBeenCalledOnce()
    })

    it('should close modal after Reset is confirmed', async () => {
      const resetButton = wrapper.find('.modal-actions .btn-danger')
      await resetButton.trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.modal-overlay').exists()).toBe(false)
    })
  })

  describe('info cards', () => {
    it('should display Total Horses count', () => {
      const totalHorsesCard = wrapper.findAll('.info-card')[0]!
      expect(totalHorsesCard.find('.info-label').text()).toBe('Total Horses')
      expect(totalHorsesCard.find('.info-value').text()).toBe('20')
    })

    it('should display Current Round', () => {
      const currentRoundCard = wrapper.findAll('.info-card')[1]!
      expect(currentRoundCard.find('.info-label').text()).toBe('Current Round')
      expect(currentRoundCard.find('.info-value').text()).toBe('-')
    })

    it('should display Total Rounds count', () => {
      const totalRoundsCard = wrapper.findAll('.info-card')[2]!
      expect(totalRoundsCard.find('.info-label').text()).toBe('Total Rounds')
      expect(totalRoundsCard.find('.info-value').text()).toBe('6')
    })

    it('should display Status', () => {
      const statusCard = wrapper.findAll('.info-card')[3]!
      expect(statusCard.find('.info-label').text()).toBe('Status')
      expect(statusCard.find('.info-value').text()).toBe('Not Started')
    })

    it('should update Current Round during race', async () => {
      store.startRacing()
      await wrapper.vm.$nextTick()

      const currentRoundCard = wrapper.findAll('.info-card')[1]!
      expect(currentRoundCard.find('.info-value').text()).toBe('1')

      // Simulate finishing first round and starting second
      Object.keys(store.roundProgress).forEach((horseId, index) => {
        store.roundProgress[parseInt(horseId)]!.distance = 101
        store.roundProgress[parseInt(horseId)]!.position = index + 1
      })
      vi.advanceTimersByTime(100) // Advance timer to trigger round transition
      await wrapper.vm.$nextTick()

      expect(currentRoundCard.find('.info-value').text()).toBe('2')
    })

    it('should update Status during race lifecycle', async () => {
      const statusCard = wrapper.findAll('.info-card')[3]!

      // Not Started
      expect(statusCard.find('.info-value').text()).toBe('Not Started')

      // Racing
      store.startRacing()
      await wrapper.vm.$nextTick()
      expect(statusCard.find('.info-value').text()).toBe('Racing')

      // Paused
      store.pauseRace()
      await wrapper.vm.$nextTick()
      expect(statusCard.find('.info-value').text()).toBe('Paused')

      // Resumed
      store.resumeRace()
      await wrapper.vm.$nextTick()
      expect(statusCard.find('.info-value').text()).toBe('Racing')

      // Completed
      store.currentRoundIndex = 6
      await wrapper.vm.$nextTick()
      expect(statusCard.find('.info-value').text()).toBe('Completed')
    })
  })

  describe('edge cases', () => {
    it('should handle rapid button clicks', async () => {
      const startButton = wrapper.find('button.btn-primary')

      // Click multiple times rapidly
      await startButton.trigger('click')
      await startButton.trigger('click')
      await startButton.trigger('click')

      // Should only start once (button becomes disabled)
      expect(startButton.attributes('disabled')).toBe('')
    })

    it('should handle reset during active race', async () => {
      store.startRacing()
      await wrapper.vm.$nextTick()

      const resetButton = wrapper.find('button.btn-danger')
      await resetButton.trigger('click')
      await wrapper.vm.$nextTick()

      const confirmButton = wrapper.find('.modal-actions .btn-danger')
      await confirmButton.trigger('click')
      await wrapper.vm.$nextTick()

      expect(store.currentRoundIndex).toBe(-1)
      expect(store.isPaused).toBe(true)
    })

    it('should handle reset during paused race', async () => {
      store.startRacing()
      store.pauseRace()
      await wrapper.vm.$nextTick()

      const resetButton = wrapper.find('button.btn-danger')
      await resetButton.trigger('click')
      await wrapper.vm.$nextTick()

      const confirmButton = wrapper.find('.modal-actions .btn-danger')
      await confirmButton.trigger('click')
      await wrapper.vm.$nextTick()

      expect(store.currentRoundIndex).toBe(-1)
    })

    it('should allow starting new race after reset', async () => {
      store.startRacing()
      await wrapper.vm.$nextTick()

      store.resetRace()
      await wrapper.vm.$nextTick()

      const startButton = wrapper.find('button.btn-primary')
      expect(startButton.attributes('disabled')).toBeUndefined()

      await startButton.trigger('click')
      expect(store.currentRoundIndex).toBe(0)
    })
  })
})
