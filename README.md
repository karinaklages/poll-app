# Poll App

An Angular app built with TypeScript and SCSS for creating, sharing, and analyzing surveys in real time. [Supabase](https://supabase.com) was used as the backend for authentication and data storage.

Poll App is part of the Developer Akademie's training programme for software developers ([www.developerakademie.com](https://www.developerakademie.com)).

![Poll App](./poll-app/public/img/poll-app-1.jpg)
![Poll App](./poll-app/public/img/poll-app-2.jpg)
![Poll App](./poll-app/public/img/poll-app-3.jpg)
![Poll App](./poll-app/public/img/poll-app-4.jpg)

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quickstart](#quickstart)
- [Project Structure](#project-structure)

## Prerequisites

- [Node.js](https://nodejs.org/) (for installing dependencies)
- [Angular CLI](https://angular.io/cli) — install globally if not already present:

```bash
npm install -g @angular/cli
```

## Quickstart

Clone the repository:

```bash
git clone https://github.com/karinaklages/poll-app.git
cd poll-app/poll-app
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
ng serve
```

Then open [http://localhost:4200](http://localhost:4200) in your browser.

### Build for production

```bash
ng build --base-href "/angular-projects/poll-app/"
```

## Project Structure

```text
poll-app/
└── poll-app/                      # Angular project root
    ├── public/
    │   ├── fonts/                 # Local font files
    │   └── img/                   # Images and screenshots
    ├── src/
    │   ├── app/
    │   │   ├── layout/
    │   │   │   ├── home/          # Home page component
    │   │   │   ├── survey-detail/ # Survey detail component
    │   │   │   └── survey-new/    # Create new survey component
    │   │   ├── app.config.ts      # App configuration
    │   │   ├── app.html           # Root component template
    │   │   ├── app.routes.ts      # App routing
    │   │   ├── app.scss           # Root component styles
    │   │   ├── app.ts             # Root component
    │   │   └── supabase.ts        # Supabase client configuration
    │   ├── styles/                # Global SCSS styles
    │   ├── index.html             # Application entry point
    │   ├── main.ts                # Angular bootstrap
    │   └── styles.scss            # Main SCSS entry point
    ├── .editorconfig
    ├── .gitignore
    ├── angular.json               # Angular CLI configuration
    ├── package.json               # Project metadata and dependencies
    ├── tsconfig.app.json          # TypeScript config (app)
    ├── tsconfig.json              # TypeScript base config
    └── tsconfig.spec.json         # TypeScript config (tests)
```