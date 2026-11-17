import { forwardRef, useImperativeHandle, useRef } from "react";
import "./calendar-loading-hud.css";

export interface CalendarLoadingHudHandle {
  setProgress: (value: number) => void;
}

type CalendarLoadingHudProps = { date?: never };

export const CalendarLoadingHud = forwardRef<CalendarLoadingHudHandle, CalendarLoadingHudProps>(
  function CalendarLoadingHud(_props, ref) {
    const progressRef = useRef<HTMLDivElement>(null);
    const valueRef = useRef<HTMLSpanElement>(null);

    useImperativeHandle(ref, () => ({
      setProgress(value: number) {
        const progress = Math.max(0, Math.min(100, Math.round(value)));
        if (valueRef.current) valueRef.current.textContent = `${String(progress).padStart(3, "0")}%`;
        progressRef.current?.setAttribute("aria-valuenow", String(progress));
        progressRef.current?.style.setProperty("--calendar-progress", `${progress}%`);
      },
    }), []);

    return (
      <aside className="calendar-loading-hud" aria-label="Progreso de carga del calendario">
        <div className="calendar-loading-hud__heading">
          <span className="calendar-loading-hud__caption">CAMBIANDO DE DÍA</span>
        </div>
        <div className="calendar-loading-hud__readout">
          <div className="calendar-loading-hud__meter" role="progressbar" aria-label="Carga del calendario" aria-valuemin={0} aria-valuemax={100} aria-valuenow={0} ref={progressRef}>
            <span className="calendar-loading-hud__fill" aria-hidden="true" />
          </div>
          <span className="calendar-loading-hud__percent" ref={valueRef} aria-hidden="true">000%</span>
        </div>
        <div className="calendar-loading-hud__footer">
          <span>ABRIENDO PORTFOLIO</span>
          <span>INICIALIZANDO SISTEMA</span>
        </div>
      </aside>
    );
  },
);

CalendarLoadingHud.displayName = "CalendarLoadingHud";
