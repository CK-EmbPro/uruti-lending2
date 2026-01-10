# Favicon Setup

## Issue
The browser requests `/favicon.ico` and gets a 404 error if no favicon is present.

## Solution

### Option 1: Add Favicon to App Directory (Recommended for Next.js 13+)

Place a favicon file in the `app` directory:
- `app/icon.ico` or `app/icon.png` or `app/icon.svg`

Next.js will automatically serve it.

### Option 2: Add Favicon to Public Directory

1. Create a `public` directory in the `frontend` folder (if it doesn't exist)
2. Add `favicon.ico` to the `public` directory
3. Next.js will serve it from the root path

### Option 3: Generate a Simple Favicon

You can generate a simple favicon using online tools:
- https://favicon.io/
- https://realfavicongenerator.net/

Or create a simple SVG icon and convert it to ICO format.

## Current Status

The metadata in `app/layout.tsx` has been updated to not explicitly reference favicon, which will suppress the metadata-based request. However, browsers will still automatically request `/favicon.ico`.

To completely fix this, add a favicon file using one of the options above.

