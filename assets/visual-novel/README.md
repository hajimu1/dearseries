# 20 · After School — 개별 에셋

2026-10-25. 내장 `image_gen` 이미지 생성 도구로 각각 별도 생성했다. 생성 원본 크기와 투명도를 그대로 보관한다. 코드에서만 화면 크기에 맞춰 그리며 원본을 합치거나 덮어쓰지 않는다.

- `corridor-v1.png`: 방과 후 복도 배경.
- `character-v1.png`: 사용자 마지막 첨부를 참고한 은보라색 머리 인물, 투명 PNG. 장면과 프로필의 기본 이미지로 사용.
- `roses-v1.png`: 장미·은색 리본 장식, 투명 PNG.
- `character-reference.png`: 사용자가 제공한 테스트 캐릭터 원본. 생성물이 아님.

프레임, 대사창, 선택지, 선택 표시와 텍스트는 `site/js/20-visual-novel.js`의 canvas 렌더러에서 따로 그린다. 글자 수정·색 변경이 가능하며 PNG/GIF/영상에 동일하게 반영한다. 이미지 교체는 각 영역별로 독립적이다.

## 조사 자료

- https://www.famitsu.com/news/202310/08318863.html — 1992년 PC-98 동급생 회고 및 당시 화면. 사용자 제공 다섯 화면과 함께, 작은 고정 화면 분할·픽셀 테두리·대사 및 선택지 창의 참고로 사용. 사이트의 이미지를 제품 에셋으로 복사하지 않았다.
- 사용자가 제공한 1~5번 화면: 왼쪽 위 장면 / 왼쪽 아래 대사 / 오른쪽 프로필 구성, 제한된 색조, 도트 음영의 참고.

## 최종 생성 프롬프트 (원문)

### corridor-v1.png

Use case: illustration-story. Create one standalone background asset for a nostalgic 1992 PC-98 romance visual novel editor. Empty Japanese school corridor after class, large windows on left looking out to flowering cherry trees and distant town, classroom doors right, perspective receding toward right center. Lavender shadows, muted dusty rose, warm cream afternoon light, restrained navy outlines. Authentic finely dithered limited-palette pixel illustration, visible deliberate pixel clusters and checkerboard shading, no smooth modern digital painting. Landscape 3:2 composition. No people, no text, no logo, no UI, no border. A calm, wistful atmosphere; foreground clear for later separate character overlay.

### character-v1.png

Input reference: `character-reference.png`. `transparent_background: true`.

Use case: identity-preserve. Standalone character cutout asset for a 1990s PC-98 romance visual novel. Input is the character identity reference. Preserve exactly this handsome male character's silver lavender long ponytail, face, eyes, black high collar school jacket with gold buttons, open white shirt and hand resting against hair pose. Waist-up portrait, entire hair and raised arm within margins. Adapt to deliberate finely dithered PC98 pixel illustration with navy outlines and limited lavender, cream, rose palette, not modern smooth rendering. Remove only the white backdrop, genuine transparent background, no scene, no text, no frame. This will be composited independently over a school corridor and cropped as a profile portrait.

### roses-v1.png

`transparent_background: true`.

Use case: stylized-concept. One separate small decorative UI ornament for a 1992 PC-98 romance visual novel, reusable on a mauve silver interface: a symmetrical horizontal arrangement of three small dusty rose blossoms and dark desaturated sage leaves around a tiny silver ribbon, with two small pearl highlights. Crisp pixel art, limited 16-color palette, careful checkerboard dithering, black/navy outlines, cream lit edges, lavender shadows. Isolated on genuine transparency. Wide horizontal silhouette, generous empty transparent margins. No text, no lettering, no frame, no background scene, no extra symbols. This is an ornament asset, not a completed screen.

## 현재 사용 자산 (v2)

초기 구성 설명보다 이 구성이 우선한다. `event-cg-v2.png`는 배경+인물이 합쳐진 단일 CG, `profile-v2.png`는 별도로 생성한 정면 프로필, `sidebar-v2.png`는 오른쪽 전용 장식 패널이다. `roses-v1.png`는 대사창 위 한 번만 사용한다. 이전 복도·누끼·캐릭터 참고 원본은 보존하며 런타임에 불러오지 않는다. 프롬프트는 `PROMPTS-v2.md`에 기록했다.

## 현재 우측 패널 (명령 UI 수정)

`sidebar-v2.png`는 이전 시안으로 보존하며 현재 사용하지 않는다. 우측은 코드로 그리는 PC-98풍 픽셀 정보판과 ‘대화/선택’ 명령 버튼으로 변경했다. CG/전용 프로필/대사창 장미는 위 v2 구성을 유지한다.

## 생활 메뉴 수정

하단 ‘대화/선택’ 구간 버튼은 제거했다. 현재는 제공 레퍼런스 2처럼 TELEPHONE/PRESENT/HOROSCOPE/HOLIDAY의 정적 생활 메뉴 네 줄이며 각각 별도 픽셀 아이콘을 코드로 그린다. 대화 단계에 따라 바뀌지 않고 재생을 조작하지 않는다. 구간 미리보기는 외부 편집 패널에서 제공한다.

## 장미 위치 변경

roses-v1.png는 이제 대사창 위가 아니라 CG 상단 레일에 한 번 사용한다. 코드로 그린 은보라색 덩굴과 모서리 장식을 함께 사용하며 ‘CG 장미 프레임 장식’으로 켜고 끈다.
