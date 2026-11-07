# Salon showcase 3D objects

The showcase is a **fictional client demo**, not a photograph or an accurate reconstruction of Bhanu's existing studio.

## Reused third-party 3D assets

The following downloaded **GLB models are licensed CC0 1.0 Universal**, and are used only as digital scenery. Asset pages and the exact immutable source URLs were checked before integration. They are bundled locally by `.github/workflows/salon-model-assets.yml` so preview users do not rely on a third-party host at runtime.

| Service | Visual asset | Original asset page | GLB source |
|---|---|---|---|
| Hair styling | Grooming tool display | https://3dassets.dev/assets/clinic-and-veterinary-practice-clipper-tool-rail-fb444d59 | https://cdn.3dassets.dev/assets/16799/v1/model.glb |
| Hair treatments | Double-sided salon styling island | https://3dassets.dev/assets/barbershop-and-hair-salon-double-sided-styling-island-cdbb931f | https://cdn.3dassets.dev/assets/29639/v1/model.glb |
| Grooming | Hydraulic salon chair | https://3dassets.dev/assets/barbershop-and-hair-salon-hydraulic-barber-chair-0540a17c | https://cdn.3dassets.dev/assets/29634/v1/model.glb |
| Skin care | Spa treatment trolley and bottles | https://3dassets.dev/assets/hotel-and-resort-operations-treatment-trolley-8b2e9724 | https://cdn.3dassets.dev/assets/25938/v1/model.glb |
| Spa | Waiting-area sofa | https://3dassets.dev/assets/barbershop-and-hair-salon-waiting-sofa-0c939a6a | https://cdn.3dassets.dev/assets/29644/v1/model.glb |

**Licence:** https://creativecommons.org/publicdomain/zero/1.0/ . 3DAssets.dev documents that every model is CC0, permits commercial redistribution and requires no attribution; this document records sources voluntarily.

The makeup station retains its existing procedural demonstration model until a suitable separately verified asset is found. **Do not claim that all six models have been replaced by scanned photorealistic assets.** These are game-ready models which improve geometry and material detail but still rely on real-time WebGL lighting.

## Fallback and performance

- Existing locally generated Three.js models remain visible until a validated GLB loads, then the loaded model replaces the placeholder.
- If downloading fails, the procedural model remains accessible and the service chooser, booking, and close button work.
- Loading begins only when the showcase is near the viewport and only on desktop, where the stage is displayed. Tablet/mobile continue to use the accessible service list.
- Source files are small self-contained GLBs with embedded textures.
- Click **X** or **All departments** to close a service's detail view; the camera and scroll return to the same full-showcase position. Esc is an alternative.
