# BKBK Studios development preview

This branch is a review draft. Do not merge or publish without Badayer's explicit approval.

## Implemented

- Actual semantic HTML sections for Home, About, Shop, Services, Portfolio, Films and Contact.
- English/Arabic interface, RTL layout, persistent language and day/night preferences.
- Separate approved day and night source photographs, without generation or replacement.
- Entry/skip intro, responsive navigation, real content search, category filtering, artwork viewer and Bee navigation dialog.
- Original Bee portrait preserved. Accessible native dialogs, keyboard focus, reduced-motion support.
- Catalogue prices from the owner's supplied catalogue. No fabricated checkout or message delivery.
- Enquiry preparation/copy, with explicit success only after clipboard success.

## Still required before acceptance

- Approved day/night photographs have different scenery: the day image shows a coastal landscape, while night shows Dubai. They are preserved exactly; they cannot meet the identical-location criterion simultaneously.
- The approved logo and floral cursor are supplied within reference sheets, not standalone transparent assets. The header currently uses a text wordmark; exact floral logo/cursor extraction remains pending.
- Environmental motion currently consists only of localized light variation. Independent realistic curtain/water/vegetation animation is not completed. No whole-background zoom is presented as animation.
- Bee remains static to preserve her face. No realistic blink, hair or dress animation is claimed.
- No approved audio files are supplied. Sound button explains availability; it does not pretend to play audio. Full ambient playback/mixing remains pending.
- Existing repository contains social URLs, but account ownership has not been independently confirmed. Contact/purchase destinations remain unconnected. No contact email is inferred from the GitHub account email.
- Approved film/video files and verified Gumroad purchase URLs are absent. No fictional projects, clients or checkout links are displayed.
- Full floral logo/visual comparison and all acceptance criteria remain pending. This is not a completed or published redesign.

## Source assets

See assets/approved-manifest.json for all 20 supplied images, dimensions and SHA-256 hashes. Active scene images are original files copied without re-encoding. Source resolutions are 1536×1024 or smaller, not native 4K.

## Local preview

Run `python -m http.server 8765` from this repository and open http://localhost:8765.
