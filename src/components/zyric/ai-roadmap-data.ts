/**
 * THE AI ACADEMY — five complete roadmaps that take a student from absolute
 * zero to provable AI skill using ONLY free resources.
 *
 * RULES for this data (mirrors THE VAULT):
 *  - every step must be genuinely free (free tier / free course / free tool)
 *  - every link is an OFFICIAL provider page — never referral/affiliate links
 *  - time estimates are honest: "mins" is focused-work minutes for a beginner
 *  - availability of free tiers and course pages can change; the wing shows
 *    a standing "verify on the official page" disclaimer
 */

export type TrackId = "zero-ai" | "prompt-craft" | "ml-foundations" | "ai-builder" | "ai-portfolio";

export type StepKind = "watch" | "read" | "course" | "practice" | "build" | "prove";

export interface RoadStep {
  label: string;      // the resource or action, short
  detail: string;     // what exactly to do + what "done" looks like
  link?: string;      // official URL (omit for pure-practice steps)
  kind: StepKind;
  mins: number;       // estimated focused minutes
}

export interface RoadStage {
  title: string;      // stage name, e.g. "Week 1 · Get your bearings"
  goal: string;       // one sentence: what you can do after this stage
  steps: RoadStep[];
}

export interface RoadTrack {
  id: TrackId;
  title: string;      // display name
  tagline: string;    // one-liner for the card
  level: "beginner" | "confident" | "builder";
  weeks: number;      // at the recommended pace
  hours: number;      // total focused hours (sum of steps, rounded)
  color: string;      // accent for this track's chips/meters
  icon: string;       // lucide icon name resolved in the app
  outcomes: string[]; // 3–5 bullet "after this you can…" statements
  stages: RoadStage[];
}

export const STEP_KIND_META: Record<StepKind, { label: string; color: string }> = {
  watch:    { label: "watch",    color: "#FFD43B" },
  read:     { label: "read",     color: "#FF9DE2" },
  course:   { label: "course",   color: "#7FC8FF" },
  practice: { label: "practice", color: "#5EE39A" },
  build:    { label: "build",    color: "#FF7A3D" },
  prove:    { label: "prove",    color: "#B9A6FF" },
};

export const TRACKS: RoadTrack[] = [
  /* ==================================================================== */
  {
    id: "zero-ai",
    title: "AI From Absolute Zero",
    tagline: "Never used an AI chat? Two weeks from zero to confident daily user.",
    level: "beginner",
    weeks: 2,
    hours: 16,
    color: "#5EE39A",
    icon: "Bot",
    outcomes: [
      "Explain in plain words what AI models can and cannot do",
      "Use a free AI assistant daily for notes, emails and study help",
      "Spot hallucinations and know when NOT to trust an answer",
      "Run a personal study system ( NotebookLM + flashcards ) for free",
    ],
    stages: [
      {
        title: "Stage 1 · Get your bearings",
        goal: "You can describe what a large language model actually is — and what it isn't.",
        steps: [
          {
            label: "Elements of AI — first chapters",
            detail: "University of Helsinki's famous free course. Do Chapter 1 and 2, no math needed. Done = you can say what machine learning is in 3 sentences.",
            link: "https://www.elementsofai.com",
            kind: "course",
            mins: 120,
          },
          {
            label: "Google's Intro to Generative AI",
            detail: "Google Cloud Skills Boost learning path (free with a Google account). Watch the first two courses at 1.25x. Done = you can explain 'generative' vs 'classic' AI.",
            link: "https://www.cloudskillsboost.google/paths/118",
            kind: "course",
            mins: 90,
          },
          {
            label: "Open your first free AI accounts",
            detail: "Sign up free at ChatGPT, Google Gemini and Claude — no card needed. Try the SAME question on all three and compare answers side by side.",
            link: "https://gemini.google.com",
            kind: "practice",
            mins: 45,
          },
          {
            label: "Break it on purpose",
            detail: "Ask a model about something you KNOW deeply (your hometown, your hobby). Note where it's wrong or vague. Done = you have your first hallucination story.",
            kind: "practice",
            mins: 30,
          },
        ],
      },
      {
        title: "Stage 2 · Talk to machines properly",
        goal: "Your prompts get useful answers on the first try, most of the time.",
        steps: [
          {
            label: "Read one prompting guide, slowly",
            detail: "Google's prompting strategies guide for Gemini. Focus on: give context, give a role, give the output format. Done = you can name the 4 parts of a good prompt.",
            link: "https://ai.google.dev/gemini-api/docs/prompting-strategies",
            kind: "read",
            mins: 45,
          },
          {
            label: "Run the 7-day prompt challenge",
            detail: "One real task per day: summarize your notes, plan a week, draft an email, explain a hard topic at 3 levels, critique your writing, brainstorm 20 ideas, quiz yourself.",
            kind: "practice",
            mins: 210,
          },
          {
            label: "Grade your prompts",
            detail: "Paste 3 of your challenge prompts into zyric's Prompt Grader tool. Fix what it flags. Done = score above 75 on a re-written prompt.",
            kind: "practice",
            mins: 30,
          },
        ],
      },
      {
        title: "Stage 3 · AI in your daily work",
        goal: "You have a real, working AI study system you actually use.",
        steps: [
          {
            label: "NotebookLM for your notes",
            detail: "Upload lecture slides or paste notes into Google's NotebookLM (free). Generate a study guide + audio overview. Done = one course loaded and summarized.",
            link: "https://notebooklm.google.com",
            kind: "practice",
            mins: 60,
          },
          {
            label: "Perplexity as a research assistant",
            detail: "Use the free tier for your next assignment research — every answer with sources. Done = you've verified one claim it made by opening the actual source.",
            link: "https://www.perplexity.ai",
            kind: "practice",
            mins: 40,
          },
          {
            label: "Free image generation",
            detail: "Try Bing Image Creator (free with a Microsoft account) for a poster or presentation art. Learn why vague prompts give mush.",
            link: "https://www.bing.com/create",
            kind: "practice",
            mins: 30,
          },
          {
            label: "Capstone · your study OS",
            detail: "Combine NotebookLM + flashcards (zyric's Flashcard Maker) + a weekly AI-planned review schedule. Done = you used the full loop for one real course this week.",
            kind: "build",
            mins: 90,
          },
        ],
      },
    ],
  },

  /* ==================================================================== */
  {
    id: "prompt-craft",
    title: "Prompt Engineering",
    tagline: "Three weeks to prompts that work on the first try — for study, code and work.",
    level: "beginner",
    weeks: 3,
    hours: 22,
    color: "#B9A6FF",
    icon: "Sparkles",
    outcomes: [
      "Write structured prompts: role, task, context, format, constraints",
      "Use few-shot examples and chain-of-thought deliberately",
      "Build and reuse a personal prompt library",
      "Test and refine prompts instead of guessing",
    ],
    stages: [
      {
        title: "Stage 1 · Anatomy of a prompt",
        goal: "You never send a one-line prompt again.",
        steps: [
          {
            label: "OpenAI's prompt engineering guide",
            detail: "Official, free, no account needed. Read the six strategies; write each one down in your own words.",
            link: "https://platform.openai.com/docs/guides/prompt-engineering",
            kind: "read",
            mins: 60,
          },
          {
            label: "Anthropic's prompt engineering overview",
            detail: "The other big lab's official guide — notice how both agree on clarity, examples and output structure.",
            link: "https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview",
            kind: "read",
            mins: 45,
          },
          {
            label: "Rebuild 5 old prompts",
            detail: "Take 5 weak prompts you actually sent. Rebuild each with role + task + context + format + constraints. Compare old vs new outputs.",
            kind: "practice",
            mins: 90,
          },
        ],
      },
      {
        title: "Stage 2 · The power patterns",
        goal: "Few-shot, chain-of-thought and system prompts are tools you reach for on purpose.",
        steps: [
          {
            label: "Few-shot examples that steer",
            detail: "Practice showing 2–3 example inputs/outputs to force a style. Try it for: marking scheme, translation style, code comments.",
            link: "https://ai.google.dev/gemini-api/docs/prompting-strategies",
            kind: "practice",
            mins: 60,
          },
          {
            label: "Chain-of-thought on hard problems",
            detail: "Take a math/logic problem. Ask directly (wrong?), then ask to reason step by step. Feel the difference; note when it's worth it.",
            kind: "practice",
            mins: 45,
          },
          {
            label: "Study the prompt library",
            detail: "Browse Anthropic's official prompt library. Pick 3 prompts, take them apart, note the patterns they share.",
            link: "https://docs.anthropic.com/en/prompt-library/library",
            kind: "read",
            mins: 45,
          },
          {
            label: "System prompts for repeated work",
            detail: "Set a system/persona prompt for one recurring job (tutor, editor, interviewer). Keep it under 150 words and test it 5 times.",
            kind: "practice",
            mins: 60,
          },
        ],
      },
      {
        title: "Stage 3 · Test, refine, keep",
        goal: "You own a tested prompt library you actually reuse.",
        steps: [
          {
            label: "Build your prompt library",
            detail: "10+ prompts that each carry: purpose, the template, one worked example. Keep it in a doc or your notes app.",
            kind: "build",
            mins: 120,
          },
          {
            label: "A/B test your best prompt",
            detail: "Take your most-used prompt. Write 2 variants. Run each 5 times on fresh inputs. Keep the winner; log why it won.",
            kind: "practice",
            mins: 60,
          },
          {
            label: "Capstone · the interview-crib prompt",
            detail: "Build a single mega-prompt that takes any topic and outputs: summary, 10 quiz questions with answers, and 3 misconceptions. Test on 3 topics.",
            kind: "build",
            mins: 90,
          },
        ],
      },
    ],
  },

  /* ==================================================================== */
  {
    id: "ml-foundations",
    title: "Machine Learning Foundations",
    tagline: "Eight weeks of Python, just-enough math, and your first real models — all free.",
    level: "confident",
    weeks: 8,
    hours: 72,
    color: "#7FC8FF",
    icon: "BrainCircuit",
    outcomes: [
      "Write working Python and use NumPy/pandas notebooks",
      "Understand linear regression, trees and overfitting in plain math",
      "Train, evaluate and improve real models on real datasets",
      "Enter a Kaggle competition with a submitted, scored model",
    ],
    stages: [
      {
        title: "Stage 1 · Python first (weeks 1–2)",
        goal: "You can read and write everyday Python in a notebook.",
        steps: [
          {
            label: "Kaggle Learn · Python",
            detail: "Seven free lessons, run in the browser, no install, certificate at the end. Do 2–3 lessons per day. Done = certificate earned.",
            link: "https://www.kaggle.com/learn/python",
            kind: "course",
            mins: 300,
          },
          {
            label: "Google Colab as your lab",
            detail: "Open a free Colab notebook, upload a CSV, load it with pandas, show summary stats. Done = one notebook you keep as reference.",
            link: "https://colab.research.google.com",
            kind: "practice",
            mins: 90,
          },
          {
            label: "Mini-project · analyze any dataset",
            detail: "Pick a dataset from data.gov or Kaggle. Answer 5 questions with pandas (means, counts, groupbys). Done = shared notebook link.",
            link: "https://www.kaggle.com/datasets",
            kind: "build",
            mins: 180,
          },
        ],
      },
      {
        title: "Stage 2 · The math that matters (week 3)",
        goal: "Vectors, matrices, means and spread no longer scare you.",
        steps: [
          {
            label: "3Blue1Brown · Essence of Linear Algebra",
            detail: "The visual intuition playlist (free). Watch chapters 1–4. Done = you can say what a matrix multiply does geometrically.",
            link: "https://www.3blue1brown.com/topics/linear-algebra",
            kind: "watch",
            mins: 90,
          },
          {
            label: "Khan Academy · Statistics essentials",
            detail: "Free course. Do mean/median/spread, correlation, and basic probability units. Done = quiz scores above 80%.",
            link: "https://www.khanacademy.org/math/statistics-probability",
            kind: "course",
            mins: 240,
          },
        ],
      },
      {
        title: "Stage 3 · Core ML (weeks 4–6)",
        goal: "You know what a model trains on, why it overfits, and how to tell.",
        steps: [
          {
            label: "Kaggle Learn · Intro to Machine Learning",
            detail: "Decision trees, validation, underfitting/overfitting, random forests. Certificate at the end.",
            link: "https://www.kaggle.com/learn/intro-to-machine-learning",
            kind: "course",
            mins: 180,
          },
          {
            label: "Google ML Crash Course",
            detail: "Google's official free course with interactive visualizations. Do the core modules (regression, classification, regularization).",
            link: "https://developers.google.com/machine-learning/crash-course",
            kind: "course",
            mins: 300,
          },
          {
            label: "StatQuest when something is fuzzy",
            detail: "Keep StatQuest's channel open. Whenever a concept is unclear (gradient descent, ROC), watch the specific video.",
            link: "https://www.youtube.com/@statquest",
            kind: "watch",
            mins: 120,
          },
          {
            label: "Kaggle Learn · Intermediate ML",
            detail: "Missing values, categorical encodings, pipelines, cross-validation. This is where models stop being toys.",
            link: "https://www.kaggle.com/learn/intermediate-machine-learning",
            kind: "course",
            mins: 240,
          },
        ],
      },
      {
        title: "Stage 4 · First real models (weeks 7–8)",
        goal: "You have a scored submission on a real leaderboard.",
        steps: [
          {
            label: "Titanic, end to end",
            detail: "Kaggle's classic. EDA → features → model → validation → SUBMIT. Done = you're on the leaderboard, any score.",
            link: "https://www.kaggle.com/competitions/titanic",
            kind: "build",
            mins: 300,
          },
          {
            label: "House Prices improvement loop",
            detail: "Second competition. Beat your Titanic process: better features, XGBoost, cross-validation. Done = top half of the leaderboard.",
            link: "https://www.kaggle.com/competitions/house-prices-advanced-regression-techniques",
            kind: "build",
            mins: 360,
          },
          {
            label: "Prove it · write the notebook up",
            detail: "Publish your best notebook public on Kaggle with a clean narrative: problem, approach, result. Done = shareable link for your CV.",
            kind: "prove",
            mins: 120,
          },
        ],
      },
    ],
  },

  /* ==================================================================== */
  {
    id: "ai-builder",
    title: "Build with Free AI APIs",
    tagline: "Six weeks to ship real AI apps on free tiers — Gemini, Groq, Hugging Face.",
    level: "builder",
    weeks: 6,
    hours: 56,
    color: "#FF7A3D",
    icon: "Code2",
    outcomes: [
      "Call LLM APIs for free and handle rate limits sanely",
      "Build a browser app that talks to a free AI API",
      "Explain embeddings and run a tiny local RAG",
      "Ship a public demo with a README people can follow",
    ],
    stages: [
      {
        title: "Stage 1 · Free compute setup (week 1)",
        goal: "You have API keys for 3 free AI services and know their limits.",
        steps: [
          {
            label: "Google AI Studio + Gemini free tier",
            detail: "Sign in at aistudio.google.com, create an API key. Read the free-tier rate limits on the pricing page. Done = one working call from Colab.",
            link: "https://aistudio.google.com",
            kind: "practice",
            mins: 90,
          },
          {
            label: "Groq free tier — speed run",
            detail: "Get a free Groq API key and feel LPU speed. Run the quickstart chat example. Done = a streamed response in your terminal or notebook.",
            link: "https://console.groq.com",
            kind: "practice",
            mins: 60,
          },
          {
            label: "Hugging Face account + hub tour",
            detail: "Create a free account. Explore model cards, datasets and Spaces. Try 3 models in the browser. Done = you know what a model card tells you.",
            link: "https://huggingface.co",
            kind: "read",
            mins: 60,
          },
        ],
      },
      {
        title: "Stage 2 · LLM app basics (weeks 2–3)",
        goal: "You can build a small app that calls an LLM with proper prompting and error handling.",
        steps: [
          {
            label: "Gemini API quickstart, properly",
            detail: "Do the official quickstart in JavaScript or Python: chat, streaming, JSON mode, safety settings. Done = notes on the 4 call patterns.",
            link: "https://ai.google.dev/gemini-api/docs/quickstart",
            kind: "course",
            mins: 120,
          },
          {
            label: "Build · summarize-me",
            detail: "Client-side web page: paste any text → choose summary style (bullets, ELI5, exam notes) → call the API. Done = working deploy you can open on your phone.",
            kind: "build",
            mins: 240,
          },
          {
            label: "Respect the limits",
            detail: "Add request caching + a friendly 'rate limit, wait Ns' message. Learn the 429 dance now, thank yourself later.",
            kind: "practice",
            mins: 90,
          },
        ],
      },
      {
        title: "Stage 3 · Beyond chat: embeddings + RAG (weeks 4–5)",
        goal: "You can explain RAG to a friend and run one locally for free.",
        steps: [
          {
            label: "Hugging Face LLM course",
            detail: "The official HF course (free). Do the embeddings and semantic-search chapters. Done = you can explain cosine similarity in one breath.",
            link: "https://huggingface.co/learn",
            kind: "course",
            mins: 180,
          },
          {
            label: "Local embeddings for free",
            detail: "Run sentence-transformers in Colab (free GPU). Embed 100 of your own notes. Done = find-similar-note demo working.",
            link: "https://www.sbert.net",
            kind: "practice",
            mins: 120,
          },
          {
            label: "Build · notes-RAG",
            detail: "Chunk your notes → embed → nearest-match → stuff into a prompt → answer with citations to your own notes. All free, all local.",
            kind: "build",
            mins: 300,
          },
        ],
      },
      {
        title: "Stage 4 · Ship it (week 6)",
        goal: "A stranger can open your demo and use it in one click.",
        steps: [
          {
            label: "Deploy on a free tier",
            detail: "Vercel Hobby or Netlify free or GitHub Pages. Custom domain optional. Done = HTTPS link, works on mobile.",
            link: "https://vercel.com/pricing",
            kind: "practice",
            mins: 90,
          },
          {
            label: "README that sells the work",
            detail: "Problem, 3 screenshots or a GIF, how to run, what the limits are, what you'd do next. Done = a friend understands it without asking you.",
            kind: "build",
            mins: 120,
          },
          {
            label: "Capstone · post it publicly",
            detail: "Share on dev.to / X / LinkedIn with the demo link and one honest lesson learned. Done = at least one stranger reaction.",
            link: "https://dev.to",
            kind: "prove",
            mins: 60,
          },
        ],
      },
    ],
  },

  /* ==================================================================== */
  {
    id: "ai-portfolio",
    title: "Portfolio & First AI Wins",
    tagline: "Four weeks to turn skills into proof: projects, certificates, visibility.",
    level: "builder",
    weeks: 4,
    hours: 32,
    color: "#FFD43B",
    icon: "Rocket",
    outcomes: [
      "A GitHub profile that shows 3 finished AI projects",
      "Free certificates from Kaggle, freeCodeCamp and Hugging Face",
      "One public write-up that ranks for your name",
      "A shortlist of internships/jobs to apply to this month",
    ],
    stages: [
      {
        title: "Stage 1 · Proof of work (weeks 1–2)",
        goal: "Your GitHub looks like a builder's, not a browser's.",
        steps: [
          {
            label: "GitHub profile README",
            detail: "Free official feature. Who you are, what you build, your stack, your best 3 repos pinned. Done = profile link you'd show a recruiter.",
            link: "https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-github-profile/customizing-your-profile/managing-your-profile-readme",
            kind: "build",
            mins: 90,
          },
          {
            label: "Polish 3 projects to sharable",
            detail: "Take your best work (zero-ai study OS, builder-track apps, ML notebooks). Each gets: clean README, demo link, honest limitations.",
            kind: "build",
            mins: 360,
          },
          {
            label: "Kaggle notebooks public",
            detail: "Publish your 2 best notebooks with clear narrative. Upvote others genuinely. Done = public links on your profile.",
            link: "https://www.kaggle.com/code",
            kind: "prove",
            mins: 120,
          },
        ],
      },
      {
        title: "Stage 2 · Free certificates that count (week 3)",
        goal: "Credentials a recruiter can check, all earned free.",
        steps: [
          {
            label: "Collect your Kaggle certificates",
            detail: "Finish any remaining Kaggle Learn courses (Python, Intro ML, Intermediate ML, Pandas). Each issues a real certificate URL.",
            link: "https://www.kaggle.com/learn",
            kind: "prove",
            mins: 240,
          },
          {
            label: "freeCodeCamp certification",
            detail: "Data Analysis with Python or Machine Learning with Python — fully free, project-based, verifiable certification.",
            link: "https://www.freecodecamp.org/learn",
            kind: "course",
            mins: 300,
          },
          {
            label: "CS50 AI (free audit)",
            detail: "Harvard's AI course, free to audit with all lectures and projects. Do weeks 0–2 now; finish the rest at your pace.",
            link: "https://cs50.harvard.edu/ai/",
            kind: "course",
            mins: 180,
          },
        ],
      },
      {
        title: "Stage 3 · Get seen (week 4)",
        goal: "People who don't know you can discover your work.",
        steps: [
          {
            label: "Write the story of one project",
            detail: "Post on dev.to: problem → approach → screenshots → what broke → lessons. Done = link that survives in a DM.",
            link: "https://dev.to",
            kind: "build",
            mins: 120,
          },
          {
            label: "First contribution",
            detail: "Find a 'good first issue' on a tool you actually use. Docs fix counts. Done = your first merged PR.",
            link: "https://goodfirstissue.dev",
            kind: "prove",
            mins: 180,
          },
          {
            label: "Apply · the honest shortlist",
            detail: "10 internships/junior roles you actually fit. Tailor 2 lines each referencing YOUR project. Done = sent, tracked, no spray.",
            kind: "practice",
            mins: 180,
          },
        ],
      },
    ],
  },
];

/* ------------------------------ helpers ----------------------------------- */

export function trackStats(t: RoadTrack): { steps: number; mins: number } {
  let steps = 0;
  let mins = 0;
  for (const st of t.stages) for (const s of st.steps) { steps += 1; mins += s.mins; }
  return { steps, mins };
}

export const TOTAL_STEPS = TRACKS.reduce((a, t) => a + trackStats(t).steps, 0);
export const TOTAL_MINS = TRACKS.reduce((a, t) => a + trackStats(t).mins, 0);
