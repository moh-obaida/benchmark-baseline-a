const paths: Record<string, string> = {
  feather: "M5 19c6-1 9-7 12-13-5 2-9 6-12 13zm0 0c3 1.2 6 1 9-.4",
  moon: "M15 4.5A7 7 0 1 0 19 15 5.5 5.5 0 0 1 15 4.5z",
  book: "M5 5.5h6.5A2.5 2.5 0 0 1 14 8v11H7.5A2.5 2.5 0 0 0 5 16.5zM19 5.5h-6.5",
  compass: "M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM14.5 9.5l-1.2 3.8-3.8 1.2 1.2-3.8z",
  home: "M4 11.5 12 5l8 6.5V20H4zM9 20v-6h6v6",
  star: "M12 4.5l1.8 4.2 4.6.5-3.4 3.1.9 4.5L12 14.7 7.1 16.8l.9-4.5L4.6 9.2l4.6-.5z",
  lamp: "M8 10a4 4 0 1 1 8 0c0 2.2-1.6 3.4-2.2 5H10.2C9.6 13.4 8 12.2 8 10zM10 18h4M9 21h6",
  spark: "M12 3v6M12 15v6M3 12h6M15 12h6M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3",
  path: "M5 18c2-6 4-6 7-6s5 0 7-6",
  tree: "M12 21V12M12 12c-3 0-4-3-2.5-5S12 4 12 4s2.2 1 2.5 3S15 12 12 12z",
};

export function Icon({ name, size = 22 }: { name: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[name] ?? paths.feather} />
    </svg>
  );
}

export function LogoMark() {
  return (
    <span className="logo-mark" aria-hidden="true">
      <Icon name="feather" size={20} />
    </span>
  );
}
