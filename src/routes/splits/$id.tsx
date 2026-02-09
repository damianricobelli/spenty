import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowLeftIcon, CheckIcon, CopyIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { getExpense } from "@/api/expenses";
import { getGroup } from "@/api/group";
import { getMembers } from "@/api/members";
import { PasswordDialog } from "@/components/password-dialog";
import { Button } from "@/components/ui/button";
import { useUpdateGroupName } from "@/hooks/groups/use-update-name";
import { isGroupUnlocked } from "@/lib/unlocked-groups";

export const Route = createFileRoute("/splits/$id")({
  component: RouteComponent,
  loader: async ({ params }) => {
    const { id } = params;
    const group = await getGroup({ data: { code: id } });
    const members = await getMembers({ data: { groupId: group.id } });
    const expense = await getExpense({ data: { groupId: group.id } });
    return { group, members, expense };
  },
});

function RouteComponent() {
  const { group } = Route.useLoaderData();
  const router = useRouter();

  const updateName = useUpdateGroupName();

  const [groupName, setGroupName] = useState(group.name);
  const [isEditing, setIsEditing] = useState(false);

  const [_, startTransition] = useTransition();

  const [copied, setCopied] = useState(false);

  const handleUpdateGroupName = async () => {
    if (!groupName.trim()) return;

    setIsEditing(false);
    setGroupName(groupName);

    startTransition(() => {
      updateName.mutate({ name: groupName, groupId: group.id });
      router.invalidate();
    });
  };

  const copyCode = () => {
    try {
      navigator.clipboard.writeText(group.slug);
    } catch (error) {
      console.error("Failed to copy code:", error);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (group.password && !isGroupUnlocked(group.id)) {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center bg-background">
        <PasswordDialog from="splits" defaultOpen={true} />
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center">
          <Link to="/">
            <ArrowLeftIcon className="size-4 text-" />
          </Link>
          <div className="flex flex-1 flex-col items-center">
            {isEditing ? (
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                onBlur={handleUpdateGroupName}
                onKeyDown={(e) => e.key === "Enter" && handleUpdateGroupName()}
                className="w-full bg-transparent text-center text-lg font-semibold text-foreground outline-none"
              />
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-lg font-semibold text-foreground hover:opacity-70"
              >
                {groupName}
              </button>
            )}
            <span className="text-xs text-muted-foreground">
              Gastos generales
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button onClick={copyCode} variant="ghost" size="xs">
              {copied ? (
                <CheckIcon data-icon="inline-start" />
              ) : (
                <CopyIcon data-icon="inline-start" />
              )}
              {group.slug}
            </Button>
            <PasswordDialog from="splits" defaultOpen={false} />
          </div>
        </div>
      </header>
    </main>
  );
}
