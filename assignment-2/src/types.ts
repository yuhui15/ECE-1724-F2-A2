// Centralized custom types used across routes, middleware, and database layer.

/**
 * Provided: Raw author data coming from request bodies.
 * Fields are optional because user input may be incomplete.
 */
export type AuthorBody = {
  name?: string;
  email?: string | null;
  affiliation?: string | null;
};

/**
 * TODO: Define the raw paper data coming from request bodies.
 *
 * Notes:
 * - Request body fields may be missing, so properties should be optional.
 * - A paper may include an array of authors in the request body.
 */
export type PaperBody = {
  // TODO
  title?: string;
  publishedIn?: string;
  year?: number;
  authors?: AuthorBody[];
};

/**
 * TODO: Define the author data used by the database layer
 * after request validation.
 *
 * - `name` is required.
 * - `email` and `affiliation` are optional.
 * - Optional fields may be omitted or set to `null`.
 */
export type AuthorCreateData = {
  // TODO
  name: string;
  email?: string | null;
  affiliation?: string | null;
};

/**
 * TODO: Define the paper data used by the database layer
 * after request validation.
 *
 * - `title` and `publishedIn` are required strings.
 * - `year` is a required number.
 * - `authors` is a required array of validated author data.
 */
export type PaperCreateData = {
  // TODO
  title: string;
  publishedIn: string;
  year: number;
  authors: AuthorCreateData[];
};

/**
 * Provided: validated query params for GET /api/papers
 *
 * - Used in middleware
 * - Prevents repeated "as any" casting on req.query and keeps code readable
 */
export type ValidatedPaperQuery = {
  year?: number;
  publishedIn?: string;
  limit?: number;
  offset?: number;
};

/**
 * Provided: validated query params for GET /api/authors
 */
export type ValidatedAuthorQuery = {
  name?: string;
  affiliation?: string;
  limit?: number;
  offset?: number;
};

/**
 * Provided: values stored in `res.locals` by validation middleware.
 *
 * Validation middleware parses and validates request data, then stores
 * the validated values in `res.locals` for route handlers to use.
 *
 * This type describes the values that may be stored there.
 */
export type ValidatedLocals = {
  id?: number;
  paperQuery?: ValidatedPaperQuery;
  authorQuery?: ValidatedAuthorQuery;
};