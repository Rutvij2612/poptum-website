/**
 * One-time setup: obtain GMAIL_REFRESH_TOKEN for info.poptum@gmail.com
 *
 * Prerequisites:
 * - GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in .env
 * - Google Cloud OAuth client (Web application) with redirect URI:
 *   http://localhost:3333/oauth2callback
 *
 * Run: npx tsx script/gmail-oauth-setup.ts
 */
import "dotenv/config";
import http from "http";
import { google } from "googleapis";

const PORT = 3333;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;
const SCOPES = ["https://www.googleapis.com/auth/gmail.send"];

const clientId = process.env.GMAIL_CLIENT_ID?.trim();
const clientSecret = process.env.GMAIL_CLIENT_SECRET?.trim();

if (!clientId || !clientSecret) {
  console.error("Set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in .env first.");
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
    if (url.pathname !== "/oauth2callback") {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    const code = url.searchParams.get("code");
    if (!code) {
      res.writeHead(400);
      res.end("Missing authorization code.");
      return;
    }

    const { tokens } = await oauth2Client.getToken(code);
    if (!tokens.refresh_token) {
      res.writeHead(500);
      res.end(
        "No refresh_token returned. Revoke app access at myaccount.google.com/permissions and run again with prompt=consent.",
      );
      return;
    }

    console.log("\n========================================");
    console.log("Add this to Render (and .env):");
    console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log("========================================\n");

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(
      "<h2>Success</h2><p>Copy <code>GMAIL_REFRESH_TOKEN</code> from your terminal, then close this tab.</p>",
    );
    setTimeout(() => server.close(), 500);
  } catch (err) {
    console.error(err);
    res.writeHead(500);
    res.end("Token exchange failed. See terminal.");
  }
});

server.listen(PORT, () => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    redirect_uri: REDIRECT_URI,
  });

  console.log("\n1. Sign in as info.poptum@gmail.com when the browser opens.");
  console.log("2. Approve sending email on your behalf.\n");
  console.log("Open this URL:\n");
  console.log(authUrl);
  console.log("\nWaiting for callback on http://localhost:3333 ...\n");
});
