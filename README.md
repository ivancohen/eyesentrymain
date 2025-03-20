# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/a05d96df-992c-4fa4-a624-28857d53b788

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/a05d96df-992c-4fa4-a624-28857d53b788) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with .

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/a05d96df-992c-4fa4-a624-28857d53b788) and click on Share -> Publish.

## I want to use a custom domain - is that possible?

We don't support custom domains (yet). If you want to deploy your project under your own domain then we recommend using Netlify. Visit our docs for more details: [Custom domains](https://docs.lovable.dev/tips-tricks/custom-domain/)

# EyeSentry

A powerful platform for eye health management and glaucoma risk assessment.

## Deployment

This project is configured for deployment on Cloudflare Pages. To deploy:

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Log in to [Cloudflare Pages](https://pages.cloudflare.com)
3. Click "Create a project"
4. Connect your Git repository
5. Configure the build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Node.js version: 20.x

### Environment Variables

Make sure to set up the following environment variables in your Cloudflare Pages project settings:

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- Any other environment variables required by your application

### Build Settings

The project uses Vite for building. The build process:
1. TypeScript compilation
2. Vite build
3. Static file generation

### Development

To run the project locally:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Features

- Patient questionnaire management
- Specialist assessment system
- Risk assessment tools
- Admin dashboard
- User management
- AI-powered insights

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS
- Supabase
- Shadcn UI
- React Router
