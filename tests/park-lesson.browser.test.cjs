'use strict';

// node --test tests/park-lesson.browser.test.cjs (Playwright with Microsoft Edge)
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');
const test = require('node:test');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const draftKey = 'stepwrite-draft-v1';
const previousLessonKey = 'stepwrite-park-lesson-v3';

async function serveWorkshop() {
  const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.svg': 'image/svg+xml' };
  const server = http.createServer(async (request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const filename = path.resolve(root, '.' + pathname);
    if (!filename.startsWith(root + path.sep) || !types[path.extname(filename)]) {
      response.writeHead(404).end();
      return;
    }
    try {
      const bytes = await fs.readFile(filename);
      response.writeHead(200, { 'Content-Type': types[path.extname(filename)] }).end(bytes);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((resolve, reject) => server.once('error', reject).listen(0, '127.0.0.1', resolve));
  return server;
}

test('the homepage embeds the seven-step lesson and keeps lesson progress separate from workshop drafts', async t => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const server = await serveWorkshop();
  try {
    const urls = [
      pathToFileURL(path.join(root, 'index.html')).href,
      'http://127.0.0.1:' + server.address().port + '/index.html'
    ];
    for (const url of urls) await t.test(new URL(url).protocol, async () => {
      const context = await browser.newContext({ viewport: { width: 1368, height: 1000 }, reducedMotion: 'reduce' });
      try {
        const errors = [];
        context.on('weberror', error => errors.push(error.error().message));
        let page = await context.newPage();
        await page.goto(url);
        const earlier = { active: 3, draft: { opening: '原有的中文構思。' } };
        await page.evaluate(([key, value]) => localStorage.setItem(key, JSON.stringify(value)), [previousLessonKey, earlier]);
        await page.locator('[role="tab"][aria-controls="workshop"]').click();
        await page.locator('#workshop .step-link[data-step="2"]').click();
        const draft = 'This is my own opening in the writing workshop.';
        await page.locator('#p1s1').fill(draft);
        const workshop = await page.evaluate(key => localStorage.getItem(key), draftKey);
        assert.equal(JSON.parse(workshop).p1s1, draft);

        await page.locator('[role="tab"][aria-controls="learn"]').click();
        assert.equal(new URL(page.url()).hash, '#learn');
        const iframe = page.locator('#learn iframe');
        assert.equal(await iframe.count(), 1);
        assert.ok((await iframe.getAttribute('title')).trim());
        const lessonUrl = new URL(await iframe.getAttribute('src'), url);
        assert.equal(lessonUrl.pathname, new URL('burger-lab.html', url).pathname);
        const lesson = page.frameLocator('#learn iframe');
        assert.equal(await lesson.locator('#lessonTitle').innerText(), '我的理想公園');
        assert.equal(await lesson.getByRole('tab').count(), 7);
        assert.ok(await lesson.locator('#originalImage').evaluate(img => img.complete && img.naturalWidth > 0));
        await lesson.locator('#step-1').click();
        await lesson.locator('[data-category-pick="When"]').check();
        await lesson.locator('[data-model-opening-adopt]').click();
        await lesson.locator('#step-6').click();
        await lesson.locator('#confirm').click();
        assert.equal(await lesson.locator('#progress').getAttribute('value'), '1');
        const essay = lesson.locator('[data-case-version="advanced"]');
        await essay.locator(':scope > summary').click();
        assert.equal(await essay.locator('p[lang="en"]').innerText(), 'The pictures show two different types of parks.');
        await page.reload();
        assert.equal(await lesson.locator('#step-6').getAttribute('aria-selected'), 'true');
        assert.equal(await lesson.locator('#progress').getAttribute('value'), '1');
        assert.equal(await page.locator('#p1s1').inputValue(), draft);
        assert.equal(await page.evaluate(key => localStorage.getItem(key), draftKey), workshop);
        assert.deepEqual(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), previousLessonKey), earlier);

        await page.close();
        page = await context.newPage();
        await page.goto(new URL('burger-lab.html', url).href);
        assert.equal(await page.locator('#step-6').getAttribute('aria-selected'), 'true');
        await page.locator('#step-1').click();
        assert.equal(await page.locator('[data-category-pick="When"]').isChecked(), true);
        await page.locator('[data-category-pick="Why"]').check();

        await page.goto(url + '#learn');
        const reopened = page.frameLocator('#learn iframe');
        assert.equal(await reopened.locator('#step-1').getAttribute('aria-selected'), 'true');
        assert.equal(await reopened.locator('[data-category-pick="When"]').isChecked(), true);
        assert.equal(await reopened.locator('[data-category-pick="Why"]').isChecked(), true);
        assert.equal(await reopened.locator('#progress').getAttribute('value'), '1');
        await page.locator('[role="tab"][aria-controls="workshop"]').click();
        assert.equal(await page.locator('#p1s1').inputValue(), draft);
        await page.locator('#p1s1').fill('I revised my independent workshop opening.');
        await page.reload();
        assert.equal(await page.locator('#p1s1').inputValue(), 'I revised my independent workshop opening.');
        await page.locator('[role="tab"][aria-controls="learn"]').click();
        assert.equal(await reopened.locator('[data-category-pick="Why"]').isChecked(), true);
        assert.equal(await reopened.locator('#progress').getAttribute('value'), '1');
        assert.deepEqual(errors, []);
      } finally {
        await context.close();
      }
    });
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
});
