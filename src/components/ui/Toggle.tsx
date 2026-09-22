import { Pressable, StyleSheet } from "react-native";
import Animated, { useAnimatedStyle, useReducedMotion, withTiming } from "react-native-reanimated";
import { useAppTheme } from "../../theme/ThemeProvider";

// Referanstaki anahtar (YeniAliskanlik.html): 52×30 hap, 24 px beyaz başparmak.
// Kapalı iz #DDDFEA, açık iz accent. RN Switch yerine kullanılır çünkü
// platforma göre farklı (turkuaz/yeşil) çiziyordu.
const WIDTH = 52;
const HEIGHT = 30;
const THUMB = 24;
const PADDING = 3;

export function Toggle({ value, onValueChange }: { value: boolean; onValueChange: (v: boolean) => void }) {
  const { colors } = useAppTheme();
  const reducedMotion = useReducedMotion();

  const thumbStyle = useAnimatedStyle(() => {
    const x = value ? WIDTH - THUMB - PADDING * 2 : 0;
    return { transform: [{ translateX: reducedMotion ? x : withTiming(x, { duration: 160 }) }] };
  });

  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      hitSlop={8}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      style={[styles.track, { backgroundColor: value ? colors.accent : colors.toggleOff }]}
    >
      <Animated.View style={[styles.thumb, thumbStyle]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: { width: WIDTH, height: HEIGHT, borderRadius: HEIGHT / 2, padding: PADDING, justifyContent: "center" },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: "#FFFFFF",
    // Küçük, opak bir başparmak: elevation güvenli.
    shadowColor: "#282C5A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
});
