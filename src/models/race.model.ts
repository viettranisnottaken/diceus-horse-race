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
