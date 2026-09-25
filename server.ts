import express, { Response } from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const catalogFilePath = path.join(process.cwd(), "public", "catalog.json");
const configFilePath = path.join(process.cwd(), "public", "config.json");
const versionFilePath = path.join(process.cwd(), "public", "version.json");
const initialProductsFilePath = path.join(process.cwd(), "src", "data", "initialProducts.ts");

function syncSourceCodeFiles(productsList?: any[], configObj?: any) {
  try {
    let currentConfig = configObj;
    if (!currentConfig && fs.existsSync(configFilePath)) {
      currentConfig = JSON.parse(fs.readFileSync(configFilePath, "utf-8"));
    }
    let currentProducts = productsList;
    if (!currentProducts && fs.existsSync(catalogFilePath)) {
      currentProducts = JSON.parse(fs.readFileSync(catalogFilePath, "utf-8"));
    }
    if (currentProducts && currentConfig) {
      const defaultCats = currentConfig.categories || [
        { id: "tshirts", name: "T-shirts & Oversized" },
        { id: "chapeus", name: "Chapéus & Bonés" },
        { id: "hoodies", name: "Moletom & Hoodies" }
      ];
      const content = `import { Product, StoreConfig, CategoryItem } from "../types";\n\n` +
        `export const DEFAULT_CATEGORIES: CategoryItem[] = ${JSON.stringify(defaultCats, null, 2)};\n\n` +
        `export const DEFAULT_STORE_CONFIG: StoreConfig = ${JSON.stringify(currentConfig, null, 2)};\n\n` +
        `export const INITIAL_PRODUCTS: Product[] = ${JSON.stringify(currentProducts, null, 2)};\n`;
      fs.writeFileSync(initialProductsFilePath, content, "utf-8");
      console.log(`[SourceSync] src/data/initialProducts.ts synchronized (${currentProducts.length} items)`);
    }
  } catch (e) {
    console.warn("Could not sync src/data/initialProducts.ts:", e);
  }
}

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

  // CORS middleware - allow requests from any origin (including external browser tabs, mobile devices, and previews)
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // Ensure public, uploads, and receipts directories exist
  const publicDir = path.join(process.cwd(), "public");
  const uploadsDir = path.join(publicDir, "uploads");
  const receiptsDir = path.join(publicDir, "receipts");
  try {
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    if (!fs.existsSync(receiptsDir)) fs.mkdirSync(receiptsDir, { recursive: true });
  } catch {}

  // Serve static files from public (for uploaded product photos, receipts, catalog.json)
  app.use(express.static(publicDir));

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

  // Upload product image to disk to avoid storing heavy base64 strings in JSON/localStorage
  app.post("/api/upload-image", express.json({ limit: "25mb" }), (req, res) => {
    try {
      const { imageBase64, clientOrigin } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: "Imagem não fornecida" });
      }

      // If already a URL, return as-is
      if (typeof imageBase64 === "string" && (imageBase64.startsWith("http://") || imageBase64.startsWith("https://") || imageBase64.startsWith("/uploads/"))) {
        return res.json({ success: true, url: imageBase64 });
      }

      const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      let mimeType = "image/jpeg";
      let buffer: Buffer;

      if (matches && matches.length === 3) {
        mimeType = matches[1];
        buffer = Buffer.from(matches[2], "base64");
      } else {
        buffer = Buffer.from(imageBase64, "base64");
      }

      const ext = mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : "jpg";
      const imageId = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const fileName = `${imageId}.${ext}`;
      const filePath = path.join(uploadsDir, fileName);
      fs.writeFileSync(filePath, buffer);

      // In production mode, also save to dist/uploads if dist exists
      const distUploadsDir = path.join(process.cwd(), "dist", "uploads");
      if (fs.existsSync(distUploadsDir)) {
        try {
          fs.writeFileSync(path.join(distUploadsDir, fileName), buffer);
        } catch {}
      }

      const relativeUrl = `/uploads/${fileName}`;

      // Determinar o URL público correto
      let baseUrl = "";
      if (typeof clientOrigin === "string" && clientOrigin.startsWith("http")) {
        baseUrl = clientOrigin.replace(/\/+$/, "");
      } else {
        const host = req.get("x-forwarded-host") || req.get("host") || "localhost:3000";
        const isHttps = req.secure || req.get("x-forwarded-proto") === "https";
        const protocol = isHttps ? "https" : "http";
        baseUrl = `${protocol}://${host}`;
      }
      const absoluteUrl = `${baseUrl}${relativeUrl}`;

      console.log(`[Upload] Imagem do produto guardada: ${fileName} (${relativeUrl})`);

      return res.json({
        success: true,
        id: imageId,
        url: relativeUrl,
        absoluteUrl,
      });
    } catch (err) {
      console.error("Error uploading product image:", err);
      return res.status(500).json({ error: "Falha ao gravar imagem do produto" });
    }
  });

  // Manual export of source code files (optional, for GitHub commits)
  app.post("/api/export-initial-products", (req, res) => {
    try {
      syncSourceCodeFiles();
      return res.json({ success: true, message: "src/data/initialProducts.ts sincronizado com sucesso!" });
    } catch (e: any) {
      return res.status(500).json({ error: e?.message || "Falha ao sincronizar código-fonte" });
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

  // --- Comprovativo de Pagamento (Upload & Acesso Online) ---
  const receiptStore = new Map<string, { buffer: Buffer; mimeType: string; createdAt: number }>();

  // 1. Upload do comprovativo em base64 com geração de link online para WhatsApp
  app.post("/api/upload-receipt", express.json({ limit: "20mb" }), (req, res) => {
    try {
      const { imageBase64, clientOrigin } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: "Comprovativo não fornecido" });
      }

      const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      let mimeType = "image/jpeg";
      let buffer: Buffer;

      if (matches && matches.length === 3) {
        mimeType = matches[1];
        buffer = Buffer.from(matches[2], "base64");
      } else {
        buffer = Buffer.from(imageBase64, "base64");
      }

      const ext = mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : "jpg";
      const receiptId = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      receiptStore.set(receiptId, {
        buffer,
        mimeType,
        createdAt: Date.now(),
      });

      // Persistir em disco para sobrevivência ao reiniciar o servidor
      try {
        const filePath = path.join(receiptsDir, `${receiptId}.${ext}`);
        fs.writeFileSync(filePath, buffer);
      } catch (saveErr) {
        console.warn("Could not persist receipt to disk:", saveErr);
      }

      // Determinar o URL público correto
      let baseUrl = "";
      if (typeof clientOrigin === "string" && clientOrigin.startsWith("http")) {
        baseUrl = clientOrigin.replace(/\/+$/, "");
      } else {
        const host = req.get("x-forwarded-host") || req.get("host") || "localhost:3000";
        const isHttps = req.secure || req.get("x-forwarded-proto") === "https";
        const protocol = isHttps ? "https" : "http";
        baseUrl = `${protocol}://${host}`;
      }
      const receiptUrl = `${baseUrl}/api/receipts/${receiptId}`;

      console.log(`[Comprovativo] Novo comprovativo guardado com sucesso: ${receiptId} (${receiptUrl})`);

      return res.json({
        success: true,
        id: receiptId,
        receiptUrl,
      });
    } catch (err) {
      console.error("Error uploading receipt:", err);
      return res.status(500).json({ error: "Falha ao processar comprovativo" });
    }
  });

  // 2. Servir imagem do comprovativo
  app.get("/api/receipts/:id", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    const { id } = req.params;
    const item = receiptStore.get(id);
    if (item) {
      res.setHeader("Content-Type", item.mimeType);
      res.setHeader("Cache-Control", "public, max-age=86400");
      return res.send(item.buffer);
    }

    // Fallback do disco
    try {
      const candidates = [
        path.join(receiptsDir, `${id}.jpg`),
        path.join(receiptsDir, `${id}.jpeg`),
        path.join(receiptsDir, `${id}.png`),
        path.join(receiptsDir, `${id}.webp`),
      ];
      for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
          const buf = fs.readFileSync(candidate);
          const ext = path.extname(candidate).toLowerCase();
          const mime = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
          res.setHeader("Content-Type", mime);
          res.setHeader("Cache-Control", "public, max-age=86400");
          return res.send(buf);
        }
      }
    } catch (diskErr) {
      console.warn("Error reading receipt from disk:", diskErr);
    }

    return res.status(404).send("Comprovativo não encontrado.");
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
