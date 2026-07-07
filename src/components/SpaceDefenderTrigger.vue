<script setup lang="ts">
import type { PortraitRect } from '../lib/spaceDefender/types'

const emit = defineEmits<{
  open: [payload: { triggerEl: HTMLElement; shipRect: PortraitRect }]
}>()

function handleClick(event: MouseEvent) {
  const btn = event.currentTarget as HTMLElement
  const ship = btn.querySelector<SVGElement>('.sd-trigger__ship')
  const r = (ship ?? btn).getBoundingClientRect()
  emit('open', {
    triggerEl: btn,
    shipRect: {
      left: r.left,
      top: r.top,
      width: r.width,
      height: r.height,
    },
  })
}
</script>

<template>
  <button
    type="button"
    class="sd-trigger group"
    aria-label="Play Space Defender (easter egg)"
    title="Space Defender"
    @click="handleClick"
  >
    <svg
      class="sd-trigger__ship"
      viewBox="0 0 32 32"
      width="28"
      height="28"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="sd-engine-glow"
          x1="0%"
          y1="0%"
          x2="0%"
          y2="100%"
        >
          <stop offset="0%" stop-color="#38bdf8" stop-opacity="0" />
          <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.9" />
        </linearGradient>
      </defs>
      <path
        d="M16 4 L24 22 L16 18 L8 22 Z"
        fill="currentColor"
        class="text-ink group-hover:text-accent"
      />
      <path
        d="M13 20 L16 28 L19 20 Z"
        fill="url(#sd-engine-glow)"
        class="sd-trigger__flame"
      />
    </svg>
    <span
      class="sd-trigger__glow"
      aria-hidden="true"
    />
    <span class="sr-only">Launch Space Defender mini-game</span>
  </button>
</template>
