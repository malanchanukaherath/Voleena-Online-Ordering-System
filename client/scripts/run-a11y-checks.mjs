import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import net from 'node:net';

const HOST = '127.0.0.1';
const PORT = 4173;
const SERVER_READY_TIMEOUT_MS = 120000;

const URLS = [
  `http://${HOST}:${PORT}/`,
  `http://${HOST}:${PORT}/login`
];

const THRESHOLDS = {
  required: {
    accessibility: 0.9
  },
  warning: {
    'best-practices': 0.85
  }
};

const OUTPUT_DIR = path.resolve('.lighthouseci');
const TEMP_BASE_DIR = path.resolve(process.env.TEMP || process.env.TMP || '.');
const LIGHTHOUSE_TEMP_DIR = path.resolve(TEMP_BASE_DIR, 'voleena-lhci');
const PROFILE_DIR = path.resolve(LIGHTHOUSE_TEMP_DIR, 'chrome-profile');

const toSlug = (url) => {
  if (url.endsWith('/login')) return 'login';
  return 'home';
};

const waitForServer = async (host, port, timeoutMs) => {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const connected = await new Promise((resolve) => {
      const socket = net.createConnection({ host, port }, () => {
        socket.end();
        resolve(true);
      });

      socket.on('error', () => resolve(false));
    });

    if (connected) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Preview server not ready on ${host}:${port} within ${timeoutMs}ms`);
};

const runCommand = (command, args, options = {}) => {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      shell: true,
      ...options
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += String(data);
    });

    child.stderr?.on('data', (data) => {
      stderr += String(data);
    });

    child.on('close', (code) => {
      resolve({ code: Number(code ?? 1), stdout, stderr });
    });

    child.on('error', (error) => {
      resolve({ code: 1, stdout, stderr: `${stderr}\n${String(error?.message || error)}` });
    });
  });
};

const terminateServer = (serverProc) => {
  if (!serverProc || serverProc.killed) {
    return;
  }

  try {
    serverProc.kill('SIGTERM');
  } catch {
    // Ignore and use fallback below.
  }

  if (process.platform === 'win32' && serverProc.pid) {
    spawnSync('taskkill', ['/pid', String(serverProc.pid), '/T', '/F'], {
      shell: true,
      stdio: 'ignore'
    });
  }
};

const findReportJsonPath = (basePath) => {
  const candidates = [
    `${basePath}.report.json`,
    `${basePath}.json`
  ];

  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
};

const findReportHtmlPath = (basePath) => {
  const candidates = [
    `${basePath}.report.html`,
    `${basePath}.html`
  ];

  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
};

const runLighthouseForUrl = async (url) => {
  const slug = toSlug(url);
  const basePath = path.resolve(LIGHTHOUSE_TEMP_DIR, `lhr-${slug}`);

  const chromeFlags = [
    '--headless=new',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    `--user-data-dir=${PROFILE_DIR}`
  ].join(' ');

  const args = [
    '--yes',
    'lighthouse',
    url,
    '--quiet',
    '--output=json',
    '--output=html',
    `--output-path=${basePath}`,
    `--chrome-flags=${chromeFlags}`
  ];

  const result = await runCommand('npx', args, { cwd: process.cwd() });
  const combinedOutput = `${result.stdout}\n${result.stderr}`;

  const jsonPath = findReportJsonPath(basePath);
  const htmlPath = findReportHtmlPath(basePath);

  const hasEpermCleanupError = /EPERM, Permission denied: .*lighthouse\./i.test(combinedOutput);
  const hasArtifacts = Boolean(jsonPath && htmlPath);

  if (result.code !== 0 && !(hasEpermCleanupError && hasArtifacts)) {
    const tail = combinedOutput.trim().split(/\r?\n/).slice(-30).join('\n');
    throw new Error(`Lighthouse failed for ${url}.\n${tail}`);
  }

  if (!jsonPath) {
    throw new Error(`Lighthouse did not generate JSON output for ${url}.`);
  }

  const projectJsonPath = path.resolve(OUTPUT_DIR, `lhr-${slug}.json`);
  const projectHtmlPath = path.resolve(OUTPUT_DIR, `lhr-${slug}.html`);

  await fsp.copyFile(jsonPath, projectJsonPath);
  if (htmlPath) {
    await fsp.copyFile(htmlPath, projectHtmlPath);
  }

  const parsed = JSON.parse(await fsp.readFile(projectJsonPath, 'utf8'));

  return {
    url,
    jsonPath: projectJsonPath,
    htmlPath: htmlPath ? projectHtmlPath : null,
    toleratedWindowsCleanupRace: hasEpermCleanupError && hasArtifacts,
    categories: {
      performance: Number(parsed?.categories?.performance?.score ?? 0),
      accessibility: Number(parsed?.categories?.accessibility?.score ?? 0),
      bestPractices: Number(parsed?.categories?.['best-practices']?.score ?? 0),
      seo: Number(parsed?.categories?.seo?.score ?? 0)
    }
  };
};

const main = async () => {
  await fsp.mkdir(OUTPUT_DIR, { recursive: true });
  await fsp.mkdir(LIGHTHOUSE_TEMP_DIR, { recursive: true });
  await fsp.mkdir(PROFILE_DIR, { recursive: true });

  const serverProc = spawn('npm', ['run', 'preview', '--', '--host', HOST, '--port', String(PORT), '--strictPort'], {
    cwd: process.cwd(),
    shell: true,
    stdio: 'ignore'
  });

  const results = [];

  try {
    await waitForServer(HOST, PORT, SERVER_READY_TIMEOUT_MS);

    for (const url of URLS) {
      const urlResult = await runLighthouseForUrl(url);
      results.push(urlResult);
    }
  } finally {
    terminateServer(serverProc);
  }

  const thresholdFailures = [];
  const thresholdWarnings = [];

  for (const result of results) {
    if (result.categories.accessibility < THRESHOLDS.required.accessibility) {
      thresholdFailures.push(`${result.url} accessibility ${result.categories.accessibility.toFixed(2)} < ${THRESHOLDS.required.accessibility.toFixed(2)}`);
    }

    if (result.categories.bestPractices < THRESHOLDS.warning['best-practices']) {
      thresholdWarnings.push(`${result.url} best-practices ${result.categories.bestPractices.toFixed(2)} < ${THRESHOLDS.warning['best-practices'].toFixed(2)}`);
    }
  }

  console.log('Lighthouse non-functional summary');
  for (const result of results) {
    console.log(`- URL: ${result.url}`);
    console.log(`  Performance: ${result.categories.performance.toFixed(2)}`);
    console.log(`  Accessibility: ${result.categories.accessibility.toFixed(2)}`);
    console.log(`  Best Practices: ${result.categories.bestPractices.toFixed(2)}`);
    console.log(`  SEO: ${result.categories.seo.toFixed(2)}`);
    console.log(`  JSON: ${result.jsonPath}`);
    console.log(`  HTML: ${result.htmlPath}`);
    if (result.toleratedWindowsCleanupRace) {
      console.log('  Note: Windows EPERM cleanup race was detected and tolerated because reports were fully generated.');
    }
  }

  if (thresholdFailures.length > 0) {
    console.error('Threshold assertion failures:');
    for (const failure of thresholdFailures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  if (thresholdWarnings.length > 0) {
    console.warn('Threshold warnings:');
    for (const warning of thresholdWarnings) {
      console.warn(`- ${warning}`);
    }
  }

  process.exit(0);
};

main().catch((error) => {
  console.error(error.message || String(error));
  process.exit(1);
});
