import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, LayoutAnimationConfig } from "react-native-reanimated";
import { useAppTheme } from "../../theme/ThemeProvider";
import { spacing, typography } from "../../theme/tokens";
import { HabitStreakCard } from "../habit-row/HabitStreakCard";
import type { Consistency } from "../../utils/gamification";
import { Habit } from "../../types/habit";

// Akış ekranındaki tek bir etiket bloğu: üstte etiket adı ve kaç alışkanlık
// olduğu, altında o etikete ait seri kartları. Kartlar 30 ms arayla aşağıdan
// belirerek girer.
export function HabitGroupSection({
  title,
  habits,
  isCompletedOn,
  consistencyByHabit,
}: {
  title: string;
  habits: Habit[];
  isCompletedOn: (habitId: string, dateKey: string) => boolean;
  consistencyByHabit: Map<string, Consistency>;
}) {
  const { colors } = useAppTheme();

  return (
    <View style={{ marginTop: spacing.xl }}>
      <Text style={[typography.title, { color: colors.text, paddingHorizontal: spacing.lg }]}>
        {title} <Text style={{ color: colors.textMuted }}>{habits.length}</Text>
      </Text>
      {/* İlk açılışta kartlar tek tek canlandırılmaz (sekme geçişini yavaşlatıyordu);
          sonradan eklenen kart yine yumuşakça belirir. */}
      <LayoutAnimationConfig skipEntering>
      <View style={styles.cardList}>
        {habits.map((h) => (
          <Animated.View key={h.id} entering={FadeInDown.duration(220)}>
            <HabitStreakCard habit={h} isCompletedOn={isCompletedOn} consistency={consistencyByHabit.get(h.id)} />
          </Animated.View>
        ))}
      </View>
      </LayoutAnimationConfig>
    </View>
  );
}

const styles = StyleSheet.create({
  cardList: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
});
