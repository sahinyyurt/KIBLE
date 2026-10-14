import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { spawn, type ChildProcess } from 'node:child_process';
import { chromium, type Browser, type Page } from 'playwright';

let server: ChildProcess;
let browser: Browser;
const url = 'http://127.0.0.1:4174';

before(async () => {
  server = spawn(
    process.execPath,
    ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '4174', '--strictPort'],
    { stdio: ['ignore', 'pipe', 'pipe'] },
  );
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Vite did not start')), 15_000);
    server.once('error', reject);
    server.once('exit', (code) => {
      clearTimeout(timeout);
      reject(new Error(`Vite exited: ${code}`));
    });
    server.stdout!.on('data', (data: Buffer) => {
      if (data.toString().includes(url)) {
        clearTimeout(timeout);
        resolve();
      }
    });
  });
  browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  });
});

after(async () => {
  await browser?.close();
  server?.kill();
});

async function openCompass(query = '') {
  const page = await browser.newPage();
  page.setDefaultTimeout(5_000);
  await page.addInitScript(() => {
    navigator.geolocation.getCurrentPosition = (success) =>
      success({
        coords: {
          latitude: 41.0082,
          longitude: 28.9784,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
          toJSON: () => ({}),
        },
        timestamp: Date.now(),
        toJSON: () => ({}),
      });
    Object.defineProperty(screen.orientation, 'angle', { configurable: true, value: 0 });
  });
  await page.goto(url + query);
  await page.getByText('Mevcut konumun', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Sensör bekleniyor…' }).waitFor();
  return page;
}

async function sendHeading(page: Page, alpha: number) {
  await page.evaluate((alpha) => {
    window.dispatchEvent(
      new DeviceOrientationEvent('deviceorientationabsolute', {
        absolute: true,
        alpha,
        beta: 0,
        gamma: 0,
      }),
    );
  }, alpha);
  await page.getByText('Pusula aktif', { exact: true }).waitFor();
}

test('Startup and restart do not show a direction until north-referenced data arrives', async () => {
  const page = await openCompass();
  try {
    assert.equal(await page.getByRole('region', { name: 'Pusula tanılama' }).count(), 0);
    assert.equal(
      await page.locator('.pointer').count(),
      0,
      'Startup must not assume the phone faces north',
    );
    await sendHeading(page, 270);
    assert.equal(
      await page.locator('.ticks').evaluate((element) => (element as HTMLElement).style.transform),
      'rotate(-90deg)',
    );
    await page.getByRole('button', { name: 'Pusulayı yeniden başlat' }).click();
    await page.getByRole('button', { name: 'Sensör bekleniyor…' }).waitFor();
    assert.equal(
      await page.locator('.pointer').count(),
      0,
      'Restart must not assume the phone faces north',
    );
    await sendHeading(page, 180);
    assert.equal(
      await page.locator('.ticks').evaluate((element) => (element as HTMLElement).style.transform),
      'rotate(-180deg)',
      'Restart must not smooth against the old session',
    );
  } finally {
    await page.close();
  }
});

test('Opt-in diagnostics capture sensor sources and restart output without coordinates', async () => {
  const page = await openCompass('?compassDebug=1');
  try {
    await page.clock.install();
    await page.getByRole('button', { name: '10 saniyelik kaydı başlat' }).click();
    await sendHeading(page, 270);
    await page.clock.runFor(500);
    await page.getByRole('button', { name: 'Kayıt sırasında pusulayı yeniden başlat' }).click();
    await page.getByRole('button', { name: 'Sensör bekleniyor…' }).waitFor();
    await sendHeading(page, 270);
    await page.clock.runFor(10_000);
    const text = await page.getByRole('textbox', { name: 'Pusula tanılama raporu' }).inputValue();
    const report = JSON.parse(text);
    assert.equal(report.version, 1);
    assert.ok(report.counts.deviceorientationabsolute >= 2);
    assert.ok(report.samples.some((sample: { rawHeading: number }) => sample.rawHeading === 90));
    assert.ok(
      report.outputs.some(
        (output: { restarts: number; heading: number }) =>
          output.restarts === 1 && output.heading === 90,
      ),
    );
    assert.equal(text.includes('latitude'), false);
    assert.equal(text.includes('longitude'), false);
    assert.equal(text.includes('41.0082'), false);
    await sendHeading(page, 180);
    await page.clock.runFor(1_000);
    assert.equal(
      await page.getByRole('textbox', { name: 'Pusula tanılama raporu' }).inputValue(),
      text,
      'Completed recordings must stop listening',
    );
  } finally {
    await page.close();
  }
});

test('Screen rotation clears the old frame and the next reading uses the new frame', async () => {
  const page = await openCompass();
  try {
    await sendHeading(page, 270);
    await page.evaluate(() => {
      Object.defineProperty(screen.orientation, 'angle', { configurable: true, value: 90 });
      screen.orientation.dispatchEvent(new Event('change'));
    });
    assert.equal(
      await page.locator('.pointer').count(),
      0,
      'Old frame must not remain visible after rotation',
    );
    await sendHeading(page, 270);
    assert.equal(
      await page.locator('.ticks').evaluate((element) => (element as HTMLElement).style.transform),
      'rotate(-180deg)',
      'Do not blend headings from portrait and landscape',
    );
  } finally {
    await page.close();
  }
});

test('Relative orientation cannot activate the compass', async () => {
  const page = await openCompass();
  try {
    await page.evaluate(() =>
      window.dispatchEvent(
        new DeviceOrientationEvent('deviceorientation', {
          absolute: false,
          alpha: 120,
          beta: 0,
          gamma: 0,
        }),
      ),
    );
    assert.equal(await page.getByText('Pusula aktif', { exact: true }).count(), 0);
    assert.equal(await page.locator('.pointer').count(), 0);
  } finally {
    await page.close();
  }
});

test('An active compass keeps north when the phone is tilted forward and sideways', async () => {
  const page = await openCompass();
  try {
    await page.evaluate(() =>
      window.dispatchEvent(
        new DeviceOrientationEvent('deviceorientationabsolute', {
          absolute: true,
          alpha: 0,
          beta: 60,
          gamma: 45,
        }),
      ),
    );
    await page.getByText('Pusula aktif', { exact: true }).waitFor();
    assert.equal(
      await page.locator('.ticks').evaluate((element) => (element as HTMLElement).style.transform),
      'rotate(0deg)',
    );
  } finally {
    await page.close();
  }
});

test('Upright readings hide the arrow and a usable pose restores it without old smoothing', async () => {
  const page = await openCompass();
  try {
    await sendHeading(page, 270);
    await page.evaluate(() =>
      window.dispatchEvent(
        new DeviceOrientationEvent('deviceorientationabsolute', {
          absolute: true,
          alpha: 0,
          beta: 90,
          gamma: 0,
        }),
      ),
    );
    assert.equal(await page.locator('.pointer').count(), 0);
    await sendHeading(page, 180);
    assert.equal(
      await page.locator('.ticks').evaluate((element) => (element as HTMLElement).style.transform),
      'rotate(-180deg)',
    );
  } finally {
    await page.close();
  }
});
