# Collection Master — Build 5.5 Realism Layer Fix

This build fixes the reason the realistic biome art was not visible in 5.3/5.4.

## Root cause
The theme images were:
- present in the repository
- referenced correctly by `dinosaurs.js`
- assigned correctly by `pathEngine.js`

But `.environment-art` used a negative z-index while `.path-region` had its own
opaque background. The realistic image was therefore rendered BEHIND the region
and could not be seen.

## 5.5 layer order
1. Realistic theme biome image
2. subtle image grading
3. dynamic water
4. fog
5. light rays
6. canopy shadow
7. optional procedural props
8. particles
9. winding route
10. dynamic 54 nodes
11. Token / labels

When a theme supplies raster art, the old CSS-built background terrain is now
disabled rather than covering it.

## Existing 5.4 fixes retained
- continuous serpentine route:
  1 2 3
  6 5 4
  7 8 9
  12 11 10
- no generic node popup
- future nodes locked and non-clickable
- completed/current nodes remain visible
- current-node auto-scroll remains

## Upload
Upload the whole package.

BUILD 5.5 confirms deployment.
