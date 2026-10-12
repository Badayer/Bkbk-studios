# BKBK Studios review preview

Development branch only. Publishing the live GitHub Pages site still requires Badayer's approval.

## Implemented and source provenance

Real HTML sections, English/Arabic translations and RTL layout, persistent language/day-night settings, responsive menu, functional search, guide/prompt filters, complete unambiguous catalogue prices, service details, enquiry copying, artwork lightbox and Bee navigation dialog. Native dialogs support close buttons and Escape. Bee's original pixels and appearance remain unchanged.

All photography comes from approved attachments. Desktop and portrait homepage scenes use the supplied day/night photographs. The header logo is cropped from the approved brand board. The introduction uses the board's floral logo panel, with actual buttons outside the artwork. The cursor uses a traced mask and resize of the supplied floral cursor sample; no new visual assets were generated.

Source-space masks sample only existing photograph pixels for restrained water shimmer and small curtain/leaf movement. Local candlelight glows are anchored to source-image coordinates. The camera, full background and architecture do not pan or zoom. Motion stops off-screen, when the document is hidden, on reduced-motion devices or when manually paused. These are subtle photographic effects, not physically simulated fabric or a fully animated video.

**Audio and the sound control were removed at the owner's explicit request.** No audio engine, audio files or playback controls are shipped.

Social destinations are copied exactly from the owner's original repository (Instagram bkbkstudios, TikTok bkbk.studios, YouTube bkbkstudios). Public profile fetching was blocked; external account ownership/reachability is not independently certified. No email address was inferred or invented.

## Verification

See scripts/qa.cjs and QA-RESULTS.json. Browser tests use Chromium responsive emulation, not physical iPhone/iPad or Safari. Offline exported HTML is also tested independently. JavaScript syntax checks run for both scripts. No live deployment is claimed.

## Remaining acceptance limitations

- Approved daytime scenes show a coast while approved nighttime scenes show Dubai; they are not identical locations/camera arrangements. No unauthorised replacement was made.
- Bee intentionally remains static under the prompt's face-preservation fallback. Blinking, hair and dress motion are not implemented.
- Photographic curtain/leaf effects are deliberately very small to avoid exposing unseen scenery; photoreal full fabric movement is not claimed.
- Gumroad purchase URLs, approved film files and verified business submission/contact details were not supplied. Shop cards prepare enquiries; there is no fake checkout or false send confirmation. Films has an enquiry action, not invented completed productions.
- Some old catalogue entries contain two unexplained prices for stamps. Those ambiguous prices were not guessed; the service category is described without a fabricated stamp price.
- Native source images are 1536×1024 or portrait 1024×1536 at most. No 4K claim is made.

## Run and export

Run `python -m http.server 8765` from the checkout for a local server. Run `node scripts/qa.cjs` with Playwright and `BKBK_CHROME` pointing to an installed Chromium executable. `python scripts/export-preview.py` creates a self-contained offline HTML review snapshot in the adjacent deliverables folder. Neither command deploys the site.
