import request from "supertest";
import { prisma } from "../src/lib/prisma";
import app from "../src/server";

// Start one temporary HTTP server for the entire test suite.
// Using port 0 lets the OS choose an available port automatically.
const server = app.listen(0, "127.0.0.1");

type Author = {
  id: number;
  name: string;
  email: string | null;
  affiliation: string | null;
  createdAt: string;
  updatedAt: string;
};

type Paper = {
  id: number;
  title: string;
  publishedIn: string;
  year: number;
  createdAt: string;
  updatedAt: string;
  authors: Author[];
};

type PapersListResponse = {
  papers: Paper[];
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

async function seedBaselineData() {
  // Create a paper with two authors, second author missing optional fields
  const res1 = await request(server)
    .post("/api/papers")
    .send({
      title: "Example Paper Title",
      publishedIn: "ICSE 2025",
      year: 2025,
      authors: [
        {
          name: "John Doe",
          email: "john@mail.utoronto.ca",
          affiliation: "University of Toronto",
        },
        {
          name: "Jane Smith",
        },
      ],
    });

  // Another paper (same first author reused, second author different)
  const res2 = await request(server)
    .post("/api/papers")
    .send({
      title: "Another Paper",
      publishedIn: "NeurIPS 2024",
      year: 2024,
      authors: [
        {
          name: "John Doe",
          email: "john@mail.utoronto.ca",
          affiliation: "University of Toronto",
        },
        {
          name: "Alice Johnson",
          email: "alice@mail.utoronto.ca",
        },
      ],
    });

  // A third paper for pagination/filtering
  const res3 = await request(server)
    .post("/api/papers")
    .send({
      title: "Yet Another Paper",
      publishedIn: "icse 2024 (workshop)",
      year: 2024,
      authors: [
        {
          name: "Bob Lee",
        },
      ],
    });

  expect(res1.status).toBe(201);
  expect(res2.status).toBe(201);
  expect(res3.status).toBe(201);

  return {
    p1: res1.body as Paper,
    p2: res2.body as Paper,
    p3: res3.body as Paper,
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

function requireDefined<T>(value: T | null | undefined, message: string): T {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
  return value;
}

describe("API Tests for Paper Routes", () => {
  // =========================================================
  // POST /api/papers
  // =========================================================
  describe("POST /api/papers", () => {
    it("creates a paper successfully", async () => {
      const body = {
        title: "Example Paper Title",
        publishedIn: "ICSE 2025",
        year: 2025,
        authors: [
          {
            name: "John Doe",
            email: "john@mail.utoronto.ca",
            affiliation: "University of Toronto",
          },
          {
            name: "Jane Smith",
          },
        ],
      };

      const res = await request(server).post("/api/papers").send(body);

      expect(res.status).toBe(201);
      expect(typeof res.body.id).toBe("number");
      expectIso8601(res.body.createdAt);
      expectIso8601(res.body.updatedAt);

      // fields match request
      expect(res.body.title).toBe(body.title);
      expect(res.body.publishedIn).toBe(body.publishedIn);
      expect(res.body.year).toBe(body.year);

      // authors array + content
      expect(Array.isArray(res.body.authors)).toBe(true);
      expect(res.body.authors).toHaveLength(2);

      const authors = res.body.authors as Author[];

      // first author checks
      const a1 = requireDefined(
        authors.find((a) => a.name === "John Doe"),
        'Expected to find author "John Doe"',
      );

      expect(typeof a1.id).toBe("number");
      expectIso8601(a1.createdAt);
      expectIso8601(a1.updatedAt);
      expect(a1.email).toBe("john@mail.utoronto.ca");
      expect(a1.affiliation).toBe("University of Toronto");

      // second author checks (email/affiliation should be null)
      const a2 = requireDefined(
        authors.find((a) => a.name === "Jane Smith"),
        'Expected to find author "Jane Smith"',
      );

      expect(typeof a2.id).toBe("number");
      expectIso8601(a2.createdAt);
      expectIso8601(a2.updatedAt);
      expect(a2.email).toBeNull();
      expect(a2.affiliation).toBeNull();

      // ensure both authors exist in Author table
      const authorCount = await prisma.author.count();
      expect(authorCount).toBe(2);
    });

    it("validation: missing fields with {} returns 400 + Validation Error + 4 messages", async () => {
      const res = await request(server).post("/api/papers").send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect([...res.body.messages].sort()).toEqual(
        [
          "Title is required",
          "Published venue is required",
          "Published year is required",
          "At least one author is required",
        ].sort(),
      );
    });

    it("validation: author's name missing returns 400", async () => {
      const base = {
        title: "T",
        publishedIn: "V",
        year: 2024,
      };

      const cases: Array<{ authors: unknown; label: string }> = [
        {
          label: "not provided",
          authors: [{ email: "x@mail.com" }],
        },
      ];

      for (const c of cases) {
        const res = await request(server)
          .post("/api/papers")
          .send({ ...base, authors: c.authors });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Validation Error");
        expect(res.body.messages).toEqual(["Author name is required"]);
      }
    });

    it("validation: invalid year values (1900 / '1901a') return 400", async () => {
      const base = {
        title: "T",
        publishedIn: "V",
        authors: [{ name: "A" }],
      };

      const years: Array<unknown> = [1900, "1901a"];

      for (const y of years) {
        const res = await request(server)
          .post("/api/papers")
          .send({ ...base, year: y });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Validation Error");
        expect(res.body.messages).toEqual([
          "Valid year after 1900 is required",
        ]);
      }
    });
  });

  // =========================================================
  // GET /api/papers
  // =========================================================
  describe("GET /api/papers", () => {
    it("basic retrieval", async () => {
      await seedBaselineData();

      const res = await request(server).get("/api/papers");
      expect(res.status).toBe(200);

      const body = res.body as PapersListResponse;
      expect(Array.isArray(body.papers)).toBe(true);

      expect(body.limit).toBe(10);
      expect(body.offset).toBe(0);

      // total should match number of papers in DB
      const count = await prisma.paper.count();
      expect(body.total).toBe(count);
      expect(body.papers.length).toBe(count);

      // each paper has authors array
      for (const p of body.papers) {
        expect(Array.isArray(p.authors)).toBe(true);
      }
    });

    it("filtering: year filter", async () => {
      await seedBaselineData();

      const res = await request(server).get("/api/papers?year=2024");
      expect(res.status).toBe(200);

      const body = res.body as PapersListResponse;
      expect(body.papers.length).toBeGreaterThan(0);
      for (const p of body.papers) {
        expect(p.year).toBe(2024);
      }
    });

    it("filtering: publishedIn case-insensitive partial match", async () => {
      await seedBaselineData();

      const res = await request(server).get("/api/papers?publishedIn=iCse");
      expect(res.status).toBe(200);

      const body = res.body as PapersListResponse;
      expect(body.papers.length).toBeGreaterThan(0);
      for (const p of body.papers) {
        expect(p.publishedIn).toMatch(/icse/i);
      }
    });

    it("pagination: limit + offset", async () => {
      await seedBaselineData();

      // explicit limit/offset
      const res = await request(server).get("/api/papers?limit=1&offset=1");
      expect(res.status).toBe(200);

      const body = res.body as PapersListResponse;
      expect(body.limit).toBe(1);
      expect(body.offset).toBe(1);
      expect(body.papers.length).toBeLessThanOrEqual(1);
    });

    it("error handling: invalid year (1900) returns 400", async () => {
      await seedBaselineData();

      const res = await request(server).get(`/api/papers?year=1900`);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.message).toBe("Invalid query parameter format");
    });

    it("error handling: invalid limit (a) returns 400", async () => {
      await seedBaselineData();

      const res = await request(server).get(`/api/papers?limit=a`);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.message).toBe("Invalid query parameter format");
    });

    it("error handling: invalid offset (2a / -2) returns 400", async () => {
      await seedBaselineData();

      const offsets = ["2a", "-2"];
      for (const o of offsets) {
        const res = await request(server).get(`/api/papers?offset=${o}`);
        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Validation Error");
        expect(res.body.message).toBe("Invalid query parameter format");
      }
    });
  });

  // =========================================================
  // GET /api/papers/:id
  // =========================================================
  describe("GET /api/papers/:id", () => {
    it("successful retrieval", async () => {
      const { p1 } = await seedBaselineData();

      const res = await request(server).get(`/api/papers/${p1.id}`);
      expect(res.status).toBe(200);

      const paper = res.body as Paper;
      expect(paper.id).toBe(p1.id);
      expect(paper.title).toBe("Example Paper Title");
      expect(paper.publishedIn).toBe("ICSE 2025");
      expect(paper.year).toBe(2025);
      expectIso8601(paper.createdAt);
      expectIso8601(paper.updatedAt);

      expect(Array.isArray(paper.authors)).toBe(true);

      // order by ascending id
      const ids = paper.authors.map((a) => a.id);
      const sorted = [...ids].sort((a, b) => a - b);
      expect(ids).toEqual(sorted);
    });

    it("error: invalid id (-1 / abc) returns 400", async () => {
      await seedBaselineData();

      const ids = ["-1", "abc"];
      for (const id of ids) {
        const res = await request(server).get(`/api/papers/${id}`);
        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Validation Error");
        expect(res.body.message).toBe("Invalid ID format");
      }
    });

    it("error: not found returns 404", async () => {
      await seedBaselineData();

      const res = await request(server).get("/api/papers/999999");
      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Paper not found");
    });
  });

  // =========================================================
  // PUT /api/papers/:id
  // =========================================================
  describe("PUT /api/papers/:id", () => {
    it("successful update", async () => {
      const { p2 } = await seedBaselineData();

      const updated = {
        title: "Updated Title",
        publishedIn: "Updated Venue",
        year: 2026,
        authors: [
          {
            name: "New Author",
            email: "new@author.com",
            affiliation: "New University",
          },
        ],
      };

      const res = await request(server)
        .put(`/api/papers/${p2.id}`)
        .send(updated);
      expect(res.status).toBe(200);

      const paper = res.body as Paper;
      expect(paper.title).toBe(updated.title);
      expect(paper.publishedIn).toBe(updated.publishedIn);
      expect(paper.year).toBe(updated.year);
    });

    it("error: invalid id (abc) returns 400", async () => {
      await seedBaselineData();

      const res = await request(server)
        .put("/api/papers/abc")
        .send({
          title: "X",
          publishedIn: "Y",
          year: 2024,
          authors: [{ name: "A" }],
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.message).toBe("Invalid ID format");
    });

    it("validation: missing fields with {} returns 400 with 4 messages (0.5 each in rubric)", async () => {
      const { p1 } = await seedBaselineData();

      const res = await request(server).put(`/api/papers/${p1.id}`).send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect([...res.body.messages].sort()).toEqual(
        [
          "Title is required",
          "Published venue is required",
          "Published year is required",
          "At least one author is required",
        ].sort(),
      );
    });

    it("validation: title of only spaces returns 400", async () => {
      const { p1 } = await seedBaselineData();

      const res = await request(server)
        .put(`/api/papers/${p1.id}`)
        .send({
          title: "    ",
          publishedIn: "V",
          year: 2024,
          authors: [{ name: "A" }],
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.messages).toEqual(["Title is required"]);
    });

    it("validation: author name missing returns 400", async () => {
      const { p1 } = await seedBaselineData();

      const res = await request(server)
        .put(`/api/papers/${p1.id}`)
        .send({
          title: "T",
          publishedIn: "V",
          year: 2024,
          authors: [{ email: "x@mail.com" }], // missing name
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.messages).toEqual(["Author name is required"]);
    });

    it("validation: invalid year (1900) returns 400", async () => {
      const { p1 } = await seedBaselineData();

      const res = await request(server)
        .put(`/api/papers/${p1.id}`)
        .send({
          title: "T",
          publishedIn: "V",
          year: 1900,
          authors: [{ name: "A" }],
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.messages).toEqual(["Valid year after 1900 is required"]);
    });

    it("error: not found returns 404", async () => {
      await seedBaselineData();

      const res = await request(server)
        .put("/api/papers/999999")
        .send({
          title: "T",
          publishedIn: "V",
          year: 2024,
          authors: [{ name: "A" }],
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Paper not found");
    });
  });

  // =========================================================
  // DELETE /api/papers/:id
  // =========================================================
  describe("DELETE /api/papers/:id", () => {
    it("successful deletion returns 204 and paper becomes not found", async () => {
      const { p3 } = await seedBaselineData();

      const del = await request(server).delete(`/api/papers/${p3.id}`);
      expect(del.status).toBe(204);

      const get = await request(server).get(`/api/papers/${p3.id}`);
      expect(get.status).toBe(404);
      expect(get.body.error).toBe("Paper not found");
    });

    it("error: invalid id (-1) returns 400", async () => {
      await seedBaselineData();

      const res = await request(server).delete("/api/papers/-1");
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation Error");
      expect(res.body.message).toBe("Invalid ID format");
    });

    it("error: not found returns 404", async () => {
      await seedBaselineData();

      const res = await request(server).delete("/api/papers/999999");
      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Paper not found");
    });
  });
});
