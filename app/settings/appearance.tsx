import { Pressable, StyleSheet, Text, View } from "react-native";
import { goBack } from "../../src/utils/navigation";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useAppTheme, AppThemeMode } from "../../src/theme/ThemeProvider";
import { radius, shadow, spacing, typography } from "../../src/theme/tokens";
import { useI18n } from "../../src/languages";
import type { TranslationKey } from "../../src/languages";

const OPTIONS: { key: AppThemeMode; labelKey: TranslationKey }[] = [
  { key: "light", labelKey: "settings.appearance.light" },
  { key: "dark", labelKey: "settings.appearance.dark" },
  { key: "system", labelKey: "settings.appearance.system" },
];

export default function AppearanceSettingsScreen() {
  const { colors, mode, setMode } = useAppTheme();
  const router = useRouter();
  const { t } = useI18n();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => goBack(router)} hitSlop={12} style={styles.headerButton}>
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={[typography.title, { color: colors.text, flex: 1, textAlign: "center" }]} numberOfLines={1}>
          {t("settings.appearance.title")}
        </Text>
        <View style={styles.headerButton} />
      </View>

      <View style={{ padding: spacing.lg }}>
        <Text style={[typography.bodyStrong, { color: colors.text, marginBottom: spacing.md }]}>
          {t("settings.appearance.theme")}
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surface }, shadow.raised]}>
          {OPTIONS.map((opt, i) => (
            <Pressable
              key={opt.key}
              onPress={() => setMode(opt.key)}
              style={[
                styles.optionRow,
                i < OPTIONS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
              ]}
            >
              <Text style={[typography.body, { color: colors.text }]}>{t(opt.labelKey)}</Text>
              {mode === opt.key ? (
                <MaterialIcons name="check" size={20} color={colors.accent} />
              ) : null}
            </Pressable>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
});
