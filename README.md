# Dear Series · 분리형 사이트

이 폴더 전체를 GitHub Pages 배포 루트로 사용하세요. 진입점은 `index.html`입니다. 장면은 `scenes/01-desktop.html`부터 `scenes/06-horror.html`까지 개별 파일이며, 각 장면 코드와 공통 코드는 `js/`, 스타일은 `css/`, 이미지와 폰트는 `assets/`와 `fonts/`에 있습니다.

분리형 사이트는 HTTP로 열어야 브라우저의 캔버스 보안 제한 없이 저장할 수 있습니다. 서버 없이 오프라인으로 사용할 때는 상위 폴더의 `offline/index.html`을 여세요. `node build-offline.mjs`를 상위 폴더에서 실행하면 현재 site/ 소스로 오프라인 버전을 다시 생성합니다.

장면을 이동해도 각 장면의 편집 내용은 열린 탭 안에서 유지됩니다. 새로고침하거나 창을 닫으면 초기화됩니다.
