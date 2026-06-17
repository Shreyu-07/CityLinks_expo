const fs = require('fs');

let single = fs.readFileSync('src/components/SingleBubble.tsx', 'utf-8');
single = single.replace(
  'export interface BubbleConfig { id: number; size: number; left: number; duration: number; delay: number; opacity?: number; x?: number; }',
  'export interface BubbleConfig { id: number; size: number; left: number; duration: number; delay: number; opacity?: number; x?: number; }'
);
// fix type errors in single bubble by coalescing undefined
single = single.replace('opacity: config.opacity', 'opacity: config.opacity || 1');
single = single.replace('x: config.x', 'x: config.x || 0');
fs.writeFileSync('src/components/SingleBubble.tsx', single);
