import { Pressable, StyleSheet } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useAppTheme } from "../../theme/ThemeProvider";
import { PRESS_SPRING, shadow } from "../../theme/tokens";
import { useTabBarBottom, useTabBarMetrics } from "../../hooks/useTabBarClearance";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type FABProps = {
  onPress: () => void;
  /**
   * Alt kenardan mesafe. Varsayılan olarak yüzen tab bar'ın üstüne
   * konumlanır; tab bar'ı OLMAYAN ekranlarda (Stack ile açılan tam ekranlar)
   * bu değer verilerek butonun boşlukta asılı kalması engellenir.
   */
  bottom?: number;
};

// Referans: alt gezinme çubuğunun yanında, accent renkli 64px daire ve beyaz "+".
export function FAB({ onPress, bottom: bottomOverride }: FABProps) {
  const { colors } = useAppTheme();
  const scale = useSharedValue(1);
  // Hook her durumda çağrılır (koşullu çağrı React kurallarını bozar);
  // bir override verilmişse sonucu kullanılmaz.
  const tabBarBottom = useTabBarBottom();
  const { fab } = useTabBarMetrics();
  const bottom = bottomOverride ?? tabBarBottom;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => (scale.value = withSpring(0.92, PRESS_SPRING))}
      onPressOut={() => (scale.value = withSpring(1, PRESS_SPRING))}
      style={[
        styles.fab,
        { backgroundColor: colors.accent, bottom, width: fab, height: fab, borderRadius: fab / 2 },
        shadow.primary,
        animatedStyle,
      ]}
    >
      <Feather name="plus" size={28} color="#FFFFFF" />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
