import { Router } from "express";
import { validateEmail, normalizeEmail } from "../services/email.service";

/**
 * @swagger
 * /api/v1/email/validate:
 *   post:
 *     summary: Validate email address
 *     tags: [Email]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "test@email.com"
 *     responses:
 *       200:
 *         description: Validation result
 */

/**
 * @swagger
 * /api/v1/email/normalize:
 *   post:
 *     summary: Normalize email address
 *     tags: [Email]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "USER@EMAIL.COM"
 *     responses:
 *       200:
 *         description: Normalized email
 */


const router = Router();

router.post("/validate", (req, res, next) => {
  try {
    const result = validateEmail(req.body);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/normalize", (req, res, next) => {
  try {
    const result = normalizeEmail(req.body);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

export default router;