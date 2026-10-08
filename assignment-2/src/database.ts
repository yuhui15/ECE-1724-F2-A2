import type { Prisma } from "../generated/prisma/client";
import { prisma } from "./lib/prisma";
import type { AuthorCreateData, PaperCreateData } from "./types";

// -------------------------
// Provided helper: detect Prisma "record not found" errors
// -------------------------
/**
 * Returns true when Prisma reports that an update or delete targeted
 * a record that does not exist.
 *
 * You may use this helper directly in your implementation.
 * You do NOT need to modify or reimplement it.
 */
function isPrismaRecordNotFound(e: unknown): boolean {
  // Prisma uses error code "P2025" when an update/delete
  // targets a record that does not exist.
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code?: string }).code === "P2025"
  );
}

// -------------------------
// Filter types (provided)
// -------------------------
export type GetPapersFilters = {
  year?: number;
  publishedIn?: string;
  limit?: number;
  offset?: number;
};

export type GetAuthorsFilters = {
  name?: string;
  affiliation?: string;
  limit?: number;
  offset?: number;
};

// -------------------------
// TODO: helper to find-or-create an author, returning { id }
// -------------------------
/**
 * Given a validated author object, return an existing author id if an identical
 * author already exists; otherwise create a new author and return its id.
 *
 * Notes:
 * - For optional fields, normalize `undefined` to `null`.
 *   In Prisma filters, `undefined` means the field is not used as a filter,
 *   while `null` matches a database NULL value.
 * - If multiple identical authors exist, pick the one with the lowest id.
 */
async function findOrCreateAuthorId(
  author: AuthorCreateData,
): Promise<{ id: number }> {
  // TODO:
  // 1) Try prisma.author.findFirst({ where: ..., orderBy: { id: "asc" } })
  // 2) If found, return { id: existing.id }
  // 3) Otherwise prisma.author.create({ data: ... }) and return { id: created.id }
}

// -------------------------
// Database API (students implement TODO parts)
// -------------------------
export const db = {
  // -------------------------
  // Papers
  // -------------------------

  /**
   * Create a paper with its authors (many-to-many).
   *
   * Requirements:
   * - For each author in paperData.authors:
   *   - find an existing author or create a new author
   * - Create the paper
   * - Connect the authors to the paper
   * - Include authors in the returned object, ordered by id ascending
   */
  async createPaper(paperData: PaperCreateData) {
    // TODO:
    // 1. For each author in paperData.authors, call findOrCreateAuthorId(author).
    //    This helper is asynchronous, so each call returns a Promise.
    //
    // 2. Wait for all of those Promises to finish and collect the resulting
    //    author IDs into an array.
    //
    //    Hint: Promise.all(...) can be used to wait for an array of Promises.
    //
    // TODO:
    // Create the paper with prisma.paper.create(...):
    // - set title, publishedIn, and year
    // - connect the authors using the collected author IDs
    // - include authors in the returned result, ordered by ascending id
    //
    // Note:
    // Using a helper like `findOrCreateAuthorId` is one valid approach.
    // You may implement createPaper in other ways.
  },

  /**
   * Get papers with optional filters and pagination.
   *
   * Requirements:
   * - Support filtering by:
   *   - year (exact match)
   *   - publishedIn (case-insensitive partial match)
   * - Support pagination:
   *   - limit (default 10)
   *   - offset (default 0)
   */
  async getAllPapers(filters: GetPapersFilters) {
    const { year, publishedIn, limit = 10, offset = 0 } = filters;

    const where: Prisma.PaperWhereInput = {};

    // TODO: Create a Prisma `where` object for filtering papers
    // - If `year` is provided, filter by exact year
    // - If `publishedIn` is provided, perform a case-insensitive partial match

    // TODO: Use the Prisma `$transaction` API to execute these two sequential operations:
    // 1) get a paginated list of papers matching the filters
    // 2) count the total number of matching papers (ignoring pagination)
    //
    // See:
    // https://www.prisma.io/docs/orm/v7/prisma-client/queries/transactions#sequential-operations

    // TODO: When fetching papers:
    // - include authors
    // - order papers by id (ascending)
    // - order authors by id (ascending)
    // - apply `limit` and `offset`

    const [papers, total] = await prisma.$transaction([
      // TODO: Query papers
      // TODO: Count matching papers
    ]);

    // TODO: Return:
    // { papers, total, limit, offset }
  },

  /**
   * Get a single paper by id.
   *
   * Requirements:
   * - Return the paper (or null if not found) including authors ordered by id ascending
   */
  async getPaperById(id: number) {
    // Hint: use await prisma.paper.findUnique()
  },

  /**
   * Update a paper by id.
   *
   * Requirements:
   * - Re-connect authors based on the provided paperData.authors
   * - If the paper does not exist, return null (normalize Prisma P2025),
   *   so routes can do `if (!paper) return 404`
   * - Include authors ordered by id ascending
   *
   * Hint:
   * - When updating many-to-many authors:
   *   - clear existing links (set: [])
   *   - connect new ones (connect: authorIds)
   */
  async updatePaper(id: number, paperData: PaperCreateData) {
    // TODO: compute authorIds from paperData.authors
    // - each author must exist in the database
    // - you may need to query or create authors first
    //
    // TODO: perform prisma.paper.update in a try/catch
    // - update paper fields and re-connect authors
    // - on Prisma P2025 => return null
    // - otherwise, rethrow the error
  },

  /**
   * Delete a paper by id.
   *
   * Requirements:
   * - If the paper existed and was deleted, return true
   * - If the paper did not exist, return false (normalize Prisma P2025)
   */
  async deletePaper(id: number) {
    // TODO: prisma.paper.delete in try/catch
    // - on P2025 => return false
    // - otherwise rethrow
    // - on success => return true
  },

  // -------------------------
  // Authors
  // -------------------------

  /**
   * Create an author.
   *
   * Requirements:
   * - Create the author with optional nullable fields
   * - Include papers ordered by id ascending in the returned object
   */
  async createAuthor(authorData: AuthorCreateData) {
    // TODO: prisma.author.create({ data: ..., include: { papers: { orderBy: { id: "asc" }}}})
  },

  /**
   * Get authors with optional filters and pagination.
   *
   * Requirements:
   * - Support filtering by:
   *   - name (case-insensitive partial match)
   *   - affiliation (case-insensitive partial match)
   * - Support pagination (limit default 10, offset default 0)
   * - Return authors ordered by id ascending
   * - Also return total count matching filters
   */
  async getAllAuthors(filters: GetAuthorsFilters) {
    const { name, affiliation, limit = 10, offset = 0 } = filters;

    const where: Prisma.AuthorWhereInput = {};

    // TODO: Create a Prisma `where` object for filtering authors
    // - If `name` is provided, perform a case-insensitive partial match (mode: "insensitive")
    // - If `affiliation` is provided, perform a case-insensitive partial match (mode: "insensitive")

    // TODO: Use the Prisma `$transaction` API to execute these two sequential operations:
    // 1) get a paginated list of authors matching the filters
    // 2) count the total number of matching authors (ignoring pagination)
    //
    // See:
    // https://www.prisma.io/docs/orm/v7/prisma-client/queries/transactions#sequential-operations

    // TODO: When fetching authors:
    // - include papers
    // - order authors by id (ascending)
    // - order papers by id (ascending)
    // - apply `limit` and `offset`

    const [authors, total] = await prisma.$transaction([
      // TODO: Query authors
      // TODO: Count matching authors
    ]);

    // TODO: Return:
    // { authors, total, limit, offset }
  },

  /**
   * Get a single author by id.
   *
   * Requirements:
   * - Return the author (or null) including papers ordered by id ascending
   */
  async getAuthorById(id: number) {
    // Hint: use prisma.author.findUnique()
  },

  /**
   * Update an author by id.
   *
   * Requirements:
   * - If the author does not exist, return null (normalize Prisma P2025)
   * - Include papers ordered by id ascending
   */
  async updateAuthor(id: number, authorData: AuthorCreateData) {
    // TODO: prisma.author.update in try/catch
    // - on P2025 => return null
    // - otherwise rethrow
  },

  /**
   * Delete an author by id.
   *
   * Requirements:
   * - If author does not exist: do nothing
   * - Enforce the "only author" constraint:
   *   - If the author is the only author of one or more papers, throw an Error
   * - Otherwise, delete the author
   *
   * Hint:
   * - First fetch the author including their papers and each paper's authors
   * - Then check if any paper has only one author
   */
  async deleteAuthor(id: number) {
    // TODO: fetch the author with nested include
    // TODO: if not found, return;
    // TODO: enforce only-author constraint (throw Error)
    // TODO: delete the author
    // Hint: use prisma.author.delete();
  },
};
