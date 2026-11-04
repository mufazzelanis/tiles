/**
 * Production entry point for cPanel "Setup Node.js App" (Phusion Passenger).
 * Passenger starts this file and routes the domain's traffic to it.
 * Locally, keep using `npm run dev` / `npm start`.
 */
/* eslint-disable @typescript-eslint/no-require-imports -- Passenger loads a CommonJS startup file */
const { createServer } = require("node:http");
const next = require("next");

const port = Number(process.env.PORT) || 3000;
// After a form save redirects, Next fetches the target page from itself. Under Passenger the
// app sits behind a socket, not localhost:3000, so point that request at the public site URL.
if (process.env.SITE_URL && !process.env.__NEXT_PRIVATE_ORIGIN) process.env.__NEXT_PRIVATE_ORIGIN = process.env.SITE_URL.replace(/\/+$/, "");
const app = next({ dev: false, dir: __dirname });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer((req, res) => handle(req, res)).listen(port, () => console.log(`> Ready on port ${port}`));
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
