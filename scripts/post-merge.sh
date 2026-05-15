#!/bin/bash
set -e
npm install
npx drizzle-kit push --force
npx playwright install chromium
npx playwright test
