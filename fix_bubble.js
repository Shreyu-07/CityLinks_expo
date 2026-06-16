const fs = require('fs');

let single = fs.readFileSync('src/components/SingleBubble.tsx', 'utf-8');
single = single.replace(
  'export interface BubbleConfig { id: number; size: number; left: number; duration: number; delay: number; }',
  'export interface BubbleConfig { id: number; size: number; left: number; duration: number; delay: number; opacity?: number; x?: number; }'
);
fs.writeFileSync('src/components/SingleBubble.tsx', single);
