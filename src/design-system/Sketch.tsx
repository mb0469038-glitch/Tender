export function Sketch({ path, label }: { path: string; label: string }) {
  if (path.startsWith("data:image/") || path.startsWith("/materials/")) {
    return <img className="sketch material-photo" src={path} alt={`${label} photo`} />;
  }
  if (label.toLowerCase().includes("tilt and turn")) {
    return (
      <svg className="sketch" viewBox="0 0 100 100" role="img" aria-label={`${label} technical drawing`}>
        <rect width="100" height="100" fill="#f4f8f8" />
        <path d="M0 25h100M0 50h100M0 75h100M25 0v100M50 0v100M75 0v100" stroke="#dbe7e7" strokeWidth=".55" />
        <rect x="14" y="12" width="72" height="76" fill="#eff6f5" stroke="#176c68" strokeWidth="2.8" />
        <rect x="20" y="18" width="60" height="64" fill="none" stroke="#53817e" strokeWidth="1.7" />
        <path d="M20 18L80 51M20 82L50 18L80 82M20 82L80 51" fill="none" stroke="#6b7f7e" strokeWidth="2.2" strokeDasharray="8 6" />
      </svg>
    );
  }
  return (
    <svg
      className="sketch"
      viewBox="0 0 100 100"
      role="img"
      aria-label={`${label} drawing`}
    >
      <rect width="100" height="100" fill="#f4f8f8" />
      <path
        d="M0 25h100M0 50h100M0 75h100M25 0v100M50 0v100M75 0v100"
        stroke="#dbe7e7"
        strokeWidth=".55"
      />
      <path
        d={path}
        fill="rgba(140,207,196,.35)"
        stroke="#176c68"
        strokeWidth="2"
      />
    </svg>
  );
}
