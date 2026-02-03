# correction_date

- 2026-01-29: **Question:** Scope duplicate checks to a campaign only? **Action:** Added storage helpers `getPostByGuidInCampaign` and `getPostByImageUrlInCampaign` to support per-campaign duplication checks.
- 2026-01-29: **Question:** Should RSS duplicate article checks be campaign-scoped? **Action:** Updated RSS ingestion to check GUID duplicates only within the same campaign.
- 2026-01-29: **Question:** Should image selection avoid duplicates within a campaign only? **Action:** Added per-campaign image URL checks for OG images and stock images during post processing.
- 2026-01-29: **Question:** Should manual image search avoid duplicates per campaign? **Action:** Prevented selecting an image already used in the same campaign during /api/posts/:id/search-image.