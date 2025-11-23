<script setup lang="ts">
import ControlPanel from '@/components/ControlPanel.vue'
import HorseList from '@/components/HorseList.vue'
import RaceTrack from '@/components/RaceTrack.vue'
import RaceResults from '@/components/RaceResults.vue'
</script>

<template>
  <div class="app">
    <div class="container">
      <h1 class="title">Horse Race Simulator</h1>

      <ControlPanel />

      <div class="main-content">
        <HorseList />
        <RaceTrack />
        <RaceResults />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/breakpoints' as *;
@use '@/assets/colors' as *;

.app {
  min-height: 100vh;
  width: 100vw;
  background-color: $color-background;
  padding: 1.25rem;
}

.container {
  width: 100%;
  max-width: 100rem;
  margin: 0 auto;
}

.title {
  text-align: center;
  font-size: 2.5rem;
  font-weight: 700;
  color: $color-text-primary;
  margin-bottom: 1.875rem;
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin-top: 1.25rem;
}

/* Large screens (desktop) - default layout above */

/* Medium screens (tablet) */
@include tablet {
  .app {
    padding: 1rem;
  }

  .title {
    font-size: 2rem;
    margin-bottom: 1.5rem;
  }

  .main-content {
    gap: 1rem;
  }
}

/* Small screens (mobile) */
@include mobile {
  .app {
    padding: 0.75rem;
  }

  .title {
    font-size: 1.75rem;
    margin-bottom: 1.25rem;
  }

  .main-content {
    gap: 0.75rem;
    margin-top: 1rem;
  }
}
</style>
