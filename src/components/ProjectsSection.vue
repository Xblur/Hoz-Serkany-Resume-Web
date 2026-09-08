<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { resume } from '../data/resume'

function isInternalDemo(url: string) {
  return url.startsWith('/')
}
</script>

<template>
  <section
    id="projects"
    class="section-anchor border-b border-line"
    aria-labelledby="projects-heading"
  >
    <div class="page-container section-pad">
      <p class="section-label">Evidence by track</p>
      <h2 id="projects-heading" class="section-title">Production case studies</h2>
      <p class="mt-4 max-w-3xl text-base leading-relaxed text-muted">
        Recent delivery across secure product engineering and C++ systems, with
        the outcomes, verification, and operating context made explicit.
      </p>

      <ul class="mt-8 grid gap-5 lg:grid-cols-2">
        <li
          v-for="project in resume.projects"
          :key="project.name"
          class="card-soft flex flex-col p-5 sm:p-6"
        >
          <p class="section-label">{{ project.track }}</p>
          <div class="flex items-start justify-between gap-3">
            <h3 class="text-lg font-semibold leading-snug text-ink">
              {{ project.name }}
            </h3>
            <div
              v-if="project.demoUrl || project.url"
              class="flex shrink-0 flex-wrap items-center justify-end gap-3"
            >
              <RouterLink
                v-if="project.demoUrl && isInternalDemo(project.demoUrl)"
                :to="project.demoUrl"
                class="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white no-underline transition hover:bg-accent/90"
              >
                Live demo
                <span class="sr-only">: {{ project.name }}</span>
              </RouterLink>
              <a
                v-else-if="project.demoUrl"
                :href="project.demoUrl"
                class="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white no-underline transition hover:bg-accent/90"
                target="_blank"
                rel="noopener noreferrer"
              >
                Live demo
                <span class="sr-only"
                  >: {{ project.name }} (opens in a new tab)</span
                >
              </a>
              <a
                v-if="project.url"
                :href="project.url"
                class="text-sm font-medium text-accent no-underline hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
                <span class="sr-only"
                  >: {{ project.name }} (opens in a new tab)</span
                >
              </a>
            </div>
          </div>
          <p class="mt-2 text-sm font-semibold leading-relaxed text-accent sm:text-base">
            {{ project.outcome }}
          </p>
          <p class="mt-3 text-sm leading-relaxed text-slate sm:text-base">
            {{ project.description }}
          </p>
          <ul class="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate">
            <li v-for="highlight in project.highlights" :key="highlight">
              {{ highlight }}
            </li>
          </ul>
          <ul class="mt-4 flex flex-wrap gap-2" aria-label="Technologies used">
            <li
              v-for="tech in project.tech"
              :key="tech"
              class="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent"
            >
              {{ tech }}
            </li>
          </ul>
        </li>
      </ul>
    </div>
  </section>
</template>
