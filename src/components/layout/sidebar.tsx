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
  Pencil,
  LogOut,
} from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { SignOutButton } from "@clerk/nextjs";
import { updateDisplayName } from "@/actions/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { USER_COLOR_OPTIONS } from "@/lib/user-colors";
import type { UserColor } from "@prisma/client";

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
  userEmail,
  avatarUrl,
  userColorPreference,
}: {
  householdName: string;
  inviteCode: string;
  userName: string;
  userEmail: string;
  avatarUrl: string | null;
  userColorPreference: UserColor | null;
}) {
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState(userName);
  const [colorPreference, setColorPreference] = useState<UserColor>(userColorPreference ?? "SKY");
  const [isPending, startTransition] = useTransition();

  function handleCopy() {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSaveName() {
    startTransition(async () => {
      const result = await updateDisplayName({ name, colorPreference });
      if (result?.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Display name updated");
      setEditOpen(false);
    });
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
          <div className="flex items-center gap-1">
            <p className="truncate text-xs text-muted-foreground">{userName}</p>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 shrink-0"
              onClick={() => {
                setName(userName);
                setColorPreference(userColorPreference ?? "SKY");
                setEditOpen(true);
              }}
            >
              <Pencil className="h-3 w-3" />
              <span className="sr-only">Edit display name</span>
            </Button>
          </div>
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

      <div className="border-t p-4 space-y-3">
        <div>
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
        <SignOutButton redirectUrl="/sign-in">
          <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </SignOutButton>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit display name</DialogTitle>
          </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="display-name">Name</Label>
          <Input
            id="display-name"
            value={name}
              onChange={(event) => setName(event.target.value)}
            maxLength={50}
            placeholder="Your name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="account-email">Email</Label>
          <Input
            id="account-email"
            value={userEmail}
            readOnly
            disabled
          />
          <p className="text-xs text-muted-foreground">
            This is the account email linked to your profile.
          </p>
        </div>
        <div className="space-y-2">
          <Label>Profile color</Label>
          <Select value={colorPreference} onValueChange={(value) => setColorPreference(value as UserColor)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {USER_COLOR_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2.5 w-2.5 rounded-full", option.dot)} />
                    <span>{option.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            This color is used for your assignee chips across meals and chores.
          </p>
        </div>
        <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveName} disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
