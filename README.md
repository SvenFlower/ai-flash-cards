# 10x-cards

AI-powered flashcard generation tool designed to minimize the time required to create educational flashcards.

## Tech Stack

- **Astro 5** - Static site generation and routing
- **TypeScript 5** - Type-safe development
- **React 19** - Interactive components
- **Tailwind 4** - Utility-first styling

## Key Features

- **AI-Powered Generation** - Generate flashcards from text (1,000-10,000 characters) using LLM
- **Manual Creation** - Create and edit flashcards manually
- **Spaced Repetition** - Built-in learning algorithm for optimal retention
- **User Management** - Secure authentication with full data privacy (GDPR compliant)
- **Telemetry** - Track AI-generated content acceptance rates

## Screenshots

![Flashcard Generation](screenshots/Screenshot%202025-12-15%20at%2003.31.19.png)
![Flashcard Review](screenshots/Screenshot%202025-12-15%20at%2003.31.57.png)
![Learning Session](screenshots/Screenshot%202025-12-15%20at%2003.32.21.png)

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run linting
npm run lint
```

## Project Structure

```
./src
├── layouts/          # Astro layouts
├── pages/           # Astro pages and API routes
│   └── api/        # API endpoints
├── components/      # React and Astro components
└── assets/          # Static internal assets
./public/            # Public assets
```

## Development Guidelines

See [CLAUDE.md](./CLAUDE.md) for detailed development guidelines and coding standards.

## Documentation

Full product specification available in [PRD](./.ai/prd.md) (Polish).