import { expect, test } from '@playwright/test';

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 }
];

test('navigation fits narrow through wide screens and renders the Phosphor icons', async ({ page }) => {
  await blockExternalRequests(page);
  for (const width of [320, 390, 600, 768, 900, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.locator('#btn-mode-explore').click();
    await assertNoHorizontalOverflow(page, width);
    for (const selector of [
      '#btn-mode-explore', '#btn-mode-challenge', '#btn-open-worldle',
      '#btn-atlas-globe', '#btn-atlas-shapes'
    ]) {
      const button = page.locator(selector);
      await expect(button).toBeVisible();
      if (width < 768 && ['#btn-atlas-globe', '#btn-atlas-shapes'].includes(selector)) {
        await expect(button.locator('svg')).toBeHidden();
      } else await expect(button.locator('svg')).toBeVisible();
      await expect(button.locator('svg')).toHaveAttribute('viewBox', '0 0 256 256');
      await expect(button.locator('svg')).toHaveAttribute('aria-hidden', 'true');
      await expect(button.locator('.atlas-nav-copy small')).toHaveCount(0);
      expect(await button.locator('svg :is(path, circle, rect, ellipse)').count()).toBeGreaterThan(0);
      const bounds = await button.boundingBox();
      expect(bounds.width, `${width}px ${selector} width`).toBeGreaterThanOrEqual(44);
      expect(bounds.height, `${width}px ${selector} height`).toBeGreaterThanOrEqual(44);
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    }
  }
});

test('challenge controls are compact and usable at every size', async ({ page }) => {
  await blockExternalRequests(page);
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    await page.locator('#btn-mode-challenge').click();
    await expect(page.locator('#btn-mode-challenge')).toHaveCSS('background-color', width < 768 ? 'rgb(102, 96, 120)' : 'rgb(108, 59, 255)');
    await expect(page.locator('#btn-mode-challenge')).toHaveCSS('color', 'rgb(255, 255, 255)');
    const preview = page.locator('canvas.atlas-hunt-preview');
    await expect(preview).toBeVisible();
    await expect(preview).toHaveAttribute('aria-hidden', 'true');
    await expect(page.locator('#quiz-preview-art svg')).toBeVisible();
    await assertNoHorizontalOverflow(page, width);
    const hunt = await page.locator('#btn-challenge-hunt').boundingBox();
    const quiz = await page.locator('#btn-start-game').boundingBox();
    expect(hunt.width).toBeGreaterThanOrEqual(44);
    expect(quiz.width).toBeGreaterThanOrEqual(44);
    if (width >= 768) {
      const huntCard = await page.locator('.atlas-challenge-hunt').boundingBox();
      const quizCard = await page.locator('.atlas-challenge-card').nth(1).boundingBox();
      expect(Math.abs(huntCard.y - quizCard.y)).toBeLessThanOrEqual(2);
      expect(Math.abs(huntCard.height - quizCard.height)).toBeLessThanOrEqual(2);
      expect(hunt.x + hunt.width).toBeLessThan(quiz.x);
      expect(Math.abs((hunt.y + hunt.height) - (quiz.y + quiz.height))).toBeLessThanOrEqual(2);
    } else {
      expect(hunt.y).toBeGreaterThan(quiz.y + quiz.height);
      const nav = await page.locator('.atlas-primary-nav').boundingBox();
      expect(quiz.y + quiz.height).toBeLessThanOrEqual(nav.y);
    }
  }
});

test('quiet Menu still exposes settings and preferences', async ({ page }) => {
  await blockExternalRequests(page);
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const menu = page.locator('#atlas-utility-menu > summary');
    await expect(menu).toHaveText('Menu');
    await expect(menu.locator('svg')).toHaveCount(0);
    const bounds = await menu.boundingBox();
    expect(bounds.width).toBeGreaterThanOrEqual(44);
    expect(bounds.height).toBeGreaterThanOrEqual(44);
    await menu.click();
    await expect(page.locator('#challenge-settings')).toBeVisible();
    await expect(page.locator('#btn-sprint')).toBeVisible();
    await expect(page.locator('#btn-showoff')).toBeVisible();
    await expect(page.locator('#btn-explorer-music')).toBeVisible();
    await menu.click();
    await expect(page.locator('#atlas-utility-panel')).toBeHidden();
  }
});

test('Shape Quiz card is a preview and launcher; every quiz setting lives in the Menu', async ({ page }) => {
  await blockExternalRequests(page);
  await page.goto('/');
  await page.locator('#btn-mode-challenge').click();
  const card = page.locator('.atlas-challenge-card').nth(1);
  await expect(card.locator('#quiz-preview-art svg')).toBeVisible();
  await expect(card.locator('#btn-start-game')).toBeVisible();
  await expect(card.locator('#btn-sprint, #btn-showoff, #challenge-settings, .diff-btn')).toHaveCount(0);
  await expect(card.locator('#mode-summary, .atlas-stage-summary')).toHaveCount(0);

  await page.locator('#atlas-utility-menu > summary').click();
  const panel = page.locator('#atlas-utility-panel');
  await expect(panel.locator('#btn-sprint')).toBeVisible();
  await expect(panel.locator('#btn-showoff')).toBeVisible();
  await expect(panel.locator('.diff-btn[data-level]')).toHaveCount(4);
  await expect(panel.locator('.diff-btn[data-continent]')).toHaveCount(6);
  await panel.locator('#btn-showoff').click();
  await expect(panel.locator('#btn-showoff')).toHaveAttribute('aria-pressed', 'true');
  await expect(card.locator('#start-game-label')).toHaveText('Start practice');
});

test('bundled Sora and Inter fonts load locally', async ({ page }) => {
  await blockExternalRequests(page);
  await page.goto('/');
  await page.locator('#btn-mode-challenge').click();
  await expect(page.locator('#atlas-challenge-title')).toHaveCSS('font-family', /Sora/);
  await expect(page.locator('#atlas-challenge-hunt-desc')).toHaveCSS('font-family', /Inter/);
  await expect.poll(() => page.evaluate(async () => {
    await document.fonts.ready;
    return [...document.fonts].filter(font => font.status === 'loaded').map(font => font.family.replace(/["']/g, '')).sort();
  })).toEqual(expect.arrayContaining(['Inter', 'Sora']));
});

test('quiz outlines fit their frame and the flag hint stays in the corner', async ({ page }) => {
  await blockExternalRequests(page);
  for (const size of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(size);
    await page.goto('/');
    await page.locator('#btn-mode-challenge').click();
    await page.locator('#btn-start-game').click();
    await expect(page.locator('#silhouette-img')).toBeVisible();
    for (let round = 0; round < 8; round += 1) {
      const fit = await page.evaluate(() => {
        const box = document.getElementById('silhouette-box').getBoundingClientRect();
        const outline = document.querySelector('#silhouette-img path').getBoundingClientRect();
        const flag = document.getElementById('flag-hint').getBoundingClientRect();
        return {
          inside: outline.left >= box.left - 1 && outline.right <= box.right + 1 && outline.top >= box.top - 1 && outline.bottom <= box.bottom + 1,
          flagInCorner: flag.right <= box.right && flag.bottom <= box.bottom && flag.left > box.left + box.width / 2
        };
      });
      expect(fit, `${size.width}px round ${round + 1}`).toEqual({ inside: true, flagInCorner: true });
      await page.locator('#btn-skip').click();
      await expect(page.locator('#silhouette-img')).toBeVisible();
    }
  }
});

test('Challenge cards carry no decorative icon tiles or filler subtitle', async ({ page }) => {
  await blockExternalRequests(page);
  await page.goto('/');
  await page.locator('#btn-mode-challenge').click();
  await expect(page.locator('.atlas-challenge-icon')).toHaveCount(0);
  await expect(page.locator('.atlas-challenge-card-header svg')).toHaveCount(0);
  await expect(page.locator('#atlas-challenge-panel')).not.toContainText('Two ways');
});

test('Country Hunt globe turns and Shape Quiz outline changes through easy countries', async ({ page }) => {
  await blockExternalRequests(page);
  await page.goto('/');
  await page.locator('#btn-mode-challenge').click();

  const globe = page.locator('canvas.atlas-hunt-preview');
  await expect(globe).toBeVisible();
  const snapshot = () => globe.evaluate(canvas => canvas.toDataURL());
  const first = await snapshot();
  await expect.poll(snapshot, { timeout: 4000 }).not.toBe(first);

  const outline = page.locator('#quiz-preview-art .atlas-quiz-shape.is-visible path');
  await expect(outline).toHaveCount(1);
  const firstShape = await outline.getAttribute('d');
  await expect.poll(() => outline.getAttribute('d'), { timeout: 6500 }).not.toBe(firstShape);

  const easyOnly = await page.evaluate(async () => {
    const easy = new Set(window.countryCards.filter(card => card.difficulty === 'easy').map(card => card.id));
    return easy.size >= 20;
  });
  expect(easyOnly).toBe(true);
});

test('previews stay still when the visitor prefers reduced motion', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await blockExternalRequests(page);
  await page.goto('/');
  await page.locator('#btn-mode-challenge').click();
  const globe = page.locator('canvas.atlas-hunt-preview');
  const outline = page.locator('#quiz-preview-art .atlas-quiz-shape.is-visible path');
  await expect(outline).toHaveCount(1);
  const globeBefore = await globe.evaluate(canvas => canvas.toDataURL());
  const shapeBefore = await outline.getAttribute('d');
  await page.waitForTimeout(4500);
  expect(await globe.evaluate(canvas => canvas.toDataURL())).toBe(globeBefore);
  expect(await outline.getAttribute('d')).toBe(shapeBefore);
  await context.close();
});

test('indigo actions contrast with quiet navigation and mint answer feedback', async ({ page }) => {
  await blockExternalRequests(page);
  await page.goto('/');
  await page.locator('#btn-mode-challenge').click();
  const actionContrast = async locator => locator.evaluate(element => {
    const style = getComputedStyle(element);
    const luminance = value => {
      const channels = value.match(/[\d.]+/g).slice(0, 3).map(Number).map(channel => channel / 255)
        .map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
      return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
    };
    const levels = [luminance(style.color), luminance(style.backgroundColor)].sort((a, b) => b - a);
    return (levels[0] + 0.05) / (levels[1] + 0.05);
  });
  for (const selector of ['#btn-challenge-hunt', '#btn-start-game']) {
    await expect(page.locator(selector)).toHaveCSS('background-color', 'rgb(108, 59, 255)');
    await expect(page.locator(selector)).toHaveCSS('color', 'rgb(255, 255, 255)');
    expect(await actionContrast(page.locator(selector))).toBeGreaterThanOrEqual(4.5);
  }
  await page.locator('#btn-challenge-hunt').hover();
  await expect(page.locator('#btn-challenge-hunt')).toHaveCSS('background-color', 'rgb(122, 77, 255)');
  expect(await actionContrast(page.locator('#btn-challenge-hunt'))).toBeGreaterThanOrEqual(4.5);
  await page.locator('#btn-open-worldle').click();
  await expect(page.locator('#worldle-guess-submit')).toHaveCSS('background-color', 'rgb(108, 59, 255)');
  expect(await actionContrast(page.locator('#worldle-guess-submit'))).toBeGreaterThanOrEqual(4.5);
  const target = await page.evaluate(() => window.GeoWarsDailyWorldle.getDailyGame(window.countryCards).target.name);
  await page.locator('#worldle-guess-input').fill(target);
  await page.locator('#worldle-guess-input').press('Enter');
  await expect(page.locator('.worldle-guess-row:not(.is-empty)')).toHaveCSS('border-top-color', 'rgb(61, 242, 181)');
  await expect(page.locator('#worldle-modal')).toBeVisible();
  await expect(page.locator('#btn-worldle-share')).toHaveCSS('background-color', 'rgb(108, 59, 255)');
  await page.locator('#btn-worldle-modal-close').click();
  await page.locator('#btn-mode-challenge').click();
  await page.locator('#btn-start-game').click();
  await page.locator('#streak-display').evaluate(element => element.classList.remove('hidden'));
  await expect(page.locator('#streak-display')).toHaveCSS('color', 'rgb(255, 209, 102)');
});

for (const viewport of viewports) {
  test.describe(`mode navigation on ${viewport.name}`, () => {
    test.beforeEach(async ({ page }) => {
      await blockExternalRequests(page);
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      await page.locator('#btn-mode-explore').click();
    });

    test('reaches Explore, Shapes, Country Hunt, Sprint, and Daily Puzzle within the activation budget', async ({ page }) => {
      const { activate, count } = activationCounter();
      await expect(page.locator('#btn-mode-explore')).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('#atlas-globe-workspace')).toBeVisible();
      expect(count()).toBe(0);

      await activate(page.locator('#btn-atlas-shapes'));
      await expect(page.locator('#atlas-shapes-workspace')).toBeVisible();
      expect(count()).toBe(1);

      await activate(page.locator('#btn-mode-challenge'));
      await activate(page.locator('#btn-challenge-hunt'));
      await expect.poll(() => page.evaluate(() => window.GeoWars.explorer.getState().huntActive)).toBe(true);
      expect(count()).toBe(3);

      await page.reload();
      const huntCounter = activationCounter();
      await huntCounter.activate(page.locator('#btn-mode-challenge'));
      await huntCounter.activate(page.locator('#btn-challenge-hunt'));
      await expect.poll(() => page.evaluate(() => window.GeoWars.explorer.getState().huntActive)).toBe(true);
      expect(huntCounter.count()).toBe(2);

      await page.reload();
      const sprintCounter = activationCounter();
      await sprintCounter.activate(page.locator('#btn-mode-challenge'));
      if (viewport.width < 768) await sprintCounter.activate(page.locator('#btn-sprint'));
      await sprintCounter.activate(page.locator('#btn-start-game'));
      await expect(page.locator('#game')).toBeVisible();
      await expect(page.locator('#game-mode-label')).toContainText('Sprint');
      expect(sprintCounter.count()).toBe(viewport.width < 768 ? 3 : 2);

      await page.goto('/');
      const dailyCounter = activationCounter();
      await dailyCounter.activate(page.locator('#btn-open-worldle'));
      await expect(page.locator('#worldle-screen')).toBeVisible();
      expect(dailyCounter.count()).toBe(1);

      await page.goto('/');
      const practiceCounter = activationCounter();
      await practiceCounter.activate(page.locator('#btn-mode-challenge'));
      if (viewport.width >= 768) await practiceCounter.activate(page.locator('#atlas-utility-menu > summary'));
      await practiceCounter.activate(page.locator('#btn-showoff'));
      if (viewport.width >= 768) await practiceCounter.activate(page.locator('#atlas-utility-menu > summary'));
      await practiceCounter.activate(page.locator('#btn-start-game'));
      await expect(page.locator('#game')).toBeVisible();
      await expect(page.locator('#game-mode-label')).toContainText('Practice');
      expect(practiceCounter.count()).toBe(viewport.width < 768 ? 3 : 5);
    });

    test('switches between every Explore and Challenge state with one activation', async ({ page }) => {
      const { activate, count } = activationCounter();

      await activate(page.locator('#btn-atlas-shapes'));
      expect(count()).toBe(1);
      await activate(page.locator('#btn-mode-challenge'));
      expect(count()).toBe(2);
      await expect(page.locator('#atlas-challenge-panel')).toBeVisible();
      await activate(page.locator('#btn-mode-explore'));
      expect(count()).toBe(3);
      await expect(page.locator('#atlas-shapes-workspace')).toBeVisible();
      await activate(page.locator('#btn-mode-challenge'));
      expect(count()).toBe(4);
      await expect(page.locator('#atlas-challenge-panel')).toBeVisible();
      await activate(page.locator('#btn-mode-explore'));
      expect(count()).toBe(5);
      await expect(page.locator('#atlas-shapes-workspace')).toBeVisible();
    });

    test('keeps navigation labels and the page inside the viewport', async ({ page }) => {
      for (const [id, label] of [
        ['#btn-mode-explore', 'Explore'],
        ['#btn-mode-challenge', 'Challenge'],
        ['#btn-open-worldle', 'Daily Puzzle']
      ]) {
        await expect(page.locator(id)).toContainText(label);
      }

      await assertNoHorizontalOverflow(page, viewport.width);
      await page.locator('#btn-mode-challenge').click();
      await expect(page.locator('#atlas-challenge-panel')).toBeVisible();
      await assertNoHorizontalOverflow(page, viewport.width);

      if (viewport.width < 768) {
        const undersized = await page.locator([
          '.atlas-primary-nav button',
          '#atlas-explore-switch button',
          '#atlas-challenge-panel button',
          '#atlas-challenge-panel select'
        ].join(',')).evaluateAll(elements => elements
          .filter(element => {
            const style = getComputedStyle(element);
            return style.display !== 'none' && style.visibility !== 'hidden'
              && element.getClientRects().length > 0;
          })
          .map(element => {
            const rect = element.getBoundingClientRect();
            return { id: element.id, width: rect.width, height: rect.height };
          })
          .filter(rect => rect.width < 44 || rect.height < 44));
        expect(undersized).toEqual([]);

        const startControls = await page.locator('#btn-challenge-hunt, #btn-start-game').evaluateAll(elements => elements.map(element => {
          const rect = element.getBoundingClientRect();
          return { id: element.id, top: rect.top, bottom: rect.bottom, height: rect.height };
        }));
        expect(await page.evaluate(() => window.scrollY)).toBe(0);
        expect(startControls.length).toBe(2);
        const primary = startControls.find(control => control.id === 'btn-start-game');
        const nav = await page.locator('.atlas-primary-nav').boundingBox();
        expect(primary.top >= 0 && primary.bottom <= nav.y && primary.height >= 44).toBe(true);
      }
    });

    test('moves focus to the revealed heading and announces each primary mode', async ({ page }) => {
      await page.locator('#btn-mode-challenge').click();
      await expect(page.locator('#atlas-challenge-title')).toBeFocused();
      await expect(page.locator('#explorer-live')).toHaveText(/Challenge mode/);

      await page.locator('#btn-mode-explore').click();
      await expect(page.locator('#atlas-globe-title')).toBeFocused();
      await expect(page.locator('#explorer-live')).toHaveText(/Explore mode\. Globe view\./);

      await page.locator('#btn-atlas-shapes').click();
      await page.locator('#btn-mode-challenge').click();
      await page.locator('#atlas-challenge-title').waitFor();
      await page.locator('#btn-mode-explore').click();
      await expect(page.locator('#atlas-shapes-title')).toBeFocused();
      await expect(page.locator('#explorer-live')).toHaveText(/Explore mode\. Shapes view\./);
    });

    test('exposes the compatibility APIs and a visible keyboard focus indicator', async ({ page }) => {
      const api = await page.evaluate(() => ({
        atlas: Object.keys(window.GeoWars.atlas),
        worldleOpen: typeof window.GeoWars.worldle.open,
        explorerStartHunt: typeof window.GeoWars.explorer.startHunt,
        explorerDismissSummary: typeof window.GeoWars.explorer.dismissHuntSummary,
        navigateShowExplorer: typeof window.GeoWars.navigate.showExplorer
      }));
      expect(api.atlas).toEqual(expect.arrayContaining([
        'showGlobe',
        'showShapes',
        'selectCountry',
        'getState',
        'showExplore',
        'showChallenge',
        'openDailyPuzzle',
        'returnFromDailyPuzzle'
      ]));
      expect(api.worldleOpen).toBe('function');
      expect(api.explorerStartHunt).toBe('function');
      expect(api.explorerDismissSummary).toBe('function');
      expect(api.navigateShowExplorer).toBe('function');

      await page.keyboard.press('Tab');
      const outlineWidth = await page.evaluate(() => parseFloat(getComputedStyle(document.activeElement).outlineWidth));
      expect(outlineWidth).toBeGreaterThan(0);
    });

    test('maintains readable contrast and a single selected treatment', async ({ page }) => {
      const results = await page.evaluate(() => {
        const controls = [...document.querySelectorAll(
          '.atlas-primary-nav button, #atlas-explore-switch button'
        )];
        const rgb = value => (value.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
        const luminance = color => {
          const channels = rgb(color).map(channel => channel / 255).map(channel =>
            channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
          );
          return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
        };
        const contrast = (first, second) => {
          const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
          return (values[0] + 0.05) / (values[1] + 0.05);
        };
        const composite = (foreground, background) => {
          const fg = rgb(foreground);
          const bg = rgb(background);
          const alphaMatch = foreground.match(/^rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)$/);
          if (!alphaMatch) return foreground;
          const alpha = Number(alphaMatch[1]);
          return `rgb(${fg.map((value, index) => Math.round(value * alpha + bg[index] * (1 - alpha))).join(', ')})`;
        };
        return controls.map(element => {
          const style = getComputedStyle(element);
          const groupBackground = getComputedStyle(element.parentElement).backgroundColor;
          const background = composite(style.backgroundColor, groupBackground);
          const texts = [...element.querySelectorAll('.atlas-nav-copy strong')]
            .filter(text => getComputedStyle(text).display !== 'none')
            .map(text => ({
              label: text.textContent.trim(),
              ratio: contrast(getComputedStyle(text).color, background)
            }));
          const cue = getComputedStyle(element, '::after');
          return {
            id: element.id,
            pressed: element.getAttribute('aria-pressed') === 'true',
            textRatios: texts,
            iconFill: getComputedStyle(element.querySelector('.icon path')).fill,
            iconRatio: contrast(getComputedStyle(element.querySelector('.icon path')).fill, background),
            selectedRatio: contrast(background, groupBackground),
            cueVisible: cue.content !== 'none' && cue.content !== 'normal' && cue.display !== 'none',
          };
        });
      });

      for (const control of results) {
        for (const text of control.textRatios) {
          expect(text.ratio, `${control.id} text "${text.label}"`).toBeGreaterThanOrEqual(4.5);
        }
        expect(control.iconFill, `${control.id} icon fill`).not.toBe('none');
        expect(control.iconRatio, `${control.id} icon`).toBeGreaterThanOrEqual(3);
        expect(control.cueVisible, `${control.id} extra underline`).toBe(false);
        if (control.pressed) {
          expect(control.selectedRatio, `${control.id} selected background`).toBeGreaterThanOrEqual(3);
        }
      }
    });
  });
}

function activationCounter() {
  let activations = 0;
  return {
    async activate(locator) {
      activations += 1;
      await locator.click();
    },
    count: () => activations
  };
}

async function assertNoHorizontalOverflow(page, viewportWidth) {
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollWidth).toBeLessThanOrEqual(viewportWidth);
}

async function blockExternalRequests(page) {
  await page.route(/^https:\/\/(?!127\.0\.0\.1)/, route => route.abort());
}
