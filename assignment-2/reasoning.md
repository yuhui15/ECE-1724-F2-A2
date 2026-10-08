## Q1: Before implementation, how do you plan to approach one core part of this assignment?
 
Choose one concrete part of the assignment.
 
Briefly describe your planned approach, a technical concern,
or an uncertainty you expect to work through.


For the database side of things, I plan to use Prisma ORM with PostgreSQL to implement the paper functions below, with authors linked through a many-to-many relation.

| Function / Operation | Prisma Call |
| :--- | :--- |
| **`createPaper`** | `prisma.author.findFirst` / `create` for each author, then `prisma.paper.create({ data: { ..., authors: { connect: ids } } })` |
| **`getAllPapers`** | `prisma.$transaction([prisma.paper.findMany({ where, skip, take, orderBy }), prisma.paper.count({ where })])` |
| **`getPaperById`** | `prisma.paper.findUnique({ where: { id }, include: { authors: true } })` |
| **`updatePaper`** | `prisma.paper.update({ where: { id }, data: { ..., authors: { set: [], connect: ids } } })` |
| **`deletePaper`** | `prisma.paper.delete({ where: { id } })` |


## Q2: Did you use AI?
 
- If YES:
  - Briefly describe the meaningful ways you used AI.
  - This may include conceptual questions, debugging assistance,
    or help with small parts of the implementation.
  - If AI directly influenced your code, identify the relevant
    file, component, function, or configuration where practical.
 
- If NO:
  - Write "No AI used."


- Yes. I used AI to break down the assignment's overall tasks and understand the project's file architecture, and it identified which files I needed to complete (`src/types.ts`, `src/database.ts`, `src/middleware.ts`, `src/routes.ts`, `src/routes/papers.ts`, and `src/routes/authors.ts`). 


## Q3: (Only if you used AI)
 
Choose one specific AI interaction that meaningfully influenced your work.
 
Briefly explain:
 
- What the AI suggested, explained, or helped identify
- What you did with that input
- How you verified, modified, or rejected it


- **What the AI suggested:** When my tests failed with "Cannot find module '../../generated/prisma/client'", AI explained that the Prisma Client had not been generated yet.
- **What I did with that input:** I ran `npx prisma generate`.
- **How I verified:** I ran the tests again and the error was gone.