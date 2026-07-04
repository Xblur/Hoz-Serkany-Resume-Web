<script setup lang="ts">
import { resume } from '../data/resume'

const { education } = resume
</script>

<template>
  <section
    id="education"
    class="section-anchor border-b border-line"
    aria-labelledby="education-heading"
  >
    <div class="page-container section-pad">
      <p class="section-label">Background</p>
      <h2 id="education-heading" class="section-title">Education</h2>

      <article class="card mt-8 p-5 sm:p-6">
        <div
          class="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
        >
          <h3 class="text-lg font-semibold leading-snug text-ink sm:text-xl">
            {{ education.degree }}
          </h3>
          <p class="shrink-0 text-sm font-medium text-muted">
            {{ education.period }}
          </p>
        </div>
        <p class="mt-1 text-base font-medium text-accent">
          {{ education.program }}
        </p>
        <p class="mt-1 text-base text-slate">{{ education.school }}</p>

        <h4
          class="mt-6 text-sm font-semibold uppercase tracking-wide text-muted"
        >
          Relevant coursework
        </h4>
        <ul class="mt-3 flex flex-wrap gap-2">
          <li
            v-for="course in education.courses"
            :key="course"
            class="rounded-md bg-canvas px-2.5 py-1 text-sm text-slate"
          >
            {{ course }}
          </li>
        </ul>
      </article>

      <div class="mt-5 grid gap-5 sm:grid-cols-2">
        <article class="card p-5">
          <h3 class="text-base font-semibold text-ink">Award</h3>
          <p class="mt-2 text-sm leading-relaxed text-slate sm:text-base">
            {{ education.award }}
          </p>
        </article>

        <article class="card p-5">
          <h3 class="text-base font-semibold text-ink">Publication</h3>
          <p class="mt-2 text-sm font-medium text-ink sm:text-base">
            {{ education.publication.title }}
          </p>
          <p class="mt-1 text-sm text-muted">
            {{ education.publication.publisher }} ·
            {{ education.publication.date }}
          </p>
          <p class="mt-2 text-sm leading-relaxed text-slate">
            {{ education.publication.summary }}
          </p>
          <a
            :href="education.publication.url"
            class="mt-3 inline-block text-sm font-medium text-accent no-underline hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read publication
            <span class="sr-only"
              >: {{ education.publication.title }} (PDF, opens in a new
              tab)</span
            >
          </a>
        </article>
      </div>

      <article class="card mt-5 p-5 sm:p-6">
        <h3 class="text-base font-semibold text-ink">Volunteer</h3>
        <div
          class="mt-2 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
        >
          <p class="font-medium text-accent">
            {{ education.volunteer.org }} — {{ education.volunteer.role }}
          </p>
          <p class="shrink-0 text-sm font-medium text-muted">
            {{ education.volunteer.period }}
          </p>
        </div>
        <p class="mt-2 text-sm leading-relaxed text-slate sm:text-base">
          {{ education.volunteer.description }}
        </p>
        <ul class="mt-3 flex flex-wrap gap-2" aria-label="Technologies used">
          <li
            v-for="tech in education.volunteer.tech"
            :key="tech"
            class="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent"
          >
            {{ tech }}
          </li>
        </ul>
      </article>
    </div>
  </section>
</template>
