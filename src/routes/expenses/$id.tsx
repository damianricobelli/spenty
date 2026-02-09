import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
	ArrowLeftIcon,
	GlobeIcon,
	HistoryIcon,
	LockIcon,
	SettingsIcon,
	ShareIcon,
	UnlockIcon,
	UserPlusIcon,
} from "lucide-react";
import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner";
import { getExpense } from "@/api/expenses";
import { getGroup } from "@/api/group";
import { getMembers } from "@/api/members";
import { PasswordDialog } from "@/components/password-dialog";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { useUpdateGroupName } from "@/hooks/groups/use-update-name";
import { isGroupUnlocked } from "@/lib/unlocked-groups";
import {
	getLocale,
	type Locale,
	locales,
	setLocale,
} from "@/paraglide/runtime";

export const Route = createFileRoute("/expenses/$id")({
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
	const { group, members, expense } = Route.useLoaderData();
	const router = useRouter();
	const [mockMembers, setMockMembers] = useState(members.length);

	const updateName = useUpdateGroupName();

	const isUnnamed = !group.name.trim() || group.name === "expense";
	const [groupName, setGroupName] = useState(isUnnamed ? "" : group.name);
	const focusInputRef = useCallback((node: HTMLInputElement | null) => {
		node?.focus();
	}, []);

	const [_, startTransition] = useTransition();

	const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
	const [historySheetOpen, setHistorySheetOpen] = useState(false);

	const handleUpdateGroupName = async () => {
		if (!groupName.trim()) {
			setGroupName(group.name);
			return;
		}
		setGroupName(groupName);
		startTransition(() => {
			updateName.mutate({ name: groupName, groupId: group.id });
			router.invalidate();
		});
	};

	const copyCode = () => {
		try {
			navigator.clipboard.writeText(group.slug);
			toast.success("Código copiado al portapapeles");
		} catch (error) {
			console.error("Failed to copy code:", error);
		}
	};

	const hasMembers = members.length + mockMembers > 0;
	const addMockMember = () => {
		setMockMembers((n) => n + 1);
		toast.success("Miembro añadido (mock)");
	};

	if (group.password && !isGroupUnlocked(group.id)) {
		return (
			<main className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4">
				<PasswordDialog from="expenses" defaultOpen={true} />
			</main>
		);
	}

	const now = new Date();
	const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
	const expenseThisMonth =
		Array.isArray(expense) &&
		expense
			.filter(
				(e: { created_at?: string }) =>
					e?.created_at && new Date(e.created_at) >= startOfMonth,
			)
			.reduce(
				(sum: number, e: { amount?: number }) => sum + (e?.amount ?? 0),
				0,
			);

	const hasHistory = Array.isArray(expense) && expense.length > 0;
	type ExpenseItem = { id?: string; amount?: number; created_at?: string; description?: string };
	const expenseList = (Array.isArray(expense) ? expense : []) as ExpenseItem[];

	return (
		<main className="relative flex min-h-screen flex-col bg-background">
			<header className="sticky top-0 z-20 border-b border-border/40 bg-background/95 px-4 py-3 backdrop-blur-md">
				<div className="mx-auto flex max-w-2xl items-center gap-3">
					<Link
						to="/"
						className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						aria-label="Volver"
					>
						<ArrowLeftIcon className="size-5" />
					</Link>

					<div className="min-w-0 flex-1 flex flex-col items-center justify-center py-0.5">
						<div className="flex h-8 items-center">
							<Input
								ref={focusInputRef}
								type="text"
								value={groupName}
								onChange={(e) => setGroupName(e.target.value)}
								onBlur={handleUpdateGroupName}
								onKeyDown={(e) => e.key === "Enter" && handleUpdateGroupName()}
								placeholder="Nombre del grupo"
								className="w-50 text-center font-semibold bg-transparent not-focus-within:border-none"
								aria-invalid={
									!!updateName.error || groupName.trim().length === 0
								}
							/>
						</div>
						<span className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
							Gastos generales
						</span>
					</div>

					<div className="size-9 shrink-0" aria-hidden />
				</div>
			</header>

			<PasswordDialog
				from="expenses"
				defaultOpen={false}
				open={passwordDialogOpen}
				onOpenChange={setPasswordDialogOpen}
			/>

			<div className="flex flex-1 flex-col items-center justify-center px-4 pb-24">
				{!hasMembers && (
					<button
						type="button"
						onClick={addMockMember}
						className="group relative flex w-full max-w-xl flex-col gap-5 rounded-2xl border border-border/60 bg-card/80 p-6 text-left backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-lg"
					>
						<div className="flex gap-5 items-center sm:justify-between">
							<div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-foreground text-background">
								<UserPlusIcon className="size-5" />
							</div>
							<div className="block sm:hidden">
								<h2 className="text-md font-semibold text-foreground">
									Añadir miembro
								</h2>
								<p className="text-xs leading-relaxed text-muted-foreground">
									No hay miembros en el grupo. Toca para añadir uno.
								</p>
							</div>
						</div>
						<div className="hidden sm:block">
							<h2 className="text-lg font-semibold text-foreground">
								Añadir miembro
							</h2>
							<p className="mt-1 text-sm leading-relaxed text-muted-foreground">
								No hay miembros en el grupo. Toca para añadir uno.
							</p>
						</div>
					</button>
				)}
			</div>

			<div className="fixed bottom-6 left-1/2 z-20 -translate-x-1/2">
				<div className="flex items-center space-x-1 rounded-full border border-border/50 bg-background/80 px-3 py-2 shadow-lg backdrop-blur-xl sm:gap-3 sm:px-4 sm:py-2.5">
					<div className="flex items-center gap-1 font-semibold mr-2">
						<span className="text-sm uppercase tracking-wider text-muted-foreground">
							Total:
						</span>
						<span className="text-sm uppercase tracking-wider text-muted-foreground">
							${Number(expenseThisMonth ?? 0).toLocaleString()}
						</span>
					</div>
					<Button
						size="sm"
						disabled={!hasHistory}
						onClick={() => setHistorySheetOpen(true)}
						className="inline-flex h-7 gap-1.5 rounded-full bg-foreground px-2.5 text-xs font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-50 sm:px-3"
					>
						<HistoryIcon className="size-4" />
						Historial
					</Button>
					<Sheet
						open={historySheetOpen}
						onOpenChange={setHistorySheetOpen}
					>
						<SheetContent side="right" className="flex flex-col">
							<SheetHeader>
								<SheetTitle>Historial de gastos</SheetTitle>
							</SheetHeader>
							<ul className="flex-1 overflow-y-auto px-6 pb-6">
								{expenseList.map((e) => (
									<li
										key={e.id ?? e.created_at ?? Math.random()}
										className="flex items-center justify-between border-b border-border/50 py-3 last:border-0"
									>
										<div className="min-w-0">
											{e.description && (
												<p className="truncate text-sm text-foreground">
													{e.description}
												</p>
											)}
											<p className="text-xs text-muted-foreground">
												{e.created_at
													? new Date(e.created_at).toLocaleDateString(
															getLocale(),
															{
																day: "numeric",
																month: "short",
																year: "numeric",
															},
														)
													: "—"}
											</p>
										</div>
										<span className="ml-2 shrink-0 font-semibold tabular-nums">
											${Number(e.amount ?? 0).toLocaleString()}
										</span>
									</li>
								))}
							</ul>
						</SheetContent>
					</Sheet>
					<DropdownMenu>
						<DropdownMenuTrigger
							render={
								<Button
									variant="ghost"
									size="icon-sm"
									className="rounded-full text-muted-foreground"
									aria-label="Configuración"
								>
									<SettingsIcon />
								</Button>
							}
						/>
						<DropdownMenuContent align="end" side="top" sideOffset={8}>
							<DropdownMenuItem
								onClick={(e) => {
									e.preventDefault();
									copyCode();
								}}
							>
								<ShareIcon />
								Compartir código
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={(e) => {
									e.preventDefault();
									setPasswordDialogOpen(true);
								}}
							>
								{group.password ? <LockIcon /> : <UnlockIcon />}
								{group.password
									? "Cambiar / quitar contraseña"
									: "Proteger con contraseña"}
							</DropdownMenuItem>
							<DropdownMenuSub>
								<DropdownMenuSubTrigger>
									<GlobeIcon />
									Idioma
								</DropdownMenuSubTrigger>
								<DropdownMenuSubContent>
									<DropdownMenuRadioGroup
										value={getLocale()}
										onValueChange={(v) => setLocale(v as Locale)}
									>
										{locales.map((locale) => (
											<DropdownMenuRadioItem key={locale} value={locale}>
												{locale.toUpperCase()}
											</DropdownMenuRadioItem>
										))}
									</DropdownMenuRadioGroup>
								</DropdownMenuSubContent>
							</DropdownMenuSub>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</main>
	);
}
