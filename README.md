# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/fc9bf4c2-5143-4270-83ec-c7de4b1ed612

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/fc9bf4c2-5143-4270-83ec-c7de4b1ed612) and start prompting.

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

This project is built with:

- Next.js (App Router) — hosts the SPA as a catch-all route
- TypeScript
- React + React Router (client-only routing inside the Next shell)
- shadcn/ui
- Tailwind CSS
- Supabase + Stripe + Resend (via `supabase/functions`)

## Architecture notes

- `app/` is the Next.js App Router entry (`layout.tsx` + a
  `[[...slug]]` catch-all page).
- `app/ClientApp.tsx` dynamically imports the existing React SPA in
  `src/App.tsx` with `ssr: false`, so React Router keeps handling all
  client routes.
- All legacy page components live in `src/spa-pages/` and are imported
  by `src/App.tsx` / React Router — they are **not** Next.js routes.
- Build locally with `npm run build` (which runs `next build`),
  develop with `npm run dev` (`next dev`).

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/fc9bf4c2-5143-4270-83ec-c7de4b1ed612) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
