<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { resume } from '../data/resume'

const menuOpen = ref(false)
const scrolled = ref(false)

function onScroll() {
  scrolled.value = window.scrollY > 8
}

function closeMenu() {
  menuOpen.value = false
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>

<template>
  <header
    class="sticky top-0 z-50 border-b transition-[background-color,box-shadow,border-color] duration-200"
    :class="
      scrolled
        ? 'border-line bg-surface/85 shadow-sm backdrop-blur-md'
        : 'border-line/60 bg-surface/75 backdrop-blur-md'
    "
  >
    <nav
      class="page-container flex items-center justify-between gap-4 py-3"
      aria-label="Primary"
    >
      <RouterLink
        :to="{ path: '/', hash: '#top' }"
        class="text-sm font-semibold tracking-tight text-ink no-underline hover:text-accent"
        @click="closeMenu"
      >
        {{ resume.name }}
      </RouterLink>

      <button
        type="button"
        class="inline-flex items-center rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-medium text-ink hover:border-accent hover:text-accent md:hidden"
        :aria-expanded="menuOpen"
        aria-controls="primary-nav"
        @click="menuOpen = !menuOpen"
      >
        {{ menuOpen ? 'Close' : 'Menu' }}
      </button>

      <ul
        id="primary-nav"
        class="absolute left-0 right-0 top-full flex-col gap-1 border-b border-line bg-surface/95 px-4 py-3 shadow-sm backdrop-blur-md md:static md:flex md:flex-row md:items-center md:gap-0.5 md:border-0 md:bg-transparent md:p-0 md:shadow-none"
        :class="menuOpen ? 'flex' : 'hidden md:flex'"
      >
        <li v-for="link in resume.nav" :key="link.id">
          <RouterLink
            :to="{ path: '/', hash: `#${link.id}` }"
            class="block rounded-md px-3 py-2 text-sm font-medium text-slate no-underline hover:bg-accent-soft hover:text-accent"
            @click="closeMenu"
          >
            {{ link.label }}
          </RouterLink>
        </li>
      </ul>
    </nav>
  </header>
</template>
