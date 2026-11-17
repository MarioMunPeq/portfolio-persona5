import { useState } from "react";
import type { EducationDoc } from "../data";
import { pdfSrc } from "../data";
import { ARCANA_BACK, BUTTON_ASSETS } from "../../../config/uiAssets";
import "./DocScene.css";

interface DocSceneProps {
  doc: EducationDoc;
  onOpen?: () => void;
  flipBack?: boolean;
}

export default function DocScene({ doc, onOpen, flipBack = false }: DocSceneProps) {
  const [previewFailed, setPreviewFailed] = useState(false);
  const [gotPdf, setGotPdf] = useState(false);
  const previewSrc = `${import.meta.env.BASE_URL}previews/${doc.slug}-1.webp`;

  return (
    <section className="doc" aria-label={`Carta y expediente: ${doc.title}`}>
      <div className="doc-grid">
        <div className="doc-card-stage">
          <span className="doc-card-sigil" data-decor aria-hidden="true">{doc.roman}</span>
          <button className="doc-carta-group" type="button" onClick={onOpen} aria-label={`Abrir el expediente de ${doc.title}`}>
            <img
              className="doc-carta"
              src={doc.arcanaFile}
              alt={`Arcano ${doc.arcana.name} correspondiente a ${doc.title}`}
              width="250"
              height="450"
              decoding="async"
              fetchPriority="high"
            />
            {flipBack && <span className="doc-card-reverse" aria-hidden="true"><img src={ARCANA_BACK.src} width={ARCANA_BACK.width} height={ARCANA_BACK.height} alt="" /></span>}
          </button>
        </div>

        <div className="doc-file-stage">
          <button className="doc-paper-stage" type="button" onClick={onOpen} aria-label={`Ampliar la primera pagina de ${doc.title}`}>
            {previewFailed ? (
              <span className="doc-preview-fallback">Vista previa no disponible</span>
            ) : (
              <img className="doc-hoja" src={previewSrc} alt={`Pagina 1 de ${doc.title}`} width="1600" height="1131" decoding="async" onError={() => setPreviewFailed(true)} />
            )}
          </button>

        </div>

          <div className="doc-info">
            <div className="doc-copy">
              <span className="doc-category">{doc.category}</span>
              <h2 className="doc-full-title">{doc.title}</h2>
              <span className="doc-title-rule" aria-hidden="true" />
              <div className="doc-meta" aria-label="Datos del documento">
                <p><span>CENTRO</span>{doc.entity}</p>
                <p><span>FECHA</span>{doc.date}</p>
                {doc.hours !== null && <p><span>HORAS</span>{doc.hours} horas</p>}
              </div>
            </div>
            <div className="doc-actions">
              <button className="doc-action doc-action--open" type="button" onClick={onOpen}>
                <img src={BUTTON_ASSETS.square.src} width={BUTTON_ASSETS.square.width} height={BUTTON_ASSETS.square.height} alt="" />
                <span>Abrir expediente</span>
              </button>
              <a className="doc-action doc-action--download" href={pdfSrc(doc)} download onClick={() => { setGotPdf(true); window.setTimeout(() => setGotPdf(false), 900); }}>
                <img src={BUTTON_ASSETS.triangle.src} width={BUTTON_ASSETS.triangle.width} height={BUTTON_ASSETS.triangle.height} alt="" />
                <span>Descargar PDF</span>
              </a>
              {gotPdf && <img className="doc-get" data-transient src={`${import.meta.env.BASE_URL}images/ui/tag-get.webp`} alt="Descarga iniciada" />}
            </div>
          </div>
      </div>
    </section>
  );
}
