<script setup lang="ts">
import { computed } from 'vue'
import { useRaceStore } from '@/stores/race'
import { ICON_HORSE, ICON_CHECKMARK, ICON_FINISH_LINE } from '@/constants/icons'

const raceStore = useRaceStore()

const hasActiveRace = computed(() => {
  return raceStore.currentRoundIndex >= 0 && Object.keys(raceStore.roundProgress).length > 0
})

const racingHorses = computed(() => {
  return Object.values(raceStore.roundProgress).map((racingHorse) => {
    const horse = raceStore.horses[racingHorse.horseId]
    return {
      ...racingHorse,
      horse,
    }
  })
})

const currentRoundNumber = computed(() => raceStore.currentRoundIndex + 1)
</script>

<template>
  <div class="race-track">
    <h2 class="section-title">Race Track</h2>

    <div v-if="!hasActiveRace" class="empty-state">
      <p>No active race. Start racing to see the action!</p>
    </div>

    <div v-else class="track-container">
      <div v-if="currentRoundNumber !== 0 && currentRoundNumber !== 7" class="track-header">
        <div class="round-info">
          <span class="round-number">Round {{ currentRoundNumber }}</span>
          <span class="round-distance">{{ raceStore.currentRoundDistance }}m</span>
        </div>
        <div v-if="!raceStore.isPaused" class="racing-indicator">
          <span class="spinner"></span>
          <span>Racing...</span>
        </div>
        <div v-else class="paused-indicator">Paused</div>
      </div>

      <div class="lanes">
        <div v-for="(racingHorse, index) in racingHorses" :key="racingHorse.horseId" class="lane">
          <div class="lane-number">{{ index + 1 }}</div>

          <div class="track">
            <div
              class="horse-marker"
              :style="{
                left: `${racingHorse.distance}%`,
                backgroundColor: racingHorse.horse?.color,
              }"
            >
              {{ ICON_HORSE }}
            </div>

            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${racingHorse.distance}%` }"></div>
            </div>
          </div>

          <div class="horse-name">{{ racingHorse.horse?.name }}</div>

          <div class="finish-indicator">
            <span v-if="racingHorse.finished" class="checkmark">{{ ICON_CHECKMARK }}</span>
            <span v-else class="finish-line">{{ ICON_FINISH_LINE }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/breakpoints' as *;
@use '@/assets/colors' as *;

.race-track {
  background: $card-background;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: $shadow-md;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: $color-text-primary;
  margin-bottom: 1.25rem;
}

.empty-state {
  text-align: center;
  padding: 2.5rem 1.25rem;
  color: $color-text-secondary;
}

.track-container {
  width: 100%;
}

.track-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
  padding: 0.75rem 1rem;
  background-color: $color-background-soft;
  border-radius: 0.375rem;
}

.round-info {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.round-number {
  font-size: 1.125rem;
  font-weight: 700;
  color: $color-text-primary;
}

.round-distance {
  font-size: 1rem;
  font-weight: 600;
  color: $color-primary;
}

.racing-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: $status-racing;
  font-weight: 600;
}

.paused-indicator {
  color: $status-paused;
  font-weight: 600;
}

.spinner {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 0.125rem solid $status-racing;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.lanes {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.lane {
  display: grid;
  grid-template-columns: 1.875rem 1fr 6.25rem 2.5rem;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  background-color: $color-background-soft;
  border-radius: 0.375rem;
}

.lane-number {
  font-weight: 700;
  color: $color-text-secondary;
  text-align: center;
  font-size: 0.875rem;
}

.track {
  position: relative;
  height: 2.5rem;
  background-color: $track-background;
  border-radius: 1.25rem;
  overflow: hidden;
}

.progress-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 1.25rem;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: $progress-fill;
  transition: width 100ms linear;
}

.horse-marker {
  position: absolute;
  top: 50%;
  transform: translate(0%, -50%);
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  box-shadow: $shadow-indicator;
  z-index: 10;
  transition: left 100ms linear;
}

.horse-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: $color-text-primary;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.finish-indicator {
  text-align: center;
  font-size: 1.25rem;
}

.checkmark {
  color: $status-completed;
  font-weight: 700;
}

.finish-line {
  color: $finish-indicator;
  font-weight: 700;
}

/* Large screens (desktop) - default layout above */

/* Medium screens (tablet) */
@include tablet {
  .race-track {
    padding: 1.25rem;
  }

  .section-title {
    font-size: 1.375rem;
    margin-bottom: 1rem;
  }

  .track-header {
    padding: 0.625rem 0.875rem;
  }

  .round-number {
    font-size: 1rem;
  }

  .round-distance {
    font-size: 0.9375rem;
  }

  .racing-indicator,
  .paused-indicator {
    font-size: 0.9375rem;
  }

  .lane {
    grid-template-columns: 1.75rem 1fr 5.625rem 2.1875rem;
    gap: 0.625rem;
    padding: 0.375rem;
  }

  .track {
    height: 2.25rem;
  }

  .horse-marker {
    width: 2rem;
    height: 2rem;
    font-size: 1.125rem;
  }

  .horse-name {
    font-size: 0.8125rem;
  }
}

/* Small screens (mobile) */
@include mobile {
  .race-track {
    padding: 1rem;
  }

  .section-title {
    font-size: 1.25rem;
    margin-bottom: 1rem;
  }

  .empty-state {
    padding: 1.875rem 1rem;
    font-size: 0.875rem;
  }

  .track-header {
    flex-direction: column;
    gap: 0.625rem;
    align-items: flex-start;
    padding: 0.625rem 0.75rem;
  }

  .round-info {
    gap: 0.75rem;
  }

  .round-number {
    font-size: 0.9375rem;
  }

  .round-distance {
    font-size: 0.875rem;
  }

  .racing-indicator,
  .paused-indicator {
    font-size: 0.875rem;
  }

  .spinner {
    width: 0.875rem;
    height: 0.875rem;
  }

  .lanes {
    gap: 0.5rem;
  }

  .lane {
    grid-template-columns: 1.5rem 1fr 4.375rem 1.75rem;
    gap: 0.375rem;
    padding: 0.25rem;
  }

  .lane-number {
    font-size: 0.75rem;
  }

  .track {
    height: 1.5rem;
  }

  .horse-marker {
    width: 1.5rem;
    height: 1.5rem;
    font-size: 0.875rem;
  }

  .horse-name {
    font-size: 0.75rem;
  }

  .finish-indicator {
    font-size: 1rem;
  }
}
</style>
