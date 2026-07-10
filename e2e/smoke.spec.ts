import { test, expect, type Page } from '@playwright/test'

// Instant, deterministic speech so the game never waits on real TTS in CI.
// The baked-mp3 manifest is stubbed empty so speak() always takes the
// (also stubbed) speechSynthesis path — headless Chromium can't play audio.
async function stubSpeech(page: Page) {
  await page.route('**/audio/manifest.json', (route) =>
    route.fulfill({ json: {} })
  )
  await page.addInitScript(() => {
    class FakeUtterance {
      text = ''
      lang = ''
      pitch = 1
      rate = 1
      voice: unknown = null
      onend: (() => void) | null = null
      onerror: (() => void) | null = null
      constructor(text: string) {
        this.text = text
      }
    }
    const synth = {
      speak: (u: InstanceType<typeof FakeUtterance>) => setTimeout(() => u.onend?.(), 5),
      cancel: () => {},
      getVoices: () => [],
      addEventListener: () => {}
    }
    Object.defineProperty(window, 'speechSynthesis', { value: synth })
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: FakeUtterance })
  })
}

async function completeOnboarding(page: Page) {
  await page.goto('/?seed=42')
  await page.getByTestId('pick-pt').click()
  await page.getByTestId('child-name').fill('Teste')
  await page.getByTestId('start-app').click()
  await expect(page.getByTestId('world-map')).toBeVisible()
}

/** Solve a tap-count question correctly: tap every dino, then pick the count */
async function solveTapCountQuestion(page: Page, questionIndex: number) {
  // wait until the stage has actually advanced to this question
  await expect(page.getByTestId('mission-stage')).toHaveAttribute('data-question', String(questionIndex))
  const dinos = page.locator('[data-testid^="dino-"]')
  await expect(dinos.first()).toBeVisible()
  const count = await dinos.count()
  for (let i = 0; i < count; i++) {
    await page.getByTestId(`dino-${i}`).click()
  }
  await page.getByTestId(`choice-${count}`).click()
}

test('first mission: play, earn stars, persist across reload', async ({ page }) => {
  await stubSpeech(page)
  await completeOnboarding(page)

  await expect(page.getByTestId('star-balance')).toHaveText('0')

  // dv-01 is a 5-question tap-count mission (deterministic under ?seed=42)
  // force: the "next mission" node pulses by design; skip the stability wait
  await page.getByTestId('mission-dv-01').click({ force: true })
  await expect(page.getByTestId('mission-player')).toBeVisible()

  for (let q = 0; q < 5; q++) {
    await solveTapCountQuestion(page, q)
  }

  // chest ceremony → session-end ritual with the 3 stars banked
  await expect(page.getByTestId('session-end')).toBeVisible({ timeout: 20_000 })
  await expect(page.getByTestId('end-star-balance')).toContainText('3')
  await page.getByTestId('back-to-map').click()

  // back on the map: stars banked, next mission unlocked
  await expect(page.getByTestId('star-balance')).toHaveText('3')
  await expect(page.getByTestId('mission-dv-02')).toBeEnabled()

  // progress survives a full reload (IndexedDB persistence)
  await page.reload()
  await expect(page.getByTestId('world-map')).toBeVisible()
  await expect(page.getByTestId('star-balance')).toHaveText('3')
  await expect(page.getByTestId('mission-dv-02')).toBeEnabled()
})

test('miss handling: wrong answer leads to retry, second miss to solve-together', async ({ page }) => {
  await stubSpeech(page)
  await completeOnboarding(page)
  // force: the "next mission" node pulses by design; skip the stability wait
  await page.getByTestId('mission-dv-01').click({ force: true })

  // count the dinos, then deliberately pick a wrong numeral twice
  const dinos = page.locator('[data-testid^="dino-"]')
  await expect(dinos.first()).toBeVisible()
  const count = await dinos.count()
  const wrong = (n: number) =>
    page
      .locator('[data-testid^="choice-"]')
      .locator(`:scope:not([data-testid="choice-${n}"])`)
      .first()

  for (let i = 0; i < count; i++) await page.getByTestId(`dino-${i}`).click()
  await wrong(count).click()

  // 1st miss → same question again in hint mode (pattern remounts, no fail state)
  await expect(dinos.first()).toBeVisible()
  for (let i = 0; i < count; i++) await page.getByTestId(`dino-${i}`).click()
  await wrong(count).click()

  // 2nd miss → guide solves it together and auto-advances to question 2
  await expect(page.locator('.progress-dot--done')).toHaveCount(1, { timeout: 30_000 })
})

test('touch targets on the world map are at least 64px', async ({ page }) => {
  await stubSpeech(page)
  await completeOnboarding(page)

  for (const button of await page.locator('button:visible').all()) {
    const box = await button.boundingBox()
    expect(box, 'button should be measurable').not.toBeNull()
    expect(box!.width, 'touch target width').toBeGreaterThanOrEqual(64)
    expect(box!.height, 'touch target height').toBeGreaterThanOrEqual(64)
  }
})

test('language toggle switches to Japanese', async ({ page }) => {
  await stubSpeech(page)
  await completeOnboarding(page)
  await expect(page.getByTestId('world-map')).toContainText('Vale dos Dinos')
  await page.getByTestId('lang-toggle').click()
  await expect(page.getByTestId('world-map')).toContainText('ダイノバレー')
})
