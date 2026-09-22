import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeOut, LayoutAnimationConfig } from "react-native-reanimated";
import { useAppTheme } from "../../theme/ThemeProvider";
import { translate, useI18n } from "../../languages";
import { spacing, typography } from "../../theme/tokens";
import { HabitRowCard } from "../habit-row/HabitRowCard";
import type { ConfettiIntensity } from "../ui/ConfettiBurst";
import { repeatCycleLabel } from "../../data/repeat";
import { useHabitStore } from "../../services/habitStore";
import { weekdayName } from "../../utils/date";
import { Habit } from "../../types/habit";

// Kartın "Döngü" çipindeki metin: "Her gün saat 17:00", "Her Perşembe saat 14:00".
// Haftalık ve belirli günlere kurulu alışkanlıkta gün adları yazılır; hatırlatma
// saati varsa sona eklenir.
export function habitCycleText(habit: Habit): string {
  const days = habit.repeatDaysOfWeek ?? [];
  const isWeeklyOnDays =
    habit.repeatCycle === "weekly" && (habit.repeatEveryN ?? 1) <= 1 && days.length > 0 && days.length < 7;
  const base = isWeeklyOnDays
    ? translate("home.cycle.weekdays", { days: days.map((d) => weekdayName(d)).join(", ") })
    : repeatCycleLabel(habit);
  return habit.hasReminderTime && habit.reminderTime ? translate("home.cycle.atTime", { base, time: habit.reminderTime }) : base;
}

type HabitListSectionProps = {
  /** Store diskten okunana kadar hiçbir şey çizilmez — boş liste yanıp sönmesin. */
  loaded: boolean;
  /** Ekranda gösterilecek alışkanlıklar (filtrelenmiş ve sıralanmış halde). */
  habits: Habit[];
  /** O gün sırası gelen toplam alışkanlık sayısı — boş durum metnini seçmek için. */
  dueCount: number;
  isCompleted: (habit: Habit) => boolean;
  onToggle: (habit: Habit) => void;
  onDelete: (habit: Habit) => void;
  /** Konfeti şu an hangi kartın üzerinde, hangi şiddette patlıyor. */
  /** Alışkanlık id'si → o kartta patlayacak konfetinin şiddeti. */
  celebrating: Map<string, ConfettiIntensity>;
  onCelebrationDone: (habitId: string) => void;
};

// Ana sayfanın alışkanlık listesi.
//
// Üç olası durum var:
//   1. Store henüz yüklenmedi -> hiçbir şey çizme.
//   2. Gösterilecek alışkanlık yok -> fidan emojili boş durum. Metin, o gün
//      hiç alışkanlık yoksa "Henüz alışkanlık yok", sadece filtre yüzünden
//      boşsa "Bu filtreye uyan alışkanlık yok" olur.
//   3. Liste dolu -> kartlar listelenir; ilk açılışta animasyon yoktur,
//      sonradan eklenen kart aşağıdan belirerek girer.
export function HabitListSection({
  loaded,
  habits,
  dueCount,
  isCompleted,
  onToggle,
  onDelete,
  celebrating,
  onCelebrationDone,
}: HabitListSectionProps) {
  const { colors } = useAppTheme();
  const { t } = useI18n();
  const { tags } = useHabitStore();
  const tagById = useMemo(() => new Map(tags.map((tag) => [tag.id, tag])), [tags]);

  return (
    // İlk açılışta kartlar tek tek canlandırılmaz; sonradan eklenen/silinen
    // kartlar yine animasyonlu.
    <LayoutAnimationConfig skipEntering>
    <View style={{ gap: spacing.md }}>
      {!loaded ? null : habits.length === 0 ? (
        <Animated.View entering={FadeInDown.duration(220)} style={styles.emptyState}>
          <Text style={{ fontSize: 32 }}>🌱</Text>
          <Text style={[typography.bodyStrong, { color: colors.text, marginTop: spacing.sm }]}>
            {dueCount === 0 ? t("home.empty.none") : t("home.empty.filtered")}
          </Text>
          {dueCount === 0 && (
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: 4, textAlign: "center" }]}>
              {t("home.empty.hint")}
            </Text>
          )}
        </Animated.View>
      ) : (
        habits.map((h) => (
          <Animated.View
            key={h.id}
            entering={FadeInDown.duration(220)}
            exiting={FadeOut.duration(150)}
          >
            <HabitRowCard
              habit={h}
              cycleText={habitCycleText(h)}
              tag={(h.tagId && tagById.get(h.tagId)) || null}
              completed={isCompleted(h)}
              onToggle={onToggle}
              onDelete={onDelete}
              celebrate={celebrating.get(h.id) ?? null}
              onCelebrationDone={onCelebrationDone}
            />
          </Animated.View>
        ))
      )}

    </View>
    </LayoutAnimationConfig>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
});
