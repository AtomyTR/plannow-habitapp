import { useMemo } from "react";
import { goBack } from "../../src/utils/navigation";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useAppTheme } from "../../src/theme/ThemeProvider";
import { radius, shadow, spacing, typography } from "../../src/theme/tokens";
import { useHabitStore } from "../../src/services/habitStore";
import { PressableScale } from "../../src/components/ui/PressableScale";
import { buildCompletionIndex } from "../../src/utils/gamification";
import { useI18n } from "../../src/languages";

export default function ArchiveScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const { t } = useI18n();
  const { archivedHabits, completions, unarchiveHabit, deleteHabit, loaded } = useHabitStore();

  // Arşivin asıl vaadi geçmişin korunması; her satırda kaç tamamlama
  // saklandığını göstermek bunu somut kılar.
  const completionCounts = useMemo(() => {
    const index = buildCompletionIndex(completions);
    return (habitId: string) => index.get(habitId)?.size ?? 0;
  }, [completions]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => goBack(router)} hitSlop={12} style={styles.headerButton}>
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={[typography.title, { color: colors.text, flex: 1, textAlign: "center" }]} numberOfLines={1}>
          {t("settings.archive.title")}
        </Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
        {!loaded ? null : archivedHabits.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 32 }}>📦</Text>
            <Text style={[typography.bodyStrong, { color: colors.text, marginTop: spacing.sm }]}>
              {t("settings.archive.empty.title")}
            </Text>
            <Text
              style={[
                typography.body,
                { color: colors.textSecondary, marginTop: 4, textAlign: "center" },
              ]}
            >
              {t("settings.archive.empty.body")}
            </Text>
          </View>
        ) : (
          <>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              {t("settings.archive.info")}
            </Text>

            {archivedHabits.map((h) => (
              <View key={h.id} style={[styles.row, { backgroundColor: colors.surface }, shadow.raised]}>
                <View style={[styles.colorDot, { backgroundColor: h.color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[typography.bodyStrong, { color: colors.text }]} numberOfLines={1}>
                    {h.title}
                  </Text>
                  <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
                    {t(
                      completionCounts(h.id) === 1
                        ? "settings.archive.completionsKept.one"
                        : "settings.archive.completionsKept.other",
                      { n: completionCounts(h.id) }
                    )}
                  </Text>
                </View>
                <Pressable onPress={() => deleteHabit(h.id)} hitSlop={8} style={styles.iconButton}>
                  <MaterialIcons name="delete-outline" size={20} color={colors.danger} />
                </Pressable>
                <PressableScale
                  onPress={() => unarchiveHabit(h.id)}
                  hitSlop={8}
                  style={[styles.restoreButton, { backgroundColor: colors.black }]}
                >
                  <MaterialIcons name="unarchive" size={16} color={colors.white} />
                </PressableScale>
              </View>
            ))}
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
  colorDot: { width: 12, height: 12, borderRadius: 6 },
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
