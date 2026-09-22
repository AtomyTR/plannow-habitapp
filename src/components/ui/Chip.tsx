import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from "react-native-reanimated";
import Feather from "@expo/vector-icons/Feather";
import { useAppTheme } from "../../theme/ThemeProvider";
import { fonts, PRESS_SPRING, radius, type Tone } from "../../theme/tokens";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ChipProps = {
  label: string;
  /** Etiketin solunda gösterilecek serbest içerik (örn. bir ikon veya marka simgesi). */
  leading?: React.ReactNode;
  emoji?: string;
  selected?: boolean;
  /** Pastel bir aile verilirse çip o ailenin zemin/kenarlık/yazı renklerini alır. */
  tone?: Tone;
  onPress?: () => void;
};

// Form çipi (YeniAliskanlik.html): 36 yüksekliğinde hap.
//   • seçili  : 1.5 accent kenarlık, accentSoft zemin, accent yazı, solda onay işareti
//   • pastel  : ailenin kendi zemin/kenarlık/yazı renkleri (etiketler)
//   • normal  : beyaz zemin, ince kenarlık, koyu yazı
export function Chip({ label, leading, emoji, selected, tone, onPress }: ChipProps) {
  const { colors } = useAppTheme();
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const bg = selected ? (tone ? tone.bg : colors.accentSoft) : tone ? tone.bg : colors.surface;
  const border = selected ? colors.accent : tone ? tone.border : colors.border;
  const fg = selected ? (tone ? tone.strong : colors.accent) : tone ? tone.strong : colors.text;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        if (!reducedMotion) scale.value = withSpring(0.95, PRESS_SPRING);
      }}
      onPressOut={() => {
        if (!reducedMotion) scale.value = withSpring(1, PRESS_SPRING);
      }}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      style={[
        styles.chip,
        { backgroundColor: bg, borderColor: border, borderWidth: selected ? 1.5 : 1 },
        animatedStyle,
      ]}
    >
      {selected && !tone ? <Feather name="check" size={13} color={fg} /> : leading}
      {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}
      <Text style={[styles.label, { color: fg, fontFamily: selected ? fonts.bold : fonts.semibold }]}>{label}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 13,
    borderRadius: radius.pill,
  },
  label: { fontSize: 12.5 },
  emoji: { fontSize: 14 },
});
