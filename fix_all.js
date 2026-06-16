const fs = require('fs');
const { execSync } = require('child_process');

function fix() {
  try {
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
    console.log("No more errors!");
    return true;
  } catch (err) {
    const output = err.stdout.toString();
    const lines = output.split('\n');
    const fixes = {};
    for (const line of lines) {
      const match = line.match(/^(src\/.*?\.tsx)\((\d+),(\d+)\): error TS\d+: Cannot find name '([^']+)'/);
      if (match) {
        const [_, file, r, c, name] = match;
        if (!fixes[file]) fixes[file] = new Set();
        fixes[file].add(name);
      }
      // Also look for "Property 'currentUser' does not exist on type 'unknown'" and fix useContext
      const match2 = line.match(/^(src\/.*?\.tsx)\((\d+),(\d+)\): error TS2339: Property '(currentUser|currentRole)' does not exist/);
      if (match2) {
        const [_, file] = match2;
        if (!fixes[file]) fixes[file] = new Set();
        fixes[file].add('AppContext');
      }
    }

    if (Object.keys(fixes).length === 0) {
      console.log("No simple fixes found. Errors:\n", output.substring(0, 500));
      return false;
    }

    const compList = ['Toast', 'SingleBubble', 'FloatingBubbles', 'SkeletonBox', 'ShopCardSkeleton', 'ContactBtn', 'AnimatedShopCard', 'TopBar', 'GlassHeader', 'ErrorBanner', 'PasswordInput', 'LocationPicker', 'PillBottomBar', 'PillNavItem', 'BarcodeProductResult', 'BarcodeScannerModal', 'FullImageViewer', 'InfoRow', 'SplashScreen', 'AuthScreen', 'ShopkeeperDetailsForm', 'UserDetailsForm', 'AddProductForm', 'ViewProductsList', 'EditProductForm', 'ShopkeeperDashboard', 'BillingSection', 'UserDashboard', 'ShopProducts', 'ProductDetail', 'CartScreen', 'ProfileScreen', 'EditProfileScreen', 'ChangePasswordScreen', 'ForgotPasswordScreen', 'AppNavigatorInner', 'AppNavigator'];
    
    for (const file of Object.keys(fixes)) {
      let content = fs.readFileSync(file, 'utf-8');
      const folderName = file.includes('src/components') ? 'components' : (file.includes('src/screens') ? 'screens' : 'navigation');
      
      const toImport = Array.from(fixes[file]);
      const newImports = [];
      toImport.forEach(name => {
        if (content.includes(`import { ${name} }`) || content.includes(`import ${name} `)) return;
        
        if (compList.includes(name)) {
          const isComp = ['Toast', 'SingleBubble', 'FloatingBubbles', 'SkeletonBox', 'ShopCardSkeleton', 'ContactBtn', 'AnimatedShopCard', 'TopBar', 'GlassHeader', 'ErrorBanner', 'PasswordInput', 'LocationPicker', 'PillBottomBar', 'PillNavItem', 'BarcodeProductResult', 'BarcodeScannerModal', 'FullImageViewer', 'InfoRow'].includes(name);
          const destFolder = isComp ? 'components' : (name.includes('Screen') || name.includes('Dashboard') || name.includes('Form') || name.includes('List') || name.includes('Section') || name.includes('Products') || name.includes('Detail') ? 'screens' : 'navigation');
          let rel = '';
          if (folderName === destFolder) {
            rel = `./${name}`;
          } else {
            rel = `../${destFolder}/${name}`;
          }
          newImports.push(`import ${name} from '${rel}';`);
        } else if (name === 'useToast') {
          newImports.push(`import { useToast } from '../utils/useToast';`);
        } else if (name === 'GlobalStore') {
          newImports.push(`import { GlobalStore } from '../utils/store';`);
        } else if (name === 'pickPhoto') {
          newImports.push(`import { pickPhoto } from '../utils/photoPicker';`);
        } else if (name === 'handleCall' || name === 'handleWhatsApp') {
          newImports.push(`import { handleCall, handleWhatsApp } from '../utils/contactHelpers';`);
        } else if (name === 'FIREBASE_API_KEY') {
          newImports.push(`import { FIREBASE_API_KEY } from '../utils/constants';`);
        } else if (name === 'AppContext') {
          newImports.push(`import { AppContext } from '../context/AppContext';`);
          // Also fix the line where it is destructured if it uses useContext without type
          content = content.replace(/const \{([^}]+)\} = useContext\(\)/g, "const {$1} = React.useContext(AppContext)");
          content = content.replace(/const \{([^}]+)\} = React\.useContext\(\)/g, "const {$1} = React.useContext(AppContext)");
        } else if (['Keyboard', 'StatusBar', 'Linking', 'Alert'].includes(name)) {
           newImports.push(`import { ${name} } from 'react-native';`);
        } else if (name === 'Print') {
           newImports.push(`import * as Print from 'expo-print';`);
        }
      });

      if (newImports.length > 0) {
        content = newImports.join('\n') + '\n' + content;
      }
      fs.writeFileSync(file, content);
      console.log(`Fixed imports in ${file}`);
    }
    return false;
  }
}

let iters = 0;
while (!fix() && iters < 5) {
  iters++;
}
