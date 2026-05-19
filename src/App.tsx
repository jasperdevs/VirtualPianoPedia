import { Link, NavLink, Route, Routes } from "react-router-dom";
import { Github, Moon, Search, Sun, WandSparkles } from "lucide-react";
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
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <img src="/RVPS/assets/rvps-logo.png" alt="" className="size-9 rounded-md" />
            <div>
              <div className="text-base font-semibold leading-none">RVPS</div>
              <div className="text-xs text-muted-foreground">Roblox Virtual Piano Sheets</div>
            </div>
          </Link>

          <nav className="hidden items-center rounded-lg border bg-muted/40 p-1 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition",
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
              <a href="https://github.com/jasperdevs/RVPS" target="_blank" rel="noreferrer">
                <Github />
                GitHub
              </a>
            </Button>
            <Button variant="outline" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === "dark" ? <Sun /> : <Moon />}
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

      <footer className="border-t">
        <div className="container flex flex-col gap-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div>Markdown sheets, no player, no comments, no clutter.</div>
          <div className="flex items-center gap-4">
            <Link to="/converter" className="inline-flex items-center gap-1 text-foreground hover:underline">
              <WandSparkles className="size-4" />
              Make a sheet
            </Link>
            <Link to="/" className="inline-flex items-center gap-1 text-foreground hover:underline">
              <Search className="size-4" />
              Browse
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
