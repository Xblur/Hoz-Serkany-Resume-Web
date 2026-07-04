<script setup lang="ts">
import { resume } from '../data/resume'
</script>

<template>
  <section
    id="skills"
    class="section-anchor border-b border-line bg-surface"
    aria-labelledby="skills-heading"
  >
    <div class="page-container section-pad">
      <p class="section-label">Capabilities</p>
      <h2 id="skills-heading" class="section-title">Skills</h2>

      <dl class="mt-8 grid gap-5 sm:grid-cols-2">
        <div
          v-for="group in resume.skills"
          :key="group.category"
          class="card p-5"
        >
          <dt class="text-sm font-semibold uppercase tracking-wide text-accent">
            {{ group.category }}
          </dt>
          <dd class="mt-3">
            <ul class="flex flex-wrap gap-2">
              <li
                v-for="item in group.items"
                :key="item"
                class="rounded-md bg-canvas px-2.5 py-1 text-sm text-slate"
              >
                {{ item }}
              </li>
            </ul>
          </dd>
        </div>
      </dl>
    </div>
  </section>
</template>
