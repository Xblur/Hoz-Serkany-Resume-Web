<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  fetchTopScores,
  isLeaderboardAvailable,
  type LeaderboardEntry,
} from '../lib/spaceDefender/leaderboard'

const props = defineProps<{
  open?: boolean
  embedded?: boolean
  playerName?: string
  playerScore?: number
  highlightName?: string
}>()

const emit = defineEmits<{
  close: []
}>()

const scores = ref<LeaderboardEntry[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const available = isLeaderboardAvailable()

const caption = computed(() =>
  available ? 'Top 10 defenders' : 'Leaderboard unavailable',
)

async function loadScores() {
  if (!available) return
  loading.value = true
  error.value = null
  const result = await fetchTopScores(10)
  scores.value = result.scores
  error.value = result.error ?? null
  loading.value = false
}

function isHighlighted(entry: LeaderboardEntry): boolean {
  if (!props.highlightName) return false
  return (
    entry.player_name === props.highlightName &&
    (props.playerScore === undefined || entry.score === props.playerScore)
  )
}

onMounted(() => {
  if (props.embedded || props.open) void loadScores()
})

watch(
  () => props.open,
  (isOpen) => {
    if (!props.embedded && isOpen) void loadScores()
  },
)

defineExpose({ refresh: loadScores })
</script>

<template>
  <component
    :is="embedded ? 'div' : 'aside'"
    class="sd-leaderboard"
    :class="{
      'sd-leaderboard--open': !embedded && open,
      'sd-leaderboard--embedded': embedded,
    }"
    aria-label="Space Defender leaderboard"
  >
    <div class="sd-leaderboard__header">
      <h2 class="sd-leaderboard__title">
        {{ embedded ? 'Top 10 Leaderboard' : 'Leaderboard' }}
      </h2>
      <button
        v-if="!embedded"
        type="button"
        class="sd-leaderboard__close"
        aria-label="Close leaderboard"
        @click="emit('close')"
      >
        ✕
      </button>
    </div>

    <p
      v-if="!available"
      class="sd-leaderboard__unavailable"
    >
      Leaderboard unavailable. Configure Supabase to enable global scores.
    </p>

    <p
      v-else-if="loading"
      class="sd-leaderboard__status"
    >
      Loading…
    </p>

    <p
      v-else-if="error"
      class="sd-leaderboard__status"
    >
      {{ error }}
    </p>

    <div
      v-else
      class="sd-leaderboard__table-wrap"
    >
      <table class="sd-leaderboard__table">
        <caption class="sr-only">
          {{ caption }}
        </caption>
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Name</th>
            <th scope="col">Score</th>
            <th scope="col">Wave</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-if="scores.length === 0"
          >
            <td
              colspan="4"
              class="sd-leaderboard__empty"
            >
              No scores yet. Be the first!
            </td>
          </tr>
          <tr
            v-for="entry in scores"
            :key="entry.id"
            :class="{ 'sd-leaderboard__row--highlight': isHighlighted(entry) }"
          >
            <td>{{ entry.rank }}</td>
            <td>{{ entry.player_name }}</td>
            <td>{{ entry.score.toLocaleString() }}</td>
            <td>{{ entry.wave }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </component>
</template>
