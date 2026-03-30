# Temp Mail Admin UI/UX Specification

## Document Status

- Project: `temp-mail`
- Scope: Admin inbox frontend planning based on the current Worker + D1 backend
- Purpose: Define the UI, interaction model, edge states, and implementation boundaries before building the frontend
- Audience: Product, frontend implementation, future refactor work

---

## 1. Why this document exists

The backend is already capable of:

- storing inbound emails
- listing emails with pagination
- filtering by `to_address`
- filtering by unread status
- returning email detail
- marking read/unread
- deleting email

What is still missing is the operator-facing admin UI.

This document exists to prevent the common failure mode of “API-first tools with random UI glued on later”. The frontend should feel operational, fast, and obvious under real usage:

- browsing many inbox addresses
- scanning subject lines quickly
- opening details without losing list context
- switching between unread triage and targeted address lookups
- deleting junk with low cognitive overhead

The product goal is not “beautiful SaaS dashboard”. The goal is **high-speed private inbox operations**.

---

## 2. Product goal

Build a lightweight admin panel for one operator to manage a catch-all mailbox.

Primary jobs:

1. See the newest emails fast
2. Filter to a specific receiving address fast
3. Triage unread messages fast
4. Open a message without losing inbox position
5. Delete noise safely
6. Read HTML/text content clearly

The UI should optimize for:

- speed over decoration
- low click count
- strong information hierarchy
- stable layout
- desktop-first operation

---

## 3. Users and usage model

### Primary user

A single technical operator managing their own temporary/catch-all mailbox.

### Expected behavior

The operator will often:

- generate or use multiple ad hoc addresses
- scan recent mail in bursts
- care about recipient address as much as sender/subject
- need to distinguish signal from junk quickly
- prefer keyboard-friendly, low-friction operations

### Non-goals

This is not intended to be:

- a public mailbox product
- a collaborative multi-user app
- a mobile-first app
- a full email client with reply/compose/threading
- a rich attachment viewer

---

## 4. UX principles

### 4.1 Speed first

The user should be able to move from “open app” to “read relevant email” in a few seconds.

### 4.2 Recipient-centric browsing

Unlike normal inboxes, recipient address is a first-class dimension. The UI must not bury it.

### 4.3 Master-detail without context loss

The inbox list should remain visible while viewing email detail on desktop.

### 4.4 Readability over brand flair

Email content is messy by nature. The UI should reduce noise, not add more.

### 4.5 Destructive actions must be obvious but calm

Delete should be easy, but never ambiguous.

### 4.6 Good defaults, fewer settings

No settings page in the first usable version unless absolutely necessary.

---

## 5. Recommended app structure

## 5.1 Information architecture

Use a 3-zone desktop layout:

1. **Top bar**
   - app name
   - auth status / API endpoint hint if needed
   - refresh action
2. **Left column: inbox list + filters**
   - search/filter controls
   - mail list
   - pagination or load-more controls
3. **Right panel: email detail**
   - selected message header
   - actions
   - content tabs or segmented switch

This should behave like a compact operations console, not a marketing site.

---

## 6. Core screens

## 6.1 Inbox view (default)

### Purpose

The main working screen.

### Layout

**Top bar**
- product name: `Temp Mail`
- optional environment badge: `local`, `staging`, `prod`
- refresh button
- optional auto-refresh toggle (future, not required in first pass)

**Filter row**
- `Recipient address` input
- `Unread only` toggle
- `Apply` button
- `Clear` button

**List panel**
Each row should show:
- unread indicator
- subject
- sender
- recipient address
- received time

Rows should support:
- click to open detail
- selected state
- unread visual emphasis
- hover affordance

**Detail panel**
When a row is selected, show:
- subject
- sender
- recipient address
- received timestamp
- actions: `Mark read/unread`, `Delete`
- content area with `HTML` and `Text` switch

### Empty default state
When there are no emails at all:
- show simple empty state
- text: no email yet
- secondary hint: incoming emails routed to this Worker will appear here

### Empty filter state
When filters return nothing:
- text: no matching email
- show current filter summary
- provide one-click clear

---

## 6.2 Message detail view

### Header block
Must show:
- subject
- sender
- delivered to (`toAddress`)
- receivedAt
- read status

### Actions
Primary actions:
- mark read / mark unread
- delete

Secondary actions (optional in first pass):
- copy recipient address
- copy sender address
- copy message ID (if added later)

### Content rendering
Because email bodies are unreliable and inconsistent, support both:

- **HTML view**
- **Plain text view**

Default behavior:
- if `htmlBody` exists, default to HTML tab
- otherwise default to Text tab

### HTML rendering rule
HTML email must render in a constrained viewer area.

Recommended safety baseline:
- render in sandboxed iframe or tightly controlled container
- do not let remote email styles break the entire app layout
- preserve readable width and scrolling

### Text rendering rule
Text mode should use:
- monospace or readable system font
- preserved line breaks
- wrapping for long lines unless it harms OTP/code visibility

---

## 6.3 Authentication gate

Since the backend uses a single shared API secret, the frontend should start with a simple access gate.

### First-pass auth UX
On first visit:
- ask for API base URL
- ask for API secret
- store locally in browser storage
- allow quick re-entry/edit

### Auth screen fields
- API Base URL
- API Secret
- Save and Connect

### Auth errors
If credentials fail:
- show explicit `Unauthorized` state
- do not spin forever
- allow immediate retry

### Security note
This is acceptable for a private self-hosted admin UI.
It is not enough for a public multi-user product.

---

## 7. Key interaction design

## 7.1 Inbox list behavior

### Sorting
Always sort newest first.
No user-configurable sort in first pass.

### Pagination
Current backend supports page + pageSize.

Recommended first-pass UI:
- default page size: 20
- next / previous controls
- visible page count
- preserve active filters across page changes

Alternative:
- infinite scroll can come later, but is not necessary for v1
- manual pagination is simpler and more deterministic

### Selection behavior
Desktop default:
- auto-select first email in the current page when results load
- unless the user already selected an item that still exists in the refreshed dataset

This reduces dead space and saves one click.

### Refresh behavior
Refresh should:
- preserve current filters
- preserve current page if still valid
- preserve selection when possible
- not snap the whole layout around

---

## 7.2 Filtering behavior

### Recipient filter
This is one of the highest-value controls.

Requirements:
- exact-match input tied to backend `to_address`
- clear label: `Recipient address`
- placeholder example: `promo@yourdomain.com`
- easy clear/reset

### Unread filter
Use a simple toggle or checkbox.

Label:
- `Unread only`

### Filter summary
When filters are active, show a small summary near the list header, for example:
- `Unread only`
- `Recipient: promo@yourdomain.com`
- `Recipient: promo@yourdomain.com · Unread only`

This prevents confusion after page reload or refresh.

---

## 7.3 Read/unread behavior

Opening a mail should **not** automatically mark it read in the first version.

Reason:
- operators may inspect quickly without wanting state mutation
- explicit action is more predictable
- temp-mail workflows are operational, not emotional; implicit read state adds ambiguity

Therefore:
- read/unread changes should be manual
- unread mails should remain visually distinct until explicitly changed

Future option:
- optional setting: mark as read on open

But do not add this in the first pass.

---

## 7.4 Delete behavior

Delete is permanent in the current backend.

UI requirement:
- use confirmation before delete
- confirm dialog copy should be short and direct

Recommended copy:
- title: `Delete email?`
- body: `This action permanently removes the message.`
- actions: `Cancel`, `Delete`

After delete:
- remove item from list immediately
- load nearest logical next selection
- if list becomes empty, show empty state cleanly

Do not use toast spam for every action. Keep signals minimal.

---

## 8. Visual hierarchy recommendations

## 8.1 Density

Use medium-to-compact density.
This is an operator tool, so wasted whitespace hurts more than it helps.

### Good candidates
- list row height around 64–84px
- compact metadata text
- stronger subject weight
- lighter secondary metadata

## 8.2 Typography

Suggested hierarchy:
- subject: strongest
- sender / recipient: secondary but visible
- timestamp: tertiary
- content body: highly readable, neutral

## 8.3 Color usage

Use color functionally, not decoratively.

Examples:
- unread dot / unread row emphasis
- destructive delete action in red
- selected row with controlled highlight
- subtle borders to separate panes

Avoid heavy gradients, glassmorphism, or dashboard theatrics.

## 8.4 Layout stability

The detail panel should not reflow unpredictably because email HTML is chaotic.
Use strict internal scrolling regions.

---

## 9. Responsive behavior

## 9.1 Desktop-first

Primary target: desktop and laptop.

Recommended breakpoint strategy:
- **Desktop:** split view (list + detail)
- **Tablet/small desktop:** narrower split, still dual-panel if possible
- **Mobile:** list screen -> detail screen stacked navigation

## 9.2 Mobile handling

Mobile support can be functional but should not drive the desktop design.
If implemented later:
- inbox list as primary route
- tapping row opens detail route/sheet
- sticky action bar for mark read/delete

---

## 10. Suggested component model

## 10.1 Required components

- `AuthGate`
- `TopBar`
- `InboxFilters`
- `InboxList`
- `InboxListRow`
- `InboxPagination`
- `EmailDetailHeader`
- `EmailContentTabs`
- `EmailHtmlViewer`
- `EmailTextViewer`
- `ConfirmDeleteDialog`
- `EmptyState`
- `ErrorState`

## 10.2 State model

At minimum, frontend state should track:

- connection credentials
- current page
- page size
- active filters
- selected email id
- list loading state
- detail loading state
- mutation loading state
- error state

This is small enough for local component state or a lightweight store.
No heavy state framework is required unless the stack already prefers one.

---

## 11. API-to-UI mapping

## 11.1 List endpoint

`GET /api/emails?page=1&pageSize=20&to_address=<recipient>&unread=true`

Used by:
- inbox list
- pagination
- filter controls

## 11.2 Detail endpoint

`GET /api/emails/:id`

Used by:
- detail pane
- content tabs

## 11.3 Status endpoint

`PATCH /api/emails/:id/status`

Used by:
- mark read/unread action

## 11.4 Delete endpoint

`DELETE /api/emails/:id`

Used by:
- delete action
- list reconciliation after deletion

---

## 12. Loading, empty, and error states

## 12.1 Loading states

Use skeletons or restrained placeholders:
- list skeleton rows while inbox loads
- detail skeleton while selected message loads
- button-level loading for mutations

Avoid full-screen blocking spinners once the shell is loaded.

## 12.2 Error states

### Inbox load error
Show:
- concise error message
- retry button
- keep filter controls visible

### Detail load error
Show:
- message failed to load
- retry action
- keep list intact

### Mutation error
For mark/delete failures:
- show small inline alert or toast
- do not reset the entire screen

## 12.3 Unauthorized state
Show:
- credentials invalid
- edit credentials action

---

## 13. Recommended implementation boundaries

## 13.1 In scope for the first frontend release

- auth gate with API secret
- inbox list
- recipient filter
- unread filter
- pagination
- detail view
- HTML/text tab
- mark read/unread
- delete with confirmation
- desktop-first responsive layout

## 13.2 Explicitly out of scope for first release

- composing or replying to email
- attachments
- full-text search across bodies
- multi-select bulk actions
- tagging/starred folders
- real-time push updates
- multi-user auth
- audit logs
- dark/light theme switcher if it delays core usability

---

## 14. Stack recommendation

If starting now, choose a frontend that stays fast and boring.

Recommended direction:
- React + Vite + TypeScript
- Tailwind only if used with restraint
- or plain CSS modules if cleaner for long-term control

Why:
- fast to ship
- easy local hosting/static deployment
- enough flexibility for split-pane UI

Do not over-engineer with a component framework that imposes dashboard aesthetics.

---

## 15. UX copy suggestions

### Empty inbox
- `No email yet`
- `Incoming messages routed to this Worker will appear here.`

### Empty filtered result
- `No matching email`
- `Try clearing filters or checking another recipient address.`

### Unauthorized
- `Connection failed`
- `Check the API base URL and secret, then try again.`

### Delete confirm
- `Delete email?`
- `This action permanently removes the message.`

---

## 16. Performance expectations

The UI should feel instant on normal mailbox sizes.

Target behavior:
- shell loads quickly
- list updates without full-page rerender feel
- detail switch is near-instant after first fetch
- filtering should not create layout jumps

Important note:
Since email HTML can be heavy and ugly, isolate the email viewer from the rest of the app so one bad message does not degrade the whole interface.

---

## 17. Proposed build sequence

### Step 1
Build the auth gate and API client wrapper.

### Step 2
Build inbox shell with filters + list + pagination.

### Step 3
Build detail pane with text/html view.

### Step 4
Add read/unread and delete mutations.

### Step 5
Polish loading, empty, and error states.

### Step 6
Do a final pass for keyboard flow, density, and visual consistency.

---

## 18. Final direction

The right UI for this project is not “fancy”. It is:

- compact
- sharp
- operational
- recipient-aware
- difficult to misuse

If later versions add search, bulk actions, or live refresh, they should extend this operator-first model instead of turning the project into a generic email SaaS clone.
