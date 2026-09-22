import { type ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Tabs } from "expo-router";
import { useAppTheme } from "../../theme/ThemeProvider";
import { useI18n, type TranslationKey } from "../../languages";
import { fonts, radius, shadow } from "../../theme/tokens";
import { TAB_BAR_BOTTOM_MARGIN, TAB_BAR_HEIGHT, useTabBarMetrics } from "../../hooks/useTabBarClearance";

// SDK 57'de @react-navigation/bottom-tabs ayrı bir paket olarak yok; tab bar
// prop tipi doğrudan expo-router'ın Tabs bileşeninden türetilir.
type BottomTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>["tabBar"]>>[0];

// Referanstaki hap şeklinde gezinme çubuğu (Bugun.html): aktif sekme koyu bir
// hap, içinde ikon + etiket; diğerleri yalnızca ikon. Sağında FAB için boşluk
// bırakılır (FAB ekranların kendisinde durur, çünkü her ekranın "+" eylemi
// farklıdır). Sıra ve etiketler referanstan gelir; rotalar değişmez.
const TABS: { name: string; label: TranslationKey; icon: ComponentProps<typeof Feather>["name"] }[] = [
  { name: "index", label: "tabs.today", icon: "home" },
  { name: "calendar", label: "tabs.calendar", icon: "calendar" },
  { name: "feed", label: "tabs.feed", icon: "align-left" },
  { name: "profile", label: "tabs.profile", icon: "user" },
];

export function LiquidTabBar({ state, navigation }: BottomTabBarProps) {
  const { colors } = useAppTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const m = useTabBarMetrics();
  const focusedName = state.routes[state.index]?.name;

  return (
    <View
      style={[
        styles.bar,
        shadow.nav,
        {
          bottom: insets.bottom + TAB_BAR_BOTTOM_MARGIN,
          right: m.barRight,
          backgroundColor: colors.glassStrong,
          borderColor: colors.glassBorder,
        },
      ]}
    >
      {TABS.map((tab) => {
        const route = state.routes.find((r) => r.name === tab.name);
        if (!route) return null;
        const focused = focusedName === tab.name;

        const onPress = () => {
          const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        return (
          <View key={tab.name}>
            <Pressable
              onPress={onPress}
              accessibilityLabel={t(tab.label)}
              accessibilityState={{ selected: focused }}
              style={[
                styles.item,
                { paddingHorizontal: m.itemPadding },
                focused && { backgroundColor: colors.black, paddingHorizontal: m.activePadding },
              ]}
            >
              <Feather name={tab.icon} size={20} color={focused ? colors.white : colors.textSecondary} />
              {focused && (
                <Text style={[styles.label, { color: colors.white }]} allowFontScaling={false}>
                  {t(tab.label)}
                </Text>
              )}
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    left: 16,
    height: TAB_BAR_HEIGHT,
    padding: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  item: {
    height: 48,
    borderRadius: radius.pill,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  // flexShrink: 0 — etiket dar bir alana sıkıştırılıp "Bug…" olarak
  // kalmasın; Android font padding'i kapalı.
  label: { fontSize: 13, lineHeight: 17, fontFamily: fonts.bold, flexShrink: 0, includeFontPadding: false },
});
