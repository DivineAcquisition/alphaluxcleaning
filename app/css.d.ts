// Allow side-effect imports of global CSS files (e.g. `import "@/index.css"`)
// from Next.js app-router files. Vite handles this natively, but the Next
// TypeScript context needs an explicit module declaration.
declare module "*.css";
