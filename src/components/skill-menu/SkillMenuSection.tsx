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
          <div className="sdeck__header-rule" />
          <div className="sdeck__header-row">
            <span className="sdeck__header-meta">SKILL DECK</span>
            <h2 className="sdeck__header-title">HABILIDADES</h2>
            <span className="sdeck__header-meta">4 SUITS · 18 CARDS</span>
          </div>
          <div className="sdeck__header-rule" />
        </div>

        {CATEGORIES.map((cat, ci) => (
          <div key={cat.label} className="sdeck__cat">
            <div className="sdeck__cat-head">
              <span className="sdeck__cat-suit">{cat.suit}</span>
              <span className="sdeck__cat-label">{cat.label}</span>
              <span className="sdeck__cat-count">{cat.items.length}</span>
            </div>
            <div className="sdeck__grid">
              {cat.items.map((item) => (
                <div key={item} className="sdeck__card">
                  <div className="sdeck__card-inner">
                    <div className="sdeck__corner sdeck__corner--tl">
                      <span className="sdeck__corner-rank">A</span>
                      <span className="sdeck__corner-suit">{cat.suit}</span>
                    </div>

                    <div className="sdeck__center">
                      <div className="sdeck__icon-wrap">
                        <TechIcon name={item} />
                      </div>
                      <span className="sdeck__label">{item}</span>
                    </div>

                    <div className="sdeck__corner sdeck__corner--br">
                      <span className="sdeck__corner-rank">A</span>
                      <span className="sdeck__corner-suit">{cat.suit}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {ci < CATEGORIES.length - 1 && (
              <div className="sdeck__cat-divider">
                <span className="sdeck__cat-divider-line" />
                <span className="sdeck__cat-divider-diamond">◆</span>
                <span className="sdeck__cat-divider-line" />
              </div>
            )}
          </div>
        ))}
      </div>
    </Reveal>
  );
}
