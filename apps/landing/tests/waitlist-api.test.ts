import { describe, test, expect, beforeAll, afterAll, vi, beforeEach } from "vitest";
import { createApp } from "../server/index.js";
import type { Express } from "express";
import http from "http";

// Helper to make requests to the test server
function request(
  server: http.Server,
  method: string,
  path: string,
  body?: any
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const addr = server.address() as { port: number };
    const options: http.RequestOptions = {
      hostname: "127.0.0.1",
      port: addr.port,
      path,
      method,
      headers: { "Content-Type": "application/json" },
    };
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode!, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode!, body: data });
        }
      });
    });
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

describe("Waitlist API", () => {
  let app: Express;
  let server: http.Server;

  beforeAll(
    () =>
      new Promise<void>((resolve) => {
        app = createApp();
        server = app.listen(0, () => resolve());
      })
  );

  afterAll(
    () =>
      new Promise<void>((resolve) => {
        server.close(() => resolve());
      })
  );

  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_ANON_KEY;
  });

  test("rejects missing email", async () => {
    const res = await request(server, "POST", "/api/waitlist", {});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Email is required");
  });

  test("rejects invalid email format", async () => {
    const res = await request(server, "POST", "/api/waitlist", {
      email: "not-an-email",
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid email format");
  });

  test("rejects non-string email", async () => {
    const res = await request(server, "POST", "/api/waitlist", {
      email: 12345,
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Email is required");
  });

  test("returns 500 when Supabase env vars not set", async () => {
    const res = await request(server, "POST", "/api/waitlist", {
      email: "test@example.com",
    });
    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Server configuration error");
  });

  test("succeeds when Supabase returns 201", async () => {
    process.env.SUPABASE_URL = "http://localhost:54321";
    process.env.SUPABASE_ANON_KEY = "test-key";

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
    });
    vi.stubGlobal("fetch", mockFetch);

    const res = await request(server, "POST", "/api/waitlist", {
      email: "Test@Example.com",
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify email was lowercased and trimmed
    const fetchBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(fetchBody.email).toBe("test@example.com");
  });

  test("handles duplicate email gracefully", async () => {
    process.env.SUPABASE_URL = "http://localhost:54321";
    process.env.SUPABASE_ANON_KEY = "test-key";

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: () => Promise.resolve('duplicate key value violates unique constraint'),
      })
    );

    const res = await request(server, "POST", "/api/waitlist", {
      email: "dup@example.com",
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
