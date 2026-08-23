# Design QA — Homepage Option 1

## Evidence

- Source visual truth: `/home/linh/.codex/generated_images/01a02a36-948c-7441-836b-00883691821f/exec-7383b579-4317-4b53-8533-2fa9401f1f40.png`
- Normalized source: `.codex-audit/2026-08-23-option-1/source-option-1-1440x1024.png`
- Rendered implementation: `.codex-audit/2026-08-23-option-1/implementation-1440x1024-final-v2.png`
- Normalized implementation: `.codex-audit/2026-08-23-option-1/implementation-1440x1024-final-v2-normalized.png`
- Full-view comparison: `.codex-audit/2026-08-23-option-1/comparison-final-v2.png`
- Focused hero-copy comparison: `.codex-audit/2026-08-23-option-1/comparison-hero-copy-v2.png`
- Responsive capture: `.codex-audit/2026-08-23-option-1/implementation-mobile-390x844-final.png`
- Intended desktop viewport: 1440 × 1024 CSS px at device scale factor 1.
- Browser capture pixels: 1432 × 1018; normalized to 1440 × 1024 for equal-size visual comparison.
- Source pixels: 1488 × 1058; normalized to 1440 × 1024 with matching aspect ratio.
- State: homepage, light theme, logged out, no modal open.

## Findings

- No actionable P0, P1, or P2 differences remain.
- Fonts and typography: Inter 400–800 plus JetBrains Mono now matches the selected technical-editorial direction and supports Vietnamese correctly. Hero weight, wrapping, hierarchy, and CTA labels are consistent with the source.
- Spacing and layout rhythm: the desktop hero uses the selected 32/68 copy-to-product balance; the image and evidence band align within a few pixels after normalization. Tablet collapses below 900px and mobile becomes a single-column flow.
- Colors and visual tokens: white, Blueprint Navy, Cobalt `#2563EB`, and Electric Cyan `#06B6D4` match the selected direction without gradients, glow, or pill navigation.
- Image quality and asset fidelity: the implementation uses the original Revit 2025 screenshots directly. No placeholder, CSS drawing, or recreated product interface is used.
- Copy and content: selected headline, product description, trial CTA, workflow CTA, and technical evidence are present and readable.
- P3 accepted difference: the implementation keeps the official BIMAutomation logo mark next to the wordmark, while the generated concept showed a simplified wordmark. Keeping the official asset improves brand correctness.

## Comparison History

1. Pass 1 found a visible support dock over the selected layout, an overly cyan primary color, and vertical drift in the evidence band. The homepage dock was removed, Cobalt/Electric Cyan roles were separated, and section alignment was corrected.
2. Pass 2 found the hero approximately 20px too tall and the technical facts too low. Hero height and evidence padding were corrected.
3. Pass 3 found moderate font and horizontal-grid drift. The UI font was changed to Inter, the hero image start was moved left, and the evidence grid gap was tightened.
4. Final comparison found no actionable P0/P1/P2 differences. The focused crop confirms heading, body copy, and CTA hierarchy are equivalent in intent and density.

## Interaction And Runtime Checks

- Mobile menu opens and closes with keyboard-accessible controls.
- Primary `Dùng thử 14 ngày` CTA routes unauthenticated users to `/login` while preserving the pending download intent.
- `Xem workflow thực tế` opens the consultation dialog and the close control works.
- FAQ rows expand correctly.
- Browser logs were reviewed. Vite connects normally. The recurring message-channel error has no application stack and is produced by the browser/extension environment; no React runtime error or failed application interaction was observed.
- Production build passed.
- Test suite passed: 51/51.

## Follow-up Polish

- P3: a future pass could tune the lower-page vertical whitespace independently; it is outside the selected 1440 × 1024 visual target and does not block this handoff.

final result: passed
