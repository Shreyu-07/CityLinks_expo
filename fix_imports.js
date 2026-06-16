const fs = require('fs');
const path = require('path');

const components = ['Toast', 'SingleBubble', 'FloatingBubbles', 'SkeletonBox', 'ShopCardSkeleton', 'ContactBtn', 'AnimatedShopCard', 'TopBar', 'GlassHeader', 'ErrorBanner', 'PasswordInput', 'LocationPicker', 'PillBottomBar', 'PillNavItem', 'BarcodeProductResult', 'BarcodeScannerModal', 'FullImageViewer', 'InfoRow'];
const utils = {
  useToast: 'useToast',
  GlobalStore: 'store',
  pickPhoto: 'photoPicker',
  handleCall: 'contactHelpers',
  handleWhatsApp: 'contactHelpers'
};

function processFolder(folderName) {
  const dir = path.join('src', folderName);
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    if (!file.endsWith('.tsx')) return;
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    
    let newImports = [];
    
    // Check components
    components.forEach(comp => {
      // Don't import yourself
      if (file.replace('.tsx', '') === comp) return;
      const regex = new RegExp(`\\b${comp}\\b`);
      if (regex.test(content) && !content.includes(`import ${comp}`)) {
        const importPath = folderName === 'components' ? `./${comp}` : `../components/${comp}`;
        newImports.push(`import ${comp} from '${importPath}';`);
      }
    });

    // Check utils
    for (const [utilName, utilFile] of Object.entries(utils)) {
      const regex = new RegExp(`\\b${utilName}\\b`);
      if (regex.test(content) && !content.includes(utilName)) {
        const importPath = `../utils/${utilFile}`;
        newImports.push(`import { ${utilName} } from '${importPath}';`);
      }
    }
    
    // Check missing rn things
    const rnThings = ['Keyboard', 'StatusBar'];
    rnThings.forEach(thing => {
      const regex = new RegExp(`\\b${thing}\\b`);
      if (regex.test(content) && !content.includes(thing)) {
        // Quick hack: just import it at top since the original file probably has a react-native import we could append to, but a separate import works too
        newImports.push(`import { ${thing} } from 'react-native';`);
      }
    });

    // Quick hack for screens missing navigation imports
    if (folderName === 'screens' && !content.includes('import { createStackNavigator }') && content.includes('createStackNavigator')) {
       newImports.push(`import { createStackNavigator } from '@react-navigation/stack';`);
    }
    if (folderName === 'navigation' && content.includes('createStackNavigator')) {
       newImports.push(`import { createStackNavigator } from '@react-navigation/stack';`);
    }

    if (newImports.length > 0) {
      content = newImports.join('\n') + '\n' + content;
      fs.writeFileSync(filePath, content);
    }
  });
}

processFolder('components');
processFolder('screens');
processFolder('navigation');
