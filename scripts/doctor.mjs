import path from'node:path';import {fileURLToPath}from'node:url';import {engines}from'../src/native.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
console.log(JSON.stringify({node:process.version,platform:process.platform,platformFallback:false,engines:await engines(path.join(root,'.local'))},null,2));
