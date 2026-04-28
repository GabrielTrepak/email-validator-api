import { Router } from "express";
import { validateEmail, normalizeEmail } from "../services/email.service";

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