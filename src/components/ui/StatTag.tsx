interface StatTagProps {
  label: string;
  rank: number;
  descriptor?: string;
  className?: string;
}

export function StatTag({
  label,
  rank,
  descriptor,
  className = "",
}: StatTagProps) {
  return (
    <div className={`profile-stat ${className}`}>
      <div className="profile-stat__plate">
        <span className="profile-stat__rank">{rank}</span>
        <span className="profile-stat__label">{label}</span>
      </div>
      {descriptor && (
        <span className="profile-stat__descriptor">{descriptor}</span>
      )}
    </div>
  );
}
