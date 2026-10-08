import request from "supertest";
import { prisma } from "../src/lib/prisma";
import app from "../src/server";

// Start one temporary HTTP server for the entire test suite.
// Using port 0 lets the OS choose an available port automatically.
const server = app.listen(0, "127.0.0.1");

type PaperSummary = {
  id: number;
  title: string;
  publishedIn: string;
  year: number;
  createdAt: string;
  updatedAt: string;
};

type Author = {
  id: number;
  name: string;
  email: string | null;
  affiliation: string | null;
  createdAt: string;
  updatedAt: string;
  papers: PaperSummary[];
};

type AuthorsListResponse = {
  authors: Author[];
  total: number;
  limit: number;
  offset: number;
};

const ISO_8601_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;

function expectIso8601(s: unknown) {
  expect(typeof s).toBe("string");
  expect(String(s)).toMatch(ISO_8601_REGEX);
}

async function resetDb() {
  await prisma.$executeRawUnsafe(`
  TRUNCATE TABLE "Paper", "Author"
  RESTART IDENTITY
  CASCADE;
`);
}

async function seedAuthors() {
  const a1 = await request(server).post("/api/authors").send({
    name: "John Doe",
    email: "john.doe@example.com",
    affiliation: "University of Toronto",
  });

  const a2 = await request(server).post("/api/authors").send({
    name: "Jane Smith",
    email: "jane.smith@example.com",
    affiliation: "MIT",
  });

  const a3 = await request(server).post("/api/authors").send({
    name: "Alice Johnson",
    email: null,
    affiliation: null,
  });

  expect(a1.status).toBe(201);
  expect(a2.status).toBe(201);
  expect(a3.status).toBe(201);

  return {
    a1: a1.body as Author,
    a2: a2.body as Author,
    a3: a3.body as Author,
  };
}

beforeAll(async () => {
  await resetDb();
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  await prisma.$disconnect();
});

beforeEach(async () => {
  await resetDb();
});

describe("API Tests for Author Routes", () => {
  // =========================================================
  // POST /api/authors
  // =========================================================
  describe("POST /api/authors", () => {
    it("successful creation", async () => {
      const body = {
        name: "John Doe",
        email: "john.doe@example.com",
        affiliation: "University of Toronto",
      };

      const res = await request(server).post("/api/authors").send(body);

      expect(res.status).toBe(201);

      expect(typeof res.body.id).toBe("number");
      expectIso8601(res.body.createdAt);
      expectIso8601(res.body.updatedAt);

      expect(res.body.name).toBe(body.name);
      expect(res.body.email).toBe(body.email);
      expect(res.body.affiliation).toBe(body.affiliation);

      expect(Array.isArray(res.body.papers)).toBe(true);
      expect(res.body.papers).toHaveLength(0);
    });

    it("validation: request body {} returns 400", async () => {
      const res = await request(server).post("/api/authors").send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.messages).toEqual(["Name is required"]);
    });
  });

  // =========================================================
  // GET /api/authors
  // =========================================================
  describe("GET /api/authors", () => {
    it("basic retrieval", async () => {
      await seedAuthors();

      const res = await request(server).get("/api/authors");
      expect(res.status).toBe(200);

      const body = res.body as AuthorsListResponse;
      expect(Array.isArray(body.authors)).toBe(true);
      expect(body.limit).toBe(10);
      expect(body.offset).toBe(0);

      for (const a of body.authors) {
        expect(Array.isArray(a.papers)).toBe(true);
      }
    });

    it("filtering: name case-insensitive partial match", async () => {
      await seedAuthors();

      const res = await request(server).get("/api/authors?name=jOh");
      expect(res.status).toBe(200);

      const body = res.body as AuthorsListResponse;
      expect(body.authors.length).toBeGreaterThan(0);
      body.authors.forEach((a) => {
        expect(a.name.toLowerCase()).toContain("joh");
      });
    });

    it("pagination: limit and offset", async () => {
      await seedAuthors();

      const res = await request(server).get("/api/authors?limit=1&offset=1");
      expect(res.status).toBe(200);

      const body = res.body as AuthorsListResponse;
      expect(body.limit).toBe(1);
      expect(body.offset).toBe(1);
      expect(body.authors.length).toBeLessThanOrEqual(1);
    });

    it("error handling: invalid offset (-1) returns 400", async () => {
      await seedAuthors();

      const res = await request(server).get("/api/authors?offset=-1");
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.message).toBe("Invalid query parameter format");
    });
  });

  // =========================================================
  // GET /api/authors/:id
  // =========================================================
  describe("GET /api/authors/:id", () => {
    it("successful retrieval", async () => {
      const { a1 } = await seedAuthors();

      const res = await request(server).get(`/api/authors/${a1.id}`);
      expect(res.status).toBe(200);

      const author = res.body as Author;
      expect(author.id).toBe(a1.id);
      expect(author.name).toBe("John Doe");
      expect(author.email).toBe("john.doe@example.com");
      expect(author.affiliation).toBe("University of Toronto");
      expectIso8601(author.createdAt);
      expectIso8601(author.updatedAt);
      expect(Array.isArray(author.papers)).toBe(true);
    });

    it("error: invalid id (-1) returns 400", async () => {
      await seedAuthors();

      const res = await request(server).get("/api/authors/-1");
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.message).toBe("Invalid ID format");
    });

    it("error: not found returns 404", async () => {
      await seedAuthors();

      const res = await request(server).get("/api/authors/999999");
      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Author not found");
    });
  });

  // =========================================================
  // PUT /api/authors/:id
  // =========================================================
  describe("PUT /api/authors/:id", () => {
    it("successful update", async () => {
      const { a2 } = await seedAuthors();

      // Put timestamps in the past so this assertion does not depend on clock resolution.
      const past = new Date("2000-01-01T00:00:00.000Z");
      await prisma.author.update({
        where: { id: a2.id },
        data: { createdAt: past, updatedAt: past },
      });

      const updated = {
        name: "Updated Name",
        email: "updated@example.com",
        affiliation: "Updated University",
      };

      const res = await request(server)
        .put(`/api/authors/${a2.id}`)
        .send(updated);

      expect(res.status).toBe(200);

      const author = res.body as Author;
      expect(author.name).toBe(updated.name);
      expect(author.email).toBe(updated.email);
      expect(author.affiliation).toBe(updated.affiliation);

      expect(author.updatedAt).not.toBe(author.createdAt);
      expectIso8601(author.updatedAt);
      expectIso8601(author.createdAt);
    });

    it("validation: missing name with {} returns 400", async () => {
      const { a1 } = await seedAuthors();

      const res = await request(server).put(`/api/authors/${a1.id}`).send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.messages).toEqual(["Name is required"]);
    });

    it("error: not found returns 404", async () => {
      await seedAuthors();

      const res = await request(server).put("/api/authors/999999").send({
        name: "X",
      });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Author not found");
    });
  });

  // =========================================================
  // DELETE /api/authors/:id
  // =========================================================
  describe("DELETE /api/authors/:id", () => {
    it("successful deletion returns 204 and author becomes not found", async () => {
      const { a3 } = await seedAuthors();

      const del = await request(server).delete(`/api/authors/${a3.id}`);
      expect(del.status).toBe(204);

      const get = await request(server).get(`/api/authors/${a3.id}`);
      expect(get.status).toBe(404);
      expect(get.body.error).toBe("Author not found");
    });

    it("error: invalid id (1a) returns 400", async () => {
      await seedAuthors();

      const res = await request(server).delete("/api/authors/1a");
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.message).toBe("Invalid ID format");
    });

    it("error: not found returns 404", async () => {
      await seedAuthors();

      const res = await request(server).delete("/api/authors/999999");
      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Author not found");
    });
  });
});
