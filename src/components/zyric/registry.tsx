import type { ComponentType } from "react";
import {
  NotebookPen,
  FileText,
  CaseSensitive,
  AlignLeft,
  Wallet,
  Flame,
  ListTodo,
  Droplets,
  Percent,
  Landmark,
  Scale,
  Cake,
  CalendarRange,
  Ruler,
  Coins,
  Brain,
  Timer,
  KeyRound,
  Fingerprint,
  Binary,
  FileJson,
  QrCode,
  Dices,
  StickyNote,
  LineChart,
  Calculator,
  Repeat2,
  Clock3,
  Sparkles,
  Wand2,
} from "lucide-react";

import {
  NotesTool,
  WordCounterTool,
  CaseConverterTool,
  LoremTool,
} from "./text-tools";
import {
  ExpenseTool,
  HabitTool,
  TodoTool,
  WaterTool,
} from "./tracker-tools";
import {
  PercentageTool,
  LoanTool,
  BmiTool,
  AgeTool,
  DateDiffTool,
} from "./calc-tools";
import {
  UnitConverterTool,
  CurrencyTool,
  PomodoroTool,
  StopwatchTool,
} from "./convert-time-tools";
import {
  PasswordTool,
  UuidTool,
  EncoderTool,
  JsonTool,
  QrTool,
} from "./dev-tools";
import { RandomPickerTool } from "./random-tools";

export interface ToolMeta {
  id: string;
  name: string;
  description: string;
  category: CategoryId;
  icon: ComponentType<{ className?: string }>;
  keywords: string;
  badge?: "new" | "local" | "saved";
  component: ComponentType;
}

export type CategoryId =
  | "notes"
  | "trackers"
  | "calculators"
  | "converters"
  | "time"
  | "generators"
  | "random";

export const CATEGORIES: { id: CategoryId; label: string; icon: ComponentType<{ className?: string }>; blurb: string }[] = [
  {
    id: "notes",
    label: "Notes & Writing",
    icon: StickyNote,
    blurb: "Capture thoughts, count words, transform text",
  },
  {
    id: "trackers",
    label: "Daily Trackers",
    icon: LineChart,
    blurb: "Expenses, habits, tasks and hydration — saved on your device",
  },
  {
    id: "calculators",
    label: "Calculators",
    icon: Calculator,
    blurb: "Percentages, loans, BMI, age and dates",
  },
  {
    id: "converters",
    label: "Converters",
    icon: Repeat2,
    blurb: "Units, currencies and more, instantly",
  },
  {
    id: "time",
    label: "Time & Focus",
    icon: Clock3,
    blurb: "Pomodoro sessions and a precise stopwatch",
  },
  {
    id: "generators",
    label: "Generators & Dev",
    icon: Wand2,
    blurb: "Passwords, UUIDs, encoders, JSON and QR codes",
  },
  {
    id: "random",
    label: "Random & Fun",
    icon: Dices,
    blurb: "Coins, dice, numbers and lucky picks",
  },
];

export const TOOLS: ToolMeta[] = [
  // Notes & Writing
  {
    id: "notes",
    name: "Quick Notes",
    description: "A fast sticky-note pad that auto-saves in your browser.",
    category: "notes",
    icon: NotebookPen,
    keywords: "notes notepad memo sticky write thoughts scratchpad",
    badge: "saved",
    component: NotesTool,
  },
  {
    id: "word-counter",
    name: "Word Counter",
    description: "Live word, character, sentence counts plus reading time.",
    category: "notes",
    icon: FileText,
    keywords: "words characters count sentences reading time essay length",
    component: WordCounterTool,
  },
  {
    id: "case-converter",
    name: "Case Converter",
    description: "UPPERCASE, camelCase, snake_case and 6 more, instantly.",
    category: "notes",
    icon: CaseSensitive,
    keywords: "uppercase lowercase camel pascal snake kebab title sentence case",
    component: CaseConverterTool,
  },
  {
    id: "lorem-ipsum",
    name: "Lorem Ipsum",
    description: "Placeholder text by paragraphs, sentences or words.",
    category: "notes",
    icon: AlignLeft,
    keywords: "lorem ipsum placeholder dummy text filler",
    component: LoremTool,
  },

  // Trackers
  {
    id: "expense-tracker",
    name: "Expense Tracker",
    description: "Log income & expenses, see your balance — no account needed.",
    category: "trackers",
    icon: Wallet,
    keywords: "expense income money budget finance tracker spending balance",
    badge: "saved",
    component: ExpenseTool,
  },
  {
    id: "habit-tracker",
    name: "Habit Tracker",
    description: "Build streaks with a 7-day check-off grid for each habit.",
    category: "trackers",
    icon: Flame,
    keywords: "habit streak daily routine check consistency goals",
    badge: "saved",
    component: HabitTool,
  },
  {
    id: "todo",
    name: "To-Do List",
    description: "Tasks with priorities, filters and one-tap completion.",
    category: "trackers",
    icon: ListTodo,
    keywords: "todo tasks checklist productivity priorities done",
    badge: "saved",
    component: TodoTool,
  },
  {
    id: "water-tracker",
    name: "Water Tracker",
    description: "Tap a button per glass — daily goal with auto-reset.",
    category: "trackers",
    icon: Droplets,
    keywords: "water hydration drink glasses daily health goal",
    badge: "saved",
    component: WaterTool,
  },

  // Calculators
  {
    id: "percentage",
    name: "Percentage Calc",
    description: "Three percentage modes with live results.",
    category: "calculators",
    icon: Percent,
    keywords: "percent percentage change increase decrease of what",
    component: PercentageTool,
  },
  {
    id: "loan-emi",
    name: "Loan / EMI Calc",
    description: "Monthly payment, total interest and repayment for any loan.",
    category: "calculators",
    icon: Landmark,
    keywords: "loan emi mortgage interest monthly payment bank credit finance",
    component: LoanTool,
  },
  {
    id: "bmi",
    name: "BMI Calculator",
    description: "Body mass index with healthy weight range, metric or imperial.",
    category: "calculators",
    icon: Scale,
    keywords: "bmi body mass index weight height health fitness",
    component: BmiTool,
  },
  {
    id: "age",
    name: "Age Calculator",
    description: "Exact age in years, months, days — plus next-birthday countdown.",
    category: "calculators",
    icon: Cake,
    keywords: "age birthday born years months days calculator",
    component: AgeTool,
  },
  {
    id: "date-diff",
    name: "Date Difference",
    description: "Days, weeks, hours and minutes between any two dates.",
    category: "calculators",
    icon: CalendarRange,
    keywords: "date difference days between countdown duration days",
    component: DateDiffTool,
  },

  // Converters
  {
    id: "unit-converter",
    name: "Unit Converter",
    description: "Length, weight, data, speed and temperature in one place.",
    category: "converters",
    icon: Ruler,
    keywords: "unit convert length weight temperature data speed km miles celsius fahrenheit kg pounds",
    component: UnitConverterTool,
  },
  {
    id: "currency",
    name: "Currency Converter",
    description: "12 currencies with offline reference rates for quick estimates.",
    category: "converters",
    icon: Coins,
    keywords: "currency money usd eur pkr bdt inr exchange rate convert",
    component: CurrencyTool,
  },

  // Time & Focus
  {
    id: "pomodoro",
    name: "Pomodoro Timer",
    description: "25/5 focus cycles with auto-breaks and session counter.",
    category: "time",
    icon: Brain,
    keywords: "pomodoro focus timer study work productivity break 25",
    component: PomodoroTool,
  },
  {
    id: "stopwatch",
    name: "Stopwatch",
    description: "Precise timing with laps and split times.",
    category: "time",
    icon: Timer,
    keywords: "stopwatch timer laps splits countdown exercise time",
    component: StopwatchTool,
  },

  // Generators & Dev
  {
    id: "password",
    name: "Password Generator",
    description: "Crypto-strong passwords with a strength meter.",
    category: "generators",
    icon: KeyRound,
    keywords: "password secure random generator strong symbols entropy",
    badge: "local",
    component: PasswordTool,
  },
  {
    id: "uuid",
    name: "UUID Generator",
    description: "Batch-generate v4 UUIDs with one-click copy.",
    category: "generators",
    icon: Fingerprint,
    keywords: "uuid guid identifier unique random v4 developer",
    component: UuidTool,
  },
  {
    id: "encoder",
    name: "Base64 / URL Encoder",
    description: "Encode and decode Base64 and URL-safe text.",
    category: "generators",
    icon: Binary,
    keywords: "base64 url encode decode developer converter",
    component: EncoderTool,
  },
  {
    id: "json",
    name: "JSON Formatter",
    description: "Beautify, minify and validate JSON with clear errors.",
    category: "generators",
    icon: FileJson,
    keywords: "json format beautify minify validate developer pretty",
    component: JsonTool,
  },
  {
    id: "qr",
    name: "QR Code Maker",
    description: "Custom-colored QR codes you can download as PNG.",
    category: "generators",
    icon: QrCode,
    keywords: "qr code generator url link scan png download",
    badge: "new",
    component: QrTool,
  },

  // Random & Fun
  {
    id: "random",
    name: "Random Picker",
    description: "Coin flip, dice, random numbers and list draws.",
    category: "random",
    icon: Dices,
    keywords: "random coin flip dice roll number picker list lucky draw decision",
    component: RandomPickerTool,
  },
];

export const TOOL_COUNT = TOOLS.length;

export function searchTools(query: string): ToolMeta[] {
  const q = query.trim().toLowerCase();
  if (!q) return TOOLS;
  return TOOLS.filter((t) =>
    `${t.name} ${t.description} ${t.keywords} ${t.category}`.toLowerCase().includes(q)
  );
}
