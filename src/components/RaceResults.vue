<script setup lang="ts">
import { computed } from 'vue'
import { useRaceStore } from '@/stores/race'
import { ICON_MEDAL_GOLD, ICON_MEDAL_SILVER, ICON_MEDAL_BRONZE } from '@/constants/icons'

const raceStore = useRaceStore()

const hasResults = computed(() => raceStore.raceResults.length > 0)

const getMedalIcon = (position: number) => {
  if (position === 1) return ICON_MEDAL_GOLD
  if (position === 2) return ICON_MEDAL_SILVER
  if (position === 3) return ICON_MEDAL_BRONZE
  return ''
}

const getPositionClass = (position: number) => {
  if (position === 1) return 'first'
  if (position === 2) return 'second'
  if (position === 3) return 'third'
  return ''
}

const formatTimestamp = (timestamp: Date) => {
  return new Date(timestamp).toLocaleTimeString()
}
</script>

<template>
  <div class="race-results">
    <h2 class="section-title">Race Results</h2>

    <div v-if="!hasResults" class="empty-state">
      <p>No results yet. Complete a race to see results!</p>
    </div>

    <div v-else class="results-grid">
      <div v-for="(result, index) in raceStore.raceResults" :key="index" class="result-card">
        <div class="result-header">
          <div class="result-title">
            <span class="round-badge">Round {{ index + 1 }}</span>
            <span class="distance">{{ result.distance }}m</span>
          </div>
          <div class="timestamp">{{ formatTimestamp(result.timestamp) }}</div>
        </div>

        <div class="rankings">
          <div
            v-for="ranking in result.rankings"
            :key="ranking.horseId"
            class="ranking-row"
            :class="getPositionClass(ranking.position)"
          >
            <div class="position">
              <span v-if="ranking.position <= 3" class="medal">
                {{ getMedalIcon(ranking.position) }}
              </span>
              <span v-else class="position-number">{{ ranking.position }}</span>
            </div>

            <div
              class="horse-color-indicator"
              :style="{ backgroundColor: raceStore.horses[ranking.horseId]?.color }"
            ></div>

            <div class="horse-details">
              <div class="horse-name">{{ raceStore.horses[ranking.horseId]?.name }}</div>
              <div class="horse-id">ID: {{ ranking.horseId }}</div>
            </div>

            <div class="finish-time">{{ ranking.finishTime }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/breakpoints' as *;
@use '@/assets/colors' as *;

.race-results {
  background: $card-background;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: $shadow-md;
  max-height: 37.5rem;
  overflow-y: auto;
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

.results-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.result-card {
  background-color: $color-background-soft;
  border-radius: 0.375rem;
  overflow: hidden;
  transition: all 200ms ease;
}

.result-card:hover {
  transform: translateX(0.25rem);
  box-shadow: $shadow-lg;
}

.result-header {
  background-color: $color-primary;
  color: white;
  padding: 0.75rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.round-badge {
  font-weight: 700;
  font-size: 1rem;
}

.distance {
  font-size: 0.875rem;
  opacity: 0.9;
}

.timestamp {
  font-size: 0.75rem;
  opacity: 0.9;
}

.rankings {
  padding: 0.75rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-gap: 0.5rem;
}

.ranking-row {
  display: grid;
  grid-template-columns: 2.5rem 1.25rem 1fr auto;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.75rem;
  background-color: $card-background;
  border-radius: 0.25rem;
  transition: all 200ms ease;
}

.ranking-row:hover {
  background-color: $card-hover-bg;
}

.ranking-row.first {
  background-color: $position-first-bg;
}

.ranking-row.second {
  background-color: $position-second-bg;
}

.ranking-row.third {
  background-color: $position-third-bg;
}

.position {
  text-align: center;
  font-weight: 700;
}

.medal {
  font-size: 1.25rem;
}

.position-number {
  color: $color-text-secondary;
  font-size: 1rem;
}

.horse-color-indicator {
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  box-shadow: $shadow-sm;
}

.horse-details {
  flex: 1;
  min-width: 0;
}

.horse-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: $color-text-primary;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.horse-id {
  font-size: 0.75rem;
  color: $color-text-secondary;
}

.finish-time {
  font-size: 0.875rem;
  font-weight: 600;
  color: $color-text-secondary;
  white-space: nowrap;
}

/* Large screens (desktop) - default layout above */

/* Medium screens (tablet) */
@include tablet {
  .race-results {
    padding: 1.25rem;
    max-height: 34.375rem;
  }

  .section-title {
    font-size: 1.375rem;
    margin-bottom: 1rem;
  }

  .results-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.875rem;
  }

  .result-card {
    max-width: 100%;
  }

  .result-header {
    padding: 0.625rem 0.875rem;
  }

  .round-badge {
    font-size: 0.9375rem;
  }

  .distance {
    font-size: 0.8125rem;
  }

  .rankings {
    padding: 0.625rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .ranking-row {
    grid-template-columns: 2.375rem 1.125rem 1fr auto;
    gap: 0.625rem;
    padding: 0.5625rem 0.625rem;
  }

  .horse-name {
    font-size: 0.8125rem;
  }

  .finish-time {
    font-size: 0.8125rem;
  }
}

/* Small screens (mobile) */
@include mobile {
  .race-results {
    padding: 1rem;
    max-height: 31.25rem;
  }

  .section-title {
    font-size: 1.25rem;
    margin-bottom: 1rem;
  }

  .empty-state {
    padding: 1.875rem 1rem;
    font-size: 0.875rem;
  }

  .results-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .result-header {
    padding: 0.625rem 0.75rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .result-title {
    gap: 0.375rem;
  }

  .round-badge {
    font-size: 0.875rem;
  }

  .distance {
    font-size: 0.75rem;
  }

  .timestamp {
    font-size: 0.6875rem;
  }

  .rankings {
    padding: 0.625rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .ranking-row {
    grid-template-columns: 2rem 0.875rem 1fr auto;
    gap: 0.5rem;
    padding: 0.5rem 0.625rem;
  }

  .medal {
    font-size: 1.125rem;
  }

  .position-number {
    font-size: 0.875rem;
  }

  .horse-color-indicator {
    width: 0.875rem;
    height: 0.875rem;
  }

  .horse-name {
    font-size: 0.75rem;
  }

  .horse-id {
    font-size: 0.6875rem;
  }

  .finish-time {
    font-size: 0.75rem;
  }
}
</style>
