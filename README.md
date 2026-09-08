# Portfolio site: Hoz Serkany

Single-page portfolio for two focused engineering tracks:

- Full-Stack Product Engineering
- C++ / Systems Engineering

The first screen leads with measurable production outcomes. The case studies cover Languages of Life, MNPS, Sensofusion, and Ericsson. Separate PDF resumes are available for each track.

**Stack:** Vite + Vue 3 + TypeScript + Tailwind CSS

## Local development

```bash
npm install
npm run dev
```

Open the URL printed by Vite (usually `http://localhost:5173/Hoz-Serkany-Resume-Web/`).

## Production build

```bash
npm run build
npm run preview
```

## Content

Structured portfolio content lives in [`src/data/resume.ts`](src/data/resume.ts). Track resume PDFs live in [`public/`](public/).

Recruiter-facing GitHub profile materials are staged in [`github-profile/`](github-profile/):

- [`README.md`](github-profile/README.md): profile README draft
- [`PINNING_PLAN.md`](github-profile/PINNING_PLAN.md): repository readiness and pin order

## GitHub Pages

This project is configured for a repository named **`Hoz-Serkany-Resume-Web`**:

- Vite `base` is set to `/Hoz-Serkany-Resume-Web/` in [`vite.config.ts`](vite.config.ts)
- [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds on push to `main` and deploys `dist/` to GitHub Pages

### Enable Pages

1. Push this repo to GitHub as `Hoz-Serkany-Resume-Web`
2. In the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**
3. Push to `main` (or run the workflow manually)

Live URL (after deploy): `https://xblur.github.io/Hoz-Serkany-Resume-Web/`

If you rename the repository, update `base` in `vite.config.ts` to match (`/your-repo-name/`).
