/**
 * scripts/src/seed-dev-data.ts — Development seed: domain data
 *
 * Populates minimum viable dev data:
 *   - demo student user account (demo@sciblock.com)
 *   - 5 student profiles
 *   - 4 papers (Zhang Wei ×2, Li Ting ×1, Wang Lei ×1)
 *   - 6 weekly reports (Zhang Wei, static past weeks)
 *   - user↔student binding (demo@sciblock.com → Li Ting)
 *   - 5 demo inbox messages (for demo@sciblock.com)
 *
 * Idempotency contract — safe to re-run, partial data is always completed:
 *   Users    : ON CONFLICT (email) DO UPDATE — resets credentials to seed values
 *   Students : insert-if-not-exists by (name, enrollment_year)
 *   Papers   : insert-if-not-exists by (student_id, doi)
 *   Reports  : insert-if-not-exists by (student_id, week_start)
 *   Binding  : UPDATE WHERE user_id IS NULL — never overwrites an existing binding
 *   Messages : insert-if-not-exists by (recipient_id, title)
 *
 * Usage: pnpm --filter @workspace/scripts run seed-dev-data
 * Or via: bash scripts/seed-dev.sh  (preferred — runs user seed first)
 *
 * Prerequisites: DATABASE_URL must be set; pnpm migrate must have been run.
 */

import bcrypt from "bcryptjs";
import { eq, and, isNull } from "drizzle-orm";
import {
  pool,
  db,
  usersTable,
  studentsTable,
  papersTable,
  weeklyReportsTable,
  messagesTable,
} from "@workspace/db";

// ============================================================================
// Constants
// ============================================================================

const DEMO_STUDENT_USER = {
  email: "demo@sciblock.com",
  password: "DemoPass1234",
  name: "Demo Student",
  role: "student",
} as const;

/**
 * Static week-start dates for Zhang Wei's seed reports.
 * Anchored to 2026-03-09 (project baseline week).
 * Using fixed strings ensures reproducible results regardless of run date.
 */
const ZHANG_WEI_WEEK_STARTS = [
  "2026-03-09",
  "2026-03-02",
  "2026-02-23",
  "2026-02-16",
  "2026-02-09",
  "2026-02-02",
] as const;

// ============================================================================
// Section 1: Users
// ============================================================================

/**
 * Upserts the demo student account.
 * ON CONFLICT DO UPDATE ensures role, password, and name are always correct.
 * Returns the user's DB id.
 */
async function seedDemoUser(): Promise<string> {
  console.log("[seed] Upserting demo student user...");
  const passwordHash = await bcrypt.hash(DEMO_STUDENT_USER.password, 12);

  const [user] = await db
    .insert(usersTable)
    .values({
      email: DEMO_STUDENT_USER.email,
      passwordHash,
      name: DEMO_STUDENT_USER.name,
      role: DEMO_STUDENT_USER.role,
    })
    .onConflictDoUpdate({
      target: usersTable.email,
      set: {
        passwordHash,
        name: DEMO_STUDENT_USER.name,
        role: DEMO_STUDENT_USER.role,
      },
    })
    .returning({ id: usersTable.id });

  console.log(`[seed]   demo user → id ${user.id}`);
  return user.id;
}

// ============================================================================
// Section 2: Students
// ============================================================================

type StudentSeed = {
  name: string;
  enrollmentYear: number;
  degree: string;
  researchTopic: string;
  phone?: string;
  labEmail: string;
  status: string;
};

const STUDENT_SEEDS: StudentSeed[] = [
  {
    name: "张伟",
    enrollmentYear: 2022,
    degree: "phd",
    researchTopic: "纳米复合材料的电化学性能研究",
    phone: "13800138001",
    labEmail: "zhang.wei@lab.edu",
    status: "active",
  },
  {
    name: "李婷",
    enrollmentYear: 2023,
    degree: "master",
    researchTopic: "二维材料界面调控与器件应用",
    phone: "13800138002",
    labEmail: "li.ting@lab.edu",
    status: "active",
  },
  {
    name: "王磊",
    enrollmentYear: 2021,
    degree: "phd",
    researchTopic: "固态锂电池界面工程",
    phone: "13800138003",
    labEmail: "wang.lei@lab.edu",
    status: "active",
  },
  {
    name: "陈雪",
    enrollmentYear: 2020,
    degree: "phd",
    researchTopic: "光催化产氢材料体系设计",
    phone: "13800138004",
    labEmail: "chen.xue@lab.edu",
    status: "graduated",
  },
  {
    name: "刘浩",
    enrollmentYear: 2024,
    degree: "master",
    researchTopic: "钙钛矿太阳能电池稳定性",
    labEmail: "liu.hao@lab.edu",
    status: "pending",
  },
];

/**
 * Seeds all student profiles, inserting only those that do not yet exist.
 * Existence check: (name, enrollment_year) — stable identifiers for seed data.
 * Returns a map of labEmail → DB student id.
 */
async function seedStudents(): Promise<Record<string, string>> {
  console.log("[seed] Seeding students...");
  const idByLabEmail: Record<string, string> = {};

  for (const s of STUDENT_SEEDS) {
    const existing = await db
      .select({ id: studentsTable.id })
      .from(studentsTable)
      .where(
        and(
          eq(studentsTable.name, s.name),
          eq(studentsTable.enrollmentYear, s.enrollmentYear),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      console.log(`[seed]   student "${s.name}" already exists — skipped`);
      idByLabEmail[s.labEmail] = existing[0].id;
    } else {
      const [inserted] = await db
        .insert(studentsTable)
        .values({
          name: s.name,
          enrollmentYear: s.enrollmentYear,
          degree: s.degree,
          researchTopic: s.researchTopic,
          phone: s.phone ?? null,
          email: s.labEmail,
          status: s.status,
        })
        .returning({ id: studentsTable.id });

      console.log(`[seed]   inserted student "${s.name}" → ${inserted.id}`);
      idByLabEmail[s.labEmail] = inserted.id;
    }
  }

  return idByLabEmail;
}

// ============================================================================
// Section 3: Papers
// ============================================================================

type PaperSeed = {
  studentLabEmail: string;
  title: string;
  journal: string;
  year: number;
  abstract: string;
  doi: string;
};

const PAPER_SEEDS: PaperSeed[] = [
  {
    studentLabEmail: "zhang.wei@lab.edu",
    title: "Enhanced Electrochemical Performance of Nano-Composite Electrode Materials",
    journal: "ACS Nano",
    year: 2024,
    abstract:
      "We report a systematic study of nano-composite electrode materials with enhanced electrochemical performance...",
    doi: "10.1021/acsnano.4c01234",
  },
  {
    studentLabEmail: "zhang.wei@lab.edu",
    title: "Interfacial Engineering in Composite Materials for Energy Storage",
    journal: "Advanced Materials",
    year: 2023,
    abstract:
      "A novel approach to interfacial engineering that significantly improves charge transfer kinetics...",
    doi: "10.1002/adma.202301234",
  },
  {
    studentLabEmail: "li.ting@lab.edu",
    title: "Two-Dimensional Materials: Interface Modulation and Device Applications",
    journal: "Nature Communications",
    year: 2024,
    abstract:
      "Interface modulation of 2D materials enables high-performance electronic devices...",
    doi: "10.1038/s41467-024-12345-6",
  },
  {
    studentLabEmail: "wang.lei@lab.edu",
    title: "Solid-State Lithium Battery Interface Engineering: A Comprehensive Review",
    journal: "Energy & Environmental Science",
    year: 2023,
    abstract:
      "This review comprehensively covers recent advances in solid-state lithium battery interfaces...",
    doi: "10.1039/D3EE12345A",
  },
];

/**
 * Seeds papers for each student, skipping any that already exist.
 * Existence check: (student_id, doi) — DOI is the canonical paper identifier.
 */
async function seedPapers(idByLabEmail: Record<string, string>): Promise<void> {
  console.log("[seed] Seeding papers...");

  for (const p of PAPER_SEEDS) {
    const studentId = idByLabEmail[p.studentLabEmail];
    if (!studentId) {
      console.warn(`[seed]   paper skipped — no student found for "${p.studentLabEmail}"`);
      continue;
    }

    const existing = await db
      .select({ id: papersTable.id })
      .from(papersTable)
      .where(and(eq(papersTable.studentId, studentId), eq(papersTable.doi, p.doi)))
      .limit(1);

    if (existing.length > 0) {
      console.log(`[seed]   paper "${p.doi}" already exists — skipped`);
    } else {
      await db.insert(papersTable).values({
        studentId,
        title: p.title,
        journal: p.journal,
        year: p.year,
        abstract: p.abstract,
        doi: p.doi,
        isThesis: false,
      });
      console.log(`[seed]   inserted paper "${p.doi}"`);
    }
  }
}

// ============================================================================
// Section 4: Weekly reports
// ============================================================================

/**
 * Seeds 6 weekly reports for Zhang Wei, skipping any that already exist.
 * Existence check: (student_id, week_start).
 * Dates are static constants anchored to 2026-03-09.
 */
async function seedWeeklyReports(idByLabEmail: Record<string, string>): Promise<void> {
  console.log("[seed] Seeding weekly reports...");

  const zhangWeiId = idByLabEmail["zhang.wei@lab.edu"];
  if (!zhangWeiId) {
    console.warn("[seed]   reports skipped — Zhang Wei not found");
    return;
  }

  const totalWeeks = ZHANG_WEI_WEEK_STARTS.length;
  for (let i = 0; i < totalWeeks; i++) {
    const weekStart = ZHANG_WEI_WEEK_STARTS[i];
    const weekLabel = totalWeeks - i;

    const existing = await db
      .select({ id: weeklyReportsTable.id })
      .from(weeklyReportsTable)
      .where(
        and(
          eq(weeklyReportsTable.studentId, zhangWeiId),
          eq(weeklyReportsTable.weekStart, weekStart),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      console.log(`[seed]   report ${weekStart} already exists — skipped`);
    } else {
      await db.insert(weeklyReportsTable).values({
        studentId: zhangWeiId,
        title: `第 ${weekLabel} 周实验进展报告`,
        content:
          "本周主要完成了以下工作：\n" +
          "1. 完成了纳米复合材料的合成与表征\n" +
          "2. 对样品进行了电化学性能测试\n" +
          "3. 分析了实验数据并与理论模型进行对比\n\n" +
          "下周计划：\n" +
          "1. 优化合成参数\n" +
          "2. 补充 TEM 表征\n" +
          "3. 撰写实验报告",
        weekStart,
        status: "submitted",
      });
      console.log(`[seed]   inserted report ${weekStart}`);
    }
  }
}

// ============================================================================
// Section 5: User↔Student binding
// ============================================================================

/**
 * Binds the demo student user to Li Ting's student profile.
 * Only executes the UPDATE when user_id IS NULL — never overwrites an existing binding.
 */
async function bindDemoUserToStudent(demoUserId: string): Promise<void> {
  console.log("[seed] Binding demo user to Li Ting student profile...");

  const result = await db
    .update(studentsTable)
    .set({ userId: demoUserId })
    .where(
      and(
        eq(studentsTable.email, "li.ting@lab.edu"),
        isNull(studentsTable.userId),
      ),
    )
    .returning({ id: studentsTable.id });

  if (result.length > 0) {
    console.log(`[seed]   bound demo@sciblock.com → student ${result[0].id}`);
  } else {
    console.log("[seed]   binding already exists — skipped");
  }
}

// ============================================================================
// Section 6: Messages
// ============================================================================

type MessageSeed = {
  senderName: string;
  type: string;
  status: "unread" | "read";
  title: string;
  body: string;
  metadata: Record<string, string>;
};

const MESSAGE_SEEDS: MessageSeed[] = [
  {
    senderName: "Prof. Chen Wei",
    type: "invitation",
    status: "unread",
    title: "邀请你加入「纳米材料合成」研究团队",
    body: "导师 Prof. Chen Wei 邀请你加入实验团队「纳米材料合成」。加入后你将可以访问团队共享的实验记录与数据资源。",
    metadata: { teamName: "纳米材料合成", teamId: "team-nano-001" },
  },
  {
    senderName: "Dr. Liu Yang",
    type: "comment",
    status: "unread",
    title: "Dr. Liu Yang 评论了你的实验记录",
    body: "导师 Dr. Liu Yang 对你的实验记录「Material characterization report」进行了评论：「样品制备步骤中的烧结温度建议提高至 800°C，同时延长保温时间至 2 小时，以确保晶相完全转变。请在下次实验中验证此参数。」",
    metadata: {
      experimentTitle: "Material characterization report",
      experimentId: "exp-001",
      comment:
        "样品制备步骤中的烧结温度建议提高至 800°C，同时延长保温时间至 2 小时，以确保晶相完全转变。请在下次实验中验证此参数。",
    },
  },
  {
    senderName: "Li Wei",
    type: "share_request",
    status: "unread",
    title: "Li Wei 请求你分享实验记录",
    body: "用户 Li Wei 请求你分享实验记录「Synthesis protocol v2」。接受后，对方将获得该记录的只读访问权限。",
    metadata: { experimentTitle: "Synthesis protocol v2", experimentId: "exp-002" },
  },
  {
    senderName: "Prof. Chen Wei",
    type: "invitation",
    status: "read",
    title: "邀请你加入「电化学储能」研究团队",
    body: "导师 Prof. Chen Wei 邀请你加入实验团队「电化学储能」，与团队共同推进新型电极材料的研发工作。",
    metadata: { teamName: "电化学储能", teamId: "team-echem-002" },
  },
  {
    senderName: "Dr. Wang Fang",
    type: "comment",
    status: "read",
    title: "Dr. Wang Fang 评论了你的实验记录",
    body: "导师 Dr. Wang Fang 对你的实验记录「Test batch 2024」进行了评论：「XRD 图谱分析结果良好，特征峰位置与理论值吻合，结晶度达到预期。建议补充 SEM 形貌表征以完善数据。」",
    metadata: {
      experimentTitle: "Test batch 2024",
      experimentId: "exp-003",
      comment:
        "XRD 图谱分析结果良好，特征峰位置与理论值吻合，结晶度达到预期。建议补充 SEM 形貌表征以完善数据。",
    },
  },
];

/**
 * Seeds demo messages for the given recipient, skipping any that already exist.
 * Existence check: (recipient_id, title).
 */
async function seedMessages(demoUserId: string): Promise<void> {
  console.log("[seed] Seeding messages for demo user...");

  for (const m of MESSAGE_SEEDS) {
    const existing = await db
      .select({ id: messagesTable.id })
      .from(messagesTable)
      .where(
        and(
          eq(messagesTable.recipientId, demoUserId),
          eq(messagesTable.title, m.title),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      console.log(`[seed]   message "${m.title}" already exists — skipped`);
    } else {
      await db.insert(messagesTable).values({
        recipientId: demoUserId,
        senderName: m.senderName,
        type: m.type,
        status: m.status,
        title: m.title,
        body: m.body,
        metadata: m.metadata,
      });
      console.log(`[seed]   inserted message "${m.title}"`);
    }
  }
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  console.log("[seed] ── dev data seed starting ──");
  console.log("");

  const demoUserId = await seedDemoUser();
  console.log("");

  const idByLabEmail = await seedStudents();
  console.log("");

  await seedPapers(idByLabEmail);
  console.log("");

  await seedWeeklyReports(idByLabEmail);
  console.log("");

  await bindDemoUserToStudent(demoUserId);
  console.log("");

  await seedMessages(demoUserId);
  console.log("");

  console.log("[seed] ── dev data seed complete ──");
}

main()
  .catch((err) => {
    console.error("[seed] Fatal error:", err);
    process.exit(1);
  })
  .finally(() => pool.end());
