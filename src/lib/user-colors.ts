import type { UserColor } from "@prisma/client";

export const USER_COLOR_OPTIONS = [
  {
    value: "ROSE",
    label: "Rose",
    dot: "bg-rose-500",
    pill: "border-rose-200 bg-rose-50 text-rose-900",
    avatar: "bg-rose-100 text-rose-700",
    subtle: "bg-rose-50 text-rose-700 border-rose-200",
  },
  {
    value: "SKY",
    label: "Sky",
    dot: "bg-sky-500",
    pill: "border-sky-200 bg-sky-50 text-sky-900",
    avatar: "bg-sky-100 text-sky-700",
    subtle: "bg-sky-50 text-sky-700 border-sky-200",
  },
  {
    value: "AMBER",
    label: "Amber",
    dot: "bg-amber-500",
    pill: "border-amber-200 bg-amber-50 text-amber-900",
    avatar: "bg-amber-100 text-amber-700",
    subtle: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    value: "EMERALD",
    label: "Emerald",
    dot: "bg-emerald-500",
    pill: "border-emerald-200 bg-emerald-50 text-emerald-900",
    avatar: "bg-emerald-100 text-emerald-700",
    subtle: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    value: "VIOLET",
    label: "Violet",
    dot: "bg-violet-500",
    pill: "border-violet-200 bg-violet-50 text-violet-900",
    avatar: "bg-violet-100 text-violet-700",
    subtle: "bg-violet-50 text-violet-700 border-violet-200",
  },
  {
    value: "SLATE",
    label: "Slate",
    dot: "bg-slate-500",
    pill: "border-slate-200 bg-slate-50 text-slate-900",
    avatar: "bg-slate-100 text-slate-700",
    subtle: "bg-slate-50 text-slate-700 border-slate-200",
  },
] as const satisfies ReadonlyArray<{
  value: UserColor;
  label: string;
  dot: string;
  pill: string;
  avatar: string;
  subtle: string;
}>;

function hashUserId(userId: string) {
  let hash = 0;

  for (let index = 0; index < userId.length; index += 1) {
    hash = (hash * 31 + userId.charCodeAt(index)) >>> 0;
  }

  return hash;
}

export function getUserColorOption(userId: string, colorPreference?: UserColor | null) {
  if (colorPreference) {
    return USER_COLOR_OPTIONS.find((option) => option.value === colorPreference) ?? USER_COLOR_OPTIONS[0];
  }

  return USER_COLOR_OPTIONS[hashUserId(userId) % USER_COLOR_OPTIONS.length];
}
