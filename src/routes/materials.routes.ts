import { Router } from "express";
import { dbQuery } from "../utils/db";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

/**
 * @route GET /api/materials
 * @desc Get all materials
 * @access Protected
 */
router.get("/", authenticateToken, async (req, res) => {
  try {
    const result = await dbQuery(
      `SELECT id, material_code, material_name, category, unit, specifications, description, created_at
       FROM materials
       ORDER BY created_at DESC
       LIMIT 50`
    );

    return res.json({
      materials: result.rows,
      pagination: {
        total: result.rows.length,
        limit: 50,
        offset: 0,
        hasMore: false
      }
    });
  } catch (err) {
    console.error("Error fetching materials:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * @route POST /api/materials
 * @desc Create a new material
 * @access Protected
 */
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { material_code, material_name, category, unit, specifications, description } = req.body;

    if (!material_code || !material_name || !category || !unit) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await dbQuery(
      `INSERT INTO materials (material_code, material_name, category, unit, specifications, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [material_code, material_name, category, unit, specifications || {}, description || ""]
    );

    return res.status(201).json({
      message: "Material created successfully",
      material: result.rows[0]
    });
  } catch (err) {
    console.error("Error creating material:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
