"use client";

import { useActionState } from "react";
import { createHousehold, joinHousehold } from "@/actions/household";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export function OnboardingForm() {
  const [createState, createAction, createPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const result = await createHousehold(formData);
      return result ?? null;
    },
    null,
  );

  const [joinState, joinAction, joinPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const result = await joinHousehold(formData);
      return result ?? null;
    },
    null,
  );

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome to Chore Diary</CardTitle>
        <CardDescription>
          Create a new household or join an existing one to get started.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="create">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Create</TabsTrigger>
            <TabsTrigger value="join">Join</TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <form action={createAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Household name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g. The Smiths"
                  required
                />
              </div>
              {createState?.error && (
                <p className="text-sm text-destructive">{createState.error}</p>
              )}
              <Button type="submit" className="w-full" disabled={createPending}>
                {createPending ? "Creating..." : "Create household"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="join">
            <form action={joinAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inviteCode">Invite code</Label>
                <Input
                  id="inviteCode"
                  name="inviteCode"
                  placeholder="e.g. a1b2c3d4"
                  required
                />
              </div>
              {joinState?.error && (
                <p className="text-sm text-destructive">{joinState.error}</p>
              )}
              <Button type="submit" className="w-full" disabled={joinPending}>
                {joinPending ? "Joining..." : "Join household"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
