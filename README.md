# Resume site — Hoz Serkany

Single-page resume site for a general Computer Engineer role.

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

All resume content lives in [`src/data/resume.ts`](src/data/resume.ts). Edit that file to update experience, projects, skills, and contact details without changing the UI components.

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
