"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  CheckSquare,
  UtensilsCrossed,
  BookOpen,
  ShoppingCart,
  Clock,
  Copy,
  Check,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/today", label: "Today", icon: Home },
  { href: "/chores", label: "Chores", icon: CheckSquare },
  { href: "/meals", label: "Meals", icon: UtensilsCrossed },
  { href: "/recipes", label: "Recipes", icon: BookOpen },
  { href: "/groceries", label: "Groceries", icon: ShoppingCart },
  { href: "/history", label: "History", icon: Clock },
];

export function Sidebar({
  householdName,
  inviteCode,
  userName,
  avatarUrl,
}: {
  householdName: string;
  inviteCode: string;
  userName: string;
  avatarUrl: string | null;
}) {
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:border-r bg-muted/40">
      <div className="flex h-14 items-center gap-3 border-b px-4">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={userName}
            width={32}
            height={32}
            className="h-8 w-8 rounded-full"
            unoptimized
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
            {userName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{householdName}</p>
          <p className="truncate text-xs text-muted-foreground">{userName}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <p className="text-xs text-muted-foreground mb-1">Invite code</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded bg-muted px-2 py-1 text-xs font-mono">
            {inviteCode}
          </code>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>
    </aside>
  );
}
