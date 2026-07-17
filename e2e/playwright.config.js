// Playwright config for the ATI e2e + axe suite.
//
// Launches BOTH servers automatically (or reuses ones you already have running):
//   - Flask backend  : .venv314\Scripts\python.exe run.py  → http://127.0.0.1:5000
//   - CRA dev server : npm start (app/frontend/src)        → http://localhost:3000
// The CRA proxy (setupProxy.js) forwards /ati/data-api and /ati/auth to Flask,
// so the suite exercises the same wiring as local development.
//
// Prerequisites: Neo4j reachable per app/.env.development, and the server's
// AUTH_ENFORCED kill-switch OFF (the dev default) so AuthGate is transparent.
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    // The app talks to a live shared Neo4j DB; keep worker count modest.
    workers: process.env.CI ? 2 : 4,
    reporter: [['list'], ['html', { open: 'never' }]],
    // Dashboard views load a lot of graph data on a dev server — allow headroom.
    timeout: 90_000,
    expect: { timeout: 15_000 },

    use: {
        baseURL: 'http://localhost:3000',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    webServer: [
        {
            // Flask via waitress. .venv314 is the interpreter with the app's deps
            // (.venv lacks waitress/neomodel>=6 — see project memory).
            command: '.venv314\\Scripts\\python.exe run.py',
            cwd: '..',
            url: 'http://127.0.0.1:5000/ati/auth/v1/me',
            reuseExistingServer: true,
            timeout: 60_000,
        },
        {
            command: 'npm start',
            cwd: '../app/frontend/src',
            url: 'http://localhost:3000/ati',
            reuseExistingServer: true,
            // First CRA compile on a cold cache can take minutes.
            timeout: 300_000,
            env: { BROWSER: 'none' },
        },
    ],
});
