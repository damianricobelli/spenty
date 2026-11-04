import { createFileRoute } from "@tanstack/react-router";
import { FloatingElements } from "@/components/floating-elements";
import { LocaleMenu } from "@/components/locale-menu";
import { NewExpenseCard } from "@/components/new-expense-card";
import { NewSplitCard } from "@/components/new-split-card";
import { RecentGroups } from "@/components/recent-groups";
import { SearchCode } from "@/components/search-code-dialog";
import { m } from "@/paraglide/messages";

export const Route = createFileRoute("/")({ component: App });

function App() {
  return (
    <main className="relative flex min-h-svh flex-col bg-background">
      {/* Animated floating background */}
      <FloatingElements count={36} />

      {/* Hero section */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-8 px-4 pt-[calc(3rem+env(safe-area-inset-top))] pb-8 sm:py-20">
        <div className="mb-4 text-center sm:mb-8">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            {m.home_page_top_title()}
          </p>
          <h1 className="text-balance text-center text-4xl sm:text-5xl font-bold tracking-tight text-foreground md:text-7xl">
            {m.home_page_title()}
            <br />
            <span className="bg-linear-to-r from-foreground via-foreground/80 to-muted-foreground bg-clip-text text-transparent">
              {m.home_page_description()}
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-md text-pretty text-base text-muted-foreground">
            {m.home_page_subtitle()}
          </p>
        </div>

        {/* Action cards */}
        <div className="flex w-full max-w-xl flex-col gap-4 sm:flex-row">
          <NewExpenseCard />
          <NewSplitCard />
        </div>

        <RecentGroups />
      </div>
      {/* Code input section - integrated */}
      <div className="relative z-10 px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] sm:pb-16">
        <div className="mx-auto flex items-center justify-center gap-2">
          <SearchCode />
          <LocaleMenu />
        </div>
      </div>
    </main>
  );
}
