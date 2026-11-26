# SRS Vision Official Website — Design v2

This is the responsive public-facing website package using the approved white, royal-purple and electric-blue design direction.

## Files
- `official.html` — website page
- `official.css` — responsive styles
- `official.js` — navigation, published-content loading and enquiry form
- `README-OFFICIAL.md` — setup notes

## Add to the existing GitHub repository
1. Download and extract this ZIP.
2. Upload `official.html`, `official.css`, and `official.js` to the root of the existing `srs-vision-firebase-realtime` repository.
3. Keep the existing `firebase-config.js` in the same root folder. Do not create another Firebase project or replace the config.
4. Open `official.html` to preview the public website. GitHub Pages can serve it at `/official.html` after the files are committed.

## Existing Firebase data paths
The public website reads only:
- `/srsVision/publicSite/services`
- `/srsVision/publicSite/portfolio`

Client quotation/enquiry form submits to:
- `/srsVision/clientInquiries`

Expected service example:
```json
{
  "title": "Web Development",
  "description": "Modern responsive websites",
  "published": true
}
```

Expected portfolio example:
```json
{
  "title": "Sample project",
  "category": "Web Development",
  "description": "Project summary",
  "imageUrl": "https://example.com/project.jpg",
  "published": true
}
```

## Important before public launch
The repository's currently observed Realtime Database rules allow any authenticated user broad read/write access, and its current compatibility auth shim is not real authorization. Do not publish this site with client enquiry writes enabled until Firebase Authentication and path-specific Realtime Database rules are configured and tested. Public users must only be able to read published public content and submit validated enquiries; they must not read or write internal team data. Do not loosen rules to make the form work.

The Official Website Management panel inside the Unofficial Website is a separate integration task. This package is the public website only; it does not yet add that management panel.
