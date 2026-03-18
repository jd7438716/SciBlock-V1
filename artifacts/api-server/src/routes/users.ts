/**
 * Users routes — authenticated user self-inspection and search.
 *
 * GET /users/me            — returns basic identity from JWT claims
 * GET /users/me/student    — returns the student profile bound to this account
 * GET /users/search?q=     — searches users by name or email (share modal)
 *
 * All routes are protected by requireAuth (applied in routes/index.ts).
 * Identity is read exclusively from res.locals (injected by requireAuth).
 * No X-User-Id header is accepted.
 */

import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { or, ilike, ne, sql } from "drizzle-orm";
import { getStudentByUserId } from "../services/student.service";

const router = Router();

// ---------------------------------------------------------------------------
// GET /users/me
// Returns the caller's basic identity derived from the JWT.
// ---------------------------------------------------------------------------
router.get("/me", (req, res) => {
  res.json({
    id:    res.locals.userId,
    email: res.locals.email,
    name:  res.locals.name,
    role:  res.locals.role,
  });
});

// ---------------------------------------------------------------------------
// GET /users/me/student
//
// Returns the student profile whose user_id is bound to this user account.
//
// 200 — profile found; body is the student row.
// 404 — this user account has no student profile binding.
//       Semantically distinct from "student has no reports" — the account
//       configuration is incomplete, not the data set.
// ---------------------------------------------------------------------------
router.get("/me/student", async (req, res) => {
  try {
    const student = await getStudentByUserId(res.locals.userId);
    if (!student) {
      res.status(404).json({
        error: "not_found",
        message: "No student profile is bound to this account",
      });
      return;
    }
    res.json(student);
  } catch (err) {
    console.error("[users] GET /me/student error:", err);
    res.status(500).json({ message: "Failed to resolve student profile" });
  }
});

// ---------------------------------------------------------------------------
// GET /users/search?q=
//
// Full-text substring search across name and email.
// Excludes the caller themselves (you cannot share with yourself).
// Returns a lightweight user list for the share modal's people picker.
//
// Query params:
//   q — search string (required, min 1 char after trim)
//
// Response: { users: Array<{ id, name, email, role }> }
// ---------------------------------------------------------------------------
router.get("/search", async (req, res) => {
  const callerId = res.locals.userId as string;
  const raw = (req.query.q as string | undefined)?.trim() ?? "";

  if (!raw) {
    res.status(400).json({ error: "bad_request", message: "查询参数 q 不能为空。" });
    return;
  }

  if (raw.length > 100) {
    res.status(400).json({ error: "bad_request", message: "查询字符串过长。" });
    return;
  }

  try {
    const pattern = `%${raw}%`;
    const users = await db
      .select({
        id:    usersTable.id,
        name:  usersTable.name,
        email: usersTable.email,
        role:  usersTable.role,
      })
      .from(usersTable)
      .where(
        sql`${usersTable.id} != ${callerId} AND (
          ${usersTable.name} ILIKE ${pattern} OR
          ${usersTable.email} ILIKE ${pattern}
        )`,
      )
      .limit(20);

    res.json({ users });
  } catch (err) {
    console.error("[users] GET /search error:", err);
    res.status(500).json({ error: "server_error", message: "搜索失败，请稍后重试。" });
  }
});

export default router;
