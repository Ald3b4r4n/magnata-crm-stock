const { execSync } = require('child_process');
const fs = require('fs');

try {
  console.log("Executando firebase apps:sdkconfig...");
  // Use powershell /c to run firebase command, avoiding coloring. Also --json helps if we parse it carefully.
  const output = execSync('npx firebase apps:sdkconfig web --project magnata-crm-stock-2026', { encoding: 'utf-8' });
  
  const match = output.match(/\{[\s\S]*?\}/);
  if (match) {
    const configStr = match[0];
    // Pega o json/object da string
    const config = eval('(' + configStr + ')');
    
    let envContent = `NEXT_PUBLIC_FIREBASE_API_KEY=${config.apiKey}
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${config.authDomain}
NEXT_PUBLIC_FIREBASE_PROJECT_ID=${config.projectId}
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${config.storageBucket}
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${config.messagingSenderId}
NEXT_PUBLIC_FIREBASE_APP_ID=${config.appId}
`;
    fs.writeFileSync('.env.local', envContent, 'utf-8');
    console.log('Successfully wrote .env.local');
  } else {
    console.log('Config not found in output:', output);
  }
} catch (e) {
  console.error(e.message);
}
