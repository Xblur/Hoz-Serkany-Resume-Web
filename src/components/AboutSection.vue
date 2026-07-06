<script setup lang="ts">
import { resume } from '../data/resume'
</script>

<template>
  <section
    id="about"
    class="section-anchor border-b border-line"
    aria-labelledby="about-heading"
  >
    <div class="page-container section-pad">
      <p class="section-label">Profile</p>
      <h2 id="about-heading" class="section-title">About</h2>
      <p class="mt-5 text-base leading-relaxed text-slate sm:text-lg">
        {{ resume.summary }}
      </p>
    </div>
  </section>
</template>
