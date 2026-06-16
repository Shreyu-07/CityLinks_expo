const fs = require('fs');

// 1. Fix duplicate imports
function removeDuplicateImports(file) {
  const content = fs.readFileSync(file, 'utf-8');
  const lines = content.split('\n');
  const uniqueLines = [];
  const importSet = new Set();
  for (const line of lines) {
    if (line.startsWith('import ')) {
      if (importSet.has(line)) continue;
      importSet.add(line);
    }
    uniqueLines.push(line);
  }
  fs.writeFileSync(file, uniqueLines.join('\n'));
}
removeDuplicateImports('src/components/AnimatedShopCard.tsx');
removeDuplicateImports('src/screens/ShopProducts.tsx');

// 2. expo-camera imports
let modal = fs.readFileSync('src/components/BarcodeScannerModal.tsx', 'utf-8');
modal = "import { CameraView, useCameraPermissions } from 'expo-camera';\n" + modal;
fs.writeFileSync('src/components/BarcodeScannerModal.tsx', modal);

// 3 & 4. Bubbles and single bubble
let single = fs.readFileSync('src/components/SingleBubble.tsx', 'utf-8');
single = "export interface BubbleConfig { id: number; size: number; left: number; duration: number; delay: number; }\n" + single;
fs.writeFileSync('src/components/SingleBubble.tsx', single);

let float = fs.readFileSync('src/components/FloatingBubbles.tsx', 'utf-8');
// Missing generateBubbles. In App.tsx it was probably defined inside or before FloatingBubbles.
// I'll define generateBubbles inside the file.
const generateBubblesCode = `
import { BubbleConfig } from './SingleBubble';
const generateBubbles = (count: number): BubbleConfig[] => {
  return Array.from({ length: count }).map((_, i) => ({
    id: i,
    size: 20 + Math.random() * 40,
    left: Math.random() * 100,
    duration: 3000 + Math.random() * 4000,
    delay: Math.random() * 2000,
  }));
};
`;
float = generateBubblesCode + float;
float = float.replace(/b: any/g, 'b: BubbleConfig').replace(/\(b\)/g, '(b: BubbleConfig)'); // fix type error
fs.writeFileSync('src/components/FloatingBubbles.tsx', float);

// 5. ToastProps
let toast = fs.readFileSync('src/components/Toast.tsx', 'utf-8');
toast = "export interface ToastProps { message: string; type?: 'success' | 'info' | 'error' | 'warning'; visible: boolean; }\n" + toast;
fs.writeFileSync('src/components/Toast.tsx', toast);

// 6. Stack definition
function addStack(file) {
  let nav = fs.readFileSync(file, 'utf-8');
  if (!nav.includes('const Stack =')) {
    nav = "import { createStackNavigator } from '@react-navigation/stack';\nconst Stack = createStackNavigator();\n" + nav;
  }
  fs.writeFileSync(file, nav);
}
addStack('src/navigation/AppNavigator.tsx');
addStack('src/navigation/AppNavigatorInner.tsx');

// Also Add NavigationContainer to AppNavigator if missing
let appNav = fs.readFileSync('src/navigation/AppNavigator.tsx', 'utf-8');
if (appNav.includes('NavigationContainer') && !appNav.includes('import { NavigationContainer }')) {
  appNav = "import { NavigationContainer } from '@react-navigation/native';\n" + appNav;
  fs.writeFileSync('src/navigation/AppNavigator.tsx', appNav);
}

