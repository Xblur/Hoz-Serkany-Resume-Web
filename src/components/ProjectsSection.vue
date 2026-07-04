<script setup lang="ts">
import { resume } from '../data/resume'
</script>

<template>
  <section
    id="projects"
    class="section-anchor border-b border-line"
    aria-labelledby="projects-heading"
  >
    <div class="page-container section-pad">
      <p class="section-label">Selected work</p>
      <h2 id="projects-heading" class="section-title">Projects</h2>

      <ul class="mt-8 grid gap-5 sm:grid-cols-2">
        <li
          v-for="project in resume.projects"
          :key="project.name"
          class="card-soft flex flex-col p-5 sm:p-6"
        >
          <h3 class="text-lg font-semibold leading-snug text-ink">
            {{ project.name }}
          </h3>
          <p class="mt-2 flex-1 text-sm leading-relaxed text-slate sm:text-base">
            {{ project.description }}
          </p>
          <ul class="mt-4 flex flex-wrap gap-2" aria-label="Technologies used">
            <li
              v-for="tech in project.tech"
              :key="tech"
              class="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent"
            >
              {{ tech }}
            </li>
          </ul>
          <a
            v-if="project.url"
            :href="project.url"
            class="mt-4 inline-block text-sm font-medium text-accent no-underline hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
            <span class="sr-only"
              >: {{ project.name }} (opens in a new tab)</span
            >
          </a>
        </li>
      </ul>
    </div>
  </section>
</template>
