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
  async (req, res) => {
    // TODO: read validated query params from res.locals
    // const { paperQuery } = res.locals as ValidatedLocals;
    // TODO: call db.getAllPapers with the validated query object
    //       Use an empty object if paperQuery is undefined.
    // TODO: return the result as JSON
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
  async (req, res) => {
    // TODO: use middleware.requireId(res);
    // TODO: await db.getPaperById
    // TODO: if not found, return 404
    // TODO: res.json(paper);
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
  // TODO: if errors exist, return 400 Validation Error
  // TODO:await db.createPaper
  // TODO: return 201 with created paper
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
  async (req, res) => {
    // TODO: validate input
    // TODO: use middleware.requireId(res)
    // TODO: const updated = await db.updatePaper
    // TODO: if updated is null, return 404
    // TODO: return updated paper
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
  async (req, res) => {
    // TODO: use middleware.requireId
    // TODO: check existence via db.getPaperById
    //       if not found, return 404
    // TODO: await db.deletePaper
    // TODO: return 204 No Content
  },
);

export default router;
