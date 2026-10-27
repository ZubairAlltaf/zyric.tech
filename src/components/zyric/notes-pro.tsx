"use client";

/*
 * NOTES PRO — a full notes app (client-side only).
 * Features: folders, tags, search, sort, pin, favorites, colors, markdown-lite
 * with interactive checklists, archive + trash with restore, duplicate, word
 * counts, JSON backup (export/import), per-note .md export, grid/list layouts.
 * Migrates the legacy {id,text,color,pinned,updatedAt} format automatically.
 */

import { useMemo, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  CheckSquare,
  Code,
  Copy,
  CopyPlus,
  Download,
  Eye,
  Folder,
  ListChecks,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Search,
  Square,
  Star,
  StickyNote,
  Tag,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { inputCls, uid, useLocalStorage } from "./hooks";

/* ------------------------------- Data model ------------------------------- */

interface Note {
  id: string;
  title: string;
  body: string;
  color: number;
  pinned: boolean;
  fav: boolean;
  archived: boolean;
  trashed: boolean;
  folder: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

const NOTE_COLORS = [
  { name: "Graphite", card: "border-zinc-700 bg-zinc-800/60", dot: "bg-zinc-400" },
  { name: "Emerald", card: "border-emerald-800/60 bg-emerald-950/40", dot: "bg-emerald-400" },
  { name: "Amber", card: "border-amber-800/60 bg-amber-950/40", dot: "bg-amber-400" },
  { name: "Rose", card: "border-rose-800/60 bg-rose-950/40", dot: "bg-rose-400" },
  { name: "Teal", card: "border-teal-800/60 bg-teal-950/40", dot: "bg-teal-400" },
  { name: "Violet", card: "border-violet-800/60 bg-violet-950/40", dot: "bg-violet-400" },
  { name: "Sky", card: "border-sky-800/60 bg-sky-950/40", dot: "bg-sky-400" },
  { name: "Lime", card: "border-lime-800/60 bg-lime-950/40", dot: "bg-lime-400" },
];

function normalizeNote(raw: unknown): Note {
  const n = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  const now = Date.now();
  const created =
    typeof n.createdAt === "number"
      ? n.createdAt
      : typeof n.updatedAt === "number"
        ? (n.updatedAt as number)
        : now;
  const updated = typeof n.updatedAt === "number" ? (n.updatedAt as number) : created;
  const tags = Array.isArray(n.tags)
    ? (n.tags as unknown[]).filter((t): t is string => typeof t === "string")
    : [];
  return {
    id: typeof n.id === "string" ? n.id : uid(),
    title: typeof n.title === "string" ? n.title : "",
    body: typeof n.body === "string" ? n.body : typeof n.text === "string" ? (n.text as string) : "",
    color: typeof n.color === "number" ? Math.abs(Math.floor(n.color)) % NOTE_COLORS.length : 0,
    pinned: n.pinned === true,
    fav: n.fav === true,
    archived: n.archived === true,
    trashed: n.trashed === true,
    folder: typeof n.folder === "string" ? n.folder : "",
    tags,
    createdAt: created,
    updatedAt: updated,
  };
}

function blankNote(): Note {
  const now = Date.now();
  return {
    id: uid(),
    title: "",
    body: "",
    color: Math.floor(Math.random() * NOTE_COLORS.length),
    pinned: false,
    fav: false,
    archived: false,
    trashed: false,
    folder: "",
    tags: [],
    createdAt: now,
    updatedAt: now,
  };
}

function downloadFile(name: string, content: string, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "note"
  );
}

function wordsOf(s: string): number {
  const t = s.trim();
  return t ? t.split(/\s+/).filter(Boolean).length : 0;
}

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ---------------------------- Markdown-lite view ---------------------------- */

function mdInline(s: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push(s.slice(last, m.index));
    const tok = m[0];
    const k = `${keyBase}-${i++}`;
    if (tok.startsWith("`")) {
      out.push(
        <code key={k} className="rounded bg-zinc-800 px-1 py-0.5 font-mono text-[0.85em] text-emerald-300">
          {tok.slice(1, -1)}
        </code>
      );
    } else if (tok.startsWith("**")) {
      out.push(
        <strong key={k} className="font-semibold text-zinc-50">
          {tok.slice(2, -2)}
        </strong>
      );
    } else if (tok.startsWith("~~")) {
      out.push(
        <s key={k} className="text-zinc-500">
          {tok.slice(2, -2)}
        </s>
      );
    } else {
      out.push(<em key={k}>{tok.slice(1, -1)}</em>);
    }
    last = m.index + tok.length;
  }
  if (last < s.length) out.push(s.slice(last));
  return out;
}

const CHECK_RE = /^- \[[ xX]\]/;

function MdLite({ text, onToggle }: { text: string; onToggle?: (itemIdx: number) => void }) {
  const lines = text.split("\n");
  let checkIdx = -1;
  return (
    <div className="space-y-1.5 text-sm leading-relaxed text-zinc-200">
      {lines.map((line, li) => {
        const trimmed = line.trim();
        if (CHECK_RE.test(trimmed)) {
          const myIdx = ++checkIdx;
          const done = trimmed[3].toLowerCase() === "x";
          const label = trimmed.replace(/^- \[[ xX]\] ?/, "");
          return (
            <div key={li} className="flex items-start gap-2">
              <button
                type="button"
                onClick={() => onToggle?.(myIdx)}
                aria-label={done ? "Uncheck item" : "Check item"}
                className="mt-0.5 shrink-0"
              >
                {done ? (
                  <CheckSquare className="h-4 w-4 text-emerald-400" aria-hidden />
                ) : (
                  <Square className="h-4 w-4 text-zinc-500" aria-hidden />
                )}
              </button>
              <span className={`min-w-0 break-words ${done ? "text-zinc-500 line-through" : ""}`}>
                {mdInline(label, `l${li}`)}
              </span>
            </div>
          );
        }
        if (/^### /.test(trimmed))
          return <h4 key={li} className="pt-1 text-sm font-bold text-zinc-50">{mdInline(trimmed.slice(4), `l${li}`)}</h4>;
        if (/^## /.test(trimmed))
          return <h3 key={li} className="pt-1 text-base font-bold text-zinc-50">{mdInline(trimmed.slice(3), `l${li}`)}</h3>;
        if (/^# /.test(trimmed))
          return <h2 key={li} className="pt-1 text-lg font-bold text-zinc-50">{mdInline(trimmed.slice(2), `l${li}`)}</h2>;
        if (/^[-*] /.test(trimmed))
          return (
            <div key={li} className="flex items-start gap-2">
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-500" aria-hidden />
              <span className="min-w-0 break-words">{mdInline(trimmed.slice(2), `l${li}`)}</span>
            </div>
          );
        if (/^\d+[.)] /.test(trimmed))
          return (
            <div key={li} className="flex items-start gap-2">
              <span className="shrink-0 pt-0.5 font-mono text-xs text-zinc-500">{trimmed.match(/^\d+/)?.[0]}.</span>
              <span className="min-w-0 break-words">{mdInline(trimmed.replace(/^\d+[.)] /, ""), `l${li}`)}</span>
            </div>
          );
        if (trimmed === "") return <div key={li} className="h-2" aria-hidden />;
        return <p key={li} className="break-words">{mdInline(line, `l${li}`)}</p>;
      })}
    </div>
  );
}

/* --------------------------------- Editor --------------------------------- */

function NoteEditor({
  note,
  onPatch,
  onClose,
  onDuplicate,
}: {
  note: Note;
  onPatch: (patch: Partial<Note>) => void;
  onClose: () => void;
  onDuplicate: () => void;
}) {
  const [preview, setPreview] = useState(false);
  const [tagDraft, setTagDraft] = useState("");
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const c = NOTE_COLORS[note.color % NOTE_COLORS.length];

  const patch = onPatch;

  const wrapSel = (before: string, after: string) => {
    const el = taRef.current;
    if (!el) return;
    const s = el.selectionStart;
    const e = el.selectionEnd;
    const next = el.value.slice(0, s) + before + el.value.slice(s, e) + after + el.value.slice(e);
    patch({ body: next });
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = s + before.length;
      el.selectionEnd = e + before.length;
    });
  };

  const insertAtCursor = (txt: string) => {
    const el = taRef.current;
    if (!el) return;
    const s = el.selectionStart;
    const e = el.selectionEnd;
    const next = el.value.slice(0, s) + txt + el.value.slice(e);
    patch({ body: next });
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = s + txt.length;
    });
  };

  const toggleChecklistItem = (itemIdx: number) => {
    let seen = -1;
    const lines = note.body.split("\n").map((ln) => {
      if (CHECK_RE.test(ln.trim())) {
        seen++;
        if (seen === itemIdx) {
          return ln.replace(/^(\s*- \[)([ xX])(\])/, (_s, a: string, br: string, b: string) =>
            `${a}${br.toLowerCase() === "x" ? " " : "x"}${b}`
          );
        }
      }
      return ln;
    });
    patch({ body: lines.join("\n") });
  };

  const addTag = () => {
    const t = tagDraft.trim().toLowerCase().replace(/^#/, "");
    if (!t) return;
    if (!note.tags.includes(t) && note.tags.length < 12) patch({ tags: [...note.tags, t] });
    setTagDraft("");
  };

  const wc = wordsOf(`${note.title} ${note.body}`);
  const mdExport = `# ${note.title || "Untitled"}\n\n${note.body}\n`;

  const toolBtn =
    "inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white";

  return (
    <div className={`rounded-2xl border ${c.card} p-4 sm:p-5`}>
      {/* top bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onClose}
          aria-label="Back to all notes"
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Notes
        </button>
        <button
          type="button"
          onClick={() => patch({ pinned: !note.pinned })}
          aria-label={note.pinned ? "Unpin note" : "Pin note"}
          className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 transition-colors hover:border-zinc-500 ${
            note.pinned ? "text-amber-400" : "text-zinc-400 hover:text-white"
          }`}
        >
          {note.pinned ? <Pin className="h-3.5 w-3.5" aria-hidden /> : <PinOff className="h-3.5 w-3.5" aria-hidden />}
        </button>
        <button
          type="button"
          onClick={() => patch({ fav: !note.fav })}
          aria-label={note.fav ? "Remove from favorites" : "Add to favorites"}
          className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 transition-colors hover:border-zinc-500 ${
            note.fav ? "text-yellow-400" : "text-zinc-400 hover:text-white"
          }`}
        >
          <Star className={`h-3.5 w-3.5 ${note.fav ? "fill-yellow-400" : ""}`} aria-hidden />
        </button>
        <button type="button" onClick={() => setPreview(!preview)} aria-pressed={preview} className={toolBtn}>
          {preview ? <Pencil className="h-3.5 w-3.5" aria-hidden /> : <Eye className="h-3.5 w-3.5" aria-hidden />}
          {preview ? "Edit" : "Preview"}
        </button>
        <span className="grow" />
        <button type="button" onClick={onDuplicate} aria-label="Duplicate note" className={`${toolBtn} hidden sm:inline-flex`}>
          <CopyPlus className="h-3.5 w-3.5" aria-hidden /> Duplicate
        </button>
        <button
          type="button"
          onClick={() => downloadFile(`${slugify(note.title)}.md`, mdExport, "text/markdown")}
          aria-label="Download as Markdown"
          className={`${toolBtn} hidden sm:inline-flex`}
        >
          <Download className="h-3.5 w-3.5" aria-hidden /> .md
        </button>
        <CopyButtonSmall text={`${note.title ? `${note.title}\n\n` : ""}${note.body}`} />
        <button
          type="button"
          onClick={() => patch({ archived: !note.archived })}
          aria-label={note.archived ? "Unarchive note" : "Archive note"}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white"
        >
          {note.archived ? <ArchiveRestore className="h-3.5 w-3.5" aria-hidden /> : <Archive className="h-3.5 w-3.5" aria-hidden />}
        </button>
        <button
          type="button"
          onClick={() => patch({ trashed: true })}
          aria-label="Move note to trash"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-400 transition-colors hover:border-rose-500/60 hover:text-rose-400"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>

      {note.trashed && (
        <div className="mb-3 flex items-center justify-between gap-2 rounded-lg border border-rose-800/50 bg-rose-950/30 px-3 py-2 text-xs text-rose-300">
          This note is in the trash.
          <button
            type="button"
            onClick={() => patch({ trashed: false })}
            className="inline-flex items-center gap-1 rounded-md border border-rose-700/60 px-2 py-1 font-medium hover:bg-rose-500/10"
          >
            <ArchiveRestore className="h-3 w-3" aria-hidden /> Restore
          </button>
        </div>
      )}

      {/* title */}
      <Input
        value={note.title}
        onChange={(e) => patch({ title: e.target.value })}
        placeholder="Note title…"
        aria-label="Note title"
        className="mb-3 border-0 bg-transparent px-0 text-lg font-semibold text-zinc-50 placeholder:text-zinc-600 focus-visible:ring-0"
      />

      {/* body */}
      {preview ? (
        <div className="min-h-48 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          {note.body.trim() ? (
            <MdLite text={note.body} onToggle={toggleChecklistItem} />
          ) : (
            <p className="text-sm text-zinc-600">Nothing to preview yet — switch to Edit and write something.</p>
          )}
        </div>
      ) : (
        <>
          <div className="mb-1.5 flex flex-wrap gap-1.5">
            <button type="button" onClick={() => wrapSel("**", "**")} aria-label="Bold" className={toolBtn}>
              <span className="font-bold">B</span>
            </button>
            <button type="button" onClick={() => wrapSel("*", "*")} aria-label="Italic" className={toolBtn}>
              <span className="italic">I</span>
            </button>
            <button type="button" onClick={() => insertAtCursor("\n## ")} aria-label="Insert heading" className={toolBtn}>
              H2
            </button>
            <button type="button" onClick={() => insertAtCursor("- [ ] ")} aria-label="Insert checklist item" className={toolBtn}>
              <ListChecks className="h-3.5 w-3.5" aria-hidden /> Item
            </button>
            <button type="button" onClick={() => wrapSel("`", "`")} aria-label="Inline code" className={toolBtn}>
              <Code className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
          <Textarea
            ref={taRef}
            value={note.body}
            onChange={(e) => patch({ body: e.target.value })}
            placeholder={"Write anything… Markdown works:\n# Heading\n- [ ] checklist item\n**bold**  *italic*  `code`"}
            aria-label="Note content"
            className="min-h-56 resize-y border-zinc-800 bg-zinc-900/50 p-3 text-sm leading-relaxed text-zinc-100 placeholder:text-zinc-600"
          />
        </>
      )}

      {/* tags + folder */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="mb-1.5 flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            <Tag className="h-3 w-3" aria-hidden /> Tags
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            {note.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-xs text-zinc-300"
              >
                #{t}
                <button
                  type="button"
                  onClick={() => patch({ tags: note.tags.filter((x) => x !== t) })}
                  aria-label={`Remove tag ${t}`}
                  className="text-zinc-500 hover:text-rose-400"
                >
                  <X className="h-3 w-3" aria-hidden />
                </button>
              </span>
            ))}
            <span className="inline-flex items-center gap-1">
              <Input
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Add tag…"
                aria-label="Add tag"
                className="h-7 w-28 border-dashed border-zinc-700 bg-transparent px-2 text-xs text-zinc-200 placeholder:text-zinc-600"
              />
            </span>
          </div>
        </div>
        <div>
          <p className="mb-1.5 flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            <Folder className="h-3 w-3" aria-hidden /> Folder
          </p>
          <Input
            value={note.folder}
            onChange={(e) => patch({ folder: e.target.value })}
            placeholder="e.g. Work, Study, Ideas"
            aria-label="Folder name"
            className="h-8 text-sm"
          />
        </div>
      </div>

      {/* color + stats footer */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 pt-3">
        <div className="flex items-center gap-1.5" role="group" aria-label="Note color">
          {NOTE_COLORS.map((cc, i) => (
            <button
              key={cc.name}
              type="button"
              onClick={() => patch({ color: i })}
              aria-label={`Color: ${cc.name}`}
              aria-pressed={note.color === i}
              className={`flex h-6 w-6 items-center justify-center rounded-full border transition-all ${
                note.color === i ? "border-zinc-100" : "border-transparent hover:border-zinc-600"
              }`}
            >
              <span className={`block h-3.5 w-3.5 rounded-full ${cc.dot}`} aria-hidden />
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-zinc-500">
          <span>{wc} words</span>
          <span>{(note.title + note.body).length} chars</span>
          <span>created {fmtDate(note.createdAt)}</span>
          <span>edited {fmtDate(note.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
}

function CopyButtonSmall({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setOk(true);
          setTimeout(() => setOk(false), 1500);
        } catch {
          /* clipboard blocked */
        }
      }}
      aria-label="Copy note contents"
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 transition-colors hover:border-zinc-500 ${
        ok ? "text-emerald-400" : "text-zinc-400 hover:text-white"
      }`}
    >
      <Copy className="h-3.5 w-3.5" aria-hidden />
    </button>
  );
}

/* ------------------------------ Notes (main) ------------------------------ */

type NoteView = "all" | "fav" | "archive" | "trash";
type NoteSort = "updated" | "created" | "title";

export function NotesTool() {
  const [raw, setRaw] = useLocalStorage<unknown[]>("notes", []);
  const notes = useMemo(() => raw.map(normalizeNote), [raw]);

  const [view, setView] = useState<NoteView>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<NoteSort>("updated");
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [folderFilter, setFolderFilter] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const write = (updater: (ns: Note[]) => Note[]) =>
    setRaw((prev) => updater((Array.isArray(prev) ? prev : []).map(normalizeNote)));

  const patchNote = (id: string, patch: Partial<Note>) =>
    write((ns) => ns.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n)));

  const counts = useMemo(
    () => ({
      all: notes.filter((n) => !n.archived && !n.trashed).length,
      fav: notes.filter((n) => n.fav && !n.archived && !n.trashed).length,
      archive: notes.filter((n) => n.archived && !n.trashed).length,
      trash: notes.filter((n) => n.trashed).length,
    }),
    [notes]
  );

  const folders = useMemo(() => {
    const m = new Map<string, number>();
    notes.filter((n) => !n.archived && !n.trashed).forEach((n) => {
      const f = n.folder.trim() || "Unfiled";
      m.set(f, (m.get(f) ?? 0) + 1);
    });
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [notes]);

  const allTags = useMemo(() => {
    const m = new Map<string, number>();
    notes.filter((n) => !n.archived && !n.trashed).forEach((n) => n.tags.forEach((t) => m.set(t, (m.get(t) ?? 0) + 1)));
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14);
  }, [notes]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = notes.filter((n) => {
      if (view === "trash") return n.trashed;
      if (n.trashed || n.archived) return false;
      if (view === "fav" && !n.fav) return false;
      if (folderFilter) {
        const f = n.folder.trim() || "Unfiled";
        if (f !== folderFilter) return false;
      }
      if (tagFilter && !n.tags.includes(tagFilter)) return false;
      return true;
    });
    if (q)
      list = list.filter((n) =>
        `${n.title}\n${n.body}\n${n.tags.join(" ")}\n${n.folder}`.toLowerCase().includes(q)
      );
    list.sort((a, b) => {
      if (view !== "trash" && a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (sort === "title") return (a.title || "Untitled").localeCompare(b.title || "Untitled");
      if (sort === "created") return b.createdAt - a.createdAt;
      return b.updatedAt - a.updatedAt;
    });
    return list;
  }, [notes, view, query, sort, folderFilter, tagFilter]);

  const openNote = notes.find((n) => n.id === openId) ?? null;

  const addNote = () => {
    const n = blankNote();
    write((ns) => [n, ...ns]);
    setOpenId(n.id);
    setView("all");
    setFolderFilter(null);
    setTagFilter(null);
  };

  const duplicateNote = (n: Note) => {
    const copy: Note = {
      ...n,
      id: uid(),
      title: n.title ? `${n.title} (copy)` : "",
      pinned: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    write((ns) => [copy, ...ns]);
    setOpenId(copy.id);
  };

  const exportAll = () => downloadFile("zyric-notes-backup.json", JSON.stringify(notes, null, 2), "application/json");

  const importFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const incoming: Note[] = (Array.isArray(parsed) ? parsed : []).map(normalizeNote);
        if (!incoming.length) return;
        write((ns) => {
          const ids = new Set(ns.map((x) => x.id));
          const add = incoming.filter((x) => !ids.has(x.id));
          return [...add, ...ns];
        });
      } catch {
        /* invalid file — ignore */
      }
    };
    reader.readAsText(file);
  };

  const VIEW_DEFS: { id: NoteView; label: string; count: number }[] = [
    { id: "all", label: "All notes", count: counts.all },
    { id: "fav", label: "Favorites", count: counts.fav },
    { id: "archive", label: "Archive", count: counts.archive },
    { id: "trash", label: "Trash", count: counts.trash },
  ];

  const chip = (active: boolean) =>
    `inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
      active
        ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-300"
        : "border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
    }`;

  return (
    <div className="space-y-5">
      {openNote ? (
        <NoteEditor
          key={openNote.id}
          note={openNote}
          onPatch={(patch) => patchNote(openNote.id, patch)}
          onClose={() => setOpenId(null)}
          onDuplicate={() => duplicateNote(openNote)}
        />
      ) : (
        <>
          {/* toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-40 grow">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" aria-hidden />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search notes, tags, folders…"
                aria-label="Search notes"
                className="h-9 pl-9 text-sm"
              />
            </div>
            <Select value={sort} onValueChange={(v) => setSort(v as NoteSort)}>
              <SelectTrigger className="h-9 w-36 text-sm" aria-label="Sort notes">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
                <SelectItem value="updated">Last edited</SelectItem>
                <SelectItem value="created">Newest first</SelectItem>
                <SelectItem value="title">Title A–Z</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex overflow-hidden rounded-lg border border-zinc-700" role="group" aria-label="Layout">
              <button
                type="button"
                onClick={() => setLayout("grid")}
                aria-label="Grid layout"
                aria-pressed={layout === "grid"}
                className={`px-2.5 py-1.5 ${layout === "grid" ? "bg-zinc-800 text-white" : "bg-zinc-900 text-zinc-500 hover:text-zinc-300"}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setLayout("list")}
                aria-label="List layout"
                aria-pressed={layout === "list"}
                className={`px-2.5 py-1.5 ${layout === "list" ? "bg-zinc-800 text-white" : "bg-zinc-900 text-zinc-500 hover:text-zinc-300"}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" />
                </svg>
              </button>
            </div>
            <Button
              onClick={addNote}
              size="sm"
              className="h-9 bg-emerald-500 font-medium text-zinc-950 hover:bg-emerald-400"
            >
              <Plus className="h-4 w-4" aria-hidden /> New note
            </Button>
          </div>

          {/* mobile chips */}
          <div className="space-y-2 lg:hidden">
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {VIEW_DEFS.map((v) => (
                <button key={v.id} type="button" onClick={() => { setView(v.id); setFolderFilter(null); setTagFilter(null); }} className={chip(view === v.id)}>
                  {v.label} <span className="opacity-60">{v.count}</span>
                </button>
              ))}
            </div>
            {folders.length > 0 && (
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                <button type="button" onClick={() => setFolderFilter(null)} className={chip(!folderFilter)}>
                  <Folder className="h-3 w-3" aria-hidden /> All folders
                </button>
                {folders.map(([f, c]) => (
                  <button key={f} type="button" onClick={() => setFolderFilter(folderFilter === f ? null : f)} className={chip(folderFilter === f)}>
                    {f} <span className="opacity-60">{c}</span>
                  </button>
                ))}
              </div>
            )}
            {allTags.length > 0 && (
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {allTags.map(([t, c]) => (
                  <button key={t} type="button" onClick={() => setTagFilter(tagFilter === t ? null : t)} className={chip(tagFilter === t)}>
                    #{t} <span className="opacity-60">{c}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-5 lg:grid-cols-[190px_1fr]">
            {/* desktop sidebar */}
            <aside className="hidden space-y-4 lg:block">
              <div className="space-y-1">
                {VIEW_DEFS.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => { setView(v.id); setFolderFilter(null); setTagFilter(null); }}
                    aria-pressed={view === v.id}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-sm transition-colors ${
                      view === v.id ? "bg-emerald-500/15 font-medium text-emerald-300" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                    }`}
                  >
                    {v.label}
                    <span className="text-xs opacity-70">{v.count}</span>
                  </button>
                ))}
              </div>
              <div>
                <p className="mb-1.5 px-3 text-[11px] font-medium uppercase tracking-wide text-zinc-600">Folders</p>
                <div className="space-y-0.5">
                  {folders.length === 0 && <p className="px-3 text-xs text-zinc-600">No folders yet</p>}
                  {folders.map(([f, c]) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFolderFilter(folderFilter === f ? null : f)}
                      aria-pressed={folderFilter === f}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-1 text-xs transition-colors ${
                        folderFilter === f ? "bg-zinc-800 font-medium text-zinc-100" : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
                      }`}
                    >
                      <span className="truncate">{f}</span>
                      <span className="opacity-70">{c}</span>
                    </button>
                  ))}
                </div>
              </div>
              {allTags.length > 0 && (
                <div>
                  <p className="mb-1.5 px-3 text-[11px] font-medium uppercase tracking-wide text-zinc-600">Tags</p>
                  <div className="flex flex-wrap gap-1 px-2">
                    {allTags.map(([t, c]) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTagFilter(tagFilter === t ? null : t)}
                        aria-pressed={tagFilter === t}
                        className={`rounded-full border px-2 py-0.5 text-[11px] transition-colors ${
                          tagFilter === t
                            ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-300"
                            : "border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                        }`}
                      >
                        #{t} {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-1.5 border-t border-zinc-800 pt-3">
                <button
                  type="button"
                  onClick={exportAll}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-zinc-300"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden /> Backup all (.json)
                </button>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-zinc-300"
                >
                  <Upload className="h-3.5 w-3.5" aria-hidden /> Restore backup
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  aria-label="Import notes backup"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) importFile(f);
                    e.target.value = "";
                  }}
                />
                {view === "trash" && counts.trash > 0 && (
                  <button
                    type="button"
                    onClick={() => write((ns) => ns.filter((n) => !n.trashed))}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-rose-400/80 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden /> Empty trash
                  </button>
                )}
              </div>
            </aside>

            {/* notes area */}
            <div className="min-w-0">
              {view === "trash" && counts.trash > 0 && (
                <div className="mb-3 flex items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-zinc-400">
                  Notes in trash stay until you remove them.
                  <button
                    type="button"
                    onClick={() => write((ns) => ns.filter((n) => !n.trashed))}
                    className="rounded-md border border-rose-800/60 px-2 py-1 font-medium text-rose-300 hover:bg-rose-500/10"
                  >
                    Empty trash
                  </button>
                </div>
              )}

              {visible.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-14 text-center">
                  <StickyNote className="h-9 w-9 text-zinc-600" aria-hidden />
                  <span className="font-medium text-zinc-200">
                    {query ? "No notes match your search" : view === "trash" ? "Trash is empty" : view === "archive" ? "Nothing archived" : "No notes here yet"}
                  </span>
                  <span className="max-w-xs text-sm text-zinc-500">
                    {query ? "Try different keywords or clear the search." : "Create a note — folders, tags, checklists and markdown all supported."}
                  </span>
                  {!query && view !== "trash" && (
                    <Button size="sm" onClick={addNote} className="bg-emerald-500 font-medium text-zinc-950 hover:bg-emerald-400">
                      <Plus className="h-4 w-4" aria-hidden /> New note
                    </Button>
                  )}
                </div>
              ) : layout === "grid" ? (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {visible.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      view={view}
                      onOpen={() => setOpenId(note.id)}
                      onPatch={(p) => patchNote(note.id, p)}
                      onDelete={() => write((ns) => ns.filter((x) => x.id !== note.id))}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {visible.map((note) => (
                    <NoteRow
                      key={note.id}
                      note={note}
                      view={view}
                      onOpen={() => setOpenId(note.id)}
                      onPatch={(p) => patchNote(note.id, p)}
                      onDelete={() => write((ns) => ns.filter((x) => x.id !== note.id))}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <p className="text-xs text-zinc-600">
            {counts.all} active · {counts.archive} archived · {counts.trash} in trash — everything auto-saves on this device only.
          </p>
        </>
      )}
    </div>
  );
}

/* ------------------------------ Note card/row ----------------------------- */

function checkStats(body: string): { done: number; total: number } {
  const items = body.split("\n").filter((l) => CHECK_RE.test(l.trim()));
  const done = items.filter((l) => l.trim()[3].toLowerCase() === "x").length;
  return { done, total: items.length };
}

function NoteCard({
  note,
  view,
  onOpen,
  onPatch,
  onDelete,
}: {
  note: Note;
  view: NoteView;
  onOpen: () => void;
  onPatch: (patch: Partial<Note>) => void;
  onDelete: () => void;
}) {
  const c = NOTE_COLORS[note.color % NOTE_COLORS.length];
  const stats = checkStats(note.body);
  const snippet = note.body.replace(/^#+ /gm, "").replace(/\n+/g, " ").trim().slice(0, 120);
  return (
    <div className={`flex flex-col rounded-xl border ${c.card} p-3`}>
      <div className="mb-1.5 flex items-center justify-between gap-1">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPatch({ pinned: !note.pinned })}
            aria-label={note.pinned ? "Unpin note" : "Pin note"}
            className={`rounded-md p-1 transition-colors hover:bg-white/5 ${note.pinned ? "text-amber-400" : "text-zinc-500"}`}
          >
            {note.pinned ? <Pin className="h-3.5 w-3.5" aria-hidden /> : <PinOff className="h-3.5 w-3.5" aria-hidden />}
          </button>
          <button
            type="button"
            onClick={() => onPatch({ fav: !note.fav })}
            aria-label={note.fav ? "Remove favorite" : "Add to favorites"}
            className={`rounded-md p-1 transition-colors hover:bg-white/5 ${note.fav ? "text-yellow-400" : "text-zinc-500"}`}
          >
            <Star className={`h-3.5 w-3.5 ${note.fav ? "fill-yellow-400" : ""}`} aria-hidden />
          </button>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => onPatch({ color: (note.color + 1) % NOTE_COLORS.length })}
            aria-label={`Change color (current: ${c.name})`}
            className="rounded-md p-1.5 transition-colors hover:bg-white/5"
          >
            <span className={`block h-3 w-3 rounded-full ${c.dot}`} aria-hidden />
          </button>
          {view === "trash" ? (
            <>
              <button
                type="button"
                onClick={() => onPatch({ trashed: false })}
                aria-label="Restore note"
                className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-white/5 hover:text-emerald-400"
              >
                <ArchiveRestore className="h-3.5 w-3.5" aria-hidden />
              </button>
              <button
                type="button"
                onClick={onDelete}
                aria-label="Delete forever"
                className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onPatch({ archived: true })}
                aria-label="Archive note"
                className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-300"
              >
                <Archive className="h-3.5 w-3.5" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => onPatch({ trashed: true })}
                aria-label="Move to trash"
                className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
              </button>
            </>
          )}
        </div>
      </div>
      <button type="button" onClick={onOpen} className="min-w-0 grow text-left" aria-label={`Open note ${note.title || "untitled"}`}>
        <p className="truncate text-sm font-semibold text-zinc-50">{note.title || "Untitled"}</p>
        <p className="mt-1 line-clamp-3 min-h-10 text-xs leading-relaxed text-zinc-400">{snippet || "Empty note"}</p>
      </button>
      <div className="mt-2 flex flex-wrap items-center gap-1 text-[10px] text-zinc-500">
        {note.folder && (
          <span className="inline-flex max-w-28 items-center gap-0.5 truncate rounded-full border border-zinc-700/60 px-1.5 py-0.5">
            <Folder className="h-2.5 w-2.5" aria-hidden /> {note.folder}
          </span>
        )}
        {note.tags.slice(0, 2).map((t) => (
          <span key={t} className="truncate rounded-full border border-zinc-700/60 px-1.5 py-0.5">#{t}</span>
        ))}
        {note.tags.length > 2 && <span>+{note.tags.length - 2}</span>}
        {stats.total > 0 && (
          <span className="inline-flex items-center gap-0.5 rounded-full border border-zinc-700/60 px-1.5 py-0.5">
            <CheckSquare className="h-2.5 w-2.5" aria-hidden /> {stats.done}/{stats.total}
          </span>
        )}
        <span className="ml-auto shrink-0">{fmtDate(note.updatedAt)}</span>
      </div>
    </div>
  );
}

function NoteRow({
  note,
  view,
  onOpen,
  onPatch,
  onDelete,
}: {
  note: Note;
  view: NoteView;
  onOpen: () => void;
  onPatch: (patch: Partial<Note>) => void;
  onDelete: () => void;
}) {
  const c = NOTE_COLORS[note.color % NOTE_COLORS.length];
  const stats = checkStats(note.body);
  return (
    <div className={`flex items-center gap-3 rounded-xl border ${c.card} px-3.5 py-2.5`}>
      <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left" aria-label={`Open note ${note.title || "untitled"}`}>
        <span className="block truncate text-sm font-medium text-zinc-50">{note.title || "Untitled"}</span>
        <span className="block truncate text-xs text-zinc-500">
          {note.folder ? `${note.folder} · ` : ""}
          {note.tags.length ? `#${note.tags.join(" #")} · ` : ""}
          {stats.total > 0 ? `${stats.done}/${stats.total} done · ` : ""}
          {fmtDate(note.updatedAt)}
        </span>
      </button>
      <button
        type="button"
        onClick={() => onPatch({ pinned: !note.pinned })}
        aria-label={note.pinned ? "Unpin note" : "Pin note"}
        className={`shrink-0 rounded-md p-1 transition-colors hover:bg-white/5 ${note.pinned ? "text-amber-400" : "text-zinc-600"}`}
      >
        {note.pinned ? <Pin className="h-3.5 w-3.5" aria-hidden /> : <PinOff className="h-3.5 w-3.5" aria-hidden />}
      </button>
      {view === "trash" ? (
        <>
          <button
            type="button"
            onClick={() => onPatch({ trashed: false })}
            aria-label="Restore note"
            className="shrink-0 rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-white/5 hover:text-emerald-400"
          >
            <ArchiveRestore className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label="Delete forever"
            className="shrink-0 rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => onPatch({ trashed: true })}
          aria-label="Move to trash"
          className="shrink-0 rounded-md p-1.5 text-zinc-600 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </button>
      )}
    </div>
  );
}
