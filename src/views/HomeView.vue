<script setup lang="ts">
import { nextTick, ref, useTemplateRef } from 'vue'
import { RouterLink } from 'vue-router'
import SiteNav from '../components/SiteNav.vue'
import HeroSection from '../components/HeroSection.vue'
import AboutSection from '../components/AboutSection.vue'
import ExperienceSection from '../components/ExperienceSection.vue'
import ProjectsSection from '../components/ProjectsSection.vue'
import SkillsSection from '../components/SkillsSection.vue'
import EducationSection from '../components/EducationSection.vue'
import ContactSection from '../components/ContactSection.vue'
import SpaceDefenderGame from '../components/SpaceDefenderGame.vue'
import type { PortraitRect } from '../lib/spaceDefender/types'

const heroRef = useTemplateRef<InstanceType<typeof HeroSection>>('hero')
const gameOpen = ref(false)
const portraitEl = ref<HTMLImageElement | null>(null)
const triggerShipRect = ref<PortraitRect | null>(null)
const triggerReturnFocus = ref<HTMLElement | null>(null)

async function openSpaceDefender(payload: { triggerEl: HTMLElement; shipRect: PortraitRect }) {
  triggerReturnFocus.value = payload.triggerEl
  triggerShipRect.value = payload.shipRect
  portraitEl.value = heroRef.value?.portraitEl ?? null
  gameOpen.value = true
}

function closeSpaceDefender() {
  gameOpen.value = false
  nextTick(() => {
    triggerReturnFocus.value?.focus()
    triggerReturnFocus.value = null
  })
}
</script>

<template>
  <RouterLink
    :to="{ path: '/', hash: '#main' }"
    class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
  >
    Skip to main content
  </RouterLink>

  <SiteNav @open-space-defender="openSpaceDefender" />

  <main id="main">
    <HeroSection ref="hero" />
    <AboutSection />
    <ExperienceSection />
    <ProjectsSection />
    <SkillsSection />
    <EducationSection />
  </main>

  <ContactSection />

  <SpaceDefenderGame
    v-if="gameOpen"
    :portrait-el="portraitEl"
    :trigger-ship-rect="triggerShipRect"
    @close="closeSpaceDefender"
  />
</template>
