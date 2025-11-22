# Horse Race Simulator Specs

## Estimations
- Specs breakdown: 1h
- Draft out animation: 1h
- Init store: 2h
- UI: 3h
- Unit test: 4h - 6h

## Requirements
- Generate 20 random horses with unique colors and condition scores (1-100)
- 6 rounds, 10 randomly selected horses per round
- Progressive distances (each round gets longer)
- Horse speed affected by condition score
- Horse speed varies during race
- Start, pause/resume, reset controls
- Display all results from all completed rounds

## Models

```ts
export type THorse = {
  id: number
  name: string
  color: string
  condition: number
}

export type THorseList = Record<number, THorse>

export type TRacingHorse = {
  horseId: number
  distance: number
  position: number
  finished: boolean
  finishTime: number
}

export type TRoundProgress = Record<number, TRacingHorse>

export type THorseRankingPerRound = {
  horseId: number
  position: number
  finishTime: string
}

export type TRaceResult = {
  rankings: THorseRankingPerRound[]
  distance: number
  timestamp: Date
}
```

## Tech Implementation

### Components
- `ControlPanel` - Race controls and statistics
- `HorseList` - Display all horses with condition
- `RaceTrack` - Live race animation with progress bars
- `RaceResults` - Round results and rankings

### State (Pinia Store)

**Reactive State:**
- `horses: THorseList` - All 20 horses keyed by ID
- `roundProgress: TRoundProgress` - Current round racing data keyed by horse ID (distance, position, finishTime, finished status)
- `raceResults: TRaceResult[]` - Historical results from all completed rounds
- `raceDistances: number[]` - Pre-generated distances for all 6 rounds
- `currentRoundIndex: number` - Current round index (-1 before start, 0-5 during race)
- `isPaused: boolean` - Pause state
- `finishedHorsesCount: number` - Count of finished horses in current round

**Timing Variables (non-reactive):**
- `roundStartTime` - High-precision start time using `performance.now()`
- `pausedTime` - Accumulated paused duration across pause/resume cycles
- `pauseStartTime` - When current pause started
- `raceIntervalId` - setInterval reference for animation

**Computed:**
- `racingHorseIds` - Array of horse IDs currently racing
- `currentRoundDistance` - Distance for current round

**Actions:**
- `startRacing()` - Generate schedule, start first round
- `pauseRace()` - Pause animation, record pause start time
- `resumeRace()` - Resume animation, accumulate paused time
- `resetRace()` - Clear all state and stop animation

**Internal Functions:**
- `startNextRound()` - Advance round, select 10 random horses, start animation
- `animateRace()` - 100ms tick: calculate speed, update progress, check finishes
- `updateHorseRanking()` - Record position and finish time when horse completes
- `setRoundResult()` - Save rankings when all horses finish
- `endRace()` - Stop animation after 6 rounds complete

### Race Logic
- Speed calculation: `(BASE_SPEED + condition/100) * randomFactor * distanceFactor`
- Animation: 100ms intervals using `setInterval`
- Timing: `performance.now()` for precise pause/resume
- Progress tracking: Distance as percentage (0-100)
