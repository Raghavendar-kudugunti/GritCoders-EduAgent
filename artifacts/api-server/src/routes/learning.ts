import { Router, type IRouter, type Request } from "express";
import { getAuth } from "@clerk/express";
import {
  CompleteOnboardingBody,
  CompleteOnboardingResponse,
  CompletePracticeBody,
  CompletePracticeResponse,
  GetDailyPracticeResponse,
  GetDashboardResponse,
  GetLearningPathResponse,
  GetPeersResponse,
  GetTopicsResponse,
  SendTutorMessageBody,
  SendTutorMessageResponse,
  SubmitDiagnosticBody,
  SubmitDiagnosticResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.use((req, res, next) => {
  const auth = getAuth(req);
  const userId = auth?.sessionClaims?.userId || auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
});

const activity = [
  { day: "Mon", minutes: 32, isToday: false },
  { day: "Tue", minutes: 18, isToday: false },
  { day: "Wed", minutes: 46, isToday: false },
  { day: "Thu", minutes: 27, isToday: false },
  { day: "Fri", minutes: 54, isToday: false },
  { day: "Sat", minutes: 12, isToday: false },
  { day: "Sun", minutes: 38, isToday: true },
];

let dashboard = {
  learnerName: "Raghav",
  greeting: "Good morning, Raghav",
  currentTopic: "embeddings",
  currentTopicLabel: "Embeddings & semantic search",
  progressPercent: 68,
  streakDays: 7,
  weeklyMinutes: 227,
  completedTopics: 8,
  totalTopics: 12,
  nextAction: "Understand how an embedding captures meaning",
  weeklyActivity: activity,
  focusAreas: ["Chunking for retrieval", "Distance metrics", "Evaluation"],
};

const learningPath = [
  {
    id: "python",
    title: "Python for AI",
    category: "FOUNDATIONS",
    description: "Build the programming fluency you need to think in models.",
    status: "completed",
    durationMinutes: 180,
    order: 1,
    accent: "teal",
    confidence: 94,
  },
  {
    id: "math",
    title: "Math for machine learning",
    category: "FOUNDATIONS",
    description: "The small set of math ideas that make AI feel less mysterious.",
    status: "completed",
    durationMinutes: 150,
    order: 2,
    accent: "orange",
    confidence: 88,
  },
  {
    id: "ml",
    title: "Machine learning",
    category: "CORE CONCEPTS",
    description: "Learn how models learn, generalize, and make mistakes.",
    status: "completed",
    durationMinutes: 240,
    order: 3,
    accent: "purple",
    confidence: 81,
  },
  {
    id: "deep-learning",
    title: "Deep learning",
    category: "CORE CONCEPTS",
    description: "See how neural networks turn patterns into predictions.",
    status: "completed",
    durationMinutes: 210,
    order: 4,
    accent: "blue",
    confidence: 76,
  },
  {
    id: "nlp",
    title: "Natural language processing",
    category: "AI SYSTEMS",
    description: "From tokens and attention to the language systems we use daily.",
    status: "current",
    durationMinutes: 195,
    order: 5,
    accent: "teal",
    confidence: 69,
  },
  {
    id: "embeddings",
    title: "Embeddings & semantic search",
    category: "AI SYSTEMS",
    description: "Give concepts a shape so machines can compare meaning.",
    status: "current",
    durationMinutes: 90,
    order: 6,
    accent: "orange",
    confidence: 52,
  },
  {
    id: "rag",
    title: "Retrieval augmented generation",
    category: "GENERATIVE AI",
    description: "Ground language models in the information you trust.",
    status: "upcoming",
    durationMinutes: 165,
    order: 7,
    accent: "purple",
    confidence: 22,
  },
  {
    id: "agents",
    title: "Agents & tool use",
    category: "GENERATIVE AI",
    description: "Design systems that can reason, act, and recover.",
    status: "upcoming",
    durationMinutes: 180,
    order: 8,
    accent: "blue",
    confidence: 8,
  },
  {
    id: "mlops",
    title: "MLOps & responsible AI",
    category: "PUTTING IT TO WORK",
    description: "Ship useful models thoughtfully and keep them healthy.",
    status: "locked",
    durationMinutes: 210,
    order: 9,
    accent: "green",
    confidence: 0,
  },
];

const topics = [
  { id: "foundations", title: "AI foundations", category: "FOUNDATIONS", description: "The mental models behind modern AI.", lessonCount: 18, color: "teal", progressPercent: 100 },
  { id: "python", title: "Python for AI", category: "FOUNDATIONS", description: "Practice the language used to explore and build models.", lessonCount: 24, color: "orange", progressPercent: 100 },
  { id: "math", title: "Math for ML", category: "FOUNDATIONS", description: "Vectors, probability, and the intuition that connects it all.", lessonCount: 16, color: "purple", progressPercent: 88 },
  { id: "machine-learning", title: "Machine learning", category: "CORE CONCEPTS", description: "Learn from data, measure performance, improve.", lessonCount: 28, color: "blue", progressPercent: 82 },
  { id: "deep-learning", title: "Deep learning", category: "CORE CONCEPTS", description: "Neural networks, training loops, and representation.", lessonCount: 22, color: "teal", progressPercent: 76 },
  { id: "nlp", title: "NLP", category: "AI SYSTEMS", description: "How machines process, understand, and generate language.", lessonCount: 20, color: "orange", progressPercent: 42 },
  { id: "computer-vision", title: "Computer vision", category: "AI SYSTEMS", description: "Help models see objects, scenes, and patterns.", lessonCount: 19, color: "purple", progressPercent: 14 },
  { id: "generative-ai", title: "Generative AI", category: "GENERATIVE AI", description: "Prompting, model behavior, and building with foundation models.", lessonCount: 26, color: "blue", progressPercent: 28 },
  { id: "rag", title: "RAG & retrieval", category: "GENERATIVE AI", description: "Connect language models to reliable knowledge.", lessonCount: 16, color: "teal", progressPercent: 18 },
  { id: "agents", title: "Agents", category: "GENERATIVE AI", description: "Build systems that reason, choose tools, and take action.", lessonCount: 18, color: "orange", progressPercent: 6 },
  { id: "mlops", title: "MLOps", category: "PUTTING IT TO WORK", description: "Deploy, observe, and improve models in the real world.", lessonCount: 21, color: "purple", progressPercent: 0 },
  { id: "responsible-ai", title: "Responsible AI", category: "PUTTING IT TO WORK", description: "Make systems safer, fairer, and easier to trust.", lessonCount: 14, color: "blue", progressPercent: 0 },
];

type LearnerData = {
  dashboard: typeof dashboard;
  learningPath: typeof learningPath;
};

const learnerData = new Map<string, LearnerData>();

function getUserId(req: Request) {
  const auth = getAuth(req);
  const userId = auth?.sessionClaims?.userId || auth?.userId;
  return typeof userId === "string" ? userId : null;
}

function getLearnerData(req: Request) {
  const userId = getUserId(req);
  if (!userId) throw new Error("Missing authenticated user");
  const existing = learnerData.get(userId);
  if (existing) return existing;
  const initial: LearnerData = {
    dashboard: {
      ...dashboard,
      weeklyActivity: activity.map((day) => ({ ...day })),
      focusAreas: [...(dashboard.focusAreas ?? [])],
    },
    learningPath: learningPath.map((node) => ({ ...node })),
  };
  learnerData.set(userId, initial);
  return initial;
}

let practiceComplete = false;

router.get("/dashboard", (req, res) => {
  res.json(GetDashboardResponse.parse(getLearnerData(req).dashboard));
});

router.get("/learning-path", (req, res) => {
  res.json(GetLearningPathResponse.parse(getLearnerData(req).learningPath));
});

router.get("/topics", (_req, res) => {
  res.json(GetTopicsResponse.parse(topics));
});

router.get("/daily-practice", (_req, res) => {
  res.json(
    GetDailyPracticeResponse.parse({
      id: "embeddings-check",
      topic: "Embeddings",
      title: "A five-minute mental model",
      prompt:
        "Why can two sentences with completely different words still end up close together in embedding space?",
      options: [
        "Because the model maps related meaning to nearby vectors",
        "Because every sentence has the same number of words",
        "Because embeddings only compare exact spelling",
        "Because the database sorts them alphabetically",
      ],
      minutes: 5,
      difficulty: "Just right",
    }),
  );
});

router.post("/diagnostic/submit", (req, res) => {
  const parsed = SubmitDiagnosticBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  res.json(
    SubmitDiagnosticResponse.parse({
      evaluatedLevel: "developing",
      accuracyPercent: 72,
      strengths: ["Model intuition", "Explaining concepts simply"],
      focusAreas: ["Distance metrics", "Chunking for retrieval"],
      message:
        "You have a strong feel for the ideas. We’ll add a little more practice where the details get precise.",
    }),
  );
});

router.post("/onboarding/complete", (req, res) => {
  const parsed = CompleteOnboardingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { userName, focus, answers, role } = parsed.data;
  const accuracyPercent = Math.min(100, 45 + answers.filter((answer) => answer.startsWith("correct:")).length * 18);
  const evaluatedLevel = accuracyPercent >= 82 ? "intermediate" : accuracyPercent >= 62 ? "developing" : "beginner";
  const focusLabels: Record<string, string> = {
    programming: "Programming for AI",
    fundamentals: "AI fundamentals",
    math: "Math and statistics for AI",
    machineLearning: "Machine learning",
    deepLearning: "Deep learning",
    nlp: "Natural language processing",
    rag: "RAG and retrieval",
    agents: "Agents and tool use",
    mlops: "MLOps",
  };
  const focusLabel = focusLabels[focus] ?? "AI foundations";

  const learner = getLearnerData(req);
  learner.dashboard = {
    ...learner.dashboard,
    learnerName: userName,
    greeting: `Good morning, ${userName}`,
    currentTopic: focus,
    currentTopicLabel: focusLabel,
    progressPercent: Math.max(6, Math.round(accuracyPercent * 0.78)),
    completedTopics: evaluatedLevel === "beginner" ? 1 : evaluatedLevel === "developing" ? 3 : 5,
    totalTopics: 12,
    nextAction: `Build your first mental model of ${focusLabel.toLowerCase()}`,
    focusAreas: role === "student" ? ["Core concepts", "Practice explaining", "Confidence checks"] : ["Core concepts", "Practical examples", "Confidence checks"],
  };

  const focusPathIds: Record<string, string> = {
    programming: "python",
    fundamentals: "foundations",
    math: "math",
    machineLearning: "ml",
    deepLearning: "deep-learning",
    nlp: "nlp",
    rag: "rag",
    agents: "agents",
    mlops: "mlops",
  };
  const currentIndex = Math.max(0, learner.learningPath.findIndex((node) => node.id === focusPathIds[focus]));
  learner.learningPath.forEach((node, index) => {
    if (index < currentIndex) node.status = "completed";
    if (index === currentIndex) node.status = "current";
    if (index > currentIndex) node.status = node.status === "locked" ? "locked" : "upcoming";
  });

  res.json(
    CompleteOnboardingResponse.parse({
      evaluatedLevel,
      accuracyPercent,
      focusLabel,
      pathSummary: `A ${evaluatedLevel} path that starts with ${focusLabel.toLowerCase()} and grows toward real AI systems.`,
      message: `Nice work, ${userName}. We found the right starting point and shaped your first route through AI.`,
    }),
  );
});

router.post("/practice/complete", (req, res) => {
  const parsed = CompletePracticeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  practiceComplete = true;
  const learner = getLearnerData(req);
  learner.dashboard = {
    ...learner.dashboard,
    progressPercent: Math.min(100, dashboard.progressPercent + 1),
    weeklyMinutes: dashboard.weeklyMinutes + 5,
    streakDays: dashboard.streakDays + 1,
  };

  res.json(
    CompletePracticeResponse.parse({
      correct: parsed.data.answer === "Because the model maps related meaning to nearby vectors",
      scorePercent: parsed.data.answer === "Because the model maps related meaning to nearby vectors" ? 100 : 55,
      feedback:
        parsed.data.answer === "Because the model maps related meaning to nearby vectors"
          ? "Exactly. The vector is useful because it preserves relationships, not just the original words."
          : "You’re close. Think about how a model can represent meaning as position rather than as a string.",
      nextStep: "Review distance metrics, then try the retrieval challenge.",
    }),
  );
});

router.get("/peers", (_req, res) => {
  res.json(
    GetPeersResponse.parse([
      { id: "maya", name: "Maya Chen", role: "Product designer", focus: "AI literacy", level: "Exploring", matchPercent: 94, initials: "MC", accent: "orange" },
      { id: "jonas", name: "Jonas Berg", role: "Software engineer", focus: "RAG systems", level: "Building", matchPercent: 87, initials: "JB", accent: "purple" },
      { id: "amira", name: "Amira Patel", role: "Student", focus: "ML foundations", level: "Learning", matchPercent: 81, initials: "AP", accent: "teal" },
    ]),
  );
});

router.post("/tutor/message", (req, res) => {
  const parsed = SendTutorMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const message = parsed.data.message.toLowerCase();
  const reply = message.includes("embedding")
    ? "Think of an embedding as a location on a map of meaning. Sentences that mean similar things land near one another, even when they use different words. The next useful question is how we measure “near.”"
    : message.includes("agent")
      ? "An agent is a system that can decide what to do next, use a tool, and learn from the result. Start with one clear goal and one reliable tool before adding more autonomy."
      : "Start with the idea underneath the vocabulary. Tell me what you think is happening, and I’ll help you find the missing piece without jumping ahead.";

  res.json(
    SendTutorMessageResponse.parse({
      reply,
      topic: parsed.data.topic ?? getLearnerData(req).dashboard.currentTopic,
      suggestedPrompt: "Can you give me a simple example?",
    }),
  );
});

export default router;