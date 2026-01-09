// services/orchestrator.js
import fs from 'fs/promises';
import path from 'path';

const getProtocolsDirectory = () => {
  return path.join(process.cwd(), 'services', 'protocols');
};

export async function fetchAllAssets(address) {
  console.log('--- [Orchestrator] Starting fetchAllAssets ---');
  console.log(`   - Address: ${address}`);

  const allAssets = [];
  const failedProtocols = [];
  const protocolsDir = getProtocolsDirectory();

  try {
    const files = await fs.readdir(protocolsDir);
    const protocolFiles = files.filter(file => file.endsWith('.js'));
    console.log(`   - Found protocol files: ${protocolFiles.join(', ')}`);

    const fetchPromises = protocolFiles.map(async (file) => {
      const protocolPath = path.join(protocolsDir, file);
      const protocolName = path.basename(file, '.js');
      console.log(`   - [${protocolName}] Processing...`);

      try {
        // FINAL FIX: Use a relative path from the current file for dynamic import.
        // This avoids tsconfig path alias issues in .js files.
        const protocolModule = await import(`./protocols/${file}`);

        const exportedFunctionName = Object.keys(protocolModule).find(
          key => typeof protocolModule[key] === 'function'
        );

        if (!exportedFunctionName) {
          throw new Error(`No exported function found`);
        }

        console.log(`   - [${protocolName}] Found function: ${exportedFunctionName}`);
        const fetcher = protocolModule[exportedFunctionName];

        console.log(`   - [${protocolName}] Executing fetcher...`);
        const assets = await fetcher(address);
        
        // --- 核心调试日志 ---
        console.log(`   - [${protocolName}] Raw output received:`, JSON.stringify(assets, null, 2));
        // --- 核心调试日志 ---

        if (Array.isArray(assets)) {
          console.log(`   - [${protocolName}] Success. Found ${assets.length} assets.`);
          return { protocolName, assets };
        } else {
          console.warn(`   - [${protocolName}] WARNING: Did not return an array. Assuming failure.`);
          throw new Error(`Invalid return type`);
        }

      } catch (error) {
        console.error(`   - [${protocolName}] ERROR: ${error.message}`);
        return { protocolName, error };
      }
    });

    const results = await Promise.all(fetchPromises);

    for (const result of results) {
      if (result.error) {
        failedProtocols.push(result.protocolName);
      } else if (result.assets) {
        allAssets.push(...result.assets);
      }
    }

  } catch (error) {
    console.error("--- [Orchestrator] CRITICAL ERROR: Failed to read protocols directory ---", error.message);
    return {
      assets: [],
      failedProtocols: ['orchestrator_failure']
    };
  }

  console.log('--- [Orchestrator] Finished. ---');
  return {
    assets: allAssets,
    failedProtocols: failedProtocols,
  };
}
