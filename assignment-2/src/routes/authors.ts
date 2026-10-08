import { Router } from "express";
import { db } from "../database";
import * as middleware from "../middleware";
import type { ValidatedLocals } from "../types";

const router = Router();

// -----------------------
// Helper (provided)
// -----------------------
function isErrorWithMessage(e: unknown): e is { message: string } {
  return (
    typeof e === "object" &&
    e !== null &&
    "message" in e &&
    typeof (e as { message?: unknown }).message === "string"
  );
}

// -----------------------
// GET /api/authors
// -----------------------
/**
 * List authors with optional query parameters.
 *
 * Requirements:
 * - Apply validateAuthorQueryParams middleware
 * - Read the validated query parameters from res.locals
 * - Pass the validated query object to db.getAllAuthors(...)
 * - If no query parameters are provided, pass an empty object
 * - Return the result as JSON
 */
router.get(
  "/",
  // TODO: attach validateAuthorQueryParams middleware
  middleware.validateAuthorQueryParams,
  async (req, res) => {
    // TODO: read validated query params from res.locals
    // const { authorQuery } = res.locals as ValidatedLocals;
    const { authorQuery } = res.locals as ValidatedLocals;
    // TODO: call db.getAllAuthors with the validated query object
    //       Use an empty object if authorQuery is undefined.
    const result = await db.getAllAuthors(authorQuery ?? {});
    // TODO: return the result as JSON
    return res.json(result);
  },
);

// -----------------------
// GET /api/authors/:id
// -----------------------
/**
 * Get a single author by id.
 *
 * Requirements:
 * - Apply validateResourceId middleware
 * - Extract the validated id using middleware.requireId
 * - If author not found: return 404
 * - Otherwise: return author as JSON
 */
router.get(
  "/:id",
  // TODO: attach validateResourceId middleware
  middleware.validateResourceId,
  async (req, res) => {
    // TODO: extract the validated id using middleware.requireId
    const id = middleware.requireId(res);
    // TODO: await db.getAuthorById
    const author = await db.getAuthorById(id);
    // TODO: if not found, return res.status(404).json({ error: "Author not found" });
    if (!author) {
      return res.status(404).json({ error: "Author not found" });
    }
    // TODO: res.json(author);
    return res.json(author);
  },
);

// -----------------------
// POST /api/authors
// -----------------------
/**
 * Create a new author.
 *
 * Requirements:
 * - Validate request body using validateAuthorInput
 * - If validation errors exist: return 400 with error messages
 * - Call db.createAuthor
 * - Return 201 with created author
 */
router.post("/", async (req, res) => {
  // TODO: validate input using middleware.validateAuthorInput(req.body)
  const errors = middleware.validateAuthorInput(req.body);
  // TODO: if errors exist, return 400 Validation Error
  if (errors.length > 0) {
    return res.status(400).json({ error: "Validation Error", messages: errors });
  }
  // TODO: await db.createAuthor
  const author = await db.createAuthor(req.body);
  // TODO: return 201 with created author
  return res.status(201).json(author);
});

// -----------------------
// PUT /api/authors/:id
// -----------------------
/**
 * Update an existing author.
 *
 * Requirements:
 * - Apply validateResourceId middleware
 * - Validate request body
 * - If validation errors exist: return 400
 * - Call db.updateAuthor
 * - If author not found: return 404
 * - Otherwise: return updated author
 */
router.put(
  "/:id",
  // TODO: attach validateResourceId middleware
  middleware.validateResourceId,
  async (req, res) => {
    // TODO: validate input
    const errors = middleware.validateAuthorInput(req.body);
    if (errors.length > 0) {
      return res
        .status(400)
        .json({ error: "Validation Error", messages: errors });
    }
    // TODO: get authorId with middleware.requireId
    const authorId = middleware.requireId(res);
    // TODO: const updated = await db.updateAuthor
    const updated = await db.updateAuthor(authorId, req.body);
    // TODO: if updated is null, return 404
    if (!updated) {
      return res.status(404).json({ error: "Author not found" });
    }
    // TODO: return updated author
    return res.json(updated);
  },
);

// -----------------------
// DELETE /api/authors/:id
// -----------------------
/**
 * Delete an author.
 *
 * Requirements:
 * - Apply validateResourceId middleware
 * - If author does not exist: return 404
 * - Enforce "only author" constraint:
 *   - If db.deleteAuthor throws a constraint error:
 *     return 400 with a Constraint Error message
 * - On success: return 204 No Content
 */
router.delete(
  "/:id",
  // TODO: attach validateResourceId middleware
  middleware.validateResourceId,
  async (req, res) => {
    // TODO: const authorId = middleware.requireId(res);
    const authorId = middleware.requireId(res);

    // TODO: check author existence via db.getAuthorById
    //       if not found, return 404
    const author = await db.getAuthorById(authorId);
    if (!author) {
      return res.status(404).json({ error: "Author not found" });
    }

    try {
      // TODO: await db.deleteAuthor
      await db.deleteAuthor(authorId);
      // TODO: return 204 No Content
      return res.status(204).send();
    } catch (e: unknown) {
      // TODO: detect "only author" constraint error
      // Hint: use isErrorWithMessage(e) and check e.message
      // If matched, return 400 with a Constraint Error
      const constraintMessage =
        "Cannot delete author: they are the only author of one or more papers";
      if (isErrorWithMessage(e) && e.message === constraintMessage) {
        return res.status(400).json({
          error: "Constraint Error",
          message: constraintMessage,
        });
      }
      throw e;
    }
  },
);

export default router;