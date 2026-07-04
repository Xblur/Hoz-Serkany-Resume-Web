<script setup lang="ts">
import { resume } from '../data/resume'
</script>

<template>
  <footer
    id="contact"
    class="section-anchor bg-ink text-slate-300"
    aria-labelledby="contact-heading"
  >
    <div class="page-container section-pad">
      <p class="text-xs font-semibold uppercase tracking-wider text-blue-300">
        Get in touch
      </p>
      <h2
        id="contact-heading"
        class="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl"
      >
        Contact
      </h2>
      <p class="mt-3 max-w-xl text-base leading-relaxed text-slate-300">
        Based in {{ resume.contact.location }}. Reach out by email or connect on
        LinkedIn and GitHub.
      </p>

      <ul class="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-8">
        <li>
          <a
            :href="resume.resumePdf"
            class="text-base font-medium text-white no-underline hover:text-blue-300"
            download="Hoz-Serkany-Resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            Download resume (PDF)
          </a>
        </li>
        <li>
          <a
            :href="`mailto:${resume.contact.email}`"
            class="text-base font-medium text-white no-underline hover:text-blue-300"
          >
            {{ resume.contact.email }}
          </a>
        </li>
        <li>
          <a
            :href="resume.contact.linkedin"
            class="text-base font-medium text-white no-underline hover:text-blue-300"
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
            class="text-base font-medium text-white no-underline hover:text-blue-300"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
            <span class="sr-only"> (opens in a new tab)</span>
          </a>
        </li>
      </ul>

      <p class="mt-10 border-t border-slate-700 pt-6 text-sm text-slate-400">
        © {{ new Date().getFullYear() }} {{ resume.name }}
      </p>
    </div>
  </footer>
</template>
