import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from "react-native-reanimated";

// Parmakla renk seçimi: üstte doygunluk/parlaklık kutusu, altında ton şeridi.
// Ek paket yok: kutu, ton renginin üstüne beyaz→şeffaf (yatay) ve
// şeffaf→siyah (dikey) iki degradeyle çizilir. Sürüklerken seçim UI
// thread'inde akar; hex değeri JS'e yalnızca parmak hareket ettikçe yollanır.

const HUE_STOPS = ["#FF0000", "#FFFF00", "#00FF00", "#00FFFF", "#0000FF", "#FF00FF", "#FF0000"] as const;
const THUMB = 24;
const BAR_HEIGHT = 24;

function hsvToHex(h: number, s: number, v: number): string {
  "worklet";
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    const c = v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
    return Math.round(c * 255).toString(16).padStart(2, "0");
  };
  return `#${f(5)}${f(3)}${f(1)}`.toUpperCase();
}

function hexToHsv(hex: string): { h: number; s: number; v: number } {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return { h: 0, s: 1, v: 1 };
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max ? d / max : 0, v: max };
}

type HsvColorPickerProps = {
  /** Başlangıç rengi (#RRGGBB). */
  value: string;
  onChange: (hex: string) => void;
};

export function HsvColorPicker({ value, onChange }: HsvColorPickerProps) {
  const initial = hexToHsv(value);
  const hue = useSharedValue(initial.h);
  const sat = useSharedValue(initial.s);
  const val = useSharedValue(initial.v);
  const boxW = useSharedValue(1);
  const boxH = useSharedValue(1);
  const barW = useSharedValue(1);
  // Kutunun zemini (saf ton) React state'i; yalnızca ton değişince güncellenir.
  const [hueHex, setHueHex] = useState(hsvToHex(initial.h, 1, 1));

  // Seçicinin kendi yaydığı son renk: geri dönen `value` bununla aynıysa
  // imleçlere dokunulmaz (siyah/gri gibi tonu belirsiz renklerde seçilen
  // tonun kaybolmasını ve imlecin zıplamasını önler).
  const lastEmitted = useRef(value.toUpperCase());

  // Dışarıdan (hex alanı, hazır renk) gelen değişiklikte imleçler senkronlanır.
  useEffect(() => {
    const hex = value.toUpperCase();
    if (hex === lastEmitted.current) return;
    lastEmitted.current = hex;
    const next = hexToHsv(hex);
    // Gri tonlarda (doygunluk ya da parlaklık 0) ton tanımsızdır; mevcut ton korunur.
    if (next.s > 0 && next.v > 0) {
      hue.value = next.h;
      setHueHex(hsvToHex(next.h, 1, 1));
    }
    sat.value = next.s;
    val.value = next.v;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Yalnızca renk gerçekten değişince üst bileşene bildirilir; sürüklerken
  // aynı renk için modal boşuna yeniden çizilmez.
  // Jestler bir kez kurulduğu için güncel `onChange` ref üzerinden okunur.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const emit = (hex: string) => {
    if (hex === lastEmitted.current) return;
    lastEmitted.current = hex;
    onChangeRef.current(hex);
  };

  // Jestler her render'da yeniden kurulmasın.
  const [boxGesture, hueGesture] = useMemo(() => {
    const boxGesture = Gesture.Pan()
      .minDistance(0)
      .onBegin((e) => {
        sat.value = Math.min(Math.max(e.x / boxW.value, 0), 1);
        val.value = 1 - Math.min(Math.max(e.y / boxH.value, 0), 1);
        runOnJS(emit)(hsvToHex(hue.value, sat.value, val.value));
      })
      .onUpdate((e) => {
        sat.value = Math.min(Math.max(e.x / boxW.value, 0), 1);
        val.value = 1 - Math.min(Math.max(e.y / boxH.value, 0), 1);
        runOnJS(emit)(hsvToHex(hue.value, sat.value, val.value));
      });

    const setHueFromX = (x: number) => {
      "worklet";
      hue.value = Math.min(Math.max(x / barW.value, 0), 0.9999) * 360;
      runOnJS(setHueHex)(hsvToHex(hue.value, 1, 1));
      runOnJS(emit)(hsvToHex(hue.value, sat.value, val.value));
    };
    const hueGesture = Gesture.Pan()
      .minDistance(0)
      .onBegin((e) => setHueFromX(e.x))
      .onUpdate((e) => setHueFromX(e.x));
    return [boxGesture, hueGesture];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const boxThumbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: sat.value * boxW.value - THUMB / 2 },
      { translateY: (1 - val.value) * boxH.value - THUMB / 2 },
    ],
    backgroundColor: hsvToHex(hue.value, sat.value, val.value),
  }));
  const hueThumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (hue.value / 360) * barW.value - THUMB / 2 }],
    backgroundColor: hsvToHex(hue.value, 1, 1),
  }));

  return (
    <View style={styles.root}>
      <GestureDetector gesture={boxGesture}>
        <View
          style={[styles.box, { backgroundColor: hueHex }]}
          onLayout={(e) => {
            boxW.value = e.nativeEvent.layout.width;
            boxH.value = e.nativeEvent.layout.height;
          }}
        >
          <LinearGradient
            colors={["#FFFFFF", "rgba(255,255,255,0)"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={["rgba(0,0,0,0)", "#000000"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Animated.View pointerEvents="none" style={[styles.thumb, boxThumbStyle]} />
        </View>
      </GestureDetector>

      <GestureDetector gesture={hueGesture}>
        <View style={styles.barWrap} onLayout={(e) => (barW.value = e.nativeEvent.layout.width)}>
          <LinearGradient
            colors={HUE_STOPS}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.bar}
          />
          <Animated.View pointerEvents="none" style={[styles.thumb, styles.hueThumb, hueThumbStyle]} />
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 14 },
  box: { height: 180, borderRadius: 14, overflow: "hidden" },
  barWrap: { height: BAR_HEIGHT, justifyContent: "center" },
  bar: { height: BAR_HEIGHT, borderRadius: BAR_HEIGHT / 2 },
  thumb: {
    position: "absolute",
    top: 0,
    left: 0,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  hueThumb: { top: 0 },
});
