import { Router } from "express";
import { getCachedLocalPlaces, getLocalPlaces } from "../services/serpApi";

const router = Router();

router.get(
  "/places/cached",
  async (req, res) => {
    try {
      const query =
        typeof req.query.q === "string" && req.query.q.trim().length > 0
          ? req.query.q
          : "restaurants";
      const location =
        typeof req.query.location === "string" &&
        req.query.location.trim().length > 0
          ? req.query.location
          : "Toronto, Ontario, Canada";
      const limit =
        typeof req.query.limit === "string" &&
        Number.isFinite(Number(req.query.limit))
          ? Number(req.query.limit)
          : 24;

      const data = await getCachedLocalPlaces(query, location, limit);

      if (!data) {
        return res
          .status(404)
          .json({ error: "No cached places found for this category and location" });
      }

      res.json(data);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch cached places" });
    }
  }
);

router.get(
  "/places",
  async (req, res) => {
    try {
      const query =
        typeof req.query.q === "string" && req.query.q.trim().length > 0
          ? req.query.q
          : "restaurants";
      const location =
        typeof req.query.location === "string" &&
        req.query.location.trim().length > 0
          ? req.query.location
          : "Toronto, Ontario, Canada";
      const limit =
        typeof req.query.limit === "string" &&
        Number.isFinite(Number(req.query.limit))
          ? Number(req.query.limit)
          : 24;

      const data = await getLocalPlaces(query, location, limit);
      res.json(data);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch places" });
    }
  }
);

export default router;
