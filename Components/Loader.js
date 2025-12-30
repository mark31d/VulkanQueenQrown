// Components/Loader.js
import React, { memo, useMemo } from 'react';
import { StyleSheet, ImageBackground, StatusBar, View, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

const BACK = require('../assets/bg.webp');

function buildHtml({ size = 1.5 }) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
  />
  <style>
    html, body {
      margin: 0;
      padding: 0;
      background: transparent;
      width: 100%;
      height: 100%;
      overflow: hidden;
      -webkit-text-size-adjust: 100%;
    }
    * { -webkit-tap-highlight-color: transparent; }
    .wrap {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
    }

    /* From Uiverse.io by ZacharyCrespin */
    @keyframes square-animation {
      0% {
        left: 0;
        top: 0;
      }

      10.5% {
        left: 0;
        top: 0;
      }

      12.5% {
        left: 32px;
        top: 0;
      }

      23% {
        left: 32px;
        top: 0;
      }

      25% {
        left: 64px;
        top: 0;
      }

      35.5% {
        left: 64px;
        top: 0;
      }

      37.5% {
        left: 64px;
        top: 32px;
      }

      48% {
        left: 64px;
        top: 32px;
      }

      50% {
        left: 32px;
        top: 32px;
      }

      60.5% {
        left: 32px;
        top: 32px;
      }

      62.5% {
        left: 32px;
        top: 64px;
      }

      73% {
        left: 32px;
        top: 64px;
      }

      75% {
        left: 0;
        top: 64px;
      }

      85.5% {
        left: 0;
        top: 64px;
      }

      87.5% {
        left: 0;
        top: 32px;
      }

      98% {
        left: 0;
        top: 32px;
      }

      100% {
        left: 0;
        top: 0;
      }
    }

    .loader {
      position: relative;
      width: 96px;
      height: 96px;
      transform: rotate(45deg) scale(${size});
      transform-origin: center;
    }

    .loader-square {
      position: absolute;
      top: 0;
      left: 0;
      width: 28px;
      height: 28px;
      margin: 2px;
      border-radius: 0px;
      background-size: cover;
      background-position: center;
      background-attachment: fixed;
      animation: square-animation 10s ease-in-out infinite both;
    }

    .loader-square:nth-of-type(0) {
      animation-delay: 0s;
      background: #DAA520; /* глубокий золотой */
    }

    .loader-square:nth-of-type(1) {
      animation-delay: -1.4285714286s;
      background: #003366; /* темный синий */
    }

    .loader-square:nth-of-type(2) {
      animation-delay: -2.8571428571s;
      background: #DAA520; /* глубокий золотой */
    }

    .loader-square:nth-of-type(3) {
      animation-delay: -4.2857142857s;
      background: #003366; /* темный синий */
    }

    .loader-square:nth-of-type(4) {
      animation-delay: -5.7142857143s;
      background: #DAA520; /* глубокий золотой */
    }

    .loader-square:nth-of-type(5) {
      animation-delay: -7.1428571429s;
      background: #003366; /* темный синий */
    }

    .loader-square:nth-of-type(6) {
      animation-delay: -8.5714285714s;
      background: #DAA520; /* глубокий золотой */
    }

    .loader-square:nth-of-type(7) {
      animation-delay: -10s;
      background: #003366; /* темный синий */
    }
  </style>
</head>

<body>
  <div class="wrap">
    <!-- From Uiverse.io by ZacharyCrespin -->
    <div class="loader">
      <div class="loader-square"></div>
      <div class="loader-square"></div>
      <div class="loader-square"></div>
      <div class="loader-square"></div>
      <div class="loader-square"></div>
      <div class="loader-square"></div>
      <div class="loader-square"></div>
    </div>
  </div>
</body>
</html>`;
}

function Loader({ size = 1.5 }) {
  const html = useMemo(() => buildHtml({ size }), [size]);

  // размер WebView с учетом масштаба и запасом, чтобы не обрезались квадраты
  const webSize = Math.round(150 * size);

  return (
    <ImageBackground source={BACK} resizeMode="cover" style={styles.bg}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={styles.center}>
        <WebView
          originWhitelist={['*']}
          source={{ html }}
          style={[styles.web, { width: webSize, height: webSize }]}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          javaScriptEnabled
          domStorageEnabled
          automaticallyAdjustContentInsets={false}
          // ✅ ВАЖНО для Android: mask/blur/filter работают стабильнее в software
          androidLayerType={Platform.OS === 'android' ? 'software' : undefined}
        />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, overflow: 'hidden' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  web: {
    backgroundColor: 'transparent',
  },
});

export default memo(Loader);
