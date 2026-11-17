/* ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
   /education — "FORMACION" (esqueleto).
   Escena de escritorio 100svh sin scroll: .edu-root fijo, hijos en vw/vh
   relativos a el. Zona segura publicada por useZone (--zone-*). Sin scroll,
   sin position:absolute con coordenadas en px, sin medidas px salvo
   bordes/sombras/blur.
   ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */

import { useRef, useState, useEffect, useCallback, useLayoutEffect } from "react";
import { flushSync } from "react-dom";
import { gsap } from "gsap";
import { SectionTitle } from "../../components/ui/SectionTitle";
import PlateStack from "./.stack/PlateStack";
import DocScene from "./.doc/DocScene";
import DocViewer from "./.doc/DocViewer";
import { useZone } from "./useZone";
import { EDUCATION_DOCS, pdfSrc } from "./data";
import "./education.css";

export default function EducationPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(() => {
    const slug = new URLSearchParams(window.location.search).get("doc");
    const index = EDUCATION_DOCS.findIndex((doc) => doc.slug === slug);
    return index < 0 ? 0 : index;
  });
  const selectedIndexRef = useRef(selectedIndex);
  const [viewerOpen, setViewerOpen] = useState(() => EDUCATION_DOCS.some((doc) => doc.slug === new URLSearchParams(window.location.search).get("doc")));
  const viewerOriginRef = useRef(selectedIndex);
  const viewerOriginElementRef = useRef<HTMLElement | null>(null);
  const viewerWasOpenRef = useRef(viewerOpen);
  const introRef = useRef<gsap.core.Timeline | null>(null);
  const introDoneRef = useRef(false);
  const [flipBack, setFlipBack] = useState(false);
  useZone({ rootRef, enabled: true });

  const openViewer = (doc?: (typeof EDUCATION_DOCS)[number]) => {
    const index = doc ? EDUCATION_DOCS.indexOf(doc) : selectedIndex;
    const target = EDUCATION_DOCS[index];
    selectedIndexRef.current = index;
    viewerOriginRef.current = index;
    viewerOriginElementRef.current = document.querySelectorAll<HTMLElement>(".arcana-option")[index] ?? null;
    setSelectedIndex(index);
    const slug = target?.slug;
    if (slug) window.history.replaceState(null, "", `${window.location.pathname}?doc=${encodeURIComponent(slug)}`);
    setViewerOpen(true);
  };
  const closeViewer = () => {
    setViewerOpen(false);
  };

  const commitSelection = useCallback((index: number) => {
    selectedIndexRef.current = index;
    setSelectedIndex(index);
  }, []);

  useLayoutEffect(() => {
    if (viewerWasOpenRef.current && !viewerOpen) {
      (viewerOriginElementRef.current ?? document.querySelectorAll<HTMLElement>(".arcana-option")[viewerOriginRef.current])?.focus({ preventScroll: true });
    }
    viewerWasOpenRef.current = viewerOpen;
  }, [viewerOpen]);

  const selectDocument = useCallback((index: number) => {
    if (index === selectedIndexRef.current) return;
    selectedIndexRef.current = index;
    setSelectedIndex(index);
    const card = rootRef.current?.querySelector<HTMLElement>(".doc-carta-group");
    if (!card || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    gsap.killTweensOf(card);
    const angle = Number(gsap.getProperty(card, "rotationY")) || 0;
    setFlipBack(angle > 90 && angle < 270);
    gsap.set(card, { transformPerspective: 1400, willChange: "transform" });
    gsap.timeline({
      onComplete: () => {
        setFlipBack(false);
        gsap.set(card, { clearProps: "transformPerspective,rotationY,willChange" });
      },
    })
      .to(card, {
        rotationY: 180,
        duration: 0.22,
        ease: "power2.in",
        onComplete: () => flushSync(() => setFlipBack(true)),
      })
      .to(card, { rotationY: 360, duration: 0.28, ease: "power2.out" });
  }, []);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || introDoneRef.current || viewerOpen) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { introDoneRef.current = true; return; }
    const ctx = gsap.context(() => {
      const timeline = gsap.timeline({
        onComplete: () => {
          introDoneRef.current = true;
          gsap.set(".edu-title, .arcana-option, .doc-carta-group, .doc-paper-stage", { clearProps: "transform,opacity" });
        },
      });
      introRef.current = timeline;
      timeline
        .from(".edu-title", { opacity: 0, y: "1.5vh", duration: 0.12, ease: "power2.out" })
        .from(".arcana-option", { opacity: 0, y: "2vh", stagger: 0.035, duration: 0.2, ease: "power2.out" }, "-=0.04")
        .from(".doc-carta-group", { opacity: 0, y: "3vh", rotation: 6, duration: 0.34, ease: "power2.out" }, "-=0.07")
        .from(".doc-paper-stage", { opacity: 0, x: "2vw", duration: 0.28, ease: "power2.out" }, "-=0.15");
    }, root);
    return () => { ctx.revert(); introRef.current = null; };
  }, [viewerOpen]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (introRef.current && introRef.current.progress() < 1) introRef.current.progress(1);
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const active = document.activeElement;
      if (active?.closest(".edu-viewer")) return;
      if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Home" || event.key === "End") {
        event.preventDefault();
        const next = event.key === "Home" ? 0 : event.key === "End" ? EDUCATION_DOCS.length - 1 : (selectedIndex + (event.key === "ArrowDown" ? 1 : EDUCATION_DOCS.length - 1)) % EDUCATION_DOCS.length;
        selectDocument(next);
      }
      if (event.key === "Escape") document.querySelector<HTMLElement>(".p5-topbar-back")?.click();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedIndex, selectDocument]);

  return (
    <section
      ref={rootRef}
      className={`edu-root${viewerOpen ? " edu-root--viewer" : ""}`}
      onPointerDownCapture={() => { if (introRef.current && introRef.current.progress() < 1) introRef.current.progress(1); }}
      onKeyDownCapture={(event) => {
        if ((event.key === "Enter" || event.key === " ") && (event.target as HTMLElement).closest(".arcana-rail")) {
          event.preventDefault();
          openViewer(EDUCATION_DOCS[selectedIndex]);
        }
      }}
    >
      {/* Lista accesible oculta con <a> reales a los PDFs (.sr-only). */}
      <div className="edu-a11y">
        {EDUCATION_DOCS.map((doc) => (
          <a key={doc.slug} className="sr-only" href={pdfSrc(doc)} download>
            {doc.title} — {doc.entity} ({doc.date})
          </a>
        ))}
      </div>

      {/* Titulo de Perfil reutilizado; la identidad Persona vive en la carta y el selector. */}
      <header className="edu-title">
        <SectionTitle
          title="FORMACION"
          persona
          compact
        />
        <p className="edu-lead">Siete arcanos. Siete titulos reales. Elige una carta para abrir su expediente.</p>
      </header>

      {/* Menu de arcanos: la lista de texto pasa a ser una fila de cartas reales. */}
      <PlateStack selectedIndex={selectedIndex} onSelect={selectDocument} />

      {/* Dos objetos en paralelo: arcano y certificado, sin solaparse. */}
      <DocScene doc={EDUCATION_DOCS[selectedIndex]!} flipBack={flipBack} onOpen={() => openViewer()} />
      <p className="edu-live" aria-live="polite" aria-atomic="true">{EDUCATION_DOCS[selectedIndex]?.title} — {EDUCATION_DOCS[selectedIndex]?.entity}</p>
      {viewerOpen && <DocViewer docIndex={selectedIndex} onSelect={commitSelection} onClose={closeViewer} />}
    </section>
  );
}
