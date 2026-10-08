import { Router } from "express";
import { db } from "../database";
import * as middleware from "../middleware";
import type { ValidatedLocals } from "../types";

const router = Router();

// -----------------------
// GET /api/papers
// -----------------------
/**
 * List papers with optional query parameters.
 *
 * Requirements:
 * - Apply validatePaperQueryParams middleware
 * - Read the validated query parameters from res.locals
 * - Pass the validated query object to db.getAllPapers(...)
 * - If no query parameters are provided, pass an empty object
 * - Return the result as JSON
 */
router.get(
  "/",
  // TODO: attach validatePaperQueryParams middleware
  middleware.validatePaperQueryParams,
  async (req, res) => {
    // TODO: read validated query params from res.locals
    // const { paperQuery } = res.locals as ValidatedLocals;
    const { paperQuery } = res.locals as ValidatedLocals;
    // TODO: call db.getAllPapers with the validated query object
    //       Use an empty object if paperQuery is undefined.
    const result = await db.getAllPapers(paperQuery ?? {});
    // TODO: return the result as JSON
    return res.json(result);
  },
);

// -----------------------
// GET /api/papers/:id
// -----------------------
/**
 * Get a single paper by id.
 *
 * Requirements:
 * - Apply validateResourceId middleware
 * - Extract validated id using middleware.requireId
 * - If paper not found: return 404
 * - Otherwise: return paper as JSON
 */
router.get(
  "/:id",
  // TODO: attach validateResourceId middleware
  middleware.validateResourceId,
  async (req, res) => {
    // TODO: use middleware.requireId(res);
    const id = middleware.requireId(res);
    // TODO: await db.getPaperById
    const paper = await db.getPaperById(id);
    // TODO: if not found, return 404
    if (!paper) {
      return res.status(404).json({ error: "Paper not found" });
    }
    // TODO: res.json(paper);
    return res.json(paper);
  },
);

// -----------------------
// POST /api/papers
// -----------------------
/**
 * Create a new paper.
 *
 * Requirements:
 * - Validate request body using validatePaperInput
 * - If validation errors exist: return 400 with error messages
 * - Call db.createPaper
 * - Return 201 with created paper
 */
router.post("/", async (req, res) => {
  // TODO: validate input using middleware.validatePaperInput(req.body)
  const errors = middleware.validatePaperInput(req.body);
  // TODO: if errors exist, return 400 Validation Error
  if (errors.length > 0) {
    return res.status(400).json({ error: "Validation Error", messages: errors });
  }
  // TODO:await db.createPaper
  const paper = await db.createPaper(req.body);
  // TODO: return 201 with created paper
  return res.status(201).json(paper);
});

// -----------------------
// PUT /api/papers/:id
// -----------------------
/**
 * Update an existing paper.
 *
 * Requirements:
 * - Apply validateResourceId middleware
 * - Validate request body
 * - If validation errors exist: return 400
 * - Call db.updatePaper
 * - If paper not found: return 404
 * - Otherwise: return updated paper
 */
router.put(
  "/:id",
  // TODO: attach validateResourceId middleware
  middleware.validateResourceId,
  async (req, res) => {
    // TODO: validate input
    const errors = middleware.validatePaperInput(req.body);
    if (errors.length > 0) {
      return res
        .status(400)
        .json({ error: "Validation Error", messages: errors });
    }
    // TODO: use middleware.requireId(res)
    const id = middleware.requireId(res);
    // TODO: const updated = await db.updatePaper
    const updated = await db.updatePaper(id, req.body);
    // TODO: if updated is null, return 404
    if (!updated) {
      return res.status(404).json({ error: "Paper not found" });
    }
    // TODO: return updated paper
    return res.json(updated);
  },
);

// -----------------------
// DELETE /api/papers/:id
// -----------------------
/**
 * Delete a paper.
 *
 * Requirements:
 * - Apply validateResourceId middleware
 * - If paper does not exist: return 404
 * - Otherwise: delete and return 204 No Content
 */
router.delete(
  "/:id",
  // TODO: attach validateResourceId middleware
  middleware.validateResourceId,
  async (req, res) => {
    // TODO: use middleware.requireId
    const id = middleware.requireId(res);
    // TODO: check existence via db.getPaperById
    //       if not found, return 404
    const paper = await db.getPaperById(id);
    if (!paper) {
      return res.status(404).json({ error: "Paper not found" });
    }
    // TODO: await db.deletePaper
    await db.deletePaper(id);
    // TODO: return 204 No Content
    return res.status(204).send();
  },
);

export default router;