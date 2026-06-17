const fs = require('fs');

const code = fs.readFileSync('App.tsx', 'utf-8');
const lines = code.split('\n');

const components = [];
let currentComponent = null;

const componentRegex = /^(const|function) ([A-Z][a-zA-Z0-9_]*) =/;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const match = line.match(componentRegex);
  if (match && !line.includes('BASE_W') && !line.includes('STATUS_BAR_H')) {
    if (currentComponent) {
      currentComponent.end = i - 1;
      components.push(currentComponent);
    }
    currentComponent = { name: match[2], start: i };
  }
}
if (currentComponent) {
  // find the end of the last component (usually before export default App)
  for(let j = currentComponent.start; j < lines.length; j++) {
    if (lines[j].includes('export default function App')) {
      currentComponent.end = j - 1;
      break;
    }
  }
  components.push(currentComponent);
}

// Just log the components
components.forEach(c => console.log(`${c.name}: ${c.start} to ${c.end}`));
