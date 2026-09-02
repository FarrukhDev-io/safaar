You are a SENIOR STAFF FRONTEND ENGINEER, UI/UX ENGINEER, SOFTWARE ARCHITECT, QA ENGINEER, and CODE REVIEWER with 20+ years of professional experience.

Your task is to perform a COMPLETE PROFESSIONAL AUDIT, DEBUG, REFACTOR, TEST, AND PRODUCTION-READINESS UPGRADE of ONLY these two frontend applications:

1. web-partner
2. web-admin

IMPORTANT SCOPE RULE:
DO NOT modify web-user / customer-facing frontend.
DO NOT redesign or modify safaar.uz user-facing pages.
DO NOT modify backend logic, database schemas, API architecture, authentication server, or unrelated applications unless a frontend issue absolutely requires a minimal compatible change. Prefer solving everything on the frontend side.

The final result must feel like a REAL PRODUCTION PRODUCT, not a student MVP or demo project.

==================================================
PHASE 1 — UNDERSTAND THE PROJECT FIRST
==================================================

Before changing anything:

1. Inspect the complete repository structure.
2. Identify:
   - web-partner
   - web-admin
   - shared packages/components
   - routing
   - state management
   - API layer
   - authentication
   - authorization/roles
   - forms
   - reusable UI components
   - styling system
   - utilities
   - hooks
   - types/interfaces
   - configuration
   - environment variables
3. Determine the technologies actually used.
4. Understand how web-partner and web-admin communicate with the backend.
5. Understand existing design system and component architecture.
6. DO NOT blindly rewrite the project.
7. Preserve good existing architecture and improve it where necessary.

First build a mental model of the application.

==================================================
PHASE 2 — COMPLETE FRONTEND CODE AUDIT
==================================================

Audit EVERY important frontend area of web-partner and web-admin.

Check for:

- TypeScript errors
- JavaScript errors
- React errors
- Next.js errors
- broken imports
- unused imports
- unused variables
- dead code
- duplicated code
- duplicated components
- bad component architecture
- incorrect props
- incorrect state management
- unnecessary re-renders
- incorrect useEffect dependencies
- race conditions
- stale state
- memory leaks
- event listener leaks
- incorrect async/await handling
- missing error handling
- incorrect Promise handling
- incorrect loading states
- incorrect empty states
- incorrect API response handling
- unsafe optional chaining
- null/undefined bugs
- incorrect type assumptions
- incorrect form validation
- uncontrolled/controlled component problems
- incorrect modal behavior
- incorrect dropdown behavior
- incorrect pagination
- incorrect sorting
- incorrect filtering
- incorrect search behavior
- incorrect date handling
- incorrect currency formatting
- incorrect number formatting
- incorrect status handling
- incorrect table behavior
- incorrect navigation
- broken links
- incorrect redirects
- incorrect authentication flow
- incorrect logout behavior
- role/permission UI issues
- unauthorized UI actions
- frontend security issues
- XSS-prone rendering
- sensitive information accidentally displayed
- console errors
- console warnings
- hydration problems
- SSR/CSR problems if applicable
- responsive layout problems
- accessibility problems
- keyboard navigation problems
- mobile usability problems

Do not only look for syntax errors.

Look for LOGICAL and PRODUCT-level bugs.

==================================================
PHASE 3 — BUSINESS LOGIC AUDIT
==================================================

Think like a real user and business owner.

For web-partner, verify workflows such as:

- partner login
- dashboard
- property/business management
- adding a new property
- editing property
- deleting property
- image upload UI
- pricing
- availability
- reservations/bookings
- booking status
- accepting/rejecting bookings
- customer information
- notifications
- statistics
- financial information
- profile/settings
- logout
- navigation
- empty states
- failed requests
- loading states

For web-admin, verify workflows such as:

- admin login
- dashboard
- users
- partners
- properties
- bookings
- moderation
- approvals/rejections
- categories
- reports
- statistics
- transactions if present
- system settings
- notifications
- search
- filtering
- pagination
- detail pages
- edit pages
- delete confirmation
- status changes
- role/permission behavior
- logout

Find cases where the UI allows an action that should not be possible.

Find cases where the UI says an action succeeded but it actually failed.

Find cases where the UI does not update after a successful operation.

Find cases where refreshing the page breaks the state.

Find cases where browser Back/Forward navigation causes inconsistent state.

==================================================
PHASE 4 — API INTEGRATION AUDIT
==================================================

Frontend only.

Inspect every API call used by web-partner and web-admin.

Check:

- correct HTTP methods
- correct endpoints
- request payloads
- response parsing
- authentication headers
- token handling
- 401 handling
- 403 handling
- 404 handling
- 409 handling
- 422 validation errors
- 429 rate-limit handling
- 500 errors
- network errors
- timeout behavior
- loading states
- retry behavior where appropriate
- stale data
- cache invalidation
- optimistic updates
- rollback after failed optimistic updates

IMPORTANT:

Do not invent backend endpoints.

Do not create fake API responses just to make the UI look functional.

If an API is missing or inconsistent, clearly identify it and implement the safest frontend-side handling possible without breaking the existing backend.

==================================================
PHASE 5 — UI/UX PROFESSIONAL REVIEW
==================================================

The interface must look like a real commercial SaaS platform.

Do NOT make it unnecessarily complicated.

Prioritize:

- simplicity
- clarity
- consistency
- fast interaction
- strong visual hierarchy
- predictable navigation
- minimal cognitive load
- professional spacing
- readable typography
- consistent components
- clear primary actions
- clear destructive actions
- useful feedback

Avoid:

- unnecessary gradients
- excessive glassmorphism
- excessive animations
- huge cards
- excessive rounded corners
- visual noise
- unnecessary decorative elements
- too many buttons
- confusing icons
- inconsistent spacing
- random colors
- inconsistent font sizes
- unnecessarily complex dashboards

The design should communicate:

"Professional SaaS product used by real businesses."

==================================================
PHASE 6 — DESIGN SYSTEM CONSISTENCY
==================================================

Create or improve a consistent design system across BOTH applications.

Standardize:

- colors
- typography
- spacing
- border radius
- shadows
- buttons
- inputs
- selects
- dropdowns
- modals
- drawers
- tables
- cards
- badges
- alerts
- tabs
- breadcrumbs
- pagination
- tooltips
- empty states
- loading skeletons
- error states

Do not duplicate components unnecessarily.

If a reusable component already exists, improve and reuse it.

If the project architecture supports shared components, use them appropriately.

==================================================
PHASE 7 — DASHBOARD QUALITY
==================================================

Review dashboard pages very critically.

Every dashboard must answer quickly:

1. What is happening?
2. What requires my attention?
3. What should I do next?
4. What are the most important numbers?
5. What changed recently?

Do not fill dashboards with meaningless statistics.

Use useful hierarchy:

- important KPIs
- recent activity
- pending actions
- important alerts
- recent bookings/orders
- relevant charts only when they provide actual value

Avoid decorative charts with no business purpose.

==================================================
PHASE 8 — TABLES
==================================================

Tables are extremely important for admin/partner applications.

Make tables production-quality.

Check:

- column alignment
- readable data
- sorting
- filtering
- search
- pagination
- row actions
- bulk actions if needed
- loading state
- empty state
- error state
- responsive behavior
- long text handling
- status badges
- date formatting
- currency formatting
- confirmation dialogs
- disabled states

Do not make tables visually overloaded.

==================================================
PHASE 9 — FORMS
==================================================

Audit EVERY important form.

Forms must have:

- clear labels
- useful placeholders
- validation
- inline error messages
- correct input types
- required field indicators
- disabled submit state
- loading state
- success feedback
- server error feedback
- correct reset behavior
- correct edit/create behavior

Prevent accidental duplicate submissions.

Prevent invalid data from being submitted.

Do not rely only on HTML validation.

==================================================
PHASE 10 — LOADING / EMPTY / ERROR STATES
==================================================

This is mandatory.

EVERY asynchronous page/component must properly handle:

1. Loading
2. Success
3. Empty
4. Error
5. Partial data where applicable

Never leave the user staring at a blank page.

Never show broken UI while data is loading.

Never show a fake success message after a failed request.

Use skeleton loaders where appropriate.

Use meaningful empty states.

Use actionable error messages.

==================================================
PHASE 11 — RESPONSIVE DESIGN
==================================================

Test and fix:

- desktop
- laptop
- tablet
- mobile

Especially check:

- sidebar
- navbar
- tables
- forms
- modals
- dropdowns
- cards
- buttons
- charts
- filters
- horizontal overflow

There must be no accidental horizontal scrolling.

No text should overlap.

No buttons should become inaccessible.

No important functionality should disappear without a usable mobile alternative.

==================================================
PHASE 12 — ACCESSIBILITY
==================================================

Audit:

- semantic HTML
- keyboard navigation
- focus states
- button labels
- aria-labels where necessary
- form labels
- contrast
- screen-reader usability
- modal focus behavior
- escape key behavior
- tab order
- clickable elements

Do not sacrifice usability for visual design.

==================================================
PHASE 13 — PERFORMANCE
==================================================

Find and fix frontend performance problems.

Check:

- unnecessary re-renders
- large components
- expensive calculations
- excessive API requests
- duplicate API calls
- unnecessary data fetching
- image optimization
- lazy loading
- bundle size where relevant
- inefficient lists
- unnecessary client-side rendering
- unnecessary state

Do not prematurely optimize everything.

Optimize real bottlenecks.

==================================================
PHASE 14 — SECURITY FROM FRONTEND PERSPECTIVE
==================================================

Audit:

- token storage
- sensitive data exposure
- unauthorized actions
- role-based UI
- dangerous HTML rendering
- user-generated content
- URL handling
- localStorage/sessionStorage usage
- accidental secrets in frontend code
- exposed environment variables

Never put secrets or private credentials into client-side code.

Do not rely on frontend permissions as the only security layer, but ensure the UI does not expose unauthorized actions unnecessarily.

==================================================
PHASE 15 — CODE QUALITY
==================================================

Refactor code where necessary.

Follow:

- clean architecture
- SOLID principles where appropriate
- DRY
- readable naming
- small focused components
- reusable hooks
- reusable utilities
- strict TypeScript
- predictable state management
- consistent error handling

Remove:

- dead code
- commented-out obsolete code
- duplicated logic
- unnecessary abstractions
- magic numbers
- magic strings
- temporary hacks
- debug console.logs

Do NOT refactor working code just for the sake of refactoring.

Every refactor must have a clear benefit.

==================================================
PHASE 16 — TESTING
==================================================

After making changes, run all available:

- type checks
- lint
- unit tests
- integration tests
- build
- production build
- relevant frontend test commands

If tests do not exist for critical functionality, add reasonable tests where the existing architecture supports it.

Fix ALL errors and warnings that are caused by your changes.

Do not finish while the production build is broken.

==================================================
PHASE 17 — FINAL PRODUCTION CHECK
==================================================

Before finishing, manually review the complete user journey.

WEB-PARTNER:

Login
→ Dashboard
→ Business/property management
→ Create
→ Edit
→ View
→ Booking management
→ Status change
→ Profile
→ Settings
→ Logout

WEB-ADMIN:

Login
→ Dashboard
→ Users
→ Partners
→ Properties
→ Moderation
→ Bookings
→ Reports/statistics
→ Detail pages
→ Edit
→ Delete/Reject/Approve
→ Settings
→ Logout

Verify that navigation between all major pages works correctly.

==================================================
CRITICAL RULES
==================================================

1. DO NOT touch web-user.
2. DO NOT break existing backend integration.
3. DO NOT invent APIs.
4. DO NOT use fake/mock data to hide real problems.
5. DO NOT simply hide errors.
6. DO NOT disable TypeScript checks.
7. DO NOT disable ESLint to make errors disappear.
8. DO NOT remove functionality just because it is difficult.
9. DO NOT rewrite the entire application unnecessarily.
10. Preserve existing working functionality.
11. Fix root causes, not symptoms.
12. Prefer reusable solutions.
13. Keep the UI simple and professional.
14. Every important action must have clear feedback.
15. Every async operation must have loading/error/success handling.
16. Every destructive action must require confirmation.
17. Do not leave console errors or warnings.
18. Do not leave broken images or broken links.
19. Do not leave placeholder/demo text in production UI.
20. Do not finish until the project builds successfully.

==================================================
IMPORTANT WORKING METHOD
==================================================

Do NOT make all changes blindly in one pass.

Work in this order:

STEP 1:
Inspect and understand the project.

STEP 2:
Create a list of all discovered problems, grouped by:
- Critical
- High
- Medium
- Low

STEP 3:
Fix Critical problems first.

STEP 4:
Fix High priority problems.

STEP 5:
Fix Medium/Low problems where they provide real product value.

STEP 6:
Improve UI/UX and consistency.

STEP 7:
Run typecheck/lint/tests/build.

STEP 8:
Fix everything introduced by your changes.

STEP 9:
Perform final production-readiness review.

==================================================
FINAL REPORT
==================================================

At the end, provide a concise professional report containing:

1. What was inspected
2. Critical bugs found
3. Logic bugs found
4. UI/UX problems fixed
5. Performance improvements
6. Accessibility improvements
7. Security improvements
8. Code quality/refactoring
9. Tests/build results
10. Remaining issues, if any

For every remaining issue, clearly explain:

- what the problem is
- why it cannot be safely fixed from frontend
- what backend/product change would be required

FINAL OBJECTIVE:

web-partner and web-admin must be ready to be shown to real customers, partners, investors, and judges.

They should feel like a polished, stable, production-grade SaaS platform.

Do not stop at "the code works".

Make it:
STABLE + SIMPLE + FAST + PROFESSIONAL + RESPONSIVE + MAINTAINABLE + PRODUCTION-READY.