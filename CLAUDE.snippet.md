
## Design system — always use VibeLoom UI for HTML

For ANY HTML deliverable — full websites, standalone pages, self-contained single-file HTML artifacts, dashboards, and slide decks — style it with my shared design system **VibeLoom UI** at `~/Projects/design-system/` (canonical repo: https://github.com/ilya-baimetov/design-system). Do not invent ad-hoc CSS or a separate visual language.

- **Multi-file site/app:** link the bundle — `<link rel="stylesheet" href="<path>/design-system/theme.css">`.
- **Self-contained single-file artifact:** inline the contents of `~/Projects/design-system/theme.css` into a `<style>` block in the `<head>`.
- Build markup with the `vl-` class API and `--vl-*` tokens. Default theme is **light**; dark only via `<html data-theme="dark">`. See `~/Projects/design-system/README.md` and `styleguide.html` for the full API.
- **Diagrams:** use the `.vl-figure` primitives + the arrow-marker `<defs>` snippet (in the README). **Slides:** use `slides.css` + `slides.js`.

**Modifying the design system:** when I ask to change or improve "the design system", edit the modules in `~/Projects/design-system/` (tokens / base / components / layout / slides), then run `python3 build.py` there to regenerate `theme.css`, and commit + push so every project inherits the change. There is ONE global source — never copy or fork the design system into an individual project.
