const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produces a self-contained `.next/standalone` server for a slim runtime image.
  output: "standalone",
  // Pin the file-tracing root to this app so the standalone output stays flat
  // at `.next/standalone/server.js` (Next otherwise guesses a parent dir when
  // it finds lockfiles higher up, e.g. in a monorepo/worktree).
  outputFileTracingRoot: path.join(__dirname),
};

module.exports = nextConfig;
