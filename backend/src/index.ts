import dotenv from "dotenv";
dotenv.config(); // MUST run before importing db

import express from "express";
import cors from "cors";
import { pool } from "./db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import type { SignOptions } from "jsonwebtoken";
import placesRouter from "./routes/places";

interface AuthRequest extends Request {
  userId?: number;
}

type AuthTokenPayload = {
  userId: number;
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return secret;
}

function getJwtExpiresIn(): NonNullable<SignOptions["expiresIn"]> {
  const expiresIn = process.env.JWT_EXPIRES_IN;
  return (expiresIn && expiresIn.trim().length > 0
    ? expiresIn
    : "7d") as NonNullable<SignOptions["expiresIn"]>;
}

function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "missing Authorization header" });
  }
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ error: "Invalid authorization format" });
  }

  const token = parts[1]!;

  let secret: string;
  try {
    secret = getJwtSecret();
  } catch {
    return res.status(500).json({ error: "server misconfigured" });
  }

  try {
    const check = jwt.verify(token, secret) as unknown as AuthTokenPayload;
    req.userId = check.userId;
    next();
  } catch (error: any) {
    return res.status(401).json({ error: "expired or invalid" });
  }
}

const spotlyServer = express();
let schemaInitialization: Promise<void> | null = null;

function getAllowedOrigins() {
  return (process.env.CLIENT_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

spotlyServer.use(
  cors({
    origin(origin, callback) {
      const allowedOrigins = getAllowedOrigins();

      // Allow non-browser/server-to-server requests without an Origin header.
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

spotlyServer.use(express.json());
spotlyServer.use("/api", placesRouter);


async function ensureUserNameColumn() {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      full_name TEXT,
      avatar_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`
  );

  await pool.query(
    `ALTER TABLE users
     ADD COLUMN IF NOT EXISTS full_name TEXT,
     ADD COLUMN IF NOT EXISTS avatar_url TEXT,
     ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
  );

  await pool.query(
    `CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx
     ON users (email)`
  );
}

async function columnExists(tableName: string, columnName: string) {
  const result = await pool.query(
    `SELECT 1
     FROM information_schema.columns
     WHERE table_schema = current_schema()
       AND table_name = $1
       AND column_name = $2`,
    [tableName, columnName]
  );

  return (result.rowCount ?? 0) > 0;
}

async function ensureCollectionsSchema() {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS collections (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`
  );

  await pool.query(
    `CREATE TABLE IF NOT EXISTS saved_places (
      id SERIAL PRIMARY KEY,
      collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      category TEXT,
      address TEXT,
      latitude DOUBLE PRECISION,
      longitude DOUBLE PRECISION,
      provider_place_id TEXT,
      image_url TEXT,
      rating DOUBLE PRECISION,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`
  );

  await pool.query(
    `ALTER TABLE saved_places
     ADD COLUMN IF NOT EXISTS collection_id INTEGER,
     ADD COLUMN IF NOT EXISTS name TEXT,
     ADD COLUMN IF NOT EXISTS category TEXT,
     ADD COLUMN IF NOT EXISTS address TEXT,
     ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
     ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
     ADD COLUMN IF NOT EXISTS provider_place_id TEXT,
     ADD COLUMN IF NOT EXISTS image_url TEXT,
     ADD COLUMN IF NOT EXISTS rating DOUBLE PRECISION,
     ADD COLUMN IF NOT EXISTS notes TEXT,
     ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
  );

  if (await columnExists("saved_places", "place_name")) {
    await pool.query(
      `UPDATE saved_places
       SET name = place_name
       WHERE (name IS NULL OR BTRIM(name) = '')
         AND place_name IS NOT NULL
         AND BTRIM(place_name) <> ''`
    );
  }

  await pool.query(
    `UPDATE saved_places
     SET name = 'Saved place'
     WHERE name IS NULL OR BTRIM(name) = ''`
  );

  await pool.query(
    `ALTER TABLE saved_places
     ALTER COLUMN latitude TYPE DOUBLE PRECISION
     USING NULLIF(latitude::text, '')::DOUBLE PRECISION,
     ALTER COLUMN longitude TYPE DOUBLE PRECISION
     USING NULLIF(longitude::text, '')::DOUBLE PRECISION,
     ALTER COLUMN rating TYPE DOUBLE PRECISION
     USING NULLIF(rating::text, '')::DOUBLE PRECISION`
  );

  await pool.query(
    `ALTER TABLE saved_places
     ALTER COLUMN address DROP NOT NULL,
     ALTER COLUMN latitude DROP NOT NULL,
     ALTER COLUMN longitude DROP NOT NULL,
     ALTER COLUMN provider_place_id DROP NOT NULL,
     ALTER COLUMN image_url DROP NOT NULL,
     ALTER COLUMN rating DROP NOT NULL,
     ALTER COLUMN notes DROP NOT NULL,
     ALTER COLUMN name SET NOT NULL`
  );

  await pool.query(
    `DO $$
     BEGIN
       IF NOT EXISTS (
         SELECT 1
         FROM pg_constraint
         WHERE conname = 'saved_places_collection_id_fkey'
       ) THEN
         ALTER TABLE saved_places
         ADD CONSTRAINT saved_places_collection_id_fkey
         FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE;
       END IF;
     END
     $$`
  );

  await pool.query(
    `ALTER TABLE collections
     ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
  );
}

async function ensureCollectionsSchemaSafely() {
  try {
    await ensureCollectionsSchema();
  } catch (error) {
    console.error("Collections schema initialization failed:", error);
  }
}

async function initializeServer() {
  await ensureUserNameColumn();
  await ensureCollectionsSchemaSafely();
}

function initializeServerOnce() {
  if (!schemaInitialization) {
    schemaInitialization = initializeServer().catch((error) => {
      schemaInitialization = null;
      throw error;
    });
  }

  return schemaInitialization;
}

function toOptionalNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

spotlyServer.get("/health", async (_req, res) => {
  try {
    await initializeServerOnce();
    const result = await pool.query("SELECT NOW() as now");
    res.json({ ok: true, dbTime: result.rows[0].now });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error: "Database error" });
  }
});

// COLLECTION REQUESTS
spotlyServer.get("/collections", requireAuth, async (req: AuthRequest, res) => {
  try {
    await initializeServerOnce();
    const userId = req.userId!;
    const result = await pool.query(
      "SELECT * FROM collections WHERE user_id = $1",
      [userId]
    );
    res.json({ ok: true, collections: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error: "Database error" });
  }
});

spotlyServer.post("/collections", requireAuth, async (req: AuthRequest, res) => {
  try {
    await initializeServerOnce();
    const userId = req.userId!;
    const { name } = req.body as { name?: string };

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ ok: false, error: "name is required" });
    }

    const instruction = await pool.query(
      "INSERT INTO collections (user_id, name) VALUES ($1, $2) RETURNING *",
      [userId, name.trim()]
    );

    return res.json({ ok: true, collection: instruction.rows[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, error: "Database error" });
  }
});

spotlyServer.delete("/collections/:collectionId", requireAuth, async (req: AuthRequest, res) => {
  try {
    await initializeServerOnce();
    const userId = req.userId!;
    const collectionId = Number(req.params.collectionId);

    if (!Number.isFinite(collectionId)) {
      return res.status(400).json({ ok: false, error: "invalid collectionId" });
    }

    const result = await pool.query(
      `DELETE FROM collections
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [collectionId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ ok: false, error: "Collection not found or not authorized" });
    }

    return res.json({ ok: true, deleted: result.rows[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, error: "Database error" });
  }
});
// END OF COLLECTION REQUESTS

// SAVED + COLLECTION REQUESTS
spotlyServer.get("/collections/:collectionId/saved-places", requireAuth, async (req: AuthRequest, res) => {
  try {
    await initializeServerOnce();
    const userId = req.userId!;
    const collectionId = Number(req.params.collectionId);

    if (!Number.isFinite(collectionId)) {
      return res.status(400).json({ ok: false, error: "invalid collectionId" });
    }

    const result = await pool.query(
      `SELECT sp.*
       FROM saved_places sp
       JOIN collections c ON c.id = sp.collection_id
       WHERE sp.collection_id = $1 AND c.user_id = $2`,
      [collectionId, userId]
    );

    return res.json({ ok: true, savedPlaces: result.rows });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ ok: false, error: "Database Error" });
  }
});

spotlyServer.post("/collections/:collectionId/saved-places", requireAuth, async (req: AuthRequest, res) => {
  try {
    await initializeServerOnce();
    const userId = req.userId!;
    const collectionId = Number(req.params.collectionId);

    if (!Number.isFinite(collectionId)) {
      // FIX: was res.send(500) which crashes
      return res.status(400).json({ ok: false, error: "invalid collectionId" });
    }

     const owns = await pool.query(
      "SELECT id FROM collections WHERE id = $1 AND user_id = $2",
      [collectionId, userId]
    );

    if (owns.rows.length === 0) {
      return res.status(403).json({ ok: false, error: "not allowed" });
    }

    const {
      name,
      category,
      address,
      latitude,
      longitude,
      providerPlaceId,
      imageUrl,
      rating,
      notes,
    } =
      req.body as {
        name?: string;
        category?: string;
        address?: string;
        latitude?: number | string;
        longitude?: number | string;
        providerPlaceId?: string;
        imageUrl?: string;
        rating?: number | string;
        notes?: string;
      };

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ ok: false, error: "name is required" });
    }

    const safeLatitude = toOptionalNumber(latitude);
    const safeLongitude = toOptionalNumber(longitude);
    const safeRating = toOptionalNumber(rating);

    const result = await pool.query(
      `INSERT INTO saved_places (collection_id, name, category, address, latitude, longitude, provider_place_id, image_url, rating, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        collectionId,
        name.trim(),
        category ?? null,
        address ?? null,
        safeLatitude,
        safeLongitude,
        providerPlaceId ?? null,
        imageUrl ?? null,
        safeRating,
        notes ?? null,
      ]
    );

    return res.status(201).json({ ok: true, savedPlace: result.rows[0] });
  } catch (error: any) {
    console.error(error);
    const errorMessage =
      process.env.NODE_ENV === "production"
        ? "Server Error"
        : error?.message || "Server Error";
    return res.status(500).json({ ok: false, error: errorMessage });
  }
});

spotlyServer.delete("/saved-places/:savedPlacesId", requireAuth, async (req: AuthRequest, res) => {
  try {
    await initializeServerOnce();
    const userId = req.userId!;
    const savedPlacesId = Number(req.params.savedPlacesId);

    if (!Number.isFinite(savedPlacesId)) {
      // FIX: was res.send(500) which crashes
      return res.status(400).json({ ok: false, error: "invalid savedPlacesId" });
    }

    const result = await pool.query(
      `DELETE FROM saved_places sp
       USING collections c
       WHERE sp.id = $1
         AND sp.collection_id = c.id
         AND c.user_id = $2
       RETURNING sp.*`,
      [savedPlacesId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ ok: false, error: "Saved place not found or not authorized" });
    }

    return res.json({ ok: true, deleted: result.rows[0] });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ ok: false, error: "Server Error" });
  }
});
// END OF SAVED + COLLECTION REQUESTS

// PROFILE REQUESTS
spotlyServer.get("/profile", requireAuth, async (req: AuthRequest, res) => {
  try {
    await initializeServerOnce();
    const userId = req.userId!;

    const result = await pool.query(
      `SELECT
         u.id,
         u.email,
         u.full_name,
         u.avatar_url,
         u.created_at,
         COUNT(sp.id)::INT AS spots_saved
       FROM users u
       LEFT JOIN collections c ON c.user_id = u.id
       LEFT JOIN saved_places sp ON sp.collection_id = c.id
       WHERE u.id = $1
       GROUP BY u.id, u.email, u.full_name, u.avatar_url, u.created_at`,
      [userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ ok: false, error: "Profile not found" });
    }

    return res.json({ ok: true, profile: result.rows[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, error: "Database error" });
  }
});

spotlyServer.patch("/profile", requireAuth, async (req: AuthRequest, res) => {
  try {
    await initializeServerOnce();
    const userId = req.userId!;
    const { fullName, avatarUrl } = req.body as {
      fullName?: string;
      avatarUrl?: string;
    };

    const cleanFullName =
      typeof fullName === "string" && fullName.trim().length > 0
        ? fullName.trim()
        : null;
    const cleanAvatarUrl =
      typeof avatarUrl === "string" && avatarUrl.trim().length > 0
        ? avatarUrl.trim()
        : null;

    const result = await pool.query(
      `UPDATE users
       SET full_name = $1,
           avatar_url = $2
       WHERE id = $3
       RETURNING id, email, full_name, avatar_url, created_at`,
      [cleanFullName, cleanAvatarUrl, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ ok: false, error: "Profile not found" });
    }

    return res.json({ ok: true, profile: result.rows[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, error: "Database error" });
  }
});
// END OF PROFILE REQUESTS

// LOGIN + AUTH REQUESTS
spotlyServer.post("/auth/register", async (req, res) => {
  try {
    await initializeServerOnce();
    // FIX: added fullName so frontend field isn't ignored
    const { email, password, fullName } = req.body as {
      email?: string;
      password?: string;
      fullName?: string;
    };

    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }
    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ error: "email and password must be strings" });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (password.length < 8) {
      return res.status(400).json({ error: "password must be at least 8 characters" });
    }

    const specialChars = "`!@#$%^&*()_+-=[]{};':\"\\|,.<>/?~";
    let hasSpecial = false;
    let hasLower = false;
    let hasUpper = false;

    for (const ch of password) {
      if (ch >= "a" && ch <= "z") hasLower = true;
      else if (ch >= "A" && ch <= "Z") hasUpper = true;
      else if (specialChars.includes(ch)) hasSpecial = true;
    }

    if (!hasSpecial || !hasLower || !hasUpper) {
      return res.status(400).json({
        error: "password must include 1 uppercase, 1 lowercase, and 1 special character",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name)
       VALUES ($1, $2, $3)
       RETURNING id, email, full_name, avatar_url, created_at`,
      [cleanEmail, hashedPassword, fullName?.trim() || null]
    );

    const newUser = result.rows[0];

    // FIX: register now signs and returns a JWT token so frontend works immediately
    const secretToken = getJwtSecret();
    const expiresIn = getJwtExpiresIn();
    const signOptions: SignOptions = { expiresIn };
    const token = jwt.sign({ userId: newUser.id }, secretToken, signOptions);
    const registerDisplayName =
      newUser.full_name?.trim() || newUser.email?.split("@")[0] || null;

    return res.status(201).json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: registerDisplayName,
        avatarUrl: newUser.avatar_url,
        createdAt: newUser.created_at,
      },
    });
  } catch (error: any) {
    if (error?.code === "23505") {
      return res.status(409).json({ error: "email already in use" });
    }
    console.error(error);
    return res.status(500).json({ error: "internal server error" });
  }
});

spotlyServer.post("/auth/login", async (req, res) => {
  try {
    await initializeServerOnce();
    const { email, password } = req.body as { email?: string; password?: string };
    
    if (!email || !password) {
      return res.status(400).json({ error: "email and password required" });
    }

    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ error: "email and password must be strings" });
    }

    const lowerCaseEmail = email.trim().toLowerCase();

    const userResult = await pool.query(
      `SELECT id, email, full_name, avatar_url, password_hash, created_at
       FROM users
       WHERE email = $1`,
      [lowerCaseEmail]
    );

    if (userResult.rowCount === 0) {
      return res.status(401).json({ error: "invalid credentials" });
    }

    const user = userResult.rows[0];

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "invalid credentials" });
    }

    const secretToken = getJwtSecret();
    const expiresIn = getJwtExpiresIn();

    const signOptions: SignOptions = { expiresIn };
    const token = jwt.sign({ userId: user.id }, secretToken, signOptions);
    const loginDisplayName =
      user.full_name?.trim() || user.email?.split("@")[0] || null;

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: loginDisplayName,
        avatarUrl: user.avatar_url,
        createdAt: user.created_at,
      },
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: "internal server error" });
  }
});
// END OF LOGIN + AUTH REQUESTS

const PORT = Number(process.env.PORT) || 5000;

export default spotlyServer;

if (!process.env.VERCEL) {
  initializeServerOnce()
    .then(() => {
      spotlyServer.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
      });
    })
    .catch((error) => {
      console.error("Failed to initialize database schema:", error);
      process.exit(1);
    });
}
