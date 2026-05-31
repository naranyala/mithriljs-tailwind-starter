# Mithril Tailwind Starter

A modern, high-performance frontend starter template using [Mithril.js](https://github.com/mithril/mithril), [Tailwind CSS v4](https://tailwindcss.com/), and [Vite](https://vitejs.dev/). This template is designed for developers who want a lightweight, extremely fast, and type-safe foundation for their web applications.

## ✨ Features

- 🚀 **Blazing Fast**: Powered by Vite and Mithril.js for minimal overhead and instant HMR.
- 🎨 **Tailwind CSS v4**: Pre-configured with the latest Tailwind CSS integration via `@tailwindcss/vite`.
- 🛡️ **TypeScript Ready**: Full type safety out of the box.
- 📦 **Single File Build**: Option to bundle everything into a single HTML file using [vite-plugin-singlefile](https://github.com/richardtallent/vite-plugin-singlefile).
- 🚦 **Reactive State**: Integrated with [@preact/signals](https://github.com/preactjs/signals) for fine-grained reactivity.

## 🛠️ Tech Stack

### Core Dependencies
- [Mithril.js](https://github.com/mithriljs/mithril.js) - A lightweight, fast, and friendly m.js framework.
- [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework.
- [Vite](https://vitejs.dev/) - Next generation frontend tooling.
- [@preact/signals](https://github.com/preactjs/signals) - Fine-grained reactivity for state management.
- [RxJS](https://github.com/ReactiveX/rxjs) - Reactive extensions for JavaScript.
- [Motion](https://github.com/motion/motion) - Powerful animation library.
- [@xstate/store](https://github.com/statelyai/xstate) - Tiny, efficient state management.
- [Mitt](https://github.com/developit/mitt) - Tiny functional event emitter.
- [Tailwind Merge](https://github.com/tailwindlabs/tailwind-merge) - Intelligent class merging for Tailwind.
- [Clsx](https://github.com/lukeed/clsx) - Utility for constructing `className` strings conditionally.
- [Vite Plugin SingleFile](https://github.com/richardtallent/vite-plugin-singlefile) - Bundles everything into one HTML file.

### Development Tools
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript.
- [@types/mithril](https://www.npmjs.com/package/@types/mithril) - Type definitions for Mithril.

## 🚀 Getting Started

### Prerequisites
Ensure you have [Bun](https://bun.sh/) installed on your machine.

### Installation

```bash
# Clone the repository
git clone <repository-url>

# Navigate to the frontend directory
cd frontend

# Install dependencies
bun install
```

### Development

Start the development server with Hot Module Replacement (HMR):

```bash
bun run dev
```

The app will be available at `http://localhost:5173`.

### Building for Production

To create a production-ready build:

```bash
bun run build
```

The optimized output will be located in the `dist/` directory.

## 📂 Project Structure

```text
frontend/
├── src/
│   ├── layouts/    # Layout components
│   ├── lib/        # Reusable UI components and utilities
│   ├── pages/      # Page components and route definitions
│   ├── main.tsx    # Application entry point
│   ├── router.tsx  # Routing configuration
│   └── style.css   # Global styles
├── index.html      # HTML entry point
├── package.json    # Project dependencies and scripts
├── tsconfig.json   # TypeScript configuration
└── vite.config.ts  # Vite configuration
```

## 📄 License

This project is licensed under the MIT License.
