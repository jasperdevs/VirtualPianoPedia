import { Link, NavLink, Route, Routes } from "react-router-dom";
import { GithubLogoIcon, MagnifyingGlassIcon, MoonIcon, SparkleIcon, SunIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { HomePage } from "@/pages/home";
import { SheetPage } from "@/pages/sheet";
import { ConverterPage } from "@/pages/converter";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Sheets" },
  { href: "/converter", label: "Converter" },
];

export default function App() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 bg-background/88 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
          <Link to="/" className="flex items-center gap-3">
            <img src="/VirtualPianoPedia/assets/rvps-logo.png" alt="" className="size-9 rounded-md" />
            <div>
              <div className="text-base font-semibold leading-none tracking-tight">VirtualPianoPedia</div>
              <div className="text-xs text-muted-foreground">Roblox piano sheet wiki</div>
            </div>
          </Link>

          <nav className="hidden items-center rounded-full bg-muted p-1 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    "rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground transition active:scale-[0.98]",
                    isActive && "bg-background text-foreground shadow-sm",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <a href="https://github.com/jasperdevs/VirtualPianoPedia" target="_blank" rel="noreferrer">
                <GithubLogoIcon />
                GitHub
              </a>
            </Button>
            <Button variant="outline" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </Button>
          </div>
        </div>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/sheet/:slug" element={<SheetPage />} />
          <Route path="/converter" element={<ConverterPage />} />
        </Routes>
      </main>

      <footer className="bg-muted/35">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div>Sheets, variants, converter, and playback. No comments or account system.</div>
          <div className="flex items-center gap-4">
            <Link to="/converter" className="inline-flex items-center gap-1 text-foreground hover:underline">
              <SparkleIcon className="size-4" />
              Convert
            </Link>
            <Link to="/" className="inline-flex items-center gap-1 text-foreground hover:underline">
              <MagnifyingGlassIcon className="size-4" />
              Browse
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
