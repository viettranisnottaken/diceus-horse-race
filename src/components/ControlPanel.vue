<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRaceStore } from '@/stores/race'
import { TOTAL_HORSES_COUNT, ROUNDS_COUNT } from '@/constants/race'

const store = useRaceStore()
const showResetConfirm = ref(false)
const currentRoundNumber = computed(() => store.currentRoundIndex + 1)
const hasStarted = computed(() => store.currentRoundIndex >= 0)
const isFinished = computed(() => store.currentRoundIndex >= ROUNDS_COUNT)
const raceStatus = computed(() => {
  if (isFinished.value) return 'Completed'
  if (!hasStarted.value) return 'Not Started'
  if (store.isPaused) return 'Paused'
  return 'Racing'
})

const handleReset = () => {
  showResetConfirm.value = true
}

const confirmReset = () => {
  store.resetRace()
  showResetConfirm.value = false
}

const cancelReset = () => {
  showResetConfirm.value = false
}
</script>

<template>
  <div class="control-panel">
    <div class="controls">
      <button class="btn btn-primary" :disabled="hasStarted" @click="store.startRacing()">
        Start Racing
      </button>

      <button
        v-if="hasStarted && !isFinished"
        class="btn btn-warning"
        @click="store.isPaused ? store.resumeRace() : store.pauseRace()"
      >
        {{ store.isPaused ? 'Resume' : 'Pause' }}
      </button>

      <button class="btn btn-danger" @click="handleReset">Reset</button>
    </div>

    <div class="info-cards">
      <div class="info-card">
        <div class="info-label">Total Horses</div>
        <div class="info-value">{{ TOTAL_HORSES_COUNT }}</div>
      </div>

      <div class="info-card">
        <div class="info-label">Current Round</div>
        <div class="info-value">
          {{
            hasStarted && currentRoundNumber !== 0 && currentRoundNumber !== 7
              ? currentRoundNumber
              : '-'
          }}
        </div>
      </div>

      <div class="info-card">
        <div class="info-label">Total Rounds</div>
        <div class="info-value">{{ ROUNDS_COUNT }}</div>
      </div>

      <div class="info-card">
        <div class="info-label">Status</div>
        <div class="info-value" :class="`status-${raceStatus.toLowerCase()}`">
          {{ raceStatus }}
        </div>
      </div>
    </div>

    <!-- Reset Confirmation Dialog -->
    <div v-if="showResetConfirm" class="modal-overlay" @click="cancelReset">
      <div class="modal" @click.stop>
        <h3 class="modal-title">Confirm Reset</h3>
        <p class="modal-text">
          Are you sure you want to reset the race? All progress will be lost.
        </p>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="cancelReset">Cancel</button>
          <button class="btn btn-danger" @click="confirmReset">Reset</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/breakpoints' as *;
@use '@/assets/colors' as *;

.control-panel {
  background: $card-background;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: $shadow-md;
}

.controls {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 200ms ease;
  color: white;
}

.btn:hover:not(:disabled) {
  transform: translateY(-0.125rem);
  box-shadow: $shadow-xl;
}

.btn:active:not(:disabled) {
  transform: translateY(0);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background-color: $color-primary;
}

.btn-primary:hover:not(:disabled) {
  background-color: $color-primary-hover;
}

.btn-warning {
  background-color: $color-warning;
}

.btn-warning:hover:not(:disabled) {
  background-color: $color-warning-hover;
}

.btn-danger {
  background-color: $color-danger;
}

.btn-danger:hover:not(:disabled) {
  background-color: $color-danger-hover;
}

.btn-secondary {
  background-color: $color-secondary;
}

.btn-secondary:hover {
  background-color: $color-secondary-hover;
}

.info-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(9.375rem, 1fr));
  gap: 1rem;
}

.info-card {
  background-color: $color-background-soft;
  padding: 1rem;
  border-radius: 0.375rem;
  text-align: center;
}

.info-label {
  font-size: 0.875rem;
  color: $color-text-secondary;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.info-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: $color-text-primary;
}

.status-completed {
  color: $status-completed;
}

.status-racing {
  color: $status-racing;
}

.status-paused {
  color: $status-paused;
}

.status-not {
  color: $status-not-started;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: $card-background;
  padding: 1.5rem;
  border-radius: 0.5rem;
  max-width: 25rem;
  width: 90%;
  box-shadow: $shadow-2xl;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: $color-text-primary;
  margin-bottom: 0.75rem;
}

.modal-text {
  color: $color-text-secondary;
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

/* Large screens (desktop) - default layout above */

/* Medium screens (tablet) */
@include tablet {
  .control-panel {
    padding: 1.25rem;
  }

  .controls {
    gap: 0.625rem;
  }

  .btn {
    padding: 0.625rem 1.25rem;
    font-size: 0.9375rem;
  }

  .info-cards {
    grid-template-columns: repeat(4, 1fr);
    gap: 0.75rem;
  }

  .info-card {
    padding: 0.875rem;
  }

  .info-value {
    font-size: 1.375rem;
  }
}

/* Small screens (mobile) */
@include mobile {
  .control-panel {
    padding: 1rem;
  }

  .controls {
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1.25rem;
  }

  .btn {
    width: 100%;
    padding: 0.75rem 1.25rem;
    font-size: 0.875rem;
  }

  .info-cards {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.625rem;
  }

  .info-card {
    padding: 0.5rem;
  }

  .info-label {
    font-size: 0.75rem;
    margin-bottom: 0.25rem;
  }

  .info-value {
    font-size: 1.125rem;
  }

  .modal {
    padding: 1.25rem;
    width: 95%;
  }

  .modal-title {
    font-size: 1.125rem;
  }

  .modal-text {
    font-size: 0.875rem;
  }

  .modal-actions {
    flex-direction: column;
  }

  .modal-actions .btn {
    width: 100%;
  }
}
</style>
