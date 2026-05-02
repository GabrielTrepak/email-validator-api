import { Router } from "express";
import {
  validateEmail,
  normalizeEmail,
  validateEmailBatch,
} from "../services/email.service";

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

function extractEmailFromBody(body: any): {
  email: string | null;
  corrected: boolean;
} {
  if (body?.email && typeof body.email === "string") {
    return {
      email: body.email,
      corrected: false,
    };
  }

  const keys = Object.keys(body || {});

  if (keys.length === 1) {
    try {
      const parsed = JSON.parse(keys[0]);

      if (parsed?.email && typeof parsed.email === "string") {
        return {
          email: parsed.email,
          corrected: true,
        };
      }
    } catch {
      // Invalid JSON string key. Ignore and return null below.
    }
  }

  return {
    email: null,
    corrected: false,
  };
}

function extractEmailsFromBody(body: any): {
  emails: string[] | null;
  corrected: boolean;
} {
  if (Array.isArray(body?.emails)) {
    return {
      emails: body.emails,
      corrected: false,
    };
  }

  if (body?.email && typeof body.email === "string") {
    return {
      emails: [body.email],
      corrected: true,
    };
  }

  const keys = Object.keys(body || {});

  if (keys.length === 1) {
    try {
      const parsed = JSON.parse(keys[0]);

      if (Array.isArray(parsed?.emails)) {
        return {
          emails: parsed.emails,
          corrected: true,
        };
      }

      if (parsed?.email && typeof parsed.email === "string") {
        return {
          emails: [parsed.email],
          corrected: true,
        };
      }
    } catch {
      // Invalid JSON string key. Ignore and return null below.
    }
  }

  return {
    emails: null,
    corrected: false,
  };
}

router.post("/validate", async (req, res, next) => {
  const startTime = Date.now();
  try {
    const { email, corrected } = extractEmailFromBody(req.body);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Invalid request body. Expected: { email: string }",
        example: {
          email: "test@gmail.com",
        },
      });
    }

    const result = await validateEmail({ email });

    return res.json({
      success: true,
      data: result,
      meta: {
        correctedInput: corrected,
        processingTimeMs: Date.now() - startTime,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/quick", async (req, res, next) => {
  const startTime = Date.now();

  try {
    const email = req.query.email;

    if (!email || typeof email !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid query parameter. Expected: ?email=test@gmail.com",
        example: "/api/v1/email/quick?email=test@gmail.com",
      });
    }

    const result = await validateEmail({ email });

    return res.json({
      success: true,
      data: result,
      meta: {
        correctedInput: false,
        processingTimeMs: Date.now() - startTime,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/validate/batch", async (req, res, next) => {
  const startTime = Date.now();
  try {
    const { emails, corrected } = extractEmailsFromBody(req.body);

    if (!emails) {
      return res.status(400).json({
        success: false,
        message: "Invalid request body. Expected: { emails: string[] }",
        example: {
          emails: ["test@gmail.com", "admin@gmail.com"],
        },
      });
    }

    const result = await validateEmailBatch({ emails });

    return res.json({
      success: true,
      data: result.results,
      meta: {
        ...result.meta,
        correctedInput: corrected,
        processingTimeMs: Date.now() - startTime,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/normalize", (req, res, next) => {
  try {
    const { email, corrected } = extractEmailFromBody(req.body);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Invalid request body. Expected: { email: string }",
        example: {
          email: " USER@Example.COM ",
        },
      });
    }

    const result = normalizeEmail({ email });

    return res.json({
      success: true,
      data: result,
      meta: {
        correctedInput: corrected,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;