import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { goBack } from "../../src/utils/navigation";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useAppTheme } from "../../src/theme/ThemeProvider";
import { radius, shadow, spacing, typography } from "../../src/theme/tokens";
import { useHabitStore } from "../../src/services/habitStore";
import { PressableScale } from "../../src/components/ui/PressableScale";
import { useI18n } from "../../src/languages";

// Sadece ekranda gösterim için — gerçek saklama süresi ve kalıcı silme
// işlemi src/services/trash.ts içindeki TRASH_RETENTION_MS'te uygulanır. Bu ikisi
// değiştirilirken birlikte güncellenmeli.
const RETENTION_DAYS = 7;

function daysLeft(deletedAt?: string) {
  if (!deletedAt) return RETENTION_DAYS;
  const elapsedMs = Date.now() - new Date(deletedAt).getTime();
  const remaining = RETENTION_DAYS - Math.floor(elapsedMs / (24 * 60 * 60 * 1000));
  return Math.max(remaining, 0);
}

export default function TrashScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const { t } = useI18n();
  const { trashedHabits, restoreHabit, permanentlyDeleteHabit, loaded } = useHabitStore();

  const isEmpty = trashedHabits.length === 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => goBack(router)} hitSlop={12} style={styles.headerButton}>
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={[typography.title, { color: colors.text, flex: 1, textAlign: "center" }]} numberOfLines={1}>
          {t("settings.trash.title")}
        </Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
        {!loaded ? null : isEmpty ? (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 32 }}>🗑️</Text>
            <Text style={[typography.bodyStrong, { color: colors.text, marginTop: spacing.sm }]}>
              {t("settings.trash.empty.title")}
            </Text>
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: 4, textAlign: "center" }]}>
              {t("settings.trash.empty.body", { n: RETENTION_DAYS })}
            </Text>
          </View>
        ) : (
          <>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              {t("settings.trash.info", { n: RETENTION_DAYS })}
            </Text>

            {trashedHabits.length > 0 && (
              <>
                <Text style={[typography.title, { color: colors.text, marginTop: spacing.md }]}>
                  {t("settings.trash.habits")}
                </Text>
                {trashedHabits.map((h) => (
                  <View key={h.id} style={[styles.row, { backgroundColor: colors.surface }, shadow.raised]}>
                    <View style={[styles.colorDot, { backgroundColor: h.color }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[typography.bodyStrong, { color: colors.text }]} numberOfLines={1}>
                        {h.title}
                      </Text>
                      <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
                        {t(
                          daysLeft(h.deletedAt) === 1 ? "settings.trash.daysLeft.one" : "settings.trash.daysLeft.other",
                          { n: daysLeft(h.deletedAt) }
                        )}
                      </Text>
                    </View>
                    <Pressable onPress={() => permanentlyDeleteHabit(h.id)} hitSlop={8} style={styles.iconButton}>
                      <MaterialIcons name="delete-forever" size={20} color={colors.danger} />
                    </Pressable>
                    <PressableScale
                      onPress={() => restoreHabit(h.id)}
                      hitSlop={8}
                      style={[styles.restoreButton, { backgroundColor: colors.black }]}
                    >
                      <MaterialIcons name="restore" size={16} color={colors.white} />
                    </PressableScale>
                  </View>
                ))}
              </>
            )}

          </>
        )}
      </ScrollView>
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
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  iconButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  restoreButton: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
