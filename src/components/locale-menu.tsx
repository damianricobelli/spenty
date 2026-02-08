import { GlobeIcon } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "./ui/dropdown-menu";
import { getLocale, locales, setLocale, Locale } from "@/paraglide/runtime";

export const LocaleMenu = () => {
  const currentLocale = getLocale();

  const handleLocaleChange = (locale: Locale) => {
    setLocale(locale);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" className="bg-muted">
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
              {locale.toUpperCase()}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
