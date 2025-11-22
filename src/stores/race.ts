import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type {
  THorseList,
  THorseRankingPerRound,
  TRaceResult,
  TRacingHorse,
  TRoundProgress,
} from '@/models/race.model'
import {
  formatSecondsToMinutes,
  generateDistances,
  generateHorses,
  selectRandomHorseIds,
} from '@/utils/race'
import { BASE_SPEED, HORSES_COUNT_PER_ROUND, ROUNDS_COUNT } from '@/constants/race'

const INITIAL_ROUND_VALUE = -1

export const useRaceStore = defineStore('race', () => {
  // Store
  const raceDistances = ref<number[]>([])
  const horses = ref<THorseList>({})
  const roundProgress = ref<TRoundProgress>({})
  const racingHorseIds = computed(() => Object.keys(roundProgress.value).map((id) => parseInt(id)))
  const raceResults = ref<TRaceResult[]>([])
  const currentRoundIndex = ref<number>(INITIAL_ROUND_VALUE)
  const isPaused = ref(true)
  const finishedHorsesCount = ref(0)
  let roundStartTime = performance.now()
  let roundStartTimestamp = Date.now()
  let pausedTime = 0
  let pauseStartTime = 0

  const currentRoundDistance = computed(() => raceDistances.value[currentRoundIndex.value] ?? 0)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let raceIntervalId: any = null

  // Actions
  function startRacing() {
    generateSchedule()
    isPaused.value = false
    startNextRound()
  }

  function startNextRound() {
    currentRoundIndex.value++

    if (currentRoundIndex.value > ROUNDS_COUNT - 1) {
      endRace()
      return
    }

    roundStartTimestamp = Date.now()
    setRacingHorseForRound()
    roundStartTime = performance.now()
    race()
  }

  function race() {
    raceIntervalId = setInterval(() => {
      animateRace()
    }, 100)
  }

  function animateRace() {
    // loop 10 racing horses
    // calculate speed and distance this tick for each
    // set round progress
    // check if a horse has finished -> setRoundResult (also check for draw results)

    let tickFinishedCount = 0

    Object.entries(roundProgress.value).forEach(([horseIdStr, racingHorse]) => {
      const horseId = parseInt(horseIdStr)

      if (roundProgress.value[horseId]!.finished) {
        return
      }

      const condition = horses.value[horseId]!.condition
      const randomFactor = 0.7 + Math.random() * 0.6
      const distanceFactor = 1 - (racingHorse.distance - 1200) / 10000

      const speed = (BASE_SPEED + condition / 100) * randomFactor * distanceFactor

      // update distance traveled
      roundProgress.value[horseId]!.distance += speed

      if (roundProgress.value[horseId]!.distance > 100) {
        updateHorseRanking(horseId)
        tickFinishedCount += 1
      }
    })

    finishedHorsesCount.value += tickFinishedCount

    if (finishedHorsesCount.value === HORSES_COUNT_PER_ROUND) {
      clearIntervalId()
      setRoundResult()
      startNextRound()
    }
  }

  function updateHorseRanking(horseId: number) {
    const now = performance.now()
    const finishTime = now - roundStartTime - pausedTime
    const position = finishedHorsesCount.value + 1

    roundProgress.value[horseId]!.finished = true
    roundProgress.value[horseId]!.position = position
    roundProgress.value[horseId]!.finishTime = finishTime
  }

  function endRace() {
    clearIntervalId()
    isPaused.value = true
  }

  function setRoundResult() {
    const rankings: THorseRankingPerRound[] = []

    Object.values(roundProgress.value).forEach((racingHorse) => {
      const { horseId, position, finishTime } = racingHorse
      const horseRanking: THorseRankingPerRound = {
        horseId,
        position,
        finishTime: formatSecondsToMinutes(finishTime),
      }

      rankings.push(horseRanking)
    })

    rankings.sort((a, b) => a.position - b.position)

    raceResults.value.push({
      rankings,
      distance: currentRoundDistance.value,
      timestamp: new Date(roundStartTimestamp),
    })
  }

  function pauseRace() {
    isPaused.value = true
    pauseStartTime = performance.now()
    clearIntervalId()
  }

  function resumeRace() {
    isPaused.value = false

    if (pauseStartTime > 0) {
      pausedTime += performance.now() - pauseStartTime
      pauseStartTime = 0
    }

    race()
  }

  function resetRace() {
    resetStoreState()
  }

  function generateSchedule() {
    resetStoreState()

    horses.value = generateHorses()
    raceDistances.value = generateDistances()
  }

  function setRacingHorseForRound() {
    resetRoundState()
    const horseIds = selectRandomHorseIds(horses.value, HORSES_COUNT_PER_ROUND)
    roundProgress.value = horseIds
      .map(
        (horseId): TRacingHorse => ({
          horseId,
          finished: false,
          distance: 0,
          position: 0,
          finishTime: 0,
        }),
      )
      .reduce<TRoundProgress>((map, currHorse) => ({ ...map, [currHorse.horseId]: currHorse }), {})
  }

  function resetRoundState() {
    roundProgress.value = {}
    finishedHorsesCount.value = 0
    pausedTime = 0
    pauseStartTime = 0
    clearIntervalId()
  }

  function resetStoreState() {
    resetRoundState()
    currentRoundIndex.value = INITIAL_ROUND_VALUE
    raceResults.value = []
    isPaused.value = true
  }

  function clearIntervalId() {
    clearInterval(raceIntervalId)
    raceIntervalId = null
  }

  return {
    // State
    horses,
    roundProgress,
    raceResults,
    currentRoundIndex,
    isPaused,

    // Computed
    racingHorseIds,
    currentRoundDistance,

    // Actions
    startRacing,
    pauseRace,
    resumeRace,
    resetRace,
  }
})
