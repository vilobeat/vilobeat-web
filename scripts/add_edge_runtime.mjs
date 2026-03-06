import fs from 'fs';
import path from 'path';

function addEdge(dir) {
    for (const file of fs.readdirSync(dir)) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            addEdge(fullPath);
        } else if (fullPath.endsWith('route.ts') || fullPath.endsWith('page.tsx')) {
            // we will add to all API routes, and [id] pages
            if (fullPath.endsWith('route.ts') || fullPath.includes('[id]')) {
                const content = fs.readFileSync(fullPath, 'utf8');
                if (!content.includes("runtime = 'edge'") && !content.includes('runtime = "edge"')) {
                    fs.writeFileSync(fullPath, "export const runtime = 'edge';\n" + content);
                    console.log("Added to", fullPath);
                }
            }
        }
    }
}
addEdge('./src/app');
