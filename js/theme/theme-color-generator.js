;(function () {
  if (!window.__paso) window.__paso = {}
  window.__paso.generateThemeColors = function (color) {
    color = tinycolor(color)
    let primary1 = tinycolor(colorPalette(color, 1))
    let styleElem = document.createElement('style')
    styleElem.innerHTML = `
        :root {
            --paso-primary-color: ${color};
            --paso-primary-color-disabled: ${colorPalette(color, 2)};
            --paso-primary-color-hover: ${colorPalette(color, 5)};
            --paso-primary-color-active: ${colorPalette(color, 7)};
            --paso-primary-color-outline: ${color
              .clone()
              .setAlpha(color.getAlpha() * 0.2)
              .toString()};
            --paso-primary-color-deprecated-bg: ${primary1.toString()};
            --paso-primary-color-deprecated-border: ${colorPalette(color, 3)};
            --paso-primary-1: ${colorPalette(color, 1)};
            --paso-primary-2: ${colorPalette(color, 2)};
            --paso-primary-3: ${colorPalette(color, 3)};
            --paso-primary-4: ${colorPalette(color, 4)};
            --paso-primary-5: ${colorPalette(color, 5)};
            --paso-primary-6: ${color};
            --paso-primary-7: ${colorPalette(color, 7)};
            --paso-primary-8: ${colorPalette(color, 8)};
            --paso-primary-9: ${colorPalette(color, 9)};
            --paso-primary-10: ${colorPalette(color, 10)};
            --paso-primary-color-deprecated-l-35: ${color.clone().lighten(35).toString()};
            --paso-primary-color-deprecated-l-20: ${color.clone().lighten(20).toString()};
            --paso-primary-color-deprecated-t-20: ${new Values(color.toString()).tint(20).hexString()};
            --paso-primary-color-deprecated-t-50: ${new Values(color.toString()).tint(50).hexString()};
            --paso-primary-color-deprecated-f-12: ${color
              .clone()
              .setAlpha(color.getAlpha() * 0.12)
              .toString()};
            --paso-primary-color-active-deprecated-f-30: ${primary1
              .clone()
              .setAlpha(primary1.getAlpha() * 0.3)
              .toString()};
            --paso-primary-color-active-deprecated-d-02: ${primary1.clone().darken(2).toString()};
        }
      `
    document.head.append(styleElem)
  }
})()
