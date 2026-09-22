import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useAppTheme } from "../../theme/ThemeProvider";
import { useI18n } from "../../languages";
import { radius, shadow, spacing, typography } from "../../theme/tokens";
import { Habit } from "../../types/habit";
import { repeatCycleLabel } from "../../data/repeat";
import { lastNDays, toDateKey } from "../../utils/date";
import type { Consistency } from "../../utils/gamification";

// Tek bir hücrenin dolum süresi. Yalnızca DEĞİŞEN hücre animasyonlanır —
// ızgaranın tamamı değil, kademeli (stagger) bir dalga da değil.
const CELL_FILL_DURATION = 200;

type DayCellProps = {
  day: Date;
  done: boolean;
  isToday: boolean;
  habitColor: string;
};

function DayCell({ day, done, isToday, habitColor }: DayCellProps) {
  const { colors } = useAppTheme();
  const { t } = useI18n();
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(done ? 1 : 0);

  useEffect(() => {
    const target = done ? 1 : 0;
    // Hareket azaltılmışsa geçiş anında olur; yavaşlatılmış bir sürüm yok.
    progress.value = reducedMotion
      ? target
      : withTiming(target, { duration: CELL_FILL_DURATION });
  }, [done, reducedMotion, progress]);

  const cellStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [colors.surfaceMuted, habitColor]
    ),
  }));

  const checkStyle = useAnimatedStyle(() => ({ opacity: progress.value }));

  return (
    <Animated.View
      style={[
        styles.dayCell,
        { borderColor: isToday ? colors.accentAlt : "transparent" },
        cellStyle,
      ]}
      accessibilityRole="image"
      accessibilityLabel={t(done ? "feed.day.done" : "feed.day.notDone", { day: day.getDate() })}
    >
      <Text style={[typography.small, { color: done ? colors.white : colors.textMuted }]}>
        {day.getDate()}
      </Text>
      {/* Renk körü kullanıcılar için renkten BAĞIMSIZ ikinci bir ipucu:
          dolu hücrelerde küçük bir onay işareti. */}
      <Animated.View style={[styles.cellCheck, checkStyle]} pointerEvents="none">
        <MaterialIcons name="check" size={10} color={colors.white} />
      </Animated.View>
    </Animated.View>
  );
}

// Payda küçükken yüzde yanıltıcıdır: haftada bir yapılan yeni bir alışkanlıkta
// tek bir kaçırma "%0" gibi sert bir sayı üretir. Anlamlı bir örneklem birikene
// kadar oran hiç gösterilmez.
const MIN_SLOTS_FOR_RATE = 5;

type HabitStreakCardProps = {
  habit: Habit;
  isCompletedOn: (habitId: string, date: string) => boolean;
  /** Son 30 günün tutarlılığı. Yeterli veri yoksa gösterilmez. */
  consistency?: Consistency;
};

export function HabitStreakCard({ habit, isCompletedOn, consistency }: HabitStreakCardProps) {
  const { colors } = useAppTheme();
  const { t } = useI18n();
  const router = useRouter();
  const days = lastNDays(7);
  const todayKey = toDateKey(new Date());

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }, shadow.raised]}>
      <View style={[styles.colorBar, { backgroundColor: habit.color }]} />
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              {repeatCycleLabel(habit)}
              {consistency && consistency.possible >= MIN_SLOTS_FOR_RATE && (
                <Text style={{ color: colors.textMuted }}>
                  {"  ·  "}{t("feed.last30", { done: consistency.completed, total: consistency.possible })}
                  {"  "}%{Math.round(consistency.rate * 100)}
                </Text>
              )}
            </Text>
            <Text style={[typography.bodyStrong, { color: colors.text, marginTop: 2 }]}>
              {habit.title}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push({ pathname: "/habit/add", params: { id: habit.id } })}
            hitSlop={10}
            style={styles.menuButton}
            accessibilityLabel={t("feed.edit")}
          >
            <MaterialIcons name="more-vert" size={18} color={colors.textMuted} />
          </Pressable>
        </View>

        <View style={styles.grid}>
          {days.map((d) => {
            const key = toDateKey(d);
            return (
              <DayCell
                key={key}
                day={d}
                done={isCompletedOn(habit.id, key)}
                isToday={key === todayKey}
                habitColor={habit.color}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderRadius: radius.lg,
    overflow: "hidden",
    marginHorizontal: spacing.lg,
  },
  colorBar: { width: 4 },
  content: { flex: 1, padding: spacing.lg, gap: spacing.sm },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  menuButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -6,
    marginRight: -6,
  },
  grid: {
    flexDirection: "row",
    gap: 6,
    marginTop: spacing.sm,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  cellCheck: {
    position: "absolute",
    bottom: 3,
  },
});
