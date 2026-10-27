"use client";

/*
 * TASKS PRO — a real task manager, still 100% client-side.
 * Projects with colors, due dates + overdue detection, subtasks with progress,
 * tags, P1–P4-style priorities, search, smart sorting, Today/Upcoming/Overdue
 * views, progress bar, undo-delete, JSON backup. Old {id,text,done,priority,
 * createdAt} tasks migrate automatically into the Inbox project.
 */

import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { inputCls, selectTriggerCls, todayStr, uid, useLocalStorage } from "./hooks";

/* --------------------------------- Model ---------------------------------- */

interface SubTask {
  id: string;
  text: string;
  done: boolean;
}

interface Task {
  id: string;
  text: string;
  done: boolean;
  priority: "low" | "medium" | "high";
  createdAt: number;
  completedAt: number;
  projectId: string;
  due: string;
  tags: string[];
  subtasks: SubTask[];
}

interface Project {
  id: string;
  name: string;
  color: number;
}

const PROJECT_COLORS = [
  { name: "Emerald", dot: "bg-emerald-400" },
  { name: "Sky", dot: "bg-sky-400" },
  { name: "Violet", dot: "bg-violet-400" },
  { name: "Amber", dot: "bg-amber-400" },
  { name: "Rose", dot: "bg-rose-400" },
  { name: "Teal", dot: "bg-teal-400" },
];

const PRIORITY_STYLE: Record<Task["priority"], string> = {
  low: "bg-zinc-500/15 text-zinc-400 border-zinc-600/40",
  medium: "bg-amber-500/15 text-amber-300 border-amber-600/40",
  high: "bg-rose-500/15 text-rose-300 border-rose-600/40",
};
const PRIORITY_ORDER: Record<Task["priority"], number> = { high: 0, medium: 1, low: 2 };

function dateFmt(d: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  return new Date(`${d}T00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function normalizeTask(raw: unknown): Task {
  const t = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  const createdAt = typeof t.createdAt === "number" ? t.createdAt : Date.now();
  const subtasks = Array.isArray(t.subtasks)
    ? (t.subtasks as unknown[]).map((s) => {
        const o = (typeof s === "object" && s !== null ? s : {}) as Record<string, unknown>;
        return { id: typeof o.id === "string" ? o.id : uid(), text: typeof o.text === "string" ? o.text : "", done: o.done === true };
      })
    : [];
  return {
    id: typeof t.id === "string" ? t.id : uid(),
    text: typeof t.text === "string" ? t.text : "",
    done: t.done === true,
    priority: t.priority === "low" || t.priority === "medium" || t.priority === "high" ? t.priority : "medium",
    createdAt,
    completedAt: typeof t.completedAt === "number" ? t.completedAt : 0,
    projectId: typeof t.projectId === "string" ? t.projectId : "inbox",
    due: typeof t.due === "string" ? t.due : "",
    tags: Array.isArray(t.tags) ? (t.tags as unknown[]).filter((x): x is string => typeof x === "string") : [],
    subtasks,
  };
}

/* ------------------------------- Tasks (main) ------------------------------ */

type TaskView = "all" | "today" | "upcoming" | "overdue" | "done";
type TaskSort = "smart" | "priority" | "due" | "newest" | "name";

export function TodoTool() {
  const [rawTasks, setRawTasks] = useLocalStorage<unknown[]>("todos", []);
  const [projects, setProjects] = useLocalStorage<Project[]>("todo-projects", [
    { id: "inbox", name: "Inbox", color: 0 },
  ]);
  const tasks = useMemo(() => (Array.isArray(rawTasks) ? rawTasks.map(normalizeTask) : []), [rawTasks]);

  const [text, setText] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("medium");
  const [due, setDue] = useState("");
  const [project, setProject] = useState("inbox");
  const [view, setView] = useState<TaskView>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<TaskSort>("smart");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [subDraft, setSubDraft] = useState("");
  const [tagDraftId, setTagDraftId] = useState<string | null>(null);
  const [tagDraft, setTagDraft] = useState("");
  const [newProject, setNewProject] = useState("");
  const [lastDeleted, setLastDeleted] = useState<{ task: Task; index: number } | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const today = todayStr();
  const tomorrow = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return todayStr(d);
  })();

  const write = (updater: (ts: Task[]) => Task[]) =>
    setRawTasks((prev) => updater((Array.isArray(prev) ? prev : []).map(normalizeTask)));

  const patch = (id: string, p: Partial<Task>) =>
    write((ts) => ts.map((t) => (t.id === id ? { ...t, ...p } : t)));

  const add = () => {
    const t = text.trim();
    if (!t) return;
    write((ts) => [
      {
        id: uid(),
        text: t,
        done: false,
        priority,
        createdAt: Date.now(),
        completedAt: 0,
        projectId: project,
        due,
        tags: [],
        subtasks: [],
      },
      ...ts,
    ]);
    setText("");
    setDue("");
  };

  const remove = (id: string) => {
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx < 0) return;
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setLastDeleted({ task: tasks[idx], index: idx });
    undoTimer.current = setTimeout(() => setLastDeleted(null), 6000);
    write((ts) => ts.filter((t) => t.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const undoDelete = () => {
    if (!lastDeleted) return;
    if (undoTimer.current) clearTimeout(undoTimer.current);
    write((ts) => {
      const next = [...ts];
      next.splice(Math.min(lastDeleted.index, next.length), 0, lastDeleted.task);
      return next;
    });
    setLastDeleted(null);
  };

  const toggle = (id: string) =>
    write((ts) =>
      ts.map((t) => (t.id === id ? { ...t, done: !t.done, completedAt: !t.done ? Date.now() : 0 } : t))
    );

  const addSubtask = (task: Task) => {
    const s = subDraft.trim();
    if (!s) return;
    patch(task.id, { subtasks: [...task.subtasks, { id: uid(), text: s, done: false }] });
    setSubDraft("");
  };

  const toggleSubtask = (task: Task, sid: string) =>
    patch(task.id, {
      subtasks: task.subtasks.map((s) => (s.id === sid ? { ...s, done: !s.done } : s)),
    });

  const removeSubtask = (task: Task, sid: string) =>
    patch(task.id, { subtasks: task.subtasks.filter((s) => s.id !== sid) });

  const addTag = (task: Task) => {
    const tg = tagDraft.trim().toLowerCase().replace(/^#/, "");
    if (!tg || task.tags.includes(tg)) {
      setTagDraft("");
      return;
    }
    patch(task.id, { tags: [...task.tags, tg] });
    setTagDraft("");
  };

  const addProject = () => {
    const n = newProject.trim();
    if (!n) return;
    const p: Project = { id: uid(), name: n.slice(0, 24), color: projects.length % PROJECT_COLORS.length };
    setProjects([...projects, p]);
    setNewProject("");
  };

  const counts = useMemo(
    () => ({
      all: tasks.filter((t) => !t.done).length,
      today: tasks.filter((t) => !t.done && t.due && t.due <= today).length,
      upcoming: tasks.filter((t) => !t.done && t.due > today).length,
      overdue: tasks.filter((t) => !t.done && t.due && t.due < today).length,
      done: tasks.filter((t) => t.done).length,
    }),
    [tasks, today]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = tasks.filter((t) => {
      if (projectFilter !== "all" && t.projectId !== projectFilter) return false;
      if (view === "done") return t.done;
      if (t.done) return false;
      if (view === "today") return t.due && t.due <= today;
      if (view === "upcoming") return t.due > today;
      if (view === "overdue") return t.due && t.due < today;
      return true;
    });
    if (q) list = list.filter((t) => `${t.text} ${t.tags.join(" ")}`.toLowerCase().includes(q));
    list.sort((a, b) => {
      if (view === "done") return b.completedAt - a.completedAt;
      if (sort === "priority") return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || b.createdAt - a.createdAt;
      if (sort === "due") return (a.due || "9999").localeCompare(b.due || "9999") || b.createdAt - a.createdAt;
      if (sort === "newest") return b.createdAt - a.createdAt;
      if (sort === "name") return a.text.localeCompare(b.text);
      // smart: overdue → priority → due → newest
      const aOver = a.due && a.due < today ? 0 : 1;
      const bOver = b.due && b.due < today ? 0 : 1;
      if (aOver !== bOver) return aOver - bOver;
      if (a.priority !== b.priority) return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      const dueCmp = (a.due || "9999").localeCompare(b.due || "9999");
      if (dueCmp !== 0) return dueCmp;
      return b.createdAt - a.createdAt;
    });
    return list;
  }, [tasks, view, projectFilter, query, sort, today]);

  const scopeDone = visible.filter((t) => t.done).length;
  const scopeTotal = visible.length;
  const scopePct = scopeTotal ? Math.round((scopeDone / scopeTotal) * 100) : 0;

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ tasks, projects }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "zyric-tasks-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const projectOf = (id: string) => projects.find((p) => p.id === id);
  const viewBtn = (activeB: boolean) =>
    `rounded-full border px-3 py-1 text-xs font-medium capitalize transition-all ${
      activeB
        ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-300"
        : "border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:border-zinc-500"
    }`;

  const VIEW_DEFS: { id: TaskView; label: string; count: number }[] = [
    { id: "all", label: "All", count: counts.all },
    { id: "today", label: "Today", count: counts.today },
    { id: "upcoming", label: "Upcoming", count: counts.upcoming },
    { id: "overdue", label: "Overdue", count: counts.overdue },
    { id: "done", label: "Done", count: counts.done },
  ];

  return (
    <div className="space-y-5">
      {/* add form */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="What needs to get done?"
            aria-label="New task"
            className={`flex-1 ${inputCls}`}
          />
          <Input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            aria-label="Due date"
            className={`w-full text-sm [color-scheme:dark] sm:w-40 ${inputCls}`}
          />
          <Select value={priority} onValueChange={(v) => setPriority(v as Task["priority"])}>
            <SelectTrigger className={`w-full sm:w-28 ${selectTriggerCls}`} aria-label="Priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={project} onValueChange={setProject}>
            <SelectTrigger className={`w-full sm:w-36 ${selectTriggerCls}`} aria-label="Project">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={add}
            disabled={!text.trim()}
            className="bg-emerald-500 font-medium text-zinc-950 hover:bg-emerald-400 disabled:opacity-40"
          >
            <Plus className="h-4 w-4" aria-hidden /> Add
          </Button>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <button type="button" onClick={() => setDue(today)} className="rounded-full border border-zinc-700 px-2 py-0.5 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200">
            Due today
          </button>
          <button type="button" onClick={() => setDue(tomorrow)} className="rounded-full border border-zinc-700 px-2 py-0.5 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200">
            Tomorrow
          </button>
          <button type="button" onClick={() => setDue("")} className="rounded-full border border-zinc-700 px-2 py-0.5 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200">
            No date
          </button>
          <button type="button" onClick={exportJson} className="ml-auto inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-300">
            <Download className="h-3 w-3" aria-hidden /> Backup tasks (.json)
          </button>
        </div>
      </div>

      {/* projects */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setProjectFilter("all")}
          aria-pressed={projectFilter === "all"}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
            projectFilter === "all"
              ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-300"
              : "border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:border-zinc-500"
          }`}
        >
          All projects <span className="opacity-60">{tasks.filter((t) => !t.done).length}</span>
        </button>
        {projects.map((p) => {
          const c = tasks.filter((t) => t.projectId === p.id && !t.done).length;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setProjectFilter(projectFilter === p.id ? "all" : p.id)}
              aria-pressed={projectFilter === p.id}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                projectFilter === p.id
                  ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-300"
                  : "border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:border-zinc-500"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${PROJECT_COLORS[p.color % PROJECT_COLORS.length].dot}`} aria-hidden />
              {p.name} <span className="opacity-60">{c}</span>
            </button>
          );
        })}
        <span className="inline-flex items-center gap-1">
          <Input
            value={newProject}
            onChange={(e) => setNewProject(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addProject()}
            placeholder="New project…"
            aria-label="New project name"
            className="h-7 w-32 border-dashed border-zinc-700 bg-transparent px-2 text-xs text-zinc-200 placeholder:text-zinc-600"
          />
          <button
            type="button"
            onClick={addProject}
            aria-label="Add project"
            className="rounded-md border border-zinc-700 p-1 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
          >
            <Plus className="h-3 w-3" aria-hidden />
          </button>
        </span>
      </div>

      {/* views + search + sort */}
      <div className="flex flex-wrap items-center gap-2">
        {VIEW_DEFS.map((v) => (
          <button key={v.id} type="button" onClick={() => setView(v.id)} aria-pressed={view === v.id} className={viewBtn(view === v.id)}>
            {v.label}
            {v.count > 0 ? ` (${v.count})` : ""}
          </button>
        ))}
        <div className="relative min-w-32 grow sm:max-w-52">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" aria-hidden />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks & tags…"
            aria-label="Search tasks"
            className="h-8 pl-9 text-xs"
          />
        </div>
        <Select value={sort} onValueChange={(v) => setSort(v as TaskSort)}>
          <SelectTrigger className="h-8 w-32 text-xs" aria-label="Sort tasks">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
            <SelectItem value="smart">Smart order</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
            <SelectItem value="due">Due date</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="name">Name A–Z</SelectItem>
          </SelectContent>
        </Select>
        {tasks.some((t) => t.done) && (
          <button
            type="button"
            onClick={() => write((ts) => ts.filter((t) => !t.done))}
            className="text-xs text-zinc-500 underline decoration-dotted underline-offset-4 hover:text-rose-400"
          >
            Clear completed
          </button>
        )}
      </div>

      {/* progress */}
      {scopeTotal > 0 && (
        <div className="space-y-1">
          <Progress
            value={scopePct}
            aria-label={`Task progress: ${scopePct}%`}
            className="h-2 bg-zinc-800 [&>div]:bg-emerald-500"
          />
          <p className="text-xs text-zinc-500">
            {scopeDone} of {scopeTotal} in this view completed ({scopePct}%)
          </p>
        </div>
      )}

      {/* undo bar */}
      {lastDeleted && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-amber-700/50 bg-amber-950/30 px-3 py-2 text-xs text-amber-200">
          <span className="truncate">Deleted “{lastDeleted.task.text.slice(0, 40)}”</span>
          <button
            type="button"
            onClick={undoDelete}
            className="inline-flex shrink-0 items-center gap-1 rounded-md border border-amber-600/60 px-2 py-1 font-medium hover:bg-amber-500/10"
          >
            <RotateCcw className="h-3 w-3" aria-hidden /> Undo
          </button>
        </div>
      )}

      {/* list */}
      <div className="space-y-2">
        {visible.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 px-4 py-10 text-center text-sm text-zinc-500">
            {query ? "No tasks match your search." : view === "done" ? "No completed tasks yet." : view === "overdue" ? "Nothing overdue — nice! 🎉" : "Nothing here yet — add your first task above."}
          </p>
        ) : (
          visible.map((t) => {
            const proj = projectOf(t.projectId);
            const subDone = t.subtasks.filter((s) => s.done).length;
            const overdue = !t.done && t.due && t.due < today;
            const dueToday = !t.done && t.due === today;
            const isExpanded = expandedId === t.id;
            const isEditing = editingId === t.id;
            return (
              <div
                key={t.id}
                className={`rounded-xl border px-4 py-3 ${
                  overdue ? "border-rose-800/60 bg-rose-950/10" : "border-zinc-800 bg-zinc-900/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => toggle(t.id)}
                    aria-label={`Mark "${t.text}" as ${t.done ? "not done" : "done"}`}
                    aria-pressed={t.done}
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-all ${
                      t.done
                        ? "border-emerald-400 bg-emerald-500 text-zinc-950"
                        : "border-zinc-600 text-transparent hover:border-emerald-500"
                    }`}
                  >
                    <Check className="h-4 w-4" aria-hidden />
                  </button>
                  <div className="min-w-0 flex-1">
                    {isEditing ? (
                      <Input
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onBlur={() => {
                          const v = editText.trim();
                          if (v) patch(t.id, { text: v });
                          setEditingId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const v = editText.trim();
                            if (v) patch(t.id, { text: v });
                            setEditingId(null);
                          }
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        aria-label="Edit task text"
                        autoFocus
                        className={`h-8 text-sm ${inputCls}`}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : t.id)}
                        className={`block max-w-full truncate text-left text-sm ${t.done ? "text-zinc-500 line-through" : "text-zinc-100"}`}
                        aria-expanded={isExpanded}
                      >
                        {t.text}
                      </button>
                    )}
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-zinc-500">
                      {proj && (
                        <span className="inline-flex items-center gap-1">
                          <span className={`h-1.5 w-1.5 rounded-full ${PROJECT_COLORS[proj.color % PROJECT_COLORS.length].dot}`} aria-hidden />
                          {proj.name}
                        </span>
                      )}
                      {t.due && (
                        <span className={overdue ? "font-medium text-rose-400" : dueToday ? "font-medium text-amber-400" : ""}>
                          {overdue ? "Overdue · " : dueToday ? "Today" : dateFmt(t.due)}
                        </span>
                      )}
                      {t.subtasks.length > 0 && (
                        <span className={subDone === t.subtasks.length ? "text-emerald-400" : ""}>
                          ☑ {subDone}/{t.subtasks.length}
                        </span>
                      )}
                      {t.tags.map((tg) => (
                        <span key={tg} className="rounded-full border border-zinc-700/60 px-1.5">#{tg}</span>
                      ))}
                    </div>
                  </div>
                  <span className={`hidden shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase sm:inline-block ${PRIORITY_STYLE[t.priority]}`}>
                    {t.priority}
                  </span>
                  <button
                    type="button"
                    onClick={() => { setExpandedId(isExpanded ? null : t.id); }}
                    aria-label={isExpanded ? "Collapse task details" : "Expand task details"}
                    aria-expanded={isExpanded}
                    className="rounded-md p-1 text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
                  >
                    {isExpanded ? <ChevronUp className="h-4 w-4" aria-hidden /> : <ChevronDown className="h-4 w-4" aria-hidden />}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEditingId(t.id); setEditText(t.text); }}
                    aria-label={`Edit task ${t.text}`}
                    className="rounded-md p-1 text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(t.id)}
                    aria-label={`Delete task ${t.text}`}
                    className="rounded-md p-1.5 text-zinc-600 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>

                {/* expanded detail */}
                {isExpanded && (
                  <div className="mt-3 space-y-3 border-t border-zinc-800 pt-3">
                    <div className="grid gap-2 sm:grid-cols-3">
                      <label className="space-y-1">
                        <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Due date</span>
                        <Input
                          type="date"
                          value={t.due}
                          onChange={(e) => patch(t.id, { due: e.target.value })}
                          aria-label="Change due date"
                          className={`h-8 text-xs [color-scheme:dark] ${inputCls}`}
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Priority</span>
                        <Select value={t.priority} onValueChange={(v) => patch(t.id, { priority: v as Task["priority"] })}>
                          <SelectTrigger className={`h-8 text-xs ${selectTriggerCls}`} aria-label="Change priority">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </label>
                      <label className="space-y-1">
                        <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Project</span>
                        <Select value={t.projectId} onValueChange={(v) => patch(t.id, { projectId: v })}>
                          <SelectTrigger className={`h-8 text-xs ${selectTriggerCls}`} aria-label="Move to project">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
                            {projects.map((p) => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </label>
                    </div>

                    {/* subtasks */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                        Subtasks {t.subtasks.length > 0 && `(${subDone}/${t.subtasks.length})`}
                      </span>
                      {t.subtasks.map((s) => (
                        <div key={s.id} className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleSubtask(t, s.id)}
                            aria-label={`Mark subtask "${s.text}" as ${s.done ? "not done" : "done"}`}
                            aria-pressed={s.done}
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all ${
                              s.done ? "border-emerald-400 bg-emerald-500 text-zinc-950" : "border-zinc-600 text-transparent hover:border-emerald-500"
                            }`}
                          >
                            <Check className="h-3 w-3" aria-hidden />
                          </button>
                          <span className={`min-w-0 flex-1 truncate text-xs ${s.done ? "text-zinc-500 line-through" : "text-zinc-300"}`}>
                            {s.text}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeSubtask(t, s.id)}
                            aria-label={`Remove subtask ${s.text}`}
                            className="rounded p-0.5 text-zinc-600 hover:text-rose-400"
                          >
                            <X className="h-3 w-3" aria-hidden />
                          </button>
                        </div>
                      ))}
                      <div className="flex gap-1.5">
                        <Input
                          value={subDraft}
                          onChange={(e) => setSubDraft(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && addSubtask(t)}
                          placeholder="Break it down — add a subtask…"
                          aria-label="New subtask"
                          className="h-7 border-dashed border-zinc-700 bg-transparent px-2 text-xs text-zinc-200 placeholder:text-zinc-600"
                        />
                        <button
                          type="button"
                          onClick={() => addSubtask(t)}
                          aria-label="Add subtask"
                          className="rounded-md border border-zinc-700 p-1 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                        >
                          <Plus className="h-3 w-3" aria-hidden />
                        </button>
                      </div>
                    </div>

                    {/* tags */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Tag className="h-3 w-3 text-zinc-600" aria-hidden />
                      {t.tags.map((tg) => (
                        <span key={tg} className="inline-flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[11px] text-zinc-300">
                          #{tg}
                          <button
                            type="button"
                            onClick={() => patch(t.id, { tags: t.tags.filter((x) => x !== tg) })}
                            aria-label={`Remove tag ${tg}`}
                            className="text-zinc-500 hover:text-rose-400"
                          >
                            <X className="h-2.5 w-2.5" aria-hidden />
                          </button>
                        </span>
                      ))}
                      {tagDraftId === t.id ? (
                        <Input
                          value={tagDraft}
                          onChange={(e) => setTagDraft(e.target.value)}
                          onBlur={() => { addTag(t); setTagDraftId(null); }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") { addTag(t); setTagDraftId(null); }
                            if (e.key === "Escape") setTagDraftId(null);
                          }}
                          autoFocus
                          aria-label="New tag"
                          className="h-6 w-24 border-dashed border-zinc-700 bg-transparent px-1.5 text-[11px] text-zinc-200"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => { setTagDraftId(t.id); setTagDraft(""); }}
                          className="rounded-full border border-dashed border-zinc-700 px-2 py-0.5 text-[11px] text-zinc-500 hover:border-zinc-500 hover:text-zinc-300"
                        >
                          + tag
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
