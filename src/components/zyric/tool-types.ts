import type { ComponentType } from "react";

/* Shared tool contract — imported by registry.tsx and every kit file.
   Lives in its own module so kit files can type their meta arrays
   without circular imports. */

export type CategoryId =
  | "signature"
  | "notes"
  | "trackers"
  | "calculators"
  | "converters"
  | "time"
  | "generators"
  | "css"
  | "media"
  | "web"
  | "business"
  | "random"
  | "writing"
  | "devkit"
  | "data"
  | "money"
  | "life"
  | "study"
  | "health"
  | "fun"
  | "websec";

export interface ToolMeta {
  id: string;
  name: string;
  description: string;
  category: CategoryId;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  keywords: string;
  badge?: "new" | "local" | "saved" | "unique";
  component: ComponentType;
}
