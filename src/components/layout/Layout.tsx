import type { ReactNode } from "react";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { TopBar } from "../ui/TopBar";
import { BottomBar } from "../ui/BottomBar";
import { Cursor } from "./Cursor";
import { CalendarTransition } from "../calendar/CalendarTransition";
import { Grain } from "../primitives/Grain";
import { useLenis } from "lenis/react";
import { PageBackground } from "./PageBackground";
import "./PageBackground.css";

interface LayoutProps {
  children: ReactNode;
}

/**
 * Marco de las pantallas: TopBar unificada en todas las pantallas.
 * En páginas interiores (no el menú principal) se añade padding-top
 * al <main> para que el botón superior izquierdo no tape los títulos.
 */
export function Layout({ children }: LayoutProps) {
  const { pathname } = useLocation();
  const isMenu = pathname === "/";
  const isDocumentScrollPage =
    pathname === "/about" ||
    pathname === "/projects" ||
    pathname === "/experience" ||
    pathname.startsWith("/proyectos/");
  const hasPageBackground =
    pathname === "/about" ||
    pathname === "/projects" ||
    pathname.startsWith("/proyectos/");
  const isProjectInventoryPage = pathname === "/projects";
  const backgroundVariant = pathname === "/about" ? "profile" : "projects";
  const lenis = useLenis();

  /* Bloqueo de scroll solo en el menú principal: añade/quita is-main-menu
     en <body> según la ruta activa. */
  useEffect(() => {
    if (isMenu) {
      document.body.classList.add("is-main-menu");
    } else {
      document.body.classList.remove("is-main-menu");
    }
    return () => {
      document.body.classList.remove("is-main-menu");
    };
  }, [isMenu]);

  useEffect(() => {
    if (isMenu) {
      lenis?.stop();
    } else {
      lenis?.start();
    }

    return () => lenis?.start();
  }, [isMenu, lenis]);

  return (
    <div
      className={`min-h-dvh text-paper ${hasPageBackground ? "bg-transparent" : "bg-bg-hero"}`}
    >
      {hasPageBackground && (
        <PageBackground variant={backgroundVariant} />
      )}
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
      <main
        id="main"
        className={
          isProjectInventoryPage
            ? "relative z-[1] h-dvh overflow-hidden pt-20"
            : isDocumentScrollPage
            ? "relative z-[1] min-h-dvh pt-20"
            : `h-dvh overflow-y-auto ${isMenu ? "pt-0" : "pt-20"}`
        }
      >
        {children}
      </main>
    </div>
  );
}
