import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { goBack } from "../../src/utils/navigation";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useAppTheme } from "../../src/theme/ThemeProvider";
import { radius, shadow, spacing, typography } from "../../src/theme/tokens";
import { useHabitStore } from "../../src/services/habitStore";
import { useI18n } from "../../src/languages";

export default function HabitOrderScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const { t } = useI18n();
  const { habits, reorderHabit, loaded } = useHabitStore();

  const sorted = [...habits].filter((h) => !h.archived).sort((a, b) => a.order - b.order);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => goBack(router)} hitSlop={12}>
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text
          style={[typography.title, { color: colors.text, flex: 1, textAlign: "center" }]}
          numberOfLines={1}
        >
          {t("settings.order.title")}
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}>
        {!loaded ? null : sorted.length === 0 ? (
          <Text style={[typography.body, { color: colors.textMuted }]}>
            {t("settings.order.empty")}
          </Text>
        ) : (
          sorted.map((habit, index) => (
            <View
              key={habit.id}
              style={[styles.row, { backgroundColor: colors.surface }, shadow.raised]}
            >
              <View style={[styles.colorDot, { backgroundColor: habit.color }]} />
              <Text style={[typography.bodyStrong, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                {habit.title}
              </Text>
              <Pressable
                onPress={() => reorderHabit(habit.id, "up")}
                disabled={index === 0}
                hitSlop={12}
                style={{ opacity: index === 0 ? 0.3 : 1 }}
              >
                <MaterialIcons name="keyboard-arrow-up" size={20} color={colors.text} />
              </Pressable>
              <Pressable
                onPress={() => reorderHabit(habit.id, "down")}
                disabled={index === sorted.length - 1}
                hitSlop={12}
                style={{ opacity: index === sorted.length - 1 ? 0.3 : 1, marginLeft: spacing.sm }}
              >
                <MaterialIcons name="keyboard-arrow-down" size={20} color={colors.text} />
              </Pressable>
            </View>
          ))
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
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
