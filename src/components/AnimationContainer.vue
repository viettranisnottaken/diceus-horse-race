<template>
  <div class="animation-container">
    <!-- control panel -->
    <div class="control-panel">
      <button class="btn" @click="handlePauseStart">{{ isPaused ? 'Start' : 'Pause' }}</button>
      <button class="btn" @click="resetRace">Reset</button>
    </div>

    <div>Round: {{ currentRoundLabel || '' }}</div>

    <!-- animation track -->
    <div v-for="id in racingHorsesIds" :key="id" ref="animationTrackDom" class="animation-track">
      <span
        ref="animatedBitDom"
        class="animated-bit"
        :style="{ left: `${roundProgress[id]?.distance}%` }"
        >O</span
      >
    </div>

    <div>{{ raceResults }}</div>
  </div>
</template>

<script setup lang="ts">
import { useRaceStore } from '@/stores/race'
import { watch } from 'vue'
import { computed } from 'vue'

const store = useRaceStore()

const isPaused = computed(() => store.isPaused)
const racingHorsesIds = computed(() => store.racingHorseIds)
const roundProgress = computed(() => store.roundProgress)
const currentRoundLabel = computed(() => store.currentRoundIndex + 1)
const raceResults = computed(() => store.raceResults)

watch(raceResults, (val) => {
  console.log('race results', val)
})

const handlePauseStart = () => {
  isPaused.value ? (store.currentRoundIndex >= 0 ? handleResume() : handleStart()) : handlePause()
}

const handleStart = () => {
  store.startRacing()
}

const handlePause = () => {
  store.pauseRace()
}

const handleResume = () => {
  store.resumeRace()
}

const resetRace = () => {
  store.resetRace()
}
</script>

<style lang="css" scoped>
.animation-container {
  border: 1px solid black;
  padding: 16px;
}

.animation-track {
  border: 1px solid red;
  position: relative;
  display: block;
  width: 600px;
  margin-bottom: 32px;
}

.animated-bit {
  transition: left 0.1s linear;
  position: absolute;
  /*left: 0;*/
}

.btn {
  padding: 10px;
}
</style>
