# AI Rules for 10x FlashCards

FlashCards generation application powered by AI for educational purposes.

## Tech Stack

- Astro 5
- TypeScript 5
- React 19
- Tailwind 4

## Project Structure

When introducing changes to the project, always follow the directory structure below:

- `./src` - source code
- `./src/layouts` - Astro layouts
- `./src/pages` - Astro pages
- `./src/pages/api` - API endpoints
- `./src/components` - client-side components written in Astro (static) and React (dynamic)
- `./src/assets` - static internal assets
- `./public` - public assets

## FRONTEND

### Guidelines for General Practices

- Use Astro components (.astro) for static content and layout
- Implement framework components in React only when interactivity is needed

### Guidelines for ASTRO

#### ASTRO_CODING_STANDARDS

- Use Astro components (.astro) for static content and layout
- Implement framework components in React only when interactivity is needed
- Leverage View Transitions API for smooth page transitions
- Use content collections with type safety for blog posts, documentation, etc.
- Implement middleware for request/response modification
- Use image optimization with the Astro Image integration
- Leverage Server Endpoints for API routes
- Implement hybrid rendering with server-side rendering where needed
- Use Astro.cookies for server-side cookie management
- Leverage import.meta.env for environment variables

#### ASTRO_ISLANDS

- Use client:visible directive for components that should hydrate when visible in viewport
- Implement shared state with nanostores instead of prop drilling between islands
- Use content collections for type-safe content management of structured content
- Leverage client:media directive for components that should only hydrate at specific breakpoints
- Implement partial hydration strategies to minimize JavaScript sent to the client
- Use client:only for components that should never render on the server
- Leverage client:idle for non-critical UI elements that can wait until the browser is idle
- Implement client:load for components that should hydrate immediately
- Use Astro's transition:* directives for view transitions between pages
- Leverage props for passing data from Astro to framework components

### Guidelines for React

#### React Coding Standards

- Use functional components with hooks instead of class components
- Implement React.memo() for expensive components that render often with the same props
- Utilize React.lazy() and Suspense for code-splitting and performance optimization
- Use the useCallback hook for event handlers passed to child components to prevent unnecessary re-renders
- Prefer useMemo for expensive calculations to avoid recomputation on every render
- Implement useId() for generating unique IDs for accessibility attributes
- Consider using the new useOptimistic hook for optimistic UI updates in forms
- Use useTransition for non-urgent state updates to keep the UI responsive

#### Key Principles

- Use functional, declarative programming. Avoid classes.
- Use descriptive variable names with auxiliary verbs (e.g., isLoading, hasError).
- Favor named exports for components.
- Use TypeScript for all code. Prefer interfaces over types.
- File structure: imports, types, main component, subcomponents, helpers, static content.
- Use Zod for form validation.
- Use Zustand for state managament.
- Use Shadcn UI, Radix, and Tailwind CSS for components and styling.

### Guidelines for STYLING

#### TAILWIND

- Use the @layer directive to organize styles into components, utilities, and base layers
- Implement Just-in-Time (JIT) mode for development efficiency and smaller CSS bundles
- Use arbitrary values with square brackets (e.g., w-[123px]) for precise one-off designs
- Leverage the @apply directive in component classes to reuse utility combinations
- Implement the Tailwind configuration file for customizing theme, plugins, and variants
- Use component extraction for repeated UI patterns instead of copying utility classes
- Leverage the theme() function in CSS for accessing Tailwind theme values
- Implement dark mode with the dark: variant
- Use responsive variants (sm:, md:, lg:, etc.) for adaptive designs
- Leverage state variants (hover:, focus:, active:, etc.) for interactive elements

### Guidelines for Accessibility

#### ARIA Best Practices

- Use ARIA landmarks to identify regions of the page (main, navigation, search, etc.)
- Apply appropriate ARIA roles to custom interface elements that lack semantic HTML equivalents
- Set aria-expanded and aria-controls for expandable content like accordions and dropdowns
- Use aria-live regions with appropriate politeness settings for dynamic content updates
- Implement aria-hidden to hide decorative or duplicative content from screen readers
- Apply aria-label or aria-labelledby for elements without visible text labels
- Use aria-describedby to associate descriptive text with form inputs or complex elements
- Implement aria-current for indicating the current item in a set, navigation, or process
- Avoid redundant ARIA that duplicates the semantics of native HTML elements

## DEVOPS

### Guidelines for CI_CD

#### GITHUB_ACTIONS

- Check if `package.json` exists in project root and summarize key scripts
- Check if `.nvmrc` exists in project root
- Check if `.env.example` exists in project root to identify key `env:` variables
- Always use terminal command: `git branch -a | cat` to verify whether we use `main` or `master` branch
- Always use `env:` variables and secrets attached to jobs instead of global workflows
- Always use `npm ci` for Node-based dependency setup
- Extract common steps into composite actions in separate files
- Once you're done, as a final step conduct the following: for each public action always use <tool>"Run Terminal"</tool> to see what is the most up-to-date version (use only major version) - extract tag_name from the response:
- ```bash curl -s https://api.github.com/repos/{owner}/{repo}/releases/latest ```

## TESTING

### Guidelines for UNIT

#### JEST

- Use Jest with TypeScript for type checking in tests
- Implement Testing Library for component testing instead of enzyme
- Use snapshot testing sparingly and only for stable UI components
- Leverage mock functions and spies for isolating units of code
- Implement test setup and teardown with beforeEach and afterEach
- Use describe blocks for organizing related tests
- Leverage expect assertions with specific matchers
- Implement code coverage reporting with meaningful targets
- Use mockResolvedValue and mockRejectedValue for async testing
- Leverage fake timers for testing time-dependent functionality

## CODING_PRACTICES

### Guidelines for Clean Code

- Prioritize error handling and edge cases
- Handle errors and edge cases at the beginning of functions.
- Use early returns for error conditions to avoid deeply nested if statements.
- Place the happy path last in the function for improved readability.
- Avoid unnecessary else statements; use if-return pattern instead.
- Use guard clauses to handle preconditions and invalid states early.
- Implement proper error logging and user-friendly error messages.
- Consider using custom error types or error factories for consistent error handling.

### Guidelines for VERSION_CONTROL

#### GIT

- Use conventional commits to create meaningful commit messages
- Use feature branches with descriptive names following {{branch_naming_convention}}
- Write meaningful commit messages that explain why changes were made, not just what
- Keep commits focused on single logical changes to facilitate code review and bisection
- Use interactive rebase to clean up history before merging feature branches
- Leverage git hooks to enforce code quality checks before commits and pushes

#### GITHUB

- Use pull request templates to standardize information provided for code reviews
- Implement branch protection rules for {{protected_branches}} to enforce quality checks
- Configure required status checks to prevent merging code that fails tests or linting
- Use GitHub Actions for CI/CD workflows to automate testing and deployment
- Implement CODEOWNERS files to automatically assign reviewers based on code paths
- Use GitHub Projects for tracking work items and connecting them to code changes

### Guidelines for STATIC_ANALYSIS

#### ESLINT

- Configure project-specific rules in eslint.config.js to enforce consistent coding standards
- Use shareable configs like eslint-config-airbnb or eslint-config-standard as a foundation
- Implement custom rules for {{project_specific_patterns}} to maintain codebase consistency
- Configure integration with Prettier to avoid rule conflicts for code formatting
- Use the --fix flag in CI/CD pipelines to automatically correct fixable issues
- Implement staged linting with husky and lint-staged to prevent committing non-compliant code

#### PRETTIER

- Define a consistent .prettierrc configuration across all {{project_repositories}}
- Configure editor integration to format on save for immediate feedback
- Use .prettierignore to exclude generated files, build artifacts, and {{specific_excluded_patterns}}
- Set printWidth based on team preferences (80-120 characters) to improve code readability
- Configure consistent quote style and semicolon usage to match team conventions
- Implement CI checks to ensure all committed code adheres to the defined style
