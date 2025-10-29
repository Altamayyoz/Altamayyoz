# TESTING.md

Manual acceptance checklist

- Start dev server: `npm run dev` and open http://localhost:5173
- On Login/Register, use the moon/sun button to toggle dark mode (persists)
- Login using any username from `src/data/users.json` (e.g., `admin`, `alex.t`, `fiona.l`) and password `password`, or select a role from the role selector
- Technician dashboard: click "Quick Task Entry" to open wizard, fill minimal fields and Save draft/Submit (mock)
- Supervisor dashboard: pending approvals counter should show submitted tasks (generated mock)
- Planning Engineer dashboard: shows priority queue sorted by lowest progress
- Production Manager dashboard: shows summary KPIs and throughput bars
 - Admin dashboard: shows system overview and quick actions
- Job Orders: visible list with progress bars
- Notifications: bell shows badge (mock)
- Keyboard shortcuts: Ctrl+S and Ctrl+Enter are wired in the wizard (basic) to save/submit

Automated tests

- Run `npm test` to execute Vitest + RTL tests (core components)

Code changes

- localStorage.clear()
- location.reload()
