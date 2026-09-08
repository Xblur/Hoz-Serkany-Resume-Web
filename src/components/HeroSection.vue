<script setup lang="ts">
import { ref } from 'vue'
import ProfileStory from './ProfileStory.vue'
import { resume } from '../data/resume'

const profileStoryRef = ref<InstanceType<typeof ProfileStory> | null>(null)

defineExpose({
  get portraitEl() {
    return profileStoryRef.value?.portraitEl ?? null
  },
})
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
            ref="profileStoryRef"
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
            class="mx-auto mt-5 text-base leading-relaxed text-muted sm:text-lg md:mx-0"
          >
            I build secure product platforms and reliable C++ systems, then carry
            them through automated verification, deployment, and operational
            handoff.
          </p>
          <ul
            class="mt-5 flex flex-wrap justify-center gap-2 md:justify-start"
            aria-label="Engineering tracks"
          >
            <li class="rounded-full bg-accent-soft px-3 py-1 text-sm font-medium text-accent">
              Full-Stack Product
            </li>
            <li class="rounded-full bg-accent-soft px-3 py-1 text-sm font-medium text-accent">
              C++ / Systems
            </li>
          </ul>
          <ul
            class="mt-7 flex flex-wrap justify-center gap-3 md:justify-start"
            aria-label="Resume and contact links"
          >
            <li v-for="trackResume in resume.resumes" :key="trackResume.href">
              <a
                :href="trackResume.href"
                class="inline-flex items-center rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-white no-underline hover:bg-accent-hover"
                :download="trackResume.downloadName"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ trackResume.shortLabel }}
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

      <dl class="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div
          v-for="outcome in resume.outcomes"
          :key="outcome.label"
          class="card p-4"
        >
          <dt>
            <span class="block text-2xl font-semibold tracking-tight text-ink">
              {{ outcome.value }}
            </span>
            <span class="text-sm font-semibold text-accent">{{ outcome.label }}</span>
          </dt>
          <dd class="mt-2 text-sm leading-relaxed text-muted">
            {{ outcome.detail }}
          </dd>
        </div>
      </dl>
    </div>
  </section>
</template>
