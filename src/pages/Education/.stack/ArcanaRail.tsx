import type { EducationDoc } from "../data";

interface ArcanaRailProps {
  documents: EducationDoc[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export function ArcanaRail({ documents, selectedIndex, onSelect }: ArcanaRailProps) {
  return (
    <nav className="arcana-rail" aria-label="Menú de arcanos: elige una formación">
      {documents.map((doc, index) => (
        <button
          key={doc.slug}
          className={`arcana-option${index === selectedIndex ? " arcana-option--active" : ""}`}
          type="button"
          aria-label={`${doc.title}, ${doc.entity}, ${doc.date}`}
          aria-pressed={index === selectedIndex}
          aria-current={index === selectedIndex ? "true" : undefined}
          onMouseEnter={() => onSelect(index)}
          onFocus={() => onSelect(index)}
          onClick={() => onSelect(index)}
        >
          <span className="arcana-option__image-wrap" aria-hidden="true">
            <img className="arcana-option__image" src={doc.arcanaFile} width="250" height="450" alt="" loading="lazy" decoding="async" />
          </span>
          <span className="arcana-option__name">{doc.shortTitle}</span>
          <span className="arcana-option__roman" aria-hidden="true">{doc.roman}</span>
        </button>
      ))}
    </nav>
  );
}
