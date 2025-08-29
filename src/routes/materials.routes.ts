import { Router } from 'express';
import { MaterialModel } from '../models/material.model';

const router = Router();

/**
 * @route GET /api/materials
 * @desc Get all materials
 */
router.get('/', async (req, res) => {
  try {
    const materials = await MaterialModel.findAll();
    res.json({
      materials,
      pagination: {
        total: materials.length,
        limit: 50,
        offset: 0,
        hasMore: false
      }
    });
  } catch (err) {
    console.error('Error fetching materials:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route POST /api/materials
 * @desc Add a new material
 */
router.post('/', async (req, res) => {
  try {
    const { material_code, material_name, category, unit, specifications, description } = req.body;

    // Simple validation
    if (!material_code || !material_name) {
      return res.status(400).json({ error: 'material_code and material_name are required' });
    }

    // Create new record
    const newMaterial = await MaterialModel.create({
      material_code,
      material_name,
      category,
      unit,
      specifications: specifications || {},
      description
    });

    res.status(201).json({
      message: 'Material created successfully',
      material: newMaterial
    });
  } catch (err) {
    console.error('Error creating material:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
