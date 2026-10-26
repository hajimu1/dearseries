# 20 · v2 에셋 및 프롬프트

내장 image_gen으로 개별 생성. profile-v2.png는 정면 프로필 전용, event-cg-v2.png는 인물·배경을 합친 단일 CG, sidebar-v2.png는 우측 전용 장식 패널이다. 기존 분리형 원본은 보관하며 현재 장면에서는 불러오지 않는다. roses-v1.png는 대사창 위에 한 번만 사용한다. 참고는 사용자가 제공한 고전 미연시 화면들이다.

## profile-v2.png

Create a separate square profile portrait asset for a 1990s PC-98 romance game. Reference image is CHARACTER IDENTITY ONLY: preserve silver lavender long tied-back hair, slim handsome male face, purple eyes, black high collar uniform with gold buttons and white shirt. NEW POSE: front-facing head and shoulders, looking gently toward viewer, small knowing smile, both hands completely outside frame. Do not crop or reuse the hand-at-head pose. Entire head and hair top comfortably inside frame, centered, shoulders at bottom. Opaque muted dusty pink and plum subtly dithered background. Crisp detailed PC98 pixel clusters, limited colors, navy outlines and checkerboard shading, matching reference illustration. No UI, frame, text, flowers or other objects. Square composition, distinct portrait illustration for a small profile slot.

## event-cg-v2.png

Use case: compositing. Produce ONE finished opaque event CG image for a PC98 romance game, landscape aspect 1.83:1. Image 1 is character identity and pose reference; Image 2 is corridor background. Combine them into a coherent finished illustration: same silver lavender ponytailed male in black gold-button school uniform, hand against hair, waist-up centered slightly right, in this flowering-window school corridor after class. Preserve the character's face, outfit, hairstyle and pose; preserve recognizable corridor windows with cherry blossoms, perspective and palette. Fit the whole top of hair within image, character occupies 90 percent of image height, face clearly readable, leave corridor visible on both sides. Warm afternoon light naturally integrated on character, deliberate crisp PC98 pixel/dither texture throughout. Fully opaque single image, background and person baked together, no transparent parts, no border, no captions, no interface, no other characters.

## sidebar-v2.png

Standalone decorative RIGHT SIDEBAR skin asset for an ornate 1990s PC98 romance visual novel. Portrait format exact ratio 140:363 (about 1:2.59), full rectangular panel viewed flat straight-on, no perspective. Exquisite pixel-art lilac silver and dusty plum beveled metal, dark navy ink, cream highlights, tiny checkerboard dithering, restrained burgundy and antique gold details. Layout is crucial: top 5%-36% contains a completely empty solid dark plum rectangular portrait recess centered, occupying 78% width, with ornate silver corner brackets; 39%-46% a wide empty purple nameplate with small gold side studs; 48%-55% a separate blank parchment thin information plaque; 58%-76% an empty dark navy calendar/clock window with ivory double borders, tiny crescent and star motif confined to upper corners, leave center empty for runtime text; 80%-98% two DISTINCT small decorative relief emblems, an antique feather quill with sealed ivory envelope on left and a silver key with violet faceted gem on right, set in individually shaped beveled compartments. Outer edge has slender silver vine filigree and pearl rivets. No roses, no repeated motifs or duplicate resource icons. No character, no photographs, NO letters numbers words labels pseudo-text anywhere. Not a whole game screen, only this one tall sidebar panel. Fine intricate pixel detail but simple readable empty text zones. Opaque background.

## sidebar-v2.png exterior alpha correction

Edit this sidebar asset only: remove every gray and white checkerboard pixel OUTSIDE the ornate outer perimeter and replace with actual transparent alpha. Keep every ornamental edge, all panel geometry, all interior dark/plum/cream filled compartments, colors and objects exactly unchanged. Interior compartments remain opaque. No checkerboard painted in the image. True transparent exterior, tightly retain original full panel proportions. Do not redraw, add, move or crop ornaments.


