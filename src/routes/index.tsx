import { createFileRoute } from "@tanstack/react-router";
import { FloatingElements } from "@/components/floating-elements";
import { NewExpenseCard } from "@/components/new-expense-card";
import { NewSplitCard } from "@/components/new-split-card";
import { SearchCode } from "@/components/search-code";
import { m } from "@/paraglide/messages";
import { LocaleMenu } from "@/components/locale-menu";

export const Route = createFileRoute("/")({ component: App });

function App() {
  return (
    <main className="relative flex h-dvh flex-col overflow-hidden bg-background">
      {/* Animated floating background */}
      <FloatingElements count={36} />

      {/* Hero section */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-12 sm:py-20">
        <div className="mb-16 text-center">
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
      </div>
      {/* Code input section - integrated */}
      <div className="relative z-10 px-4 pb-12 sm:pb-16">
        <div className="mx-auto flex items-center justify-center">
          <SearchCode />
          <LocaleMenu />
        </div>
      </div>
    </main>
  );
}
