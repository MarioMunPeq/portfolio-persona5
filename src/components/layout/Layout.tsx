import type { ReactNode } from "react";
import { TopBar } from "../ui/TopBar";
import { BottomBar } from "../ui/BottomBar";
import { Cursor } from "./Cursor";
import { CalendarTransition } from "../calendar/CalendarTransition";
import { Grain } from "../primitives/Grain";

interface LayoutProps {
  children: ReactNode;
}

/**
 * Marco de las pantallas: TopBar unificada en todas las pantallas
 * (incluido el menu principal, con Wordmark estatico). El footer
 * global, el cargador, el grano y el cursor viven por encima de todo.
 */
export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-dvh bg-bg-hero text-paper">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[130] focus:bg-accent focus:px-4 focus:py-2 focus:font-medium focus:uppercase focus:tracking-widest focus:text-paper"
      >
        Saltar al contenido
      </a>
      <CalendarTransition />
      <TopBar />
      <BottomBar />
      <Grain />
      <Cursor />
      <main id="main">{children}</main>
    </div>
  );
}
