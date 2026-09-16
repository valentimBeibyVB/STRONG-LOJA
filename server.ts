import express, { Response } from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const catalogFilePath = path.join(process.cwd(), "public", "catalog.json");
const configFilePath = path.join(process.cwd(), "public", "config.json");
const versionFilePath = path.join(process.cwd(), "public", "version.json");

// Persistent version loading
function loadPersistedVersion(): number {
  try {
    if (fs.existsSync(versionFilePath)) {
      const raw = fs.readFileSync(versionFilePath, "utf-8");
      const parsed = JSON.parse(raw);
      if (typeof parsed.version === "number" && parsed.version > 0) {
        return parsed.version;
      }
    }
    if (fs.existsSync(catalogFilePath)) {
      const stat = fs.statSync(catalogFilePath);
      return Math.floor(stat.mtimeMs);
    }
  } catch (e) {
    console.warn("Could not load initial catalog version:", e);
  }
  return Date.now();
}

let catalogVersion = loadPersistedVersion();

function savePersistedVersion(v: number) {
  catalogVersion = v;
  try {
    fs.writeFileSync(
      versionFilePath,
      JSON.stringify({ version: v, updatedAt: new Date().toISOString() }, null, 2),
      "utf-8"
    );
    // Also sync to dist if exists
    const distVersionPath = path.join(process.cwd(), "dist", "version.json");
    if (fs.existsSync(path.join(process.cwd(), "dist"))) {
      try {
        fs.writeFileSync(
          distVersionPath,
          JSON.stringify({ version: v, updatedAt: new Date().toISOString() }, null, 2),
          "utf-8"
        );
      } catch {}
    }
  } catch (e) {
    console.warn("Could not save version.json:", e);
  }
}

// Active Server-Sent Events (SSE) connections for instant cross-device sync
const sseClients = new Set<Response>();

function broadcastUpdate(event: "catalog" | "config", payload: any) {
  const data = JSON.stringify(payload);
  for (const client of sseClients) {
    try {
      client.write(`event: ${event}\ndata: ${data}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limit to support images uploaded as base64
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/status", (req, res) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.json({
      status: "ok",
      version: catalogVersion,
      connectedClients: sseClients.size,
    });
  });

  // Real-time Server-Sent Events endpoint for immediate cross-device updates
  app.get("/api/sync/events", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    if (typeof (res as any).flushHeaders === "function") {
      (res as any).flushHeaders();
    }

    // Send initial connection packet
    res.write(
      `event: connected\ndata: ${JSON.stringify({
        type: "connected",
        version: catalogVersion,
        timestamp: Date.now(),
      })}\n\n`
    );

    sseClients.add(res);

    // Keepalive ping every 20 seconds
    const interval = setInterval(() => {
      try {
        res.write(": keepalive\n\n");
      } catch {
        clearInterval(interval);
        sseClients.delete(res);
      }
    }, 20000);

    req.on("close", () => {
      clearInterval(interval);
      sseClients.delete(res);
    });
  });

  app.get("/api/products", (req, res) => {
    try {
      if (fs.existsSync(catalogFilePath)) {
        const raw = fs.readFileSync(catalogFilePath, "utf-8");
        const data = JSON.parse(raw);
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("ETag", `"${catalogVersion}"`);
        return res.json({
          version: catalogVersion,
          products: data,
        });
      }
      return res.json({
        version: catalogVersion,
        products: [],
      });
    } catch (err) {
      console.error("Error reading catalog.json:", err);
      res.status(500).json({ error: "Failed to read products" });
    }
  });

  app.post("/api/products", (req, res) => {
    try {
      const incoming = req.body;
      const productsList = Array.isArray(incoming)
        ? incoming
        : Array.isArray(incoming?.products)
        ? incoming.products
        : null;

      if (!productsList) {
        return res.status(400).json({ error: "Invalid products format. Must be an array." });
      }

      // If incoming contains a version number, use it, otherwise generate now
      const newVersion = typeof incoming?.version === "number" && incoming.version > 0
        ? incoming.version
        : Date.now();
      savePersistedVersion(newVersion);

      // Save to public/catalog.json
      fs.writeFileSync(catalogFilePath, JSON.stringify(productsList, null, 2), "utf-8");

      // In production mode, also save to dist/catalog.json if dist exists
      const distCatalogPath = path.join(process.cwd(), "dist", "catalog.json");
      if (fs.existsSync(path.join(process.cwd(), "dist"))) {
        try {
          fs.writeFileSync(distCatalogPath, JSON.stringify(productsList, null, 2), "utf-8");
        } catch (distErr) {
          console.warn("Could not sync to dist/catalog.json:", distErr);
        }
      }

      // Also automatically update src/data/initialProducts.ts only if content differs
      const initialProductsPath = path.join(process.cwd(), "src", "data", "initialProducts.ts");
      if (fs.existsSync(initialProductsPath)) {
        try {
          const currentContent = fs.readFileSync(initialProductsPath, "utf-8");
          const configMatch = currentContent.match(/export const DEFAULT_STORE_CONFIG: StoreConfig = (\{[\s\S]*?\});/);
          const configStr = configMatch
            ? configMatch[1]
            : JSON.stringify({
                storeName: "STRONG",
                tagline: "STREETWEAR & ESSENTIAL APPAREL",
                whatsappNumber: "244923456789",
                countryCode: "+244",
                currencySymbol: "Kz",
                currencyPosition: "suffix",
                welcomeMessage: "Olá Strong! Vim através da vossa loja online e gostaria de finalizar a seguinte encomenda:",
                instagramHandle: "@strong.brand",
                address: "Luanda, Angola | Entregas para todo o país",
                adminPassword: "admin",
              }, null, 2);

          const newCode = `import { Product, StoreConfig } from "../types";\n\nexport const DEFAULT_STORE_CONFIG: StoreConfig = ${configStr};\n\nexport const INITIAL_PRODUCTS: Product[] = ${JSON.stringify(productsList, null, 2)};\n`;
          if (newCode !== currentContent) {
            fs.writeFileSync(initialProductsPath, newCode, "utf-8");
            console.log("[API] Synchronized products with src/data/initialProducts.ts");
          }
        } catch (srcErr) {
          console.warn("Could not sync to src/data/initialProducts.ts:", srcErr);
        }
      }

      console.log(`[API] Catalog updated with ${productsList.length} items (v: ${catalogVersion})`);

      // Immediately notify all other connected devices in real-time
      broadcastUpdate("catalog", {
        version: catalogVersion,
        count: productsList.length,
        timestamp: Date.now(),
      });

      return res.json({
        success: true,
        count: productsList.length,
        version: catalogVersion,
      });
    } catch (err) {
      console.error("Error saving catalog.json:", err);
      return res.status(500).json({ error: "Failed to save products" });
    }
  });

  app.get("/api/config", (req, res) => {
    try {
      if (fs.existsSync(configFilePath)) {
        const raw = fs.readFileSync(configFilePath, "utf-8");
        const data = JSON.parse(raw);
        return res.json(data);
      }
      return res.status(404).json({ error: "Config not found" });
    } catch (err) {
      console.error("Error reading config.json:", err);
      return res.status(500).json({ error: "Failed to read config" });
    }
  });

  app.post("/api/config", (req, res) => {
    try {
      const newConfig = req.body;
      if (!newConfig || typeof newConfig !== "object") {
        return res.status(400).json({ error: "Invalid config object" });
      }

      fs.writeFileSync(configFilePath, JSON.stringify(newConfig, null, 2), "utf-8");

      // In production mode, also write to dist/config.json
      const distConfigPath = path.join(process.cwd(), "dist", "config.json");
      if (fs.existsSync(path.join(process.cwd(), "dist"))) {
        try {
          fs.writeFileSync(distConfigPath, JSON.stringify(newConfig, null, 2), "utf-8");
        } catch (e) {
          console.warn("Could not sync to dist/config.json", e);
        }
      }

      // Broadcast to connected clients in real-time
      broadcastUpdate("config", { config: newConfig });

      return res.json({ success: true });
    } catch (err) {
      console.error("Error saving config.json:", err);
      return res.status(500).json({ error: "Failed to save config" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Strong Store Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
