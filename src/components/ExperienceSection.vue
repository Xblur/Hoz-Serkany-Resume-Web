<script setup lang="ts">
import { resume } from '../data/resume'
</script>

<template>
  <section
    id="experience"
    class="section-anchor border-b border-line bg-surface"
    aria-labelledby="experience-heading"
  >
    <div class="page-container section-pad">
      <p class="section-label">Career</p>
      <h2 id="experience-heading" class="section-title">Experience</h2>

      <ol class="mt-8 space-y-5">
        <li
          v-for="role in resume.experience"
          :key="`${role.company}-${role.title}`"
          class="card flex overflow-hidden"
        >
          <div class="w-1 shrink-0 bg-accent" aria-hidden="true" />
          <div class="min-w-0 flex-1 p-5 sm:p-6">
            <div
              class="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
            >
              <h3 class="text-lg font-semibold leading-snug text-ink sm:text-xl">
                {{ role.title }}
              </h3>
              <p class="shrink-0 text-sm font-medium text-muted">
                {{ role.period }}
              </p>
            </div>
            <p class="mt-1 text-base font-medium text-accent">
              {{ role.company }}
            </p>
            <ul
              class="mt-4 list-disc space-y-2.5 pl-5 text-base leading-relaxed text-slate"
            >
              <li v-for="(bullet, index) in role.bullets" :key="index">
                {{ bullet }}
              </li>
            </ul>
          </div>
        </li>
      </ol>
    </div>
  </section>
</template>
