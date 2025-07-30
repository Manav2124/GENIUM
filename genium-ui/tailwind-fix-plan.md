# Tailwind CSS Configuration Fix Plan

## Problem Analysis

The build is failing with the following error:

```
Error: It looks like you're trying to use `tailwindcss` directly as a PostCSS plugin. The PostCSS plugin has moved to a separate package, so to continue using Tailwind CSS with PostCSS you'll need to install `@tailwindcss/postcss` and update your PostCSS configuration.
```

This error occurs because:

1. The project is using Tailwind CSS v4.1.11, which has moved its PostCSS plugin to a separate package
2. The current postcss.config.js file is using the old configuration format that directly references `tailwindcss` as a plugin

## Solution Steps

### 1. Install the Required Package

Run the following command in the genium-ui directory:

```bash
npm install @tailwindcss/postcss --save-dev
```

This will install the separate PostCSS plugin package that Tailwind CSS v4 requires.

### 2. Update PostCSS Configuration

Modify the `postcss.config.js` file to use the new package. Change from:

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  }
}
```

To:

```javascript
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  }
}
```

This change replaces the direct reference to `tailwindcss` with the new separate package `@tailwindcss/postcss`.

### 3. Test the Changes

After making these changes, run the application to verify that the build succeeds:

```bash
npm start
```

If the application builds and runs successfully, the Tailwind CSS configuration issue has been resolved.

## Alternative Approach (If Needed)

If there are compatibility issues with the new package, an alternative approach would be to downgrade Tailwind CSS to a version that doesn't require the separate PostCSS plugin (v3.x):

```bash
npm uninstall tailwindcss
npm install tailwindcss@3.3.3 --save-dev
```

Then keep the original postcss.config.js file as is.

## Verification

The fix is successful if:

1. The build completes without the PostCSS plugin error
2. The Tailwind CSS styles are correctly applied to the application
3. Both index.css and App.css are processed correctly