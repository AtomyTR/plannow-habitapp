import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { goBack } from "../../src/utils/navigation";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useAppTheme } from "../../src/theme/ThemeProvider";
import { radius, spacing, typography } from "../../src/theme/tokens";
import { SettingsRow } from "../../src/components/ui/SettingsRow";
import { useHabitStore } from "../../src/services/habitStore";
import { useNotificationPermission } from "../../src/hooks/useNotificationPermission";
import { useI18n } from "../../src/languages";

export default function HabitSettingsScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const { t } = useI18n();
  const { settings, updateSettings, archivedHabits } = useHabitStore();
  const { status: permissionStatus, openSettings } = useNotificationPermission();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => goBack(router)} hitSlop={12} style={styles.headerButton}>
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text
          style={[typography.title, { color: colors.text, flex: 1, textAlign: "center" }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {t("settings.title")}
        </Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        {/* Yalnızca gerçekten bir sorun varken görünür. "İzin verildi" diye bir
            satır göstermek, çözülecek bir şey yokken gürültü yaratırdı. */}
        {permissionStatus === "denied" && (
          <Pressable
            onPress={openSettings}
            style={[styles.permissionNotice, { borderColor: colors.danger }]}
          >
            <MaterialIcons name="notifications-off" size={20} color={colors.danger} />
            <View style={{ flex: 1 }}>
              <Text style={[typography.bodyStrong, { color: colors.text }]}>
                {t("settings.permission.title")}
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 4 }]}>
                {t("settings.permission.body")}
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
          </Pressable>
        )}

        {/* Android 12+: "Alarmlar ve hatırlatıcılar" izni olmadan tam zamanlı
            bildirimler gecikebilir. iOS'ta böyle bir ayar yok. */}
        {Platform.OS === "android" && Number(Platform.Version) >= 31 && (
          <Pressable
            style={[styles.navRow, { marginTop: 0, marginBottom: spacing.sm }]}
            onPress={() =>
              Linking.sendIntent("android.settings.REQUEST_SCHEDULE_EXACT_ALARM").catch(() =>
                Linking.openSettings()
              )
            }
          >
            <View style={{ flex: 1 }}>
              <Text style={[typography.bodyStrong, { color: colors.text }]}>
                {t("settings.exactAlarm.title")}
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 4 }]}>
                {t("settings.exactAlarm.caption")}
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
          </Pressable>
        )}

        <Text style={[typography.title, { color: colors.text }]}>{t("settings.section.habit")}</Text>

        <Pressable style={styles.navRow} onPress={() => router.push("/settings/order")}>
          <View style={{ flex: 1 }}>
            <Text style={[typography.bodyStrong, { color: colors.text }]}>{t("settings.order.title")}</Text>
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 4 }]}>
              {t("settings.order.caption")}
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
        </Pressable>

        <Pressable style={styles.navRow} onPress={() => router.push("/settings/tags")}>
          <View style={{ flex: 1 }}>
            <Text style={[typography.bodyStrong, { color: colors.text }]}>{t("settings.tags.title")}</Text>
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 4 }]}>
              {t("settings.tags.caption")}
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
        </Pressable>

        <Pressable style={styles.navRow} onPress={() => router.push("/settings/archive")}>
          <View style={{ flex: 1 }}>
            <Text style={[typography.bodyStrong, { color: colors.text }]}>{t("settings.archive.title")}</Text>
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 4 }]}>
              {archivedHabits.length > 0
                ? t(
                    archivedHabits.length === 1
                      ? "settings.archive.captionCount.one"
                      : "settings.archive.captionCount.other",
                    { n: archivedHabits.length }
                  )
                : t("settings.archive.captionEmpty")}
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
        </Pressable>

        <Pressable style={styles.navRow} onPress={() => router.push("/settings/appearance")}>
          <View style={{ flex: 1 }}>
            <Text style={[typography.bodyStrong, { color: colors.text }]}>{t("settings.appearance.title")}</Text>
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 4 }]}>
              {t("settings.appearance.caption")}
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
        </Pressable>

        <SettingsRow
          title={t("settings.incompleteFirst.title")}
          description={t("settings.incompleteFirst.description")}
          value={settings.incompleteFirst}
          onValueChange={(v) => updateSettings({ incompleteFirst: v })}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  permissionNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
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
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
});
