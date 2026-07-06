<script setup lang="ts">
import ProfileStory from './ProfileStory.vue'
import { resume } from '../data/resume'
</script>

<template>
  <section
    id="top"
    class="section-anchor border-b border-line bg-surface"
    aria-labelledby="hero-heading"
  >
    <div class="page-container section-pad">
      <div
        class="flex flex-col items-center gap-8 sm:gap-10 md:flex-row md:items-center md:gap-12"
      >
        <div class="shrink-0">
          <ProfileStory
            :photo="resume.photo"
            :photo-alt="resume.photoAlt"
          />
        </div>

        <div class="min-w-0 flex-1 text-center md:text-left">
          <p class="section-label">{{ resume.contact.location }}</p>
          <h1
            id="hero-heading"
            class="mt-1 text-4xl font-semibold tracking-tight text-ink sm:text-5xl"
          >
            {{ resume.name }}
          </h1>
          <p class="mt-2 text-xl leading-snug text-slate sm:text-2xl">
            {{ resume.title }}
          </p>
          <p
            class="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg md:mx-0"
          >
            Computer engineering professional building full-stack web platforms,
            embedded Linux systems, and production software—hardware and
            software integrated end to end.
          </p>
          <ul
            class="mt-8 flex flex-wrap justify-center gap-3 md:justify-start"
            aria-label="Contact links"
          >
            <li>
              <a
                :href="resume.resumePdf"
                class="inline-flex items-center rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-white no-underline hover:bg-accent-hover"
                download="Hoz-Serkany-Resume.pdf"
                target="_blank"
                rel="noopener noreferrer"
              >
                Download resume
              </a>
            </li>
            <li>
              <a
                :href="`mailto:${resume.contact.email}`"
                class="inline-flex items-center rounded-md border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink no-underline hover:border-accent hover:text-accent"
              >
                Email
              </a>
            </li>
            <li>
              <a
                :href="resume.contact.linkedin"
                class="inline-flex items-center rounded-md border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink no-underline hover:border-accent hover:text-accent"
                target="_blank"
                rel="noopener noreferrer"
              >
                LinkedIn
                <span class="sr-only"> (opens in a new tab)</span>
              </a>
            </li>
            <li>
              <a
                :href="resume.contact.github"
                class="inline-flex items-center rounded-md border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink no-underline hover:border-accent hover:text-accent"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
                <span class="sr-only"> (opens in a new tab)</span>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>
