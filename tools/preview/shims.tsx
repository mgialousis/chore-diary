import { createElement, type AnchorHTMLAttributes, type ImgHTMLAttributes, type ReactNode } from "react";

export function Link(props: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a {...props} onClick={(event) => event.preventDefault()} />;
}
export function Image(props: ImgHTMLAttributes<HTMLImageElement>) {
  return createElement("img", props);
}
export function usePathname() { return "/today"; }
export function SignOutButton({ children }: { children: ReactNode }) {
  return <span aria-disabled="true">{children}</span>;
}
// Fail closed: preview controls must never call live Server Actions.
async function readOnly() { return { error: "This component preview is read-only." }; }
export const completeChore = readOnly;
export const postponeChore = readOnly;
export const markMealCooked = readOnly;
export const markGroceryBought = readOnly;
export const updateDisplayName = readOnly;
