// Bu dosya: kutlama konfetisi.
//
// Bir alışkanlık tamamlandığında o kartın üstünde küçük bir patlama olur.
// Seri 7, 30 veya 100. güne ulaştıysa aynı patlama belirgin şekilde büyür —
// aksi halde özel bir gün, sıradan bir günden ayırt edilemezdi.
//
// Tüm ekranı kaplamaz, ses çıkarmaz ve "hareketi azalt" açıkken hiç
// patlamaz (yavaşlatılmış bir sürümü yok, tamamen atlanır).

import { useEffect, useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useAppTheme } from "../../theme/ThemeProvider";
import { pastel } from "../../theme/tokens";

// Konfetinin iki şiddeti var. Sıradan bir tamamlama her gün yaşandığı için
// ölçülü kalır; 7/30/100. gün ise ondan gözle görülür şekilde ayrışmalı —
// aksi halde kilometre taşı sıradan bir günden ayırt edilemez ve mekanik
// görünmez olur.
export type ConfettiIntensity = "normal" | "milestone";

const VARIANTS: Record<
  ConfettiIntensity,
  { count: number; duration: number; sizeBase: number; sizeRange: number; distanceBase: number; distanceRange: number }
> = {
  normal: { count: 22, duration: 750, sizeBase: 8, sizeRange: 8, distanceBase: 75, distanceRange: 105 },
  milestone: { count: 34, duration: 900, sizeBase: 10, sizeRange: 10, distanceBase: 110, distanceRange: 140 },
};

type Particle = {
  color: string;
  angleDeg: number;
  distance: number;
  size: number;
  spin: number;
};

function ConfettiParticle({
  particle,
  duration,
  onDone,
}: {
  particle: Particle;
  duration: number;
  onDone?: () => void;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration, easing: Easing.out(Easing.cubic) }, (finished) => {
      if (finished && onDone) runOnJS(onDone)();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => {
    const rad = (particle.angleDeg * Math.PI) / 180;
    const t = progress.value;
    const dx = Math.cos(rad) * particle.distance * t;
    // Gerçek bir konfeti fırlatışı gibi hafif bir yukarı yay çizip geri iner.
    const arc = Math.sin(t * Math.PI) * particle.distance * 0.35;
    const dy = Math.sin(rad) * particle.distance * t - arc;
    return {
      opacity: 1 - t * t,
      transform: [
        { translateX: dx },
        { translateY: dy },
        { rotate: `${t * particle.spin}deg` },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: particle.size,
          height: particle.size,
          backgroundColor: particle.color,
          borderRadius: particle.size * 0.3,
        },
        style,
      ]}
    />
  );
}

export function ConfettiBurst({
  intensity = "normal",
  onDone,
}: {
  intensity?: ConfettiIntensity;
  onDone?: () => void;
}) {
  const { colors } = useAppTheme();
  const reducedMotion = useReducedMotion();
  const variant = VARIANTS[intensity];

  const particles = useMemo<Particle[]>(() => {
    const palette = [colors.accent, colors.accentAlt, colors.success, pastel.amberStrong, pastel.roseStrong];
    return Array.from({ length: variant.count }, (_, i) => ({
      color: palette[i % palette.length],
      // Dağılım yukarı yönlü ağırlıklandırılır (-170°..-10°) ki bir "patlama"
      // gibi görünsün, yerde birikmiş bir yığın gibi değil.
      angleDeg: -170 + Math.random() * 160,
      distance: variant.distanceBase + Math.random() * variant.distanceRange,
      size: variant.sizeBase + Math.random() * variant.sizeRange,
      spin: (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 360),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // "Hareketi azalt" açıkken konfeti HİÇ atılmaz — yavaşlatılmış ya da yarım
  // bir sürüm değil. Yine de barındıran bileşen kendini kapatabilsin diye
  // onDone anında tetiklenir.
  useEffect(() => {
    if (reducedMotion) onDone?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  // Sayaç ref'te tutulur: sıradan bir değişken her render'da sıfırlanır ve
  // patlama ortasında gelen bir render, onDone'ın hiç tetiklenmemesine yol açar.
  const remaining = useRef(particles.length);
  const handleOneDone = () => {
    remaining.current -= 1;
    if (remaining.current <= 0) onDone?.();
  };

  if (reducedMotion) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((p, i) => (
        <ConfettiParticle key={i} particle={p} duration={variant.duration} onDone={handleOneDone} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
    alignItems: "center",
  },
  particle: {
    position: "absolute",
  },
});
