import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data (order matters for foreign keys)
  await prisma.auditLog.deleteMany();
  await prisma.checkInComment.deleteMany();
  await prisma.checkIn.deleteMany();
  await prisma.goalApproval.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.sharedGoal.deleteMany();
  await prisma.goalCycle.deleteMany();
  await prisma.user.deleteMany();

  // ─── Create Users ──────────────────────────────────────────────
  const hash = (pw: string) => bcrypt.hash(pw, 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@atomquest.com",
      name: "Priya Sharma",
      password: await hash("admin123"),
      role: "ADMIN",
      department: "Human Resources",
    },
  });

  const managerEng = await prisma.user.create({
    data: {
      email: "manager@atomquest.com",
      name: "Sarah Chen",
      password: await hash("manager123"),
      role: "MANAGER",
      department: "Engineering",
    },
  });

  const managerDesign = await prisma.user.create({
    data: {
      email: "ravi@atomquest.com",
      name: "Ravi Patel",
      password: await hash("ravi123"),
      role: "MANAGER",
      department: "Design",
    },
  });

  const alice = await prisma.user.create({
    data: {
      email: "alice@atomquest.com",
      name: "Alice Johnson",
      password: await hash("alice123"),
      role: "EMPLOYEE",
      department: "Engineering",
      managerId: managerEng.id,
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: "bob@atomquest.com",
      name: "Bob Williams",
      password: await hash("bob123"),
      role: "EMPLOYEE",
      department: "Engineering",
      managerId: managerEng.id,
    },
  });

  const carol = await prisma.user.create({
    data: {
      email: "carol@atomquest.com",
      name: "Carol Martinez",
      password: await hash("carol123"),
      role: "EMPLOYEE",
      department: "Design",
      managerId: managerDesign.id,
    },
  });

  const dave = await prisma.user.create({
    data: {
      email: "dave@atomquest.com",
      name: "Dave Kim",
      password: await hash("dave123"),
      role: "EMPLOYEE",
      department: "Engineering",
      managerId: managerEng.id,
    },
  });

  // ─── Create Goal Cycle ─────────────────────────────────────────
  const cycle = await prisma.goalCycle.create({
    data: {
      name: "FY 2025-26",
      startDate: new Date("2025-04-01"),
      endDate: new Date("2026-03-31"),
      isActive: true,
    },
  });

  // ─── Alice's Goals (5 goals, 100% weightage, fully approved) ──
  const aliceGoals = [
    {
      thrustArea: "Product Development",
      title: "Launch Customer Analytics Dashboard v2.0",
      description: "Redesign and ship the analytics dashboard with real-time data pipelines, customizable widgets, and export functionality. Target: zero critical bugs at launch.",
      uom: "TIMELINE",
      target: 100,
      weightage: 25,
      status: "LOCKED",
      isLocked: true,
      sortOrder: 0,
    },
    {
      thrustArea: "Quality & Reliability",
      title: "Achieve 95% unit test coverage on core modules",
      description: "Increase test coverage from 72% to 95% across authentication, billing, and data pipeline modules using Jest and React Testing Library.",
      uom: "PERCENTAGE",
      target: 95,
      weightage: 20,
      status: "APPROVED",
      isLocked: false,
      sortOrder: 1,
    },
    {
      thrustArea: "Innovation",
      title: "Build AI-powered search prototype",
      description: "Research and prototype a semantic search feature using vector embeddings. Deliver a working demo that handles at least 10K documents with <200ms latency.",
      uom: "NUMERIC_LOWER",
      target: 200,
      weightage: 20,
      status: "APPROVED",
      isLocked: false,
      sortOrder: 2,
    },
    {
      thrustArea: "Operational Excellence",
      title: "Reduce deployment pipeline time by 40%",
      description: "Optimize CI/CD pipelines — parallelize test suites, implement build caching, and reduce Docker image sizes. Current avg: 18 min.",
      uom: "NUMERIC_LOWER",
      target: 11,
      weightage: 20,
      status: "APPROVED",
      isLocked: false,
      sortOrder: 3,
    },
    {
      thrustArea: "Knowledge Sharing",
      title: "Conduct 8 engineering tech talks",
      description: "Organize and present monthly internal tech talks covering architecture decisions, new tools, and post-mortems for the engineering org.",
      uom: "NUMERIC_HIGHER",
      target: 8,
      weightage: 15,
      status: "APPROVED",
      isLocked: false,
      sortOrder: 4,
    },
  ];

  for (const goalData of aliceGoals) {
    const goal = await prisma.goal.create({
      data: { ...goalData, userId: alice.id, cycleId: cycle.id },
    });

    // Create approval record
    await prisma.goalApproval.create({
      data: {
        goalId: goal.id,
        reviewedById: managerEng.id,
        action: "APPROVED",
        comment: "Great goals Alice! Well-aligned with team OKRs.",
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        goalId: goal.id,
        userId: managerEng.id,
        action: "APPROVED",
        field: "status",
        oldValue: "PENDING_APPROVAL",
        newValue: "APPROVED",
      },
    });
  }

  // ─── Alice's Check-Ins (Q1 & Q2) ──────────────────────────────
  const aliceGoalRecords = await prisma.goal.findMany({
    where: { userId: alice.id },
    orderBy: { sortOrder: "asc" },
  });

  // Q1 check-ins
  const q1Data = [
    { achievement: 35, progress: 35, status: "ON_TRACK", notes: "Dashboard wireframes approved. Data pipeline 60% complete. On track for beta in Q2." },
    { achievement: 82, progress: 86.3, status: "ON_TRACK", notes: "Coverage at 82% — auth module fully covered. Billing module next." },
    { achievement: 350, progress: 0, status: "ON_TRACK", notes: "Initial research complete. Tested OpenAI embeddings and Pinecone. Latency at 350ms, needs optimization." },
    { achievement: 15, progress: 27.3, status: "ON_TRACK", notes: "Pipeline at 15 min avg (down from 18). Parallelized unit tests. Docker multi-stage builds next." },
    { achievement: 3, progress: 37.5, status: "ON_TRACK", notes: "3 talks delivered: React Server Components, DB indexing strategies, and incident post-mortem." },
  ];

  for (let i = 0; i < aliceGoalRecords.length; i++) {
    const ci = await prisma.checkIn.create({
      data: {
        goalId: aliceGoalRecords[i].id,
        userId: alice.id,
        quarter: "Q1",
        achievement: q1Data[i].achievement,
        progressPercent: q1Data[i].progress,
        status: q1Data[i].status,
        notes: q1Data[i].notes,
      },
    });

    // Manager comment on check-in
    await prisma.checkInComment.create({
      data: {
        checkInId: ci.id,
        userId: managerEng.id,
        content: i === 0
          ? "Solid progress! Let me know if you need additional frontend resources for the beta."
          : i === 2
          ? "Exciting prototype! Let's schedule a demo with the product team."
          : "Good progress, keep it up!",
      },
    });
  }

  // Q2 check-ins
  const q2Data = [
    { achievement: 72, progress: 72, status: "ON_TRACK", notes: "Beta launched internally. 12 bugs found, 10 fixed. Public beta scheduled for end of Q3." },
    { achievement: 91, progress: 95.8, status: "ON_TRACK", notes: "91% coverage achieved. Data pipeline module at 88%, working on edge cases." },
    { achievement: 180, progress: 100, status: "COMPLETED", notes: "Search prototype complete! Latency at 180ms with 15K docs. Demo well received by leadership." },
    { achievement: 12, progress: 85.7, status: "ON_TRACK", notes: "Pipeline at 12 min avg. Build caching implemented. Docker images reduced by 60%." },
    { achievement: 5, progress: 62.5, status: "ON_TRACK", notes: "5 talks done. Next: Kubernetes deep-dive and performance profiling workshop." },
  ];

  for (let i = 0; i < aliceGoalRecords.length; i++) {
    await prisma.checkIn.create({
      data: {
        goalId: aliceGoalRecords[i].id,
        userId: alice.id,
        quarter: "Q2",
        achievement: q2Data[i].achievement,
        progressPercent: q2Data[i].progress,
        status: q2Data[i].status,
        notes: q2Data[i].notes,
      },
    });
  }

  // ─── Bob's Goals (4 goals, 100% weightage, approved) ──────────
  const bobGoals = [
    {
      thrustArea: "Product Development",
      title: "Ship Mobile App v1.0 (iOS & Android)",
      description: "Develop and launch the React Native mobile app with core features: goal viewing, check-in submission, and push notifications.",
      uom: "TIMELINE",
      target: 100,
      weightage: 30,
      status: "APPROVED",
      isLocked: false,
      sortOrder: 0,
    },
    {
      thrustArea: "Quality & Reliability",
      title: "Reduce production incidents by 50%",
      description: "Implement better monitoring (Datadog), automated alerting, and runbooks. Current baseline: 12 incidents/quarter.",
      uom: "NUMERIC_LOWER",
      target: 6,
      weightage: 25,
      status: "APPROVED",
      isLocked: false,
      sortOrder: 1,
    },
    {
      thrustArea: "Security",
      title: "Complete SOC 2 Type II compliance audit",
      description: "Lead the engineering workstream for SOC 2 compliance — implement required controls, document procedures, and coordinate with auditors.",
      uom: "PERCENTAGE",
      target: 100,
      weightage: 25,
      status: "APPROVED",
      isLocked: false,
      sortOrder: 2,
    },
    {
      thrustArea: "Knowledge Sharing",
      title: "Mentor 2 junior developers through onboarding",
      description: "Guide new hires through the codebase, conduct weekly 1-on-1s, pair programming sessions, and ensure productive contribution within 60 days.",
      uom: "NUMERIC_HIGHER",
      target: 2,
      weightage: 20,
      status: "APPROVED",
      isLocked: false,
      sortOrder: 3,
    },
  ];

  for (const goalData of bobGoals) {
    const goal = await prisma.goal.create({
      data: { ...goalData, userId: bob.id, cycleId: cycle.id },
    });

    await prisma.goalApproval.create({
      data: {
        goalId: goal.id,
        reviewedById: managerEng.id,
        action: "APPROVED",
        comment: "Approved. Strong alignment with team priorities.",
      },
    });
  }

  // Bob's Q1 check-ins
  const bobGoalRecords = await prisma.goal.findMany({
    where: { userId: bob.id },
    orderBy: { sortOrder: "asc" },
  });

  const bobQ1 = [
    { achievement: 25, progress: 25, status: "ON_TRACK", notes: "App scaffolding complete. Auth flow and goal viewing implemented. Push notifications WIP." },
    { achievement: 8, progress: 66.7, status: "ON_TRACK", notes: "8 incidents in Q1 (down from 12). Added 15 new Datadog monitors. 3 runbooks created." },
    { achievement: 40, progress: 40, status: "ON_TRACK", notes: "40% of controls implemented. Access reviews complete. Encryption at rest verified." },
    { achievement: 1, progress: 50, status: "ON_TRACK", notes: "Mentoring Aisha — she shipped her first feature (user profile page) in week 4." },
  ];

  for (let i = 0; i < bobGoalRecords.length; i++) {
    await prisma.checkIn.create({
      data: {
        goalId: bobGoalRecords[i].id,
        userId: bob.id,
        quarter: "Q1",
        achievement: bobQ1[i].achievement,
        progressPercent: bobQ1[i].progress,
        status: bobQ1[i].status,
        notes: bobQ1[i].notes,
      },
    });
  }

  // ─── Carol's Goals (Design team, 4 goals, pending + returned) ─
  const carolGoals = [
    {
      thrustArea: "Product Development",
      title: "Redesign the entire onboarding flow",
      description: "Create a new 5-step onboarding experience with progressive disclosure, reducing time-to-first-value from 12 min to 4 min.",
      uom: "NUMERIC_LOWER",
      target: 4,
      weightage: 30,
      status: "APPROVED",
      isLocked: false,
      sortOrder: 0,
    },
    {
      thrustArea: "Innovation",
      title: "Build and launch the design system v2",
      description: "Expand the component library from 30 to 80+ components with Figma-to-code pipeline, accessibility compliance (WCAG AA), and dark mode support.",
      uom: "NUMERIC_HIGHER",
      target: 80,
      weightage: 25,
      status: "PENDING_APPROVAL",
      isLocked: false,
      sortOrder: 1,
    },
    {
      thrustArea: "Customer Focus",
      title: "Conduct 20 user research interviews",
      description: "Interview enterprise customers and SMB users to identify pain points in the dashboard, reporting, and goal-setting flows.",
      uom: "NUMERIC_HIGHER",
      target: 20,
      weightage: 25,
      status: "RETURNED",
      isLocked: false,
      sortOrder: 2,
    },
    {
      thrustArea: "Operational Excellence",
      title: "Reduce design handoff iteration cycles by 30%",
      description: "Streamline Figma-to-dev handoff with auto-generated specs, Storybook integration, and weekly design review cadence.",
      uom: "PERCENTAGE",
      target: 30,
      weightage: 20,
      status: "DRAFT",
      isLocked: false,
      sortOrder: 3,
    },
  ];

  for (const goalData of carolGoals) {
    const goal = await prisma.goal.create({
      data: { ...goalData, userId: carol.id, cycleId: cycle.id },
    });

    if (goalData.status === "APPROVED") {
      await prisma.goalApproval.create({
        data: {
          goalId: goal.id,
          reviewedById: managerDesign.id,
          action: "APPROVED",
          comment: "Excellent goal — this directly supports our product roadmap.",
        },
      });
    } else if (goalData.status === "RETURNED") {
      await prisma.goalApproval.create({
        data: {
          goalId: goal.id,
          reviewedById: managerDesign.id,
          action: "RETURNED",
          comment: "Good idea, but please add more specifics: which customer segments? What interview methodology? Also consider increasing the target to 25.",
        },
      });
    }
  }

  // Carol's Q1 check-in (only for approved goal)
  const carolApprovedGoal = await prisma.goal.findFirst({
    where: { userId: carol.id, status: "APPROVED" },
  });
  if (carolApprovedGoal) {
    const ci = await prisma.checkIn.create({
      data: {
        goalId: carolApprovedGoal.id,
        userId: carol.id,
        quarter: "Q1",
        achievement: 7,
        progressPercent: 42.9,
        status: "AT_RISK",
        notes: "Current onboarding takes 7 min. New flow designed but dev implementation delayed. Risk: dependency on frontend team bandwidth.",
      },
    });

    await prisma.checkInComment.create({
      data: {
        checkInId: ci.id,
        userId: managerDesign.id,
        content: "I'll coordinate with Sarah to get frontend support. Let's discuss priority trade-offs in our next 1-on-1.",
      },
    });
  }

  // ─── Dave's Goals (3 goals, all draft — new employee) ─────────
  const daveGoals = [
    {
      thrustArea: "Product Development",
      title: "Build real-time collaboration features",
      description: "Implement WebSocket-based real-time editing for shared goals, including presence indicators, live cursors, and conflict resolution.",
      uom: "TIMELINE",
      target: 100,
      weightage: 40,
      status: "PENDING_APPROVAL",
      isLocked: false,
      sortOrder: 0,
    },
    {
      thrustArea: "Quality & Reliability",
      title: "Set up end-to-end testing with Playwright",
      description: "Create a comprehensive E2E test suite covering the top 20 user flows with CI integration and visual regression testing.",
      uom: "NUMERIC_HIGHER",
      target: 20,
      weightage: 30,
      status: "PENDING_APPROVAL",
      isLocked: false,
      sortOrder: 1,
    },
    {
      thrustArea: "Knowledge Sharing",
      title: "Write technical documentation for 5 core services",
      description: "Document architecture, data flows, API contracts, and operational runbooks for Authentication, Billing, Analytics, Notifications, and Search services.",
      uom: "NUMERIC_HIGHER",
      target: 5,
      weightage: 30,
      status: "DRAFT",
      isLocked: false,
      sortOrder: 2,
    },
  ];

  for (const goalData of daveGoals) {
    await prisma.goal.create({
      data: { ...goalData, userId: dave.id, cycleId: cycle.id },
    });
  }

  // ─── Shared Goal (Manager-created) ─────────────────────────────
  const sharedGoal = await prisma.sharedGoal.create({
    data: {
      createdById: managerEng.id,
      thrustArea: "Operational Excellence",
      title: "Achieve 99.9% uptime SLA for Q3-Q4",
      description: "Collaborative team goal: maintain platform uptime above 99.9% through improved monitoring, automated failovers, and proactive capacity planning.",
      uom: "PERCENTAGE",
      target: 99.9,
    },
  });

  console.log("✅ Seeded users:");
  console.log("   Admin:     admin@atomquest.com / admin123      (Priya Sharma, HR)");
  console.log("   Manager:   manager@atomquest.com / manager123  (Sarah Chen, Engineering)");
  console.log("   Manager:   ravi@atomquest.com / ravi123        (Ravi Patel, Design)");
  console.log("   Employee:  alice@atomquest.com / alice123      (Alice Johnson, Engineering)");
  console.log("   Employee:  bob@atomquest.com / bob123          (Bob Williams, Engineering)");
  console.log("   Employee:  carol@atomquest.com / carol123      (Carol Martinez, Design)");
  console.log("   Employee:  dave@atomquest.com / dave123        (Dave Kim, Engineering)");
  console.log("");
  console.log("📊 Seeded data:");
  console.log("   • 16 goals across 4 employees (various statuses)");
  console.log("   • 14 quarterly check-ins (Q1 & Q2)");
  console.log("   • 12 goal approvals with comments");
  console.log("   • Manager comments on check-ins");
  console.log("   • 1 shared team goal");
  console.log(`   • Cycle: ${cycle.name}`);
  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
