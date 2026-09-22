import { Pressable, StyleSheet, Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useAppTheme } from "../../theme/ThemeProvider";
import { translate, useI18n } from "../../languages";
import { layout, radius, typography } from "../../theme/tokens";

function greeting(now = new Date()) {
  const h = now.getHours();
  if (h < 12) return translate("home.greeting.morning");
  if (h < 18) return translate("home.greeting.afternoon");
  return translate("home.greeting.evening");
}

// Ana sayfanın üst satırı (Bugun.html): solda küçük selamlama + seçili günün
// başlığı, sağda 44×44 yarı saydam ayarlar butonu.
export function HomeHeader({ title, onPressSettings }: { title: string; onPressSettings: () => void }) {
  const { colors } = useAppTheme();
  const { t } = useI18n();

  return (
    <View style={styles.header}>
      <View style={styles.texts}>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>{greeting()}</Text>
        <Text
          style={[typography.largeTitle, { color: colors.text }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
        >
          {title}
        </Text>
      </View>
      <Pressable
        onPress={onPressSettings}
        accessibilityLabel={t("home.settings")}
        style={[styles.button, { backgroundColor: colors.panel }]}
      >
        <Feather name="settings" size={20} color={colors.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  texts: { flex: 1, gap: 2 },
  button: {
    width: layout.touchTarget,
    height: layout.touchTarget,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
