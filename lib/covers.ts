export function coverSvg(color: string, motif: number) {
  const shapes = [
    `<circle cx="400" cy="470" r="150" fill="none" stroke="#2C272A" stroke-opacity="0.28" stroke-width="3"/>
     <path d="M250 760h300" stroke="#2C272A" stroke-opacity="0.28" stroke-width="3"/>`,
    `<path d="M180 820c120-220 320-220 440 0" fill="none" stroke="#2C272A" stroke-opacity="0.3" stroke-width="3"/>
     <circle cx="400" cy="390" r="70" fill="#2C272A" fill-opacity="0.12"/>`,
    `<rect x="250" y="280" width="300" height="420" rx="8" fill="none" stroke="#2C272A" stroke-opacity="0.28" stroke-width="3"/>
     <path d="M290 390h220M290 450h180" stroke="#2C272A" stroke-opacity="0.22" stroke-width="3"/>`,
    `<path d="M400 250c80 90 80 180 0 280c-80-100-80-190 0-280z" fill="#2C272A" fill-opacity="0.12"/>
     <path d="M400 250v520" stroke="#2C272A" stroke-opacity="0.3" stroke-width="3"/>`,
    `<circle cx="310" cy="430" r="90" fill="#2C272A" fill-opacity="0.08"/>
     <circle cx="490" cy="520" r="120" fill="none" stroke="#2C272A" stroke-opacity="0.28" stroke-width="3"/>`,
    `<path d="M220 700l180-360 180 360" fill="none" stroke="#2C272A" stroke-opacity="0.3" stroke-width="3"/>
     <path d="M300 560h200" stroke="#2C272A" stroke-opacity="0.22" stroke-width="3"/>`,
  ];
  const art = shapes[motif % shapes.length];
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1100" viewBox="0 0 800 1100">
  <rect width="800" height="1100" fill="#F7F4F1"/>
  <rect x="48" y="48" width="704" height="1004" fill="${color}"/>
  <rect x="78" y="78" width="644" height="944" fill="none" stroke="#2C272A" stroke-opacity="0.2" stroke-width="2"/>
  ${art}
</svg>`;
}

export function avatarSvg(color: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
  <rect width="600" height="600" fill="${color}"/>
  <circle cx="300" cy="300" r="180" fill="none" stroke="#2C272A" stroke-opacity="0.25" stroke-width="3"/>
  <path d="M300 180c70 80 70 150 0 250c-70-100-70-170 0-250z" fill="#2C272A" fill-opacity="0.16"/>
</svg>`;
}
