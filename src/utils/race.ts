import { TOTAL_HORSES_COUNT } from '@/constants/race'
import type { THorse, THorseList } from '@/models/race.model'

const HORSE_NAMES = [
  'Thunder',
  'Lightning',
  'Storm',
  'Blaze',
  'Shadow',
  'Spirit',
  'Maverick',
  'Phoenix',
  'Apollo',
  'Zeus',
  'Atlas',
  'Comet',
  'Flash',
  'Rocket',
  'Tornado',
  'Cyclone',
  'Tempest',
  'Fury',
  'Champion',
  'Victory',
]

const HORSE_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#FFA07A', // Light Salmon
  '#98D8C8', // Mint
  '#F7DC6F', // Yellow
  '#BB8FCE', // Purple
  '#85C1E2', // Sky Blue
  '#F8B739', // Orange
  '#52B788', // Green
  '#FF8FA3', // Pink
  '#6C5CE7', // Indigo
  '#FFB6B9', // Light Pink
  '#A8E6CF', // Light Green
  '#FFD93D', // Gold
  '#95E1D3', // Aqua
  '#F38181', // Coral
  '#AA96DA', // Lavender
  '#FCBAD3', // Light Rose
  '#74B9FF', // Light Blue
]

export function generateHorses(): THorseList {
  const horses: THorse[] = []

  for (let i = 0; i < TOTAL_HORSES_COUNT; i++) {
    horses.push({
      id: i + 1,
      name: HORSE_NAMES[i] || `Horse ${i + 1}`,
      color: HORSE_COLORS[i] || '#000000',
      condition: Math.floor(Math.random() * 100) + 1, // Random condition 1-100
    })
  }

  const mappedHorses = horses.reduce<THorseList>((map, currHorse) => {
    map[currHorse.id] = currHorse

    return map
  }, {})

  return mappedHorses
}

export function selectRandomHorseIds(horses: THorseList, count: number): number[] {
  const shuffled = Object.keys(horses)
    .map((id) => parseInt(id))
    .sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

export function generateDistances() {
  return [1200, 1400, 1600, 1800, 2000, 2200]
}

export function formatSecondsToMinutes(milliseconds: number): string {
  const totalSeconds = milliseconds / 1000
  const minutes = Math.floor(totalSeconds / 60)
  const remainingSeconds = totalSeconds % 60

  if (minutes > 0) {
    return `${minutes}:${remainingSeconds.toFixed(3).padStart(6, '0')}`
  }
  return `${remainingSeconds.toFixed(3)}s`
}
