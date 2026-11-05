import { useRef, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { useReducedMotion } from "motion/react";
import { gsap } from "gsap";
import { useMediaQuery } from "../../lib/use-media-query";
import { transitionBus } from "../transition/transition-bus";

export type HeroIcon = "triangle" | "square" | "circle" | "cross" | "asterisk";

const ICON_IMAGES: Record<HeroIcon, string> = {
  triangle: "/images/ui/Button_Triangle.png",
  square: "/images/ui/Button_Square.png",
  circle: "/images/ui/Button_Circle.png",
  cross: "/images/ui/Button_X.png",
  asterisk: "/images/ui/Button_X.png",
};

interface CommandNavItemProps {
  icon: HeroIcon;
  label: string;
  sub: string;
  subHover: string;
  path: string;
  rotation?: number;
  offsetX?: number;
  widthPx?: number;
  index: number;
  selected: boolean;
  onSelect: (index: number) => void;
  setButtonRef: (index: number, element: HTMLButtonElement | null) => void;
}

export function CommandNavItem({
  icon,
  label,
  sub,
  subHover,
  path,
  rotation = 0,
  offsetX = 0,
  widthPx = 380,
  index,
  selected,
  onSelect,
  setButtonRef,
}: CommandNavItemProps) {
  const navigate = useNavigate();
  const navigating = useRef(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isPhone = useMediaQuery("(max-width: 639px)");
  const reducedMotion = useReducedMotion();
  const clampedWidth = Math.max(400, Math.min(550, widthPx));

  const handleNav = async () => {
    if (navigating.current) return;
    navigating.current = true;
    onSelect(index);

    const button = buttonRef.current;
    const track = button?.querySelector<HTMLElement>(".hero-cmd-track");
    const labelElement = button?.querySelector<HTMLElement>(
      ".hero-command-label",
    );
    if (!reducedMotion && track && labelElement) {
      const flash = gsap.timeline();
      flash
        .to(track, { backgroundColor: "#e8112d", duration: 0.06 })
        .to(labelElement, { color: "#fff", duration: 0.06 }, "<")
        .to(track, { backgroundColor: "#fff", duration: 0.06 })
        .to(labelElement, { color: "#111", duration: 0.06 }, "<")
        .to(track, { backgroundColor: "#e8112d", duration: 0.06 })
        .to(labelElement, { color: "#fff", duration: 0.06 }, "<")
        .to(track, { backgroundColor: "#fff", duration: 0.06 })
        .to(labelElement, { color: "#111", duration: 0.06 }, "<");
      await flash.then();
    }

    if (!isDesktop) {
      navigate(path);
      return;
    }
    transitionBus.markExternallyStarted();
    await transitionBus.playUntilCovered();
    navigate(path);
  };

  return (
    <li
      className={`hero-command-item${selected ? " is-selected" : ""}`}
      style={
        {
          "--off": `${offsetX}px`,
          "--rot": `${rotation}deg`,
          "--menu-shift-x": "0px",
          "--menu-angle": `${rotation}deg`,
          "--menu-scale": 1,
          width: isPhone ? "100%" : `${clampedWidth}px`,
        } as CSSProperties
      }
    >
      <span className="hero-command-entry">
        <button
          ref={(element) => {
            buttonRef.current = element;
            setButtonRef(index, element);
          }}
          type="button"
          onPointerEnter={() => onSelect(index)}
          onFocus={() => onSelect(index)}
          onClick={() => void handleNav()}
          data-cursor="open"
          className="hero-cmd metro-menu-btn group w-full border-none text-left"
        >
          <span aria-hidden="true" className="hero-cmd-track" />
          <span
            aria-hidden="true"
            className="hero-btn-icon flex h-[30px] w-[30px] shrink-0 items-center justify-center [transform:skewX(11deg)]"
          >
            <span
              className="absolute inset-0 h-full w-full"
              style={{
                backgroundImage: `url(${ICON_IMAGES[icon]})`,
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
              }}
            />
          </span>
          <span className="hero-command-label min-w-0 flex-1 overflow-hidden whitespace-nowrap [transform:skewX(11deg)] font-p5-menu text-[22px] leading-none tracking-[0.02em] text-paper [text-shadow:2px_2px_0_color-mix(in_srgb,var(--color-ink)_60%,transparent)] sm:text-[28px] lg:text-[30px] xl:text-[36px]">
            {label}
          </span>
          <span
            className="w-[130px] shrink-0 hidden self-center overflow-hidden whitespace-nowrap [transform:skewX(11deg)] md:block"
            aria-hidden="true"
          >
            <span className="hero-sub block transition-opacity duration-200">
              {sub}
            </span>
            <span className="hero-sub hero-sub--hover pointer-events-none absolute inset-0 block opacity-0 transition-opacity duration-200">
              {subHover}
            </span>
          </span>
          <span className="hero-command-arrow" aria-hidden="true">
            ◀
          </span>
          <span className="hero-command-flash" aria-hidden="true" />
        </button>
      </span>
    </li>
  );
}
