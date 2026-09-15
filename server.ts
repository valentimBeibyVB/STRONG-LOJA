import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

let catalogVersion = Date.now();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limit to support images uploaded as base64
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  const catalogFilePath = path.join(process.cwd(), "public", "catalog.json");
  const configFilePath = path.join(process.cwd(), "public", "config.json");

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/status", (req, res) => {
    res.json({
      status: "ok",
      version: catalogVersion,
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

      // Also automatically update src/data/initialProducts.ts so exported code / GitHub builds have the latest catalog
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
          fs.writeFileSync(initialProductsPath, newCode, "utf-8");
          console.log("[API] Synchronized products with src/data/initialProducts.ts");
        } catch (srcErr) {
          console.warn("Could not sync to src/data/initialProducts.ts:", srcErr);
        }
      }

      catalogVersion = Date.now();
      console.log(`[API] Catalog updated with ${productsList.length} items (v: ${catalogVersion})`);

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
