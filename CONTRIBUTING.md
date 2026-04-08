# Contributing to CG²R

Thank you for your interest in contributing! This guide will help you get started.

## 🚀 Getting Started

1. **Fork** the repository and clone your fork:
   ```bash
   git clone https://github.com/<your-username>/cg2r.git
   cd cg2r
   ```

2. **Install dependencies**:
   ```bash
   cp .env.example .env
   npm install
   ```

3. **Start the dev server**:
   ```bash
   npm run dev
   ```

4. **Create a branch** for your change:
   ```bash
   git checkout -b feat/my-feature
   ```

## 📐 Code Style

- **TypeScript** with `strict` mode enabled — no `any` types unless absolutely necessary.
- **Prettier** for formatting — run `npm run format` before committing.
- **ESLint** for linting — run `npm run lint` and fix all warnings/errors.
- **Tailwind CSS** for styling — use utility classes, avoid inline styles.

## ✅ Before Submitting

Run these checks locally:

```bash
npm run typecheck   # TypeScript type checking
npm run lint        # ESLint
npm run build       # Full production build
```

## 🔀 Pull Request Process

1. Make sure your branch is up to date with `main`.
2. Write a clear PR title and description explaining **what** and **why**.
3. Keep PRs focused — one feature or fix per PR.
4. If you add a new feature, update the README if needed.

## 💬 Commit Message Convention

Use clear, descriptive commit messages using [Conventional Commits](https://www.conventionalcommits.org):

## 🐛 Reporting Issues

- Use [GitHub Issues](https://github.com/nicolasfeyer/cg2r/issues) to report bugs or suggest features.
- Include steps to reproduce, expected behavior, and screenshots if applicable.
- Check existing issues before opening a new one.

## 🌍 Language

- The **application UI** is in **French** (targeting Fribourg citizens).
- **Code**, **comments**, **documentation**, and **commit messages** should be in **English**.

## 🗺️ Roadmap

The next major milestone is the **German translation** of the application UI, to reflect Fribourg's bilingual identity (French/German). Contributions on this front — whether it's i18n architecture suggestions or actual translations — are very welcome!

## 📄 License

By contributing, you agree that your contributions will be licensed under the [CC BY-NC 4.0 License](LICENSE).

