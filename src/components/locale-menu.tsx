import { GlobeIcon } from "lucide-react";
import { localeFlags } from "@/lib/locale-flags";
import { m } from "@/paraglide/messages";
import type { Locale } from "@/paraglide/runtime";
import { getLocale, locales, setLocale } from "@/paraglide/runtime";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export const LocaleMenu = () => {
  const currentLocale = getLocale();

  const handleLocaleChange = (locale: Locale) => {
    setLocale(locale);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="bg-muted"
            aria-label={m.header_language()}
          >
            <GlobeIcon />
          </Button>
        }
      />
      <DropdownMenuContent>
        <DropdownMenuRadioGroup
          value={currentLocale}
          onValueChange={handleLocaleChange}
        >
          {locales.map((locale) => (
            <DropdownMenuRadioItem value={locale} key={locale}>
              <span>{localeFlags[locale]}</span>
              {locale.toUpperCase()}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
