/**
 * https://github.com/ant-design/ant-design/blob/master/components/style/color/colorPalette.less
 */
;(function () {
  let hueStep = 2
  let saturationStep = 0.16
  let saturationStep2 = 0.05
  let brightnessStep1 = 0.05
  let brightnessStep2 = 0.15
  let lightColorCount = 5
  let darkColorCount = 4

  let getHue = function (hsv, i, isLight) {
    let hue
    if (hsv.h >= 60 && hsv.h <= 240) {
      hue = isLight ? hsv.h - hueStep * i : hsv.h + hueStep * i
    } else {
      hue = isLight ? hsv.h + hueStep * i : hsv.h - hueStep * i
    }
    if (hue < 0) {
      hue += 360
    } else if (hue >= 360) {
      hue -= 360
    }
    return Math.round(hue)
  }
  let getSaturation = function (hsv, i, isLight) {
    // grey color don't change saturation
    if (hsv.h === 0 && hsv.s === 0) {
      return hsv.s
    }
    let saturation
    if (isLight) {
      saturation = hsv.s - saturationStep * i
    } else if (i === darkColorCount) {
      saturation = hsv.s + saturationStep
    } else {
      saturation = hsv.s + saturationStep2 * i
    }
    if (saturation > 1) {
      saturation = 1
    }
    if (isLight && i === lightColorCount && saturation > 0.1) {
      saturation = 0.1
    }
    if (saturation < 0.06) {
      saturation = 0.06
    }
    return Number(saturation.toFixed(2))
  }
  let getValue = function (hsv, i, isLight) {
    let value
    if (isLight) {
      value = hsv.v + brightnessStep1 * i
    } else {
      value = hsv.v - brightnessStep2 * i
    }
    if (value > 1) {
      value = 1
    }
    return Number(value.toFixed(2))
  }

  window.colorPalette = function (color, index) {
    let isLight = index <= 6
    let hsv = tinycolor(color).toHsv()
    let i = isLight ? lightColorCount + 1 - index : index - lightColorCount - 1
    return tinycolor({
      h: getHue(hsv, i, isLight),
      s: getSaturation(hsv, i, isLight),
      v: getValue(hsv, i, isLight)
    }).toHexString()
  }
})()
