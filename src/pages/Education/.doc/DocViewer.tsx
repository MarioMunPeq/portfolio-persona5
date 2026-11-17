import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { EducationDoc } from "../data";
import { EDUCATION_DOCS, pdfSrc } from "../data";
import { BUTTON_ASSETS } from "../../../config/uiAssets";
import { Tag } from "../../../components/ui/Tag";
import "./DocViewer.css";

interface DocViewerProps {
  docIndex: number;
  onSelect: (index: number) => void;
  onClose: () => void;
}

export default function DocViewer({ docIndex, onSelect, onClose }: DocViewerProps) {
  const doc = EDUCATION_DOCS[docIndex]!;
  const dialogRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const arcana = { src: doc.arcanaFile, width: 250, height: 450, name: doc.arcana.name };

  useEffect(() => {
    const menu = document.querySelector<HTMLElement>(".p5-topbar-back");
    const main = document.querySelector<HTMLElement>(".education-main");
    const previousAriaHidden = menu?.getAttribute("aria-hidden");
    const previousOverflow = document.body.style.overflow;
    const previousMainZ = main?.style.zIndex ?? "";
    menu?.setAttribute("aria-hidden", "true");
    if (main) main.style.zIndex = "60";
    document.body.style.overflow = "hidden";
    backRef.current?.focus();
    return () => {
      if (menu) {
        if (previousAriaHidden == null) menu.removeAttribute("aria-hidden");
        else menu.setAttribute("aria-hidden", String(previousAriaHidden));
      }
      document.body.style.overflow = previousOverflow;
      if (main) main.style.zIndex = previousMainZ;
    };
  }, []);

  useEffect(() => {
    setPageNumber(1);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [doc.slug]);

  const move = (delta: number) => {
    onSelect((docIndex + delta + EDUCATION_DOCS.length) % EDUCATION_DOCS.length);
  };

  return (
    <div
      className="edu-viewer"
      onPointerDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
      onKeyDown={(event) => {
        if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); onClose(); }
        else if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); }
        else if (event.key === "ArrowRight") { event.preventDefault(); move(1); }
        else if (event.key === "Tab") {
          const items = document.querySelectorAll<HTMLElement>('.edu-viewer button:not([disabled]), .edu-viewer a[href], .edu-viewer [tabindex="0"]');
          if (!items.length) return;
          const first = items[0]!;
          const last = items[items.length - 1]!;
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
      }}
    >
      <div
        ref={dialogRef}
        className="edu-viewer__dialog"
        role="dialog"
        aria-modal="true"
        aria-label={`Visor: ${doc.title}`}
      >
        <div className="edu-viewer__pages">
          <span className="edu-viewer__red-plate" aria-hidden="true" />
          <div
            ref={scrollRef}
            className="edu-viewer__page-scroll"
            onScroll={(event) => setPageNumber(Math.min(doc.pages, Math.floor(event.currentTarget.scrollTop / event.currentTarget.clientHeight) + 1))}
            aria-label="Paginas del documento"
          >
            {Array.from({ length: doc.pages }, (_, index) => (
              <ViewerPage key={`${doc.slug}-${index + 1}`} doc={doc} page={index + 1} />
            ))}
          </div>
          <span className="edu-viewer__page-count">PAG. {pageNumber} / {doc.pages}</span>
        </div>

        <section className="edu-viewer__info" aria-label="Informacion del documento">
          <div className="edu-viewer__topline">
            <span className="doc-category">{doc.category}</span>
            <img className="edu-viewer__arcana" src={arcana.src} width={arcana.width} height={arcana.height} alt={`Arcano ${arcana.name}`} />
          </div>
          <h2 className="edu-viewer__short">{doc.shortTitle}</h2>
          <h3 className="edu-viewer__title">{doc.title}</h3>
          <div className="edu-viewer__tags">
            <Tag tone="light" font="sans" className="doc-meta-tag">{doc.entity}</Tag>
            <Tag tone="light" font="sans" className="doc-meta-tag">{doc.date}</Tag>
            {doc.hours !== null && <Tag tone="light" font="sans" className="doc-meta-tag">{doc.hours} horas</Tag>}
          </div>
          <div className="edu-viewer__actions">
            <a className="doc-action doc-action--download" href={pdfSrc(doc)} download>
              <img src={BUTTON_ASSETS.square.src} width={BUTTON_ASSETS.square.width} height={BUTTON_ASSETS.square.height} alt="" /><span>Descargar PDF</span>
            </a>
            <a className="doc-action" href={pdfSrc(doc)} target="_blank" rel="noreferrer">
              <img src={BUTTON_ASSETS.triangle.src} width={BUTTON_ASSETS.triangle.width} height={BUTTON_ASSETS.triangle.height} alt="" /><span>Abrir original ↗</span>
            </a>
          </div>
          <nav className="edu-viewer__navigation" aria-label="Cambiar documento">
            <button className="edu-viewer__shoulder" type="button" onClick={() => move(-1)} aria-label="Documento anterior">L1</button>
            <button type="button" onClick={() => move(-1)} aria-label="Documento anterior">◀</button>
            <span aria-live="polite">{String(docIndex + 1).padStart(2, "0")} / {String(EDUCATION_DOCS.length).padStart(2, "0")}</span>
            <button type="button" onClick={() => move(1)} aria-label="Documento siguiente">▶</button>
            <button className="edu-viewer__shoulder" type="button" onClick={() => move(1)} aria-label="Documento siguiente">R1</button>
          </nav>
        </section>
      </div>
      <button
        ref={backRef}
        className="edu-backplate"
        type="button"
        onClick={onClose}
        aria-label="Atras, cerrar visor"
        style={menuRectStyle()}
      >
        <img src={BUTTON_ASSETS.cross.src} width={BUTTON_ASSETS.cross.width} height={BUTTON_ASSETS.cross.height} alt="" />
        <span>ATRAS</span>
      </button>
    </div>
  );
}

function menuRectStyle(): CSSProperties {
  const rect = document.querySelector<HTMLElement>(".p5-topbar-back")?.getBoundingClientRect();
  if (!rect) return {};
  return { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` };
}

function ViewerPage({ doc, page }: { doc: EducationDoc; page: number }) {
  const [failed, setFailed] = useState(false);
  const src = `${import.meta.env.BASE_URL}previews/${doc.slug}-${page}.webp`;
  return (
    <div className="edu-viewer__page">
      {failed ? <p className="edu-viewer__fallback">Vista previa no disponible</p> : <img src={src} alt={`Pagina ${page} de ${doc.title}`} onError={() => setFailed(true)} />}
    </div>
  );
}
