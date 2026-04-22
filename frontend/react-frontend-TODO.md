# React Frontend TODO

Based on the `Prototype 1` screens in `frontend/Design/Prototype 1`.

## Current Session Goal

Build a demoable frontend for:

- Landing page
- Sign-in page
- Register page

These pages do not need real backend functionality yet, but they should be structured so backend integration is easy later.

## Recommended Frontend Architecture

Keep the app split into route-level pages, shared layout pieces, reusable UI controls, and future API helpers.

Suggested `src` structure:

```text
src/
  app/
    router.jsx
  assets/
  components/
    branding/
      Logo.jsx
    forms/
      AuthForm.jsx
      FormField.jsx
      PasswordField.jsx
    layout/
      PublicLayout.jsx
      Footer.jsx
    ui/
      Button.jsx
      Card.jsx
      Input.jsx
  pages/
    LandingPage.jsx
    LoginPage.jsx
    RegisterPage.jsx
  styles/
    tokens.css
    utilities.css
  lib/
    routes.js
    validators.js
  services/
    authService.js
  mocks/
    authResponses.js
```

Notes:

- `pages` should stay thin and mostly compose components.
- Shared form pieces should be reusable between sign-in and register.
- `services` should define the future backend boundary even if it returns mock data for now.
- Keep styling centralized enough that later dashboard pages can reuse the same theme.

## Route Plan For This Session

- `/` -> Landing page
- `/login` -> Sign-in page
- `/register` -> Register page

Future routes implied by the prototype:

- `/vault`
- `/add-password`
- `/docs`
- `/settings`
- `/vault/:credentialId/edit`

## Prototype Observations

- The visual language is simple and consistent: very light gray background, dark navy surfaces, blue primary actions, rounded cards, large typography.
- The logo appears on all public pages and authenticated pages.
- Login and register are very similar, so they should share a form shell instead of duplicating markup.
- The authenticated section uses a reusable left sidebar layout that should be built later as a separate app shell, not mixed into the public auth pages.
- The credentials modal and credential row suggest later need for reusable actions like reveal, copy, edit, and delete.

## Session TODO

### 1. Set up routing and page shells

- Add `react-router-dom`.
- Create a dedicated router file instead of hardcoding page switching in `App.jsx`.
- Wire up routes for `/`, `/login`, and `/register`.
- Add a not-found fallback or temporary redirect strategy.

### 2. Establish shared design tokens

- Define CSS variables for:
  - page background
  - dark surface color
  - primary blue
  - danger red
  - text colors
  - border radius
  - spacing scale
- Move base typography and reset styles into global CSS.
- Use a consistent container width for public pages.

### 3. Build shared branding components

- Create a reusable `Logo` component.
- Decide whether the current logo should be:
  - imported as an image asset, or
  - recreated with text/CSS later
- Build a simple `Footer` component matching the prototype direction.

### 4. Build reusable UI primitives

- Create shared `Button` component with variants:
  - primary
  - secondary/outline
  - ghost or text-link if needed
- Create shared `Input` component.
- Create `FormField` wrapper for label + input + future error text.
- Create `PasswordField` component now, even if show/hide is added later.

Reason:
The login, register, add-password, and edit-password screens all reuse the same form patterns.

### 5. Build public page layouts

- Create `PublicLayout` for logo, centered content, and optional footer.
- Build `LandingPage` with:
  - headline
  - short supporting copy
  - register CTA
  - secondary "How it works" CTA
  - placeholder section for technology/feature explanation
- Build `LoginPage` to match the prototype.
- Build `RegisterPage` to match the prototype.

### 6. Implement form state for demo purposes

- Use controlled React inputs for login and register.
- Add submit handlers that prevent default and log/mock-submit for now.
- Add lightweight client validation:
  - required email
  - required password
  - confirm password matches on register
- Show inline or summary placeholder error messaging structure.

Reason:
Even without backend integration, demo pages feel more complete if the forms behave realistically.

### 7. Prepare backend integration boundaries now

- Create `authService.js` with placeholder functions:
  - `login(credentials)`
  - `register(payload)`
- For now, return mocked promises.
- Keep route components unaware of fetch details so real API integration is a swap later.
- Define expected payload shapes in comments or constants.

Suggested shapes:

```js
login({ email, password })
register({ email, password, confirmPassword })
```

Later backend-oriented shape may become:

```js
register({ email, password })
login({ email, password })
```

Frontend should handle removing `confirmPassword` before the API call.

### 8. Add navigation links between auth pages

- Landing page "Register" button -> `/register`
- Landing page "How it Works" button -> likely `/docs` later, or temporary anchor/placeholder
- Login page "Click here to register" -> `/register`
- Register page "Click here to log in" -> `/login`
- Optionally make the logo route back to `/`

### 9. Make the pages responsive

- Ensure the large landing hero scales down well on laptop and mobile widths.
- Stack auth form elements cleanly on smaller screens.
- Avoid hardcoded pixel positioning taken directly from the prototype.
- Prefer layout systems like flex/grid and spacing tokens.

Reason:
The prototype looks desktop-first, but the implementation should be fluid from the start.

### 10. Keep authenticated-area code separate

- Do not build the dashboard/sidebar inside the auth page layout.
- If time allows, create a placeholder `AppShell` component later for:
  - sidebar
  - top content region
  - active nav state
- Keep this out of the current session scope unless the landing/auth pages are complete first.

## Nice-To-Have If Time Remains

- Add hover/focus states for buttons and inputs.
- Add loading button state on form submit.
- Add password visibility toggle to auth forms.
- Add a small success state after mock registration.
- Add a simple 404 page.

## Out Of Scope For This Session

- Real authentication
- JWT/session handling
- MFA flow
- Protected routes
- Vault data fetching
- Add/edit password persistence
- Documentation page content
- Settings functionality

## Suggested Build Order

1. Install router and create routes.
2. Set up CSS tokens and global styles.
3. Build `Logo`, `Button`, `Input`, and `FormField`.
4. Build `PublicLayout`.
5. Implement `LandingPage`.
6. Implement `LoginPage`.
7. Implement `RegisterPage`.
8. Add mock submit handlers and basic validation.
9. Polish responsive behavior.

## Definition Of Done For Today

- App runs locally without errors.
- `/`, `/login`, and `/register` routes exist.
- All three pages are navigable from the browser.
- Login and register forms are controlled and visually complete.
- Shared components are reused rather than copy-pasted.
- No backend is required for the demo.
