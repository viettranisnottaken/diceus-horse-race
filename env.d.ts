/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TOTAL_HORSES_COUNT: string
  readonly VITE_HORSES_COUNT_PER_ROUND: string
  readonly VITE_ROUNDS_COUNT: string
  readonly VITE_BASE_SPEED: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
