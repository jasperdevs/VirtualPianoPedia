import { Link, Route, Routes, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { GithubLogoIcon, MoonIcon, SunIcon } from "@phosphor-icons/react";
import { FluidButton } from "@/components/fluid/FluidButton";
import { HomePage } from "@/pages/home";
import { SheetPage } from "@/pages/sheet";
import { ArtistPage } from "@/pages/artist";
import { ConverterPage } from "@/pages/converter";
import { useTheme } from "@/lib/theme";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Sheets" },
  { href: "/converter", label: "Converter" },
];

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const isSheetPage = location.pathname.startsWith("/sheet");

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <header className="sticky top-0 z-40 bg-transparent">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-28 bg-gradient-to-b from-background via-background/85 to-transparent" />
        <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2 md:flex-nowrap">
          <Link to="/" className="flex items-center gap-3">
            <img src="/VirtualPianoPedia/assets/rvps-logo.png" alt="" className="size-9 rounded-md" />
            <div>
              <div className="text-base font-semibold leading-none">VirtualPianoPedia</div>
              <div className="text-xs text-muted-foreground">Roblox piano sheets</div>
            </div>
          </Link>

          <nav className="order-3 mx-auto flex items-center rounded-full bg-muted/80 p-1 md:order-none md:mx-0">
            {navItems.map((item) => {
              const isActive = item.href === "/" ? location.pathname === "/" || location.pathname.startsWith("/sheet") || location.pathname.startsWith("/artist") : location.pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn("relative rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground transition-[color,font-weight] hover:text-foreground", isActive && "text-foreground")}
                >
                  {isActive ? <motion.span layoutId="app-nav-active" className="absolute inset-0 rounded-full bg-background shadow-sm" transition={{ type: "spring", stiffness: 420, damping: 32 }} /> : null}
                  <span className="relative">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <FluidButton asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <a href="https://github.com/jasperdevs/VirtualPianoPedia" target="_blank" rel="noreferrer">
                <GithubLogoIcon />
                GitHub
              </a>
            </FluidButton>
            <FluidButton variant="outline" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </FluidButton>
          </div>
        </div>
      </header>

      <main className={cn(isSheetPage && "h-[calc(100dvh-4rem)] overflow-hidden")}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/sheet/*" element={<SheetPage />} />
          <Route path="/artist/:artistSlug" element={<ArtistPage />} />
          <Route path="/converter" element={<ConverterPage />} />
        </Routes>
      </main>
      <Toaster />
    </div>
  );
}
