/**
 * 团队成员路由
 *
 * GET    /api/team/members          — 获取所有成员（首次访问自动 seed）
 * POST   /api/team/members          — 邀请新成员
 * GET    /api/team/members/:id      — 获取成员详情
 * PATCH  /api/team/members/:id      — 更新成员信息
 *
 * GET    /api/team/members/:id/papers   — 获取成员论文列表
 * POST   /api/team/members/:id/papers   — 添加论文记录
 *
 * GET    /api/team/members/:id/reports  — 获取周报列表
 * POST   /api/team/members/:id/reports  — 提交周报
 */

import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { studentsTable, papersTable, weeklyReportsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

async function seedStudents() {
  const existing = await db.select().from(studentsTable).limit(1);
  if (existing.length > 0) return;

  const students = await db.insert(studentsTable).values([
    {
      name: "张伟",
      enrollmentYear: 2022,
      degree: "phd",
      researchTopic: "纳米复合材料的电化学性能研究",
      phone: "13800138001",
      email: "zhang.wei@lab.edu",
      status: "active",
    },
    {
      name: "李婷",
      enrollmentYear: 2023,
      degree: "master",
      researchTopic: "二维材料界面调控与器件应用",
      phone: "13800138002",
      email: "li.ting@lab.edu",
      status: "active",
    },
    {
      name: "王磊",
      enrollmentYear: 2021,
      degree: "phd",
      researchTopic: "固态锂电池界面工程",
      phone: "13800138003",
      email: "wang.lei@lab.edu",
      status: "active",
    },
    {
      name: "陈雪",
      enrollmentYear: 2020,
      degree: "phd",
      researchTopic: "光催化产氢材料体系设计",
      phone: "13800138004",
      email: "chen.xue@lab.edu",
      status: "graduated",
    },
    {
      name: "刘浩",
      enrollmentYear: 2024,
      degree: "master",
      researchTopic: "钙钛矿太阳能电池稳定性",
      phone: null,
      email: "liu.hao@lab.edu",
      status: "pending",
    },
  ]).returning();

  // Seed some papers for Zhang Wei
  if (students.length > 0) {
    const zhangWeiId = students[0].id;
    const liTingId = students[1].id;
    const wangLeiId = students[2].id;

    await db.insert(papersTable).values([
      {
        studentId: zhangWeiId,
        title: "Enhanced Electrochemical Performance of Nano-Composite Electrode Materials",
        journal: "ACS Nano",
        year: 2024,
        abstract: "We report a systematic study of nano-composite electrode materials with enhanced electrochemical performance...",
        doi: "10.1021/acsnano.4c01234",
        isThesis: false,
      },
      {
        studentId: zhangWeiId,
        title: "Interfacial Engineering in Composite Materials for Energy Storage",
        journal: "Advanced Materials",
        year: 2023,
        abstract: "A novel approach to interfacial engineering that significantly improves charge transfer kinetics...",
        doi: "10.1002/adma.202301234",
        isThesis: false,
      },
      {
        studentId: liTingId,
        title: "Two-Dimensional Materials: Interface Modulation and Device Applications",
        journal: "Nature Communications",
        year: 2024,
        abstract: "Interface modulation of 2D materials enables high-performance electronic devices...",
        doi: "10.1038/s41467-024-12345-6",
        isThesis: false,
      },
      {
        studentId: wangLeiId,
        title: "Solid-State Lithium Battery Interface Engineering: A Comprehensive Review",
        journal: "Energy & Environmental Science",
        year: 2023,
        abstract: "This review comprehensively covers recent advances in solid-state lithium battery interfaces...",
        doi: "10.1039/D3EE12345A",
        isThesis: false,
      },
    ]);

    // Seed weekly reports
    const now = new Date();
    const reports = [];
    for (let i = 0; i < 6; i++) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - i * 7);
      const weekStr = weekStart.toISOString().slice(0, 10);
      reports.push({
        studentId: zhangWeiId,
        title: `第 ${6 - i} 周实验进展报告`,
        content: `本周主要完成了以下工作：\n1. 完成了纳米复合材料的合成与表征\n2. 对样品进行了电化学性能测试\n3. 分析了实验数据并与理论模型进行对比\n\n下周计划：\n1. 优化合成参数\n2. 补充 TEM 表征\n3. 撰写实验报告`,
        weekStart: weekStr,
      });
    }
    await db.insert(weeklyReportsTable).values(reports);
  }
}

// ---------------------------------------------------------------------------
// Members
// ---------------------------------------------------------------------------

router.get("/members", async (_req, res) => {
  try {
    await seedStudents();
    const members = await db.select().from(studentsTable).orderBy(studentsTable.createdAt);
    res.json({ members: members.reverse() });
  } catch (err) {
    console.error("[team] GET members error:", err);
    res.status(500).json({ error: "server_error", message: "获取成员列表失败" });
  }
});

router.post("/members", async (req, res) => {
  const { name, email, phone, enrollmentYear, degree, researchTopic } = req.body as {
    name?: string;
    email?: string;
    phone?: string;
    enrollmentYear?: number;
    degree?: string;
    researchTopic?: string;
  };

  if (!name || !enrollmentYear || !degree || !researchTopic) {
    res.status(400).json({ error: "bad_request", message: "必填字段缺失" });
    return;
  }

  try {
    const [student] = await db
      .insert(studentsTable)
      .values({ name, email: email ?? null, phone: phone ?? null, enrollmentYear, degree, researchTopic, status: "pending" })
      .returning();
    res.status(201).json({ student });
  } catch (err) {
    console.error("[team] POST members error:", err);
    res.status(500).json({ error: "server_error" });
  }
});

router.get("/members/:id", async (req, res) => {
  try {
    const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, req.params.id));
    if (!student) { res.status(404).json({ error: "not_found" }); return; }
    res.json({ student });
  } catch (err) {
    console.error("[team] GET member error:", err);
    res.status(500).json({ error: "server_error" });
  }
});

router.patch("/members/:id", async (req, res) => {
  const { name, phone, email, enrollmentYear, degree, researchTopic } = req.body as {
    name?: string; phone?: string; email?: string;
    enrollmentYear?: number; degree?: string; researchTopic?: string;
  };

  const patch: Record<string, unknown> = {};
  if (name !== undefined) patch.name = name;
  if (phone !== undefined) patch.phone = phone;
  if (email !== undefined) patch.email = email;
  if (enrollmentYear !== undefined) patch.enrollmentYear = enrollmentYear;
  if (degree !== undefined) patch.degree = degree;
  if (researchTopic !== undefined) patch.researchTopic = researchTopic;

  try {
    const [updated] = await db
      .update(studentsTable)
      .set(patch)
      .where(eq(studentsTable.id, req.params.id))
      .returning();
    if (!updated) { res.status(404).json({ error: "not_found" }); return; }
    res.json({ student: updated });
  } catch (err) {
    console.error("[team] PATCH member error:", err);
    res.status(500).json({ error: "server_error" });
  }
});

// ---------------------------------------------------------------------------
// Papers
// ---------------------------------------------------------------------------

router.get("/members/:id/papers", async (req, res) => {
  try {
    const papers = await db.select().from(papersTable).where(eq(papersTable.studentId, req.params.id));
    res.json({ papers: papers.sort((a, b) => (b.year ?? 0) - (a.year ?? 0)) });
  } catch (err) {
    console.error("[team] GET papers error:", err);
    res.status(500).json({ error: "server_error" });
  }
});

router.post("/members/:id/papers", async (req, res) => {
  const { title, journal, year, abstract, doi, fileName, isThesis } = req.body as {
    title?: string; journal?: string; year?: number; abstract?: string;
    doi?: string; fileName?: string; isThesis?: boolean;
  };

  if (!title) { res.status(400).json({ error: "bad_request", message: "论文标题必填" }); return; }

  try {
    const [paper] = await db
      .insert(papersTable)
      .values({ studentId: req.params.id, title, journal: journal ?? null, year: year ?? null, abstract: abstract ?? null, doi: doi ?? null, fileName: fileName ?? null, isThesis: isThesis ?? false })
      .returning();
    res.status(201).json({ paper });
  } catch (err) {
    console.error("[team] POST papers error:", err);
    res.status(500).json({ error: "server_error" });
  }
});

router.delete("/members/:id/papers/:paperId", async (req, res) => {
  try {
    await db.delete(papersTable).where(eq(papersTable.id, req.params.paperId));
    res.json({ success: true });
  } catch (err) {
    console.error("[team] DELETE paper error:", err);
    res.status(500).json({ error: "server_error" });
  }
});

// ---------------------------------------------------------------------------
// Weekly Reports
// ---------------------------------------------------------------------------

router.get("/members/:id/reports", async (req, res) => {
  try {
    const reports = await db.select().from(weeklyReportsTable).where(eq(weeklyReportsTable.studentId, req.params.id));
    res.json({ reports: reports.sort((a, b) => b.weekStart.localeCompare(a.weekStart)) });
  } catch (err) {
    console.error("[team] GET reports error:", err);
    res.status(500).json({ error: "server_error" });
  }
});

router.post("/members/:id/reports", async (req, res) => {
  const { title, content, weekStart } = req.body as {
    title?: string; content?: string; weekStart?: string;
  };

  if (!title || !weekStart) { res.status(400).json({ error: "bad_request", message: "标题和周次必填" }); return; }

  try {
    const [report] = await db
      .insert(weeklyReportsTable)
      .values({ studentId: req.params.id, title, content: content ?? "", weekStart })
      .returning();
    res.status(201).json({ report });
  } catch (err) {
    console.error("[team] POST reports error:", err);
    res.status(500).json({ error: "server_error" });
  }
});

export default router;
