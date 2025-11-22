<template>
  <div class="animation-container">
    <!-- control panel -->
    <div class="control-panel">
      <button class="btn" @click="handlePauseStart">{{ isPaused ? 'Start' : 'Pause' }}</button>
      <button class="btn" @click="resetAnimation">Reset</button>
    </div>

    <!-- animation track -->
    <div ref="animationTrackDom" class="animation-track">
      <span
        ref="animatedBitDom"
        class="animated-bit"
        :style="{ left: `${animationState.progress}%` }"
        >O</span
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { ref } from 'vue'

const BASE_SPEED = 5 // distance per tick
const INTERVAL = 100
const PROGRESS_GOAL = 100

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let intervalId: any = null

const isPaused = ref(true)
const animationState = reactive({ progress: 0 })
const animatedBitDom = ref<HTMLElement | null>(null)
const animationTrackDom = ref<HTMLElement | null>(null)

const handlePauseStart = () => {
  isPaused.value ? handleStart() : handlePause()
}

const handleStart = () => {
  isPaused.value = false
  startAnimation()
}

const handlePause = () => {
  isPaused.value = true
  pauseAnimation()
}

const startAnimation = () => {
  intervalId = setInterval(() => {
    // Check if the NEXT move would go past the finish line

    const speedThisTick = calculateSpeed()
    if (animationState.progress + speedThisTick >= PROGRESS_GOAL) {
      // Stop exactly at the finish line
      animationState.progress = PROGRESS_GOAL
      clearInterval(intervalId)
      return
    }

    // Safe to move forward
    animationState.progress += speedThisTick
  }, INTERVAL)
}

const pauseAnimation = () => {
  clearInterval(intervalId)
}

const resetAnimation = () => {
  isPaused.value = true
  animationState.progress = 0
}

const calculateSpeed = () => {
  const variator = 0.8 + Math.random() * 0.4
  const multiplier = 1
  return BASE_SPEED * variator * multiplier
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
