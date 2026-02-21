import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = express();

  app.use(express.json());

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Waitlist API endpoint
  app.post("/api/waitlist", async (req, res) => {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Email is required" });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("SUPABASE_URL or SUPABASE_ANON_KEY not set");
      return res.status(500).json({ error: "Server configuration error" });
    }

    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/waitlist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      if (response.status === 409 || response.status === 409) {
        // Duplicate — still show success to avoid email enumeration
        return res.json({ success: true });
      }

      if (!response.ok) {
        const body = await response.text();
        // Supabase returns 409-like errors as 400 with unique violation message
        if (body.includes("duplicate") || body.includes("unique")) {
          return res.json({ success: true });
        }
        console.error("Supabase error:", response.status, body);
        return res.status(500).json({ error: "Failed to save email" });
      }

      return res.json({ success: true });
    } catch (error) {
      console.error("Waitlist error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  return app;
}

async function startServer() {
  const app = createApp();
  const server = createServer(app);

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
