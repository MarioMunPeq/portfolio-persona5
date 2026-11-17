import { EDUCATION_DOCS } from "../data";
import { ArcanaRail } from "./ArcanaRail";
import "./stack.css";

export default function PlateStack({ selectedIndex, onSelect }: { selectedIndex: number; onSelect: (index: number) => void }) {
  return <ArcanaRail documents={EDUCATION_DOCS} selectedIndex={selectedIndex} onSelect={onSelect} />;
}
