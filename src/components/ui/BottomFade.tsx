import { StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../../theme/ThemeProvider";
import { glowTones, withAlpha } from "../../theme/tokens";
import { TAB_BAR_BOTTOM_MARGIN, TAB_BAR_HEIGHT } from "../../hooks/useTabBarClearance";

// Listenin altındaki kartlar tab bar'a yaklaştıkça yumuşakça solar; kaydırınca
// yukarı gelip netleşirler. Zeminin alt tonuna doğru eriyen bir örtüdür
// (gerçek bulanıklık değil — ek native modül ve çizim maliyeti gerektirmez).
// Dokunuşları geçirir.
const FADE_ABOVE_BAR = 72;

export function BottomFade() {
  const { isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const bottom = (isDark ? glowTones.dark : glowTones.light).bottom;

  return (
    <LinearGradient
      pointerEvents="none"
      colors={[withAlpha(bottom, 0), withAlpha(bottom, 0.75), withAlpha(bottom, 0.95)]}
      locations={[0, 0.55, 1]}
      style={[
        styles.fade,
        { height: insets.bottom + TAB_BAR_BOTTOM_MARGIN + TAB_BAR_HEIGHT + FADE_ABOVE_BAR },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  fade: { position: "absolute", left: 0, right: 0, bottom: 0 },
});
