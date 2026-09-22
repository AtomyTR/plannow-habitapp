// Bu dosya: kart silinirken etrafa dağılan "toz" efekti.
//
// Sadece görseldir, hiçbir veriye dokunmaz. Kart sola kaydırılıp silindiğinde
// sekiz küçük nokta dışa doğru savrulup solar; kartın listeden kaybolması bu
// animasyon bitene kadar bekletilir, böylece kart aniden yok olmuş gibi
// görünmez.

import Animated, { SharedValue, useAnimatedStyle } from "react-native-reanimated";
import { StyleSheet } from "react-native";

export const DUST_COUNT = 8;
export const DUST_DURATION = 380;

// Parçacığın merkezden savrulacağı en uzak mesafe (piksel).
const DUST_DISTANCE = 34;

type DustParticleProps = {
  progress: SharedValue<number>;
  angle: number;
  color: string;
};

export function DustParticle({ progress, angle, color }: DustParticleProps) {
  const style = useAnimatedStyle(() => {
    const distance = progress.value * DUST_DISTANCE;
    return {
      opacity: 1 - progress.value,
      transform: [
        { translateX: Math.cos(angle) * distance },
        { translateY: Math.sin(angle) * distance },
        { scale: 1 - progress.value * 0.5 },
      ],
    };
  });

  return <Animated.View style={[styles.dot, { backgroundColor: color }, style]} />;
}

const styles = StyleSheet.create({
  dot: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
