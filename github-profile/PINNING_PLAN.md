# Recruiter-facing GitHub pinning plan

## Current public-profile gap

The profile currently has no bio, location, website, or pinned repositories. Recent MNPS, Şand, and company work is private, while the visible public repository list is weighted toward older coursework and forks.

## Pin order

1. **`frame-pipeline-cpp`**, C++ / Systems proof
   - Publish the existing purpose-built sample as a new public repository.
   - Before pinning, confirm the README includes architecture, build/test commands, benchmark guidance, and the no-proprietary-code statement.
   - Add one architecture diagram, a CI badge, and captured benchmark output from a named machine and build mode.

2. **`workflow-guard`**, Full-Stack Product proof
   - Publish the existing synthetic TypeScript/Postgres sample as a new public repository.
   - Before pinning, confirm one-command local setup, API and RLS tests, threat boundaries, and production limitations are explicit.
   - Add a workflow screenshot, a trust-boundary diagram, and a passing CI badge.

3. **`Hoz-Serkany-Resume-Web`**, recruiter landing page
   - Pin after the dual-track portfolio changes are deployed.
   - Update the repository description to: `Portfolio and production case studies for a Full-Stack Product + C++ Systems Engineer.`
   - Add a homepage screenshot, live-site link, stack summary, and local build instructions to the repository README.

Use three strong pins initially. Add a fourth only when it demonstrates a distinct capability with the same evidence quality. Do not pin private-product placeholders, forks, or coursework to fill all six slots.

## Profile setup

1. Create a public repository named **`Xblur`** under the `Xblur` account.
2. Copy the adjacent `README.md` draft into that repository as `README.md`.
3. Set the profile bio to: `Full-Stack Product + C++ Systems Engineer | Flutter, TypeScript, Postgres, C++17, embedded Linux`
4. Set location to `Ottawa, Ontario, Canada`.
5. Set website to `https://xblur.github.io/Hoz-Serkany-Resume-Web/`.
6. Pin the three repositories in the order above after their readiness checks pass.

## Keep off the recruiter surface

- `FaceForensics`, `word_prediction`, `390MiniProject`, `Elec-299-Final-Project`, `Updated-Automous-Robot-Code`, `qtutor`, and `wiki`: forks or older coursework
- `QMIND_Stroke_Prediction`, `COMP-365-Dijkstra-s-Algorithm`, and `CMPE-320-Project-Schindler-s-List-FaceInvader`: older academic work that does not support the current lead positioning
- Private MNPS, Şand, Languages of Life, Sensofusion, or Ericsson code: keep private unless a separately reviewed, sanitized artifact is created

## Readiness check

For every pinned repository, require:

- A recruiter-readable first screen stating the problem, engineering decisions, and result
- Reproducible build and test commands
- Passing CI on the default branch
- A concise architecture diagram or system map
- Screenshots or terminal evidence showing the artifact running
- Explicit test scope, tradeoffs, and known limitations
- No secrets, real customer data, proprietary code, or employer/client identifiers beyond approved public descriptions
