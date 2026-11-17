import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { gsap } from "gsap";
import { routePaths, skillLines, skillStations, type SkillLineId, type SkillStation } from "../../config/skillMap";
import "./skills-metro.css";

type LabelSide = "left" | "right" | "top" | "bottom" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
type LabelPlacement = { side: LabelSide; gap: number };
type Box = { left: number; top: number; right: number; bottom: number };

const BADGE_POINT: Partial<Record<SkillLineId, { start: {x:number;y:number}; end: {x:number;y:number} }>> = {
  java: { start:{x:152,y:174}, end:{x:752,y:352} },
  kotlin: { start:{x:146,y:584}, end:{x:582,y:356} },
  python: { start:{x:153,y:735}, end:{x:784,y:448} },
  csharp: { start:{x:900,y:368}, end:{x:1290,y:340} },
  sql: { start:{x:837,y:474}, end:{x:653,y:466} },
  web: { start:{x:906,y:292}, end:{x:1360,y:226} },
  service: { start:{x:900,y:474}, end:{x:1491,y:606} },
};

function svgIcon(icon: SkillStation["icon"]) {
  const [width, height, , , path] = icon.icon;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true" focusable="false">
      {Array.isArray(path) ? path.map((d) => <path key={d} d={d} />) : <path d={path} />}
    </svg>
  );
}

function intersects(a: Box, b: Box, gap = 0) {
  return a.left < b.right + gap && a.right + gap > b.left && a.top < b.bottom + gap && a.bottom + gap > b.top;
}

function rectSegmentDistance(box: Box, a: {x:number;y:number}, b: {x:number;y:number}) {
  let closest = Infinity;
  for (let i=0;i<=16;i++) {
    const t=i/16;
    const x=a.x+(b.x-a.x)*t;
    const y=a.y+(b.y-a.y)*t;
    const dx=Math.max(box.left-x,0,x-box.right);
    const dy=Math.max(box.top-y,0,y-box.bottom);
    closest=Math.min(closest,Math.hypot(dx,dy));
  }
  return closest;
}

/** Place each label by testing eight directions against routes, nodes and labels already placed. */
function solveLabelSides(stage: HTMLDivElement, labels: NodeListOf<HTMLElement>): Record<string, LabelPlacement> {
  const stageRect=stage.getBoundingClientRect();
  const sx=stageRect.width/1800;
  const sy=stageRect.height/920;
  const svg=stage.querySelector<SVGSVGElement>(".metro-map__svg");
  const matrix=svg?.getScreenCTM();
  const routes=svg&&matrix?[...svg.querySelectorAll<SVGPathElement>(".metro-route__ink")].flatMap((path)=>{
    const total=path.getTotalLength();
    const points=Array.from({length:129},(_,index)=>path.getPointAtLength(total*index/128)).map((point)=>{
      const screen=point.matrixTransform(matrix);
      return {x:screen.x-stageRect.left,y:screen.y-stageRect.top};
    });
    return points.slice(1).map((b,index)=>({a:points[index],b}));
  }):[];
  const stations=[...stage.querySelectorAll<HTMLElement>(".metro-station")].map((element)=>{
    const rect=element.getBoundingClientRect();
    return {id:element.dataset.station??"",x:(rect.left+rect.width/2)-stageRect.left,y:(rect.top+rect.height/2)-stageRect.top,width:rect.width,height:rect.height};
  });
  const badges=skillLines.flatMap((line)=>["start","end"].flatMap((endpoint)=>{
    const point=BADGE_POINT[line.id]?.[endpoint as "start"|"end"];
    if(!point)return [];
    const width=(line.badge.length>2?56:line.badge.length===2?44:34)*sx;
    return [{left:(point.x+80)*sx-width/2,top:(point.y+80)*sy-14*sy,right:(point.x+80)*sx+width/2,bottom:(point.y+80)*sy+14*sy}];
  }));
  const sides: LabelSide[]=["right","left","top","bottom","top-right","top-left","bottom-right","bottom-left"];
  const placed: Box[]=[];
  const result: Record<string,LabelPlacement>={};
  const ordered=[...labels].sort((a,b)=>(b.textContent?.length??0)-(a.textContent?.length??0));
  for(const label of ordered){
    const id=label.dataset.station ?? "";
    const station=stations.find((item)=>item.id===id);
    if(!station)continue;
    const rect=label.getBoundingClientRect();
    const width=Math.max(rect.width,40);
    const height=Math.max(rect.height,22);
    const baseGap=Number.parseFloat(getComputedStyle(stage).getPropertyValue("--label-gap"))||12;
    const gap=id==="driving-license"?Math.max(baseGap,window.innerHeight*.07):id==="unity-godot"?Math.max(baseGap,window.innerHeight*.14):id==="firebase"?Math.max(baseGap,window.innerHeight*.08):baseGap;
    let best=sides[0];
    let bestGap=gap;
    let bestBox:Box={left:0,top:0,right:0,bottom:0};
    let bestScore=Infinity;
    const preferred: Partial<Record<string,LabelSide[]>>={sql:["left"],"unity-godot":["top-right"],firebase:["top-left"]};
    const availableSides=preferred[id]??sides;
    for(let ring=0;ring<5;ring++)for(const side of availableSides){
      const offset=gap+ring*Math.max(18,height*.55);
      const box:Box=side==="right"?{left:station.x+offset,top:station.y-height/2,right:station.x+offset+width,bottom:station.y+height/2}
        :side==="left"?{left:station.x-offset-width,top:station.y-height/2,right:station.x-offset,bottom:station.y+height/2}
        :side==="top"?{left:station.x-width/2,top:station.y-offset-height,right:station.x+width/2,bottom:station.y-offset}
        :side==="bottom"?{left:station.x-width/2,top:station.y+offset,right:station.x+width/2,bottom:station.y+offset+height}
        :side==="top-left"?{left:station.x-offset-width,top:station.y-offset-height,right:station.x-offset,bottom:station.y-offset}
        :side==="top-right"?{left:station.x+offset,top:station.y-offset-height,right:station.x+offset+width,bottom:station.y-offset}
        :side==="bottom-left"?{left:station.x-offset-width,top:station.y+offset,right:station.x-offset,bottom:station.y+offset+height}
        :{left:station.x+offset,top:station.y+offset,right:station.x+offset+width,bottom:station.y+offset+height};
      let score=ring*40;
      const safe=28;
      if(box.left<safe)score+=(safe-box.left)*100000;
      if(box.top<safe)score+=(safe-box.top)*100000;
      if(box.right>stageRect.width-safe)score+=(box.right-stageRect.width+safe)*100000;
      if(box.bottom>stageRect.height-safe)score+=(box.bottom-stageRect.height+safe)*100000;
      for(const prior of placed)if(intersects(box,prior,10))score+=1000000000;
      for(const badge of badges)if(intersects(box,badge,5))score+=2600;
      for(const node of stations){
        if(node.id===id)continue;
        if(intersects(box,{left:node.x-node.width/2,top:node.y-node.height/2,right:node.x+node.width/2,bottom:node.y+node.height/2},7))score+=100000000;
      }
      for(const route of routes){
        const distance=rectSegmentDistance(box,route.a,route.b);
        if(distance<28)score+=(28-distance)*3000;
      }
      if(score<bestScore){best=side;bestGap=offset;bestBox=box;bestScore=score;}
    }
    placed.push(bestBox);
    result[id]={side:best,gap:bestGap};
  }
  return result;
}

function Badge({lineId, endpoint}:{lineId:SkillLineId;endpoint:"start"|"end"}){
  const line=skillLines.find((item)=>item.id===lineId)!;
  const point=BADGE_POINT[lineId]?.[endpoint];
  const halfWidth=line.badge.length>2?28:line.badge.length===2?22:17;
  if(!point)return null;
  return <g className={`metro-line-badge metro-line-badge--${lineId}`} style={{"--line-color":line.color} as CSSProperties} transform={`translate(${point.x} ${point.y})`} aria-hidden="true">
    <path d={`M-${halfWidth} -12 L${halfWidth} -12 L${halfWidth-4} 12 L-${halfWidth+4} 12 Z`} />
    <text textAnchor="middle" dominantBaseline="central">{line.badge}</text>
  </g>;
}

function MetroArtwork({selectedId,svgRef,vanRef}:{selectedId:string;svgRef:React.RefObject<SVGSVGElement|null>;vanRef:React.RefObject<SVGGElement|null>}){
  return <svg ref={svgRef} className="metro-map__svg" viewBox="-80 -80 1800 920" role="img" aria-labelledby="metro-svg-title metro-svg-desc" preserveAspectRatio="none">
    <title id="metro-svg-title">Mapa de habilidades de Mementos</title>
    <desc id="metro-svg-desc">Siete líneas de programación conectan diecinueve estaciones. Git y GitHub es el cruce principal.</desc>
    <defs><pattern id="metro-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="rgba(245,245,240,.075)" strokeWidth="1" /></pattern></defs>
    <rect x="-80" y="-80" width="1800" height="920" fill="url(#metro-grid)" />
    {skillLines.map((line)=><g key={line.id} className={`metro-route metro-route--${line.id}`} style={{"--line-color":line.color} as CSSProperties} data-line={line.id} data-line-color={line.color}>
      <path className="metro-route__outline" d={routePaths[line.id]} />
      <path className="metro-route__edge" d={routePaths[line.id]} />
      <path className="metro-route__ink" d={routePaths[line.id]} />
      <path className="metro-route__stop-edge" d={routePaths[line.id]} />
      <path className="metro-route__stops" d={routePaths[line.id]} />
      <Badge lineId={line.id} endpoint="start"/><Badge lineId={line.id} endpoint="end"/>
    </g>)}
    {skillStations.map((station)=>{
      const crossover=station.lines.length>1;
      const hub=station.id==="git-github";
      return <g key={station.id} className={`metro-node metro-node--${station.id}${crossover?" is-crossover":""}${hub?" is-hub":""}${station.id===selectedId?" is-selected":""}`} transform={`translate(${station.point.x} ${station.point.y})`}>
        <circle className="metro-node__halo" r={hub?33:crossover?28:20}/>
        {crossover&&<circle className="metro-node__ring" r={hub?28:22}/>}
        <circle className="metro-node__shape" r={hub?18:crossover?13:9}/>
        <circle className="metro-node__core" r={hub?7:5}/>
      </g>;
    })}
    <g ref={vanRef} className="morgana-van" transform="translate(1630 700) scale(1.15)" aria-hidden="true" data-morgana-van>
      <ellipse className="morgana-van__shadow" cx="0" cy="22" rx="62" ry="10" />
      <path className="morgana-van__speed" d="M-72-10h-20m23 8h-28m26 8h-17" />
      <g className="morgana-van__body">
        <path className="morgana-van__shell" d="M-54 9v-30q0-8 9-8h13l13-19q4-6 12-6h38q9 0 13 8l9 17 12 6q6 3 6 10v22q0 7-7 7h-111q-7 0-7-7Z" />
        <path className="morgana-van__window" d="M-17-49h25v25h-42l13-20q1-5 4-5Zm32 0h17q6 0 9 6l8 19H15Z" />
        <path className="morgana-van__stripe" d="M-50-5H55v10H-50Z" />
        <path className="morgana-van__ear" d="m-35-51-8-25 24 18Zm55-7 20-21-4 28Z" />
        <circle className="morgana-van__eye" cx="40" cy="-12" r="7"/><circle className="morgana-van__eye" cx="56" cy="-12" r="7"/>
        <path className="morgana-van__whisker" d="m49-6 15 1m-15 4 16 6m-18-11-16 1" />
        <image className="morgana-van__sprite" href={`${import.meta.env.BASE_URL}images/map/morgana.webp`} x="-24" y="-53" width="31" height="40" preserveAspectRatio="xMidYMid meet" />
        <g className="morgana-van__wheels"><circle cx="-31" cy="11" r="11"/><circle cx="39" cy="11" r="11"/><circle className="morgana-van__hub" cx="-31" cy="11" r="4"/><circle className="morgana-van__hub" cx="39" cy="11" r="4"/></g>
      </g>
    </g>
  </svg>;
}

function LineLegend({active,onSelect}:{active:SkillLineId|null;onSelect?:(id:SkillLineId)=>void}){
  return <div className="metro-legend" role="group" aria-label="Líneas del mapa">
    {skillLines.map((line)=><button key={line.id} type="button" className={`metro-legend__item metro-legend__item--${line.id}${active===line.id?" is-active":""}`} style={{"--line-color":line.color} as CSSProperties} data-line-color={line.color} onClick={()=>onSelect?.(line.id)} aria-pressed={active===line.id}>
      <span className="metro-legend__mark" style={{"--line-color":line.color} as CSSProperties} data-line-color={line.color} aria-hidden="true"><span>{line.badge}</span></span>
      <span>{line.name}</span>
    </button>)}
  </div>;
}

function StationButton({station,onSelect,onHover,selectedId,pinnedId}:{station:SkillStation;onSelect:(id:string)=>void;onHover:(id:string)=>void;selectedId:string;pinnedId:string|null}){
  const lines=station.lines.map((id)=>skillLines.find((line)=>line.id===id)?.name);
  const aria=station.lines.length>1?`${station.name}, cruce de las líneas ${lines.join(" y ")}`:`${station.name}, línea ${lines[0]}`;
  const move=(event:React.KeyboardEvent<HTMLButtonElement>)=>{
    const currentLine=station.lines[0];
    let nextId:string|undefined;
    if(event.key==="ArrowLeft"||event.key==="ArrowRight"){
      const ordered=MOBILE_LINE_STATIONS[currentLine];
      const index=ordered.indexOf(station.id);
      nextId=ordered[(index+(event.key==="ArrowRight"?1:-1)+ordered.length)%ordered.length];
    }else if((event.key==="ArrowUp"||event.key==="ArrowDown")&&station.lines.length>1){
      const lineIndex=station.lines.indexOf(currentLine);
      const offset=event.key==="ArrowDown"?1:-1;
      const line=station.lines[(lineIndex+offset+station.lines.length)%station.lines.length];
      nextId=MOBILE_LINE_STATIONS[line].find((id)=>id!==station.id);
    }else return;
    event.preventDefault();
    if(nextId){onSelect(nextId);requestAnimationFrame(()=>document.querySelector<HTMLButtonElement>(`.metro-station[data-station="${nextId}"]`)?.focus());}
  };
  return <button type="button" className={`metro-station${station.lines.length>1?" is-crossover":""}${station.id==="git-github"?" is-hub":""}${station.id===selectedId?" is-selected":""}`} data-station={station.id} aria-label={aria} aria-pressed={station.id===pinnedId} style={{left:`${(station.point.x+80)/18}%`,top:`${(station.point.y+80)/9.2}%`} as CSSProperties} onPointerEnter={(event)=>{if(event.pointerType==="mouse")onHover(station.id);}} onFocus={()=>onHover(station.id)} onClick={()=>onSelect(station.id)} onKeyDown={move}>
    <span className="metro-station__icon">{svgIcon(station.icon)}</span><span className="sr-only">{station.name}</span>
  </button>;
}

const MOBILE_LINE_STATIONS: Record<SkillLineId, string[]> = {
  java: ["java", "liferay", "android-studio", "git-github"],
  kotlin: ["kotlin", "firebase", "android-studio"],
  python: ["python", "scikit-learn", "pytorch", "pandas", "odoo", "git-github"],
  sql: ["odoo", "sql"],
  csharp: ["git-github", "unity-godot", "csharp"],
  web: ["git-github", "figma", "html-css"],
  service: ["git-github", "power-platform", "office", "driving-license"],
};

const LINE_STATION_ORDER: Record<SkillLineId, string[]> = {
  java: ["java", "liferay", "android-studio", "git-github"],
  kotlin: ["kotlin", "firebase", "android-studio"],
  python: ["python", "scikit-learn", "pytorch", "pandas", "odoo", "git-github"],
  sql: ["odoo", "sql"],
  csharp: ["git-github", "unity-godot", "csharp"],
  web: ["git-github", "figma", "html-css"],
  service: ["git-github", "power-platform", "office", "driving-license"],
};

function trackRoute(svg:SVGSVGElement,start:{x:number;y:number},target:SkillStation):DOMPoint[]{
  const graph=new Map<string,{to:string;line:SkillLineId}[]>();
  for(const [line,stations] of Object.entries(LINE_STATION_ORDER) as [SkillLineId,string[]][]){
    stations.slice(1).forEach((to,index)=>{
      const from=stations[index];
      graph.set(from,[...(graph.get(from)??[]),{to,line}]);
      graph.set(to,[...(graph.get(to)??[]),{to:from,line}]);
    });
  }
  const nearest=skillStations.reduce((best,station)=>Math.hypot(station.point.x-start.x,station.point.y-start.y)<Math.hypot(best.point.x-start.x,best.point.y-start.y)?station:best,skillStations[0]);
  const previous=new Map<string,{from:string;line:SkillLineId}>();
  const queue=[nearest.id];
  const seen=new Set(queue);
  while(queue.length){
    const id=queue.shift()!;
    if(id===target.id)break;
    for(const edge of graph.get(id)??[]){if(!seen.has(edge.to)){seen.add(edge.to);previous.set(edge.to,{from:id,line:edge.line});queue.push(edge.to);}}
  }
  const steps:{from:string;to:string;line:SkillLineId}[]=[];
  let cursor=target.id;
  while(cursor!==nearest.id){const step=previous.get(cursor);if(!step)break;steps.unshift({from:step.from,to:cursor,line:step.line});cursor=step.from;}
  const result:DOMPoint[]=[new DOMPoint(start.x,start.y)];
  for(const step of steps){
    const path=svg.querySelector<SVGPathElement>(`.metro-route--${step.line} .metro-route__ink`);
    const from=skillStations.find((item)=>item.id===step.from)?.point;
    const to=skillStations.find((item)=>item.id===step.to)?.point;
    if(!path||!from||!to)continue;
    const count=Math.ceil(path.getTotalLength()/10);
    const points=Array.from({length:count+1},(_,index)=>path.getPointAtLength(path.getTotalLength()*index/count));
    const nearestIndex=(point:{x:number;y:number})=>points.reduce((best,p,index)=>Math.hypot(p.x-point.x,p.y-point.y)<Math.hypot(points[best].x-point.x,points[best].y-point.y)?index:best,0);
    const fromIndex=nearestIndex(from),toIndex=nearestIndex(to);
    const segment=points.slice(Math.min(fromIndex,toIndex),Math.max(fromIndex,toIndex)+1);
    if(fromIndex>toIndex)segment.reverse();
    result.push(...segment);
  }
  if(result.length===1)result.push(new DOMPoint(target.point.x,target.point.y));
  return result;
}

function parkingPoint(svg:SVGSVGElement,van:SVGGElement,station:SkillStation):{x:number;y:number}{
  const stage=svg.closest<HTMLElement>(".metro-map");
  const body=van.querySelector<SVGGElement>(".morgana-van__body");
  if(!stage||!body)return station.point;
  const bounds=stage.getBoundingClientRect();
  const scaleX=bounds.width/1800,scaleY=bounds.height/920,box=body.getBBox();
  const labels=[...stage.querySelectorAll<HTMLElement>(".metro-label")].map((element)=>element.getBoundingClientRect());
  const fixed=[...document.querySelectorAll<HTMLElement>(".p5-bb-player-wrapper,.p5-bb-clock,.p5-bb-social > a,[aria-label='Volver al menu principal'],.calendar-anchor")].map((element)=>element.getBoundingClientRect());
  const offsets=station.id==="driving-license"?[[250,50]]:[[200,0],[-200,0],[0,160],[0,-160],[160,120],[-160,120],[160,-120],[-160,-120],[200,-80],[-200,-80],[0,0]];
  let best={x:station.point.x,y:station.point.y},bestScore=Infinity;
  for(const [dx,dy] of offsets){
    const x=Math.max(100,Math.min(1610,station.point.x+dx)),y=Math.max(100,Math.min(700,station.point.y+dy));
    const left=bounds.left+(x+80+box.x*1.15)*scaleX;
    const right=bounds.left+(x+80+(box.x+box.width)*1.15)*scaleX;
    const top=bounds.top+(y+80+box.y*1.15)*scaleY;
    const bottom=bounds.top+(y+80+(box.y+box.height)*1.15)*scaleY;
    const outside=left<bounds.left+2||right>bounds.right-2||top<bounds.top+2||bottom>bounds.bottom-2;
    const collides=(rect:DOMRect)=>left<rect.right&&right>rect.left&&top<rect.bottom&&bottom>rect.top;
    const hits=labels.filter(collides).length+fixed.filter(collides).length;
    const score=(outside?1000000:0)+hits*1000000+Math.hypot(dx,dy);
    if(score<bestScore){best={x,y};bestScore=score;}
  }
  return best;
}

function MobileMap({onSelect}:{onSelect:(id:string)=>void}){
  return <div className="metro-mobile-map" aria-label="Líneas y estaciones de habilidades">
    {skillLines.map((line)=>{
      const ids=MOBILE_LINE_STATIONS[line.id];
      const lineStations=ids.map((id)=>skillStations.find((station)=>station.id===id)).filter((station):station is SkillStation=>Boolean(station));
      return <section className={`metro-mobile-line metro-mobile-line--${line.id}`} style={{"--mobile-line":line.color} as CSSProperties} key={line.id} aria-labelledby={`mobile-line-${line.id}`}>
        <h3 id={`mobile-line-${line.id}`}><span>{line.badge}</span>{line.name}<small>{lineStations.length} ESTACIONES</small></h3>
        <ol>{lineStations.map((station)=>{
          const cross=station.lines.length>1;
          return <li key={`${line.id}-${station.id}`}><button type="button" className="metro-mobile-station" data-station={station.id} onClick={()=>onSelect(station.id)} aria-label={`${station.name}, línea ${line.name}${cross?`, cruce con ${station.lines.filter((id)=>id!==line.id).map((id)=>skillLines.find((item)=>item.id===id)?.name).join(", ")}`:""}`}>
            <span className="metro-mobile-station__node" aria-hidden="true"/>
            <span className="metro-mobile-station__name">{station.name}</span>
            {cross&&<span className="metro-mobile-station__cross">{station.lines.filter((id)=>id!==line.id).map((id)=>skillLines.find((item)=>item.id===id)?.badge).join(" · ")}</span>}
            <span className="metro-mobile-station__icon">{svgIcon(station.icon)}</span>
          </button></li>;
        })}</ol>
      </section>;
    })}
  </div>;
}

function ProjectThumbnail({src}:{src:string|null}){
  const [failed,setFailed]=useState(!src);
  return <span className={`metro-project__thumb${failed?" is-fallback":""}`} aria-hidden="true">
    {src&&!failed?<img src={src} alt="" loading="lazy" onError={()=>setFailed(true)}/>:<i>↗</i>}
  </span>;
}

function DetailPanel({station}:{station:SkillStation}){
  const title=station.name==="Git/GitHub"?"GITHUB":station.name==="HTML/CSS"?"HTML·CSS":station.name==="Unity/Godot"?"UNITY·GODOT":station.name.toUpperCase();
  return <aside className="metro-detail" aria-label={`Detalle de ${station.name}`} data-detail-station={station.id}>
    <div className="metro-detail__eyebrow"><span><i/>DOSSIER DE ESTACIÓN</span><b>#{String(skillStations.indexOf(station)+1).padStart(2,"0")}</b></div>
    <header className="metro-detail__title">
      <span className="metro-detail__icon">{svgIcon(station.icon)}</span>
      <h3 data-panel-name={station.id}>{title}</h3>
    </header>
    <div className="metro-detail__lines" aria-label="Líneas conectadas">
      {station.lines.map((id)=>{const line=skillLines.find((item)=>item.id===id)!;return <span key={id} className={`metro-detail__line metro-detail__line--${id}`} style={{"--detail-line":line.color} as CSSProperties} data-line-color={line.color}><b>{line.badge}</b>{line.name}</span>;})}
    </div>
    <section className="metro-detail__projects" aria-labelledby="metro-projects-heading">
      <div className="metro-detail__section-title"><h4 id="metro-projects-heading">Proyectos</h4><span>{String(station.projects.length).padStart(2,"0")} VÍNCULOS</span></div>
      {station.projects.length?<ul>{station.projects.map((project,index)=><li key={project.slug}>
        <a href={`/proyectos/${project.slug}`} className="metro-project" aria-label={`Abrir proyecto ${project.name}`}>
          <ProjectThumbnail src={project.image}/>
          <span className="metro-project__number">{String(index+1).padStart(2,"0")}</span>
          <span className="metro-project__copy"><span className="metro-project__name">{project.name}</span><span className="metro-project__summary">{project.summary}</span></span>
          <span className="metro-project__arrow" aria-hidden="true">↗</span>
        </a>
      </li>)}</ul>:<p className="metro-detail__empty">No hay proyectos asociados a esta estación.</p>}
    </section>
    {station.level&&<p className="metro-detail__level">NIVEL <b>{station.level}</b></p>}
    <span className="metro-detail__corner metro-detail__corner--tl" aria-hidden="true"/><span className="metro-detail__corner metro-detail__corner--br" aria-hidden="true"/>
  </aside>;
}

export function SkillsMetroMap(){
  const sectionRef=useRef<HTMLElement>(null);
  const headingRef=useRef<HTMLHeadingElement>(null);
  const stageRef=useRef<HTMLDivElement>(null);
  const svgRef=useRef<SVGSVGElement>(null);
  const vanRef=useRef<SVGGElement>(null);
  const previousStation=useRef("git-github");
  const [labelSides,setLabelSides]=useState<Record<string,LabelPlacement>>({});
  const [activeLine,setActiveLine]=useState<SkillLineId|null>(null);
  const [pinnedId,setPinnedId]=useState<string|null>(null);
  const [hoveredId,setHoveredId]=useState<string|null>(null);
  const [mobileOpen,setMobileOpen]=useState(false);
  const hoverTimer=useRef<number|null>(null);
  const introTimeline=useRef<gsap.core.Timeline|null>(null);
  const selectedId=pinnedId??hoveredId??"git-github";
  const selected=skillStations.find((station)=>station.id===selectedId)??skillStations[0];

  useEffect(()=>()=>{if(hoverTimer.current!==null)window.clearTimeout(hoverTimer.current);},[]);

  const queueHover=(id:string)=>{
    if(hoverTimer.current!==null)window.clearTimeout(hoverTimer.current);
    hoverTimer.current=window.setTimeout(()=>setHoveredId(id),60);
  };

  const pinStation=(id:string)=>{setPinnedId(id);setHoveredId(null);};

  useLayoutEffect(()=>{
    const section=sectionRef.current;
    if(!section)return;
    const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let played=false;
    const observer=new IntersectionObserver((entries)=>{
      if(played||!entries.some((entry)=>entry.isIntersecting))return;
      played=true;
      const routes=section.querySelectorAll<SVGPathElement>(".metro-route__ink");
      const nodes=section.querySelectorAll<HTMLElement>(".metro-station");
      const detail=section.querySelector(".metro-detail");
      const van=vanRef.current;
      if(reduced){gsap.to(detail,{opacity:1,duration:0.15});observer.disconnect();return;}
      routes.forEach((route)=>{const length=route.getTotalLength();gsap.set(route,{strokeDasharray:length,strokeDashoffset:length});});
      gsap.set(nodes,{scale:0.65,opacity:0,transformOrigin:"center"});
      const timeline=gsap.timeline({onComplete:()=>{
        gsap.set(routes,{clearProps:"strokeDasharray,strokeDashoffset"});
        gsap.set(nodes,{clearProps:"transform,opacity"});
      }});
      introTimeline.current=timeline;
      timeline.to(routes,{strokeDashoffset:0,duration:0.28,stagger:0.1,ease:"power1.inOut"})
        .to(nodes,{scale:1,opacity:1,duration:0.2,stagger:0.02,ease:"back.out(1.8)"},"-=0.08")
        .fromTo(detail,{clipPath:"polygon(0 0,0 0,0 100%,0 100%)"},{clipPath:"polygon(0 0,100% 0,100% 100%,0 100%)",duration:0.28},"-=0.16");
      if(van)timeline.fromTo(van,{attr:{transform:"translate(1410 700) scale(1.15)"}},{attr:{transform:"translate(1630 700) scale(1.15)"},duration:0.4,ease:"power2.inOut"},"-=0.28");
      observer.disconnect();
    },{threshold:0.12});
    observer.observe(section);
    return()=>{observer.disconnect();introTimeline.current?.kill();};
  },[]);

  const selectStation=(id:string)=>{introTimeline.current?.progress(1);pinStation(id);};
  const selectMobileStation=(id:string)=>{selectStation(id);setMobileOpen(true);};

  useEffect(()=>{
    if(!mobileOpen)return;
    const close=(event:KeyboardEvent)=>{if(event.key==="Escape")setMobileOpen(false);};
    window.addEventListener("keydown",close);
    return()=>window.removeEventListener("keydown",close);
  },[mobileOpen]);

  useEffect(()=>{
    const svg=svgRef.current;
    const van=vanRef.current;
    if(!svg||!van||previousStation.current===selectedId)return;
    const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const destination=skillStations.find((station)=>station.id===selectedId);
    if(!destination)return;
    const selectedSticker=sectionRef.current?.querySelector<HTMLElement>(`.metro-station[data-station="${selectedId}"]`);
    if(selectedSticker&&!reduced)gsap.fromTo(selectedSticker,{scale:1.28},{scale:1.12,duration:0.42,ease:"elastic.out(1,.48)"});
    const current=van.getAttribute("transform")?.match(/translate\(([-\d.]+)[ ,]+([-\d.]+)\)/);
    const start={x:Number(current?.[1]??1630),y:Number(current?.[2]??700)};
    const target=parkingPoint(svg,van,destination);
    const points=trackRoute(svg,start,destination);
    if(target.x!==destination.point.x||target.y!==destination.point.y)points.push(new DOMPoint(target.x,target.y));
    const pathLength=points.slice(1).reduce((sum,p,index)=>sum+Math.hypot(p.x-points[index].x,p.y-points[index].y),0);
    const progress={value:0};
    const wheels=van.querySelector<SVGGElement>(".morgana-van__wheels");
    const speed=van.querySelector<SVGPathElement>(".morgana-van__speed");
    previousStation.current=selectedId;
    if(!reduced&&wheels)gsap.to(wheels,{rotation:360,transformOrigin:"center center",duration:0.3,ease:"none",repeat:-1});
    if(!reduced&&speed)gsap.to(speed,{opacity:0.8,duration:0.12,repeat:1,yoyo:true});
    const vanTween=gsap.to(progress,{value:1,duration:reduced?0.15:Math.min(1.4,Math.max(0.6,pathLength/1500*1.4)),ease:reduced?"none":"power2.inOut",onUpdate:()=>{
      const distance=pathLength*progress.value;
      let walked=0,point=points[0],next=points[1];
      for(let i=1;i<points.length;i++){
        const segment=Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y);
        if(walked+segment>=distance){const t=segment?(distance-walked)/segment:0;point=new DOMPoint(points[i-1].x+(points[i].x-points[i-1].x)*t,points[i-1].y+(points[i].y-points[i-1].y)*t);next=points[i];break;}
        walked+=segment;
      }
      const angle=Math.atan2(next.y-point.y,next.x-point.x)*180/Math.PI;
      van.setAttribute("transform",`translate(${point.x} ${point.y}) scale(1.15) rotate(${Math.max(-14,Math.min(14,angle))}) scale(${next.x<point.x?-1:1} 1)`);
    },onComplete:()=>{
      van.setAttribute("transform",`translate(${target.x} ${target.y}) scale(1.15)`);
      if(wheels)gsap.killTweensOf(wheels);
      if(speed)gsap.to(speed,{opacity:0,duration:0.12});
      gsap.fromTo(van.querySelector(".morgana-van__body"),{scale:1.08,transformOrigin:"center center"},{scale:1,duration:0.2,ease:"back.out(2)"});
    }});
    return()=>{vanTween.kill();if(wheels)gsap.killTweensOf(wheels);if(speed)gsap.killTweensOf(speed);};
  },[selectedId]);

  useLayoutEffect(()=>{
    const stage=stageRef.current;
    if(!stage)return;
    const solve=()=>setLabelSides(solveLabelSides(stage,stage.querySelectorAll<HTMLElement>(".metro-label")));
    solve();
    let cancelled=false;
    document.fonts.ready.then(()=>{if(!cancelled)solve();});
    const observer=new ResizeObserver(solve);
    observer.observe(stage);
    window.addEventListener("resize",solve,{passive:true});
    return()=>{cancelled=true;observer.disconnect();window.removeEventListener("resize",solve);};
  },[]);

  const selectLine=(id:SkillLineId)=>setActiveLine((current)=>current===id?null:id);

  return <section ref={sectionRef} className="skills-metro" aria-labelledby="skills-metro-title" data-map-section>
    <span className="skills-metro__ghost" data-decor aria-hidden="true">MEMENTOS</span>
    <div className="skills-metro__heading">
      <span className="skills-metro__heading-mark" aria-hidden="true">✦</span>
      <div>
        <h2 ref={headingRef} id="skills-metro-title">Habilidades</h2>
        <p>La red de tecnologías y herramientas de Mario.</p>
      </div>
      <span className="skills-metro__station-count"><b>07</b> LÍNEAS <i /> <b>19</b> ESTACIONES</span>
    </div>
    <div className="skills-metro__workspace">
    <div className="skills-metro__map-column">
    <LineLegend active={activeLine} onSelect={selectLine}/>
    <div className="metro-map" ref={stageRef} data-active-line={activeLine??"all"}>
      <div className="metro-map__art"><MetroArtwork selectedId={selectedId} svgRef={svgRef} vanRef={vanRef}/></div>
      <div className="metro-map__labels">
        {skillStations.map((station)=>{
          const placement=labelSides[station.id];
          const side=placement?.side??"right";
          const index=skillStations.indexOf(station);
          const aria=station.lines.length>1?`${station.name}, cruce de las líneas ${station.lines.map((id)=>skillLines.find((line)=>line.id===id)?.name).join(" y ")}`:`${station.name}, línea ${skillLines.find((line)=>line.id===station.lines[0])?.name}`;
          return <div key={station.id} className={`metro-label metro-label--${side}${station.id===selectedId?" is-selected":""}`} data-station={station.id} style={{left:`${(station.point.x+80)/18}%`,top:`${(station.point.y+80)/9.2}%`,"--label-tilt":index%2===0?"-2deg":"1.5deg","--label-gap":placement?`${placement.gap}px`:station.id==="driving-license"?"7vh":undefined} as CSSProperties}>
            <span>{station.name}</span><small>{station.lines.map((id)=>skillLines.find((line)=>line.id===id)?.badge).join(" · ")}</small>
            <span className="sr-only">{aria}</span>
          </div>;
        })}
      </div>
      <div className="metro-map__nodes">
        {skillStations.map((station)=><StationButton key={station.id} station={station} onSelect={selectStation} onHover={queueHover} selectedId={selectedId} pinnedId={pinnedId}/>) }
      </div>
    </div>
    </div>
    <div className="metro-map__desktop-detail"><DetailPanel station={selected}/></div>
    </div>
    <MobileMap onSelect={selectMobileStation}/>
    {mobileOpen&&<div className="metro-mobile-sheet" role="dialog" aria-modal="true" aria-label={`Detalle de ${selected.name}`}>
      <button type="button" className="metro-mobile-sheet__close" onClick={()=>setMobileOpen(false)} aria-label="Cerrar detalle">×</button>
      <DetailPanel station={selected}/>
    </div>}
    <div className="skills-metro__footer"><span><i /> MEMENTOS // REGISTRO DE HABILIDADES</span><span>◄ SELECCIONA UNA LÍNEA PARA FILTRAR ►</span></div>
    <div className="sr-only" aria-live="polite" aria-atomic="true">{selected.name}. {selected.lines.map((id)=>skillLines.find((line)=>line.id===id)?.name).join(", ")}. {activeLine?`Línea ${skillLines.find((line)=>line.id===activeLine)?.name} resaltada`:"Todas las líneas visibles"}</div>
    <div className="sr-only">{skillStations.map((station)=><span key={station.id}>{station.name}: {station.lines.join(", ")}</span>)}</div>
  </section>;
}
