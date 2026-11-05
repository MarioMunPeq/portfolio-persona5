import {
  faCode,
  faDatabase,
  faMobileAndroid,
  faServer,
  faCogs,
  faChartArea,
  faBrain,
  faTable,
  faFire,
  faFile,
  faCloudArrowUp,
} from "@fortawesome/free-solid-svg-icons";
import {
  faJava,
  faPython,
  faHtml5,
  faGitAlt,
  faAndroid,
  faUnity,
  faFigma,
} from "@fortawesome/free-brands-svg-icons";
import type { CSSProperties } from "react";
import { Reveal } from "../primitives/Reveal";
import type { ProfileSkills } from "../../data/profile";

interface Props {
  skills: ProfileSkills;
}

interface Category {
  suit: string;
  label: string;
  items: string[];
}

const ICONS: Record<string, typeof faJava> = {
  Java: faJava,
  Python: faPython,
  Kotlin: faMobileAndroid,
  "C#": faCode,
  SQL: faDatabase,
  "HTML/CSS": faHtml5,
  "Git/GitHub": faGitAlt,
  Liferay: faServer,
  Odoo: faCogs,
  "Power Platform": faChartArea,
  "Android Studio": faAndroid,
  "Unity/Godot": faUnity,
  "Scikit-learn": faBrain,
  Pandas: faTable,
  PyTorch: faFire,
  Office: faFile,
  Figma: faFigma,
  Firebase: faCloudArrowUp,
};

function TechIcon({ name }: { name: string }) {
  const icon = ICONS[name];
  if (!icon) return null;
  const path = icon.icon[4];
  return (
    <svg
      viewBox={`0 0 ${icon.icon[0]} ${icon.icon[1]}`}
      aria-hidden="true"
      className="sdeck__card-icon"
      fill="currentColor"
    >
      {Array.isArray(path) ? (
        path.map((d) => <path key={d} d={d} />)
      ) : (
        <path d={path} />
      )}
    </svg>
  );
}

export function SkillMenuSection({ skills }: Props) {
  const CATEGORIES: Category[] = [
    { suit: "♦", label: "LENGUAJES DE PROGRAMACIÓN", items: skills.programming },
    { suit: "♣", label: "TECNOLOGÍAS", items: skills.technologies },
    { suit: "♥", label: "IA Y DATA SCIENCE", items: skills.aiData },
    { suit: "♠", label: "OTROS", items: skills.other },
  ];

  return (
    <Reveal delay={0.16}>
      <div className="sdeck">
        <div className="sdeck__header">
          <span aria-hidden="true" className="sdeck__header-mark">
            ✦
          </span>
          <h2 className="sdeck__header-title">Habilidades</h2>
        </div>

        {CATEGORIES.map((cat, ci) => (
          <div key={cat.label} className="sdeck__cat">
            <div className="sdeck__cat-head">
              <span className="sdeck__cat-suit" aria-hidden="true">
                {cat.suit}
              </span>
              <span className="sdeck__cat-label">{cat.label}</span>
            </div>
            <div className="sdeck__grid">
              {cat.items.map((item, index) => (
                <article
                  key={item}
                  className="sdeck__card"
                  style={
                    {
                      "--card-index": index,
                      "--card-accent": "#E60012",
                    } as CSSProperties
                  }
                >
                  <div className="sdeck__card-inner">
                    <div className="sdeck__corner sdeck__corner--tl">
                      <span className="sdeck__corner-suit">{cat.suit}</span>
                    </div>

                    <div className="sdeck__center">
                      <div className="sdeck__icon-wrap">
                        <TechIcon name={item} />
                      </div>
                      <span className="sdeck__label">{item}</span>
                    </div>

                    <div className="sdeck__corner sdeck__corner--br">
                      <span className="sdeck__corner-suit">{cat.suit}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            {ci < CATEGORIES.length - 1 && (
              <div className="sdeck__cat-divider">
                <span className="sdeck__cat-divider-mark">✦</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </Reveal>
  );
}
