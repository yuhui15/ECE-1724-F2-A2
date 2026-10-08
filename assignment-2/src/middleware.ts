// This file contains reusable validation helpers and Express middleware.
//
// You DO NOT need to modify requestLogger, errorHandler, or requireId.
// Your task is to implement:
//   - validatePaperInput
//   - validateAuthorInput
//   - validateResourceId
//   - validatePaperQueryParams
//   - validateAuthorQueryParams

import type { NextFunction, Request, Response } from "express";
import type {
  AuthorBody,
  PaperBody,
  ValidatedAuthorQuery,
  ValidatedLocals,
  ValidatedPaperQuery,
} from "./types";

// -----------------------
// Request logger middleware
// -----------------------
export const requestLogger = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
};

// -----------------------
// Error handler middleware
// -----------------------
export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error(err);

  // If a response has already been sent, let Express handle it
  if (res.headersSent) return next(err);

  return res.status(500).json({
    error: "Internal Server Error",
    message: "An unexpected error occurred",
  });
};

// -----------------------
// validatePaperInput
// -----------------------
/**
 * Validation helper: validate a paper object from the request body.
 *
 * Return value:
 * - Return an array of error messages (strings).
 * - Return [] if there are no validation errors.
 *
 * See handout for requirements to validate:
 * - title: required, must be a non-empty string
 * - publishedIn: required, must be a non-empty string
 * - year: required, must be an integer > 1900
 * - authors: required, must be a non-empty array
 *   - each author must have a valid name
 */
export const validatePaperInput = (paper: PaperBody): string[] => {
  const errors: string[] = [];

  // TODO: validate paper.title
  // (guard against a missing request body)
  const body = (paper ?? {}) as PaperBody;
  if (typeof body.title !== "string" || body.title.trim() === "") {
    errors.push("Title is required");
  }

  // TODO: validate paper.publishedIn
  if (typeof body.publishedIn !== "string" || body.publishedIn.trim() === "") {
    errors.push("Published venue is required");
  }

  // TODO: validate paper.year
  if (body.year === undefined || body.year === null) {
    errors.push("Published year is required");
  } else if (!Number.isInteger(body.year) || body.year <= 1900) {
    errors.push("Valid year after 1900 is required");
  }

  // TODO: validate paper.authors exists and is a non-empty array
  if (!Array.isArray(body.authors) || body.authors.length === 0) {
    errors.push("At least one author is required");
  } else {
    // TODO: validate each author has a valid name
    // ("Author name is required" is added only once)
    const hasInvalidName = body.authors.some(
      (a) => !a || typeof a.name !== "string" || a.name.trim() === "",
    );
    if (hasInvalidName) {
      errors.push("Author name is required");
    }
  }

  return errors;
};

// -----------------------
// validateAuthorInput
// -----------------------
/**
 * Validation helper: validate an author object from the request body.
 *
 * Return value:
 * - Return an array of error messages (strings).
 * - Return [] if there are no validation errors.
 *
 * Requirements to validate (see handout):
 * - name: required, must be a non-empty string
 */
export const validateAuthorInput = (author: AuthorBody): string[] => {
  const errors: string[] = [];

  // TODO: validate author.name
  const name = author?.name;
  if (typeof name !== "string" || name.trim() === "") {
    errors.push("Name is required");
  }

  return errors;
};

// -----------------------
// validateResourceId
// -----------------------
/**
 * Middleware: validate `:id` route parameter.
 *
 * Requirements:
 * - ID must be a positive integer
 * - On invalid ID: respond with HTTP 400 and a JSON validation error
 * - On valid ID:
 *   - parse it as a number
 *   - store it into res.locals.id
 *   - call next()
 */
export const validateResourceId = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // TODO: read the raw id from req.params.id as a string
  const rawId = String(req.params.id);
  // TODO: validate it is a positive integer
  const isValid = /^\d+$/.test(rawId) && Number(rawId) > 0;
  // TODO: if invalid, return res.status(400).json({ error: ..., message: ... })
  if (!isValid) {
    return res.status(400).json({
      error: "Validation Error",
      message: "Invalid ID format",
    });
  }

  // TODO: convert to number
  const id = Number(rawId);

  // TODO: store validated id into res.locals.id (use type ValidatedLocals)
  (res.locals as ValidatedLocals).id = id;

  // TODO: next();
  next();
};

// -----------------------
// Helper: requireId (provided)
// -----------------------
/**
 * Extracts a validated numeric `id` from `res.locals`.
 *
 * This function assumes that the `validateResourceId` middleware
 * has already run and stored a parsed number in `res.locals.id`.
 *
 * This function can be used in `src/routes/papers.ts` and
 * `src/routes/authors.ts`
 *
 * Why do we need this helper?
 * - It centralizes the runtime check in one place instead of
 *   repeating it in every route handler.
 *
 * If this function throws, it indicates a programming error
 * (the route forgot to attach `validateResourceId` middleware),
 * not a client error.
 */
export function requireId(res: Response): number {
  const { id } = res.locals as ValidatedLocals;

  if (typeof id !== "number") {
    throw new Error("validateResourceId middleware was not applied");
  }

  return id;
}

// -----------------------
// validatePaperQueryParams
// -----------------------
/**
 * Middleware: validate and parse query params for GET /api/papers
 *
 * Requirements (see handout):
 * - year (optional): must be an integer > 1900
 * - publishedIn (optional): string
 * - limit (optional): positive integer within range [1..100]
 * - offset (optional): non-negative integer
 *
 * On success:
 * - store the parsed result object in res.locals.paperQuery
 * - call next()
 *
 * On invalid query format:
 * - respond with HTTP 400 and a JSON validation error
 */
export const validatePaperQueryParams = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const parsed: ValidatedPaperQuery = {};

  // TODO: validate year (if provided)
  const isDigits = (v: unknown): v is string =>
    typeof v === "string" && /^\d+$/.test(v);
  const sendInvalid = () =>
    res.status(400).json({
      error: "Validation Error",
      message: "Invalid query parameter format",
    });
  const { year, publishedIn, limit, offset } = req.query;

  if (year !== undefined) {
    if (!isDigits(year) || Number(year) <= 1900) return sendInvalid();
    parsed.year = Number(year);
  }

  // TODO: process publishedIn (if provided)
  // (kept exactly as provided, no trimming)
  if (publishedIn !== undefined) {
    if (typeof publishedIn !== "string") return sendInvalid();
    parsed.publishedIn = publishedIn;
  }

  // TODO: validate limit (if provided)
  if (limit !== undefined) {
    if (!isDigits(limit) || Number(limit) < 1 || Number(limit) > 100) {
      return sendInvalid();
    }
    parsed.limit = Number(limit);
  }

  // TODO: validate offset (if provided)
  if (offset !== undefined) {
    if (!isDigits(offset)) return sendInvalid();
    parsed.offset = Number(offset);
  }

  // TODO: store parsed into res.locals.paperQuery
  (res.locals as ValidatedLocals).paperQuery = parsed;

  next();
};

// -----------------------
// validateAuthorQueryParams
// -----------------------
/**
 * Middleware: validate and parse query params for GET /api/authors
 *
 * Requirements (see handout):
 * - name (optional): string
 * - affiliation (optional): string
 * - limit (optional): positive integer within range [1..100]
 * - offset (optional): non-negative integer
 *
 * On success:
 * - store the parsed result object in res.locals.authorQuery
 * - call next()
 *
 * On invalid query format:
 * - respond with HTTP 400 and a JSON validation error
 */
export const validateAuthorQueryParams = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const parsed: ValidatedAuthorQuery = {};

  // TODO: process name (if provided)
  const isDigits = (v: unknown): v is string =>
    typeof v === "string" && /^\d+$/.test(v);
  const sendInvalid = () =>
    res.status(400).json({
      error: "Validation Error",
      message: "Invalid query parameter format",
    });
  const { name, affiliation, limit, offset } = req.query;

  if (name !== undefined) {
    if (typeof name !== "string") return sendInvalid();
    parsed.name = name;
  }

  // TODO: process affiliation (if provided)
  if (affiliation !== undefined) {
    if (typeof affiliation !== "string") return sendInvalid();
    parsed.affiliation = affiliation;
  }

  // TODO: validate limit (if provided)
  if (limit !== undefined) {
    if (!isDigits(limit) || Number(limit) < 1 || Number(limit) > 100) {
      return sendInvalid();
    }
    parsed.limit = Number(limit);
  }

  // TODO: validate offset (if provided)
  if (offset !== undefined) {
    if (!isDigits(offset)) return sendInvalid();
    parsed.offset = Number(offset);
  }

  // TODO: store parsed into res.locals.authorQuery
  (res.locals as ValidatedLocals).authorQuery = parsed;

  next();
};