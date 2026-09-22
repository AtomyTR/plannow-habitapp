// "Tekrar döngüsü" bölümü: alışkanlığın hangi sıklıkla tekrar edeceği.
//
// Üç ayrı seçim burada birleşir:
// 1) Hazır çipler — Her gün / Hafta / Ay / Yıl.
// 2) Hemen altındaki sıklık satırı — "Her [– 2 +] günde bir". Ayrı bir pencere
//    açmadan tek dokunuşla "2 günde bir", "3 haftada bir" … kurulur.
// 3) Seçime göre altta beliren ek alan:
//    - Hafta seçiliyse: haftanın günleri.
//    - Ay/Yıl seçiliyse ya da özel aralık varsa: bir başlangıç/referans tarihi.
//      Tekrarların hangi günden itibaren sayılacağı bu tarihe göre belirlenir.

import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import DateTimePicker from "@react-native-community/datetimepicker";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useAppTheme } from "../../theme/ThemeProvider";
import { fonts, radius, spacing, typography } from "../../theme/tokens";
import { Chip } from "../ui/Chip";
import { WeekdaySelector } from "../ui/WeekdaySelector";
import { RepeatCycle } from "../../types/habit";
import { monthName, weekdayName, toDateKey } from "../../utils/date";
import { upcomingReminderDates } from "../../utils/habitSchedule";
import { Habit } from "../../types/habit";
import { REPEAT_OPTIONS, repeatCycleLabel } from "../../data/repeat";
import { translate, useI18n } from "../../languages";

function formatDayOfMonth(date: Date) {
  return translate("habitForm.repeat.dayOfMonth", { day: date.getDate() });
}

function formatMonthDay(date: Date) {
  return translate("habitForm.repeat.monthDay", { day: date.getDate(), month: monthName(date.getMonth()) });
}

// Sıklık sayacının sınırları ("30 günde bir"e kadar).
const MIN_EVERY_N = 1;
const MAX_EVERY_N = 30;
// "30 yılda bir"e kadar sonraki tekrarı bulabilsin.
const PREVIEW_LOOKAHEAD_DAYS = 366 * MAX_EVERY_N;

// "Ayın 22. günü" her ay farklı bir haftanın gününe denk gelir; kullanıcı
// yanılmasın diye bir sonraki tekrar gün adıyla gösterilir.
function nextOccurrenceText(
  repeatCycle: RepeatCycle,
  repeatEveryN: number,
  anchor: Date,
  repeatDaysOfWeek: number[]
): string | null {
  const probe = {
    id: "preview",
    title: "",
    createdAt: anchor.toISOString(),
    repeatCycle,
    repeatEveryN,
    repeatAnchorDate: toDateKey(anchor),
    repeatDaysOfWeek,
  } as Habit;
  const [next] = upcomingReminderDates(probe, 0, 0, new Date(new Date().setHours(0, 0, 0, 0) - 1), 1, PREVIEW_LOOKAHEAD_DAYS);
  if (!next) return null;
  return translate("habitForm.repeat.next", {
    day: next.getDate(),
    month: monthName(next.getMonth()),
    weekday: weekdayName(next.getDay()),
  });
}

type HabitRepeatSectionProps = {
  repeatCycle: RepeatCycle;
  onRepeatCycleChange: (cycle: RepeatCycle) => void;
  repeatEveryN: number;
  onRepeatEveryNChange: (everyN: number) => void;
  repeatDaysOfWeek: number[];
  onRepeatDaysOfWeekChange: (days: number[]) => void;
  repeatAnchorDate: Date;
  onRepeatAnchorDateChange: (date: Date) => void;
  /** Haftalık seçilip hiç gün işaretlenmediyse true — altta uyarı gösterilir. */
  weeklyNeedsDay: boolean;
};

export function HabitRepeatSection({
  repeatCycle,
  onRepeatCycleChange,
  repeatEveryN,
  onRepeatEveryNChange,
  repeatDaysOfWeek,
  onRepeatDaysOfWeekChange,
  repeatAnchorDate,
  onRepeatAnchorDateChange,
  weeklyNeedsDay,
}: HabitRepeatSectionProps) {
  const { colors } = useAppTheme();
  const { t } = useI18n();
  const [showAnchorDatePicker, setShowAnchorDatePicker] = useState(false);
  const showsAnchor = repeatCycle === "monthly" || repeatCycle === "yearly" || repeatEveryN > 1;
  const nextText = showsAnchor ? nextOccurrenceText(repeatCycle, repeatEveryN, repeatAnchorDate, repeatDaysOfWeek) : null;

  return (
    <>
      <View style={styles.tagHeaderRow}>
        <Text style={[styles.heading, { color: colors.text }]}>{t("habitForm.repeat.title")}</Text>
        <Text style={[styles.headingLink, { color: colors.accent }]}>
          {repeatCycleLabel({ repeatCycle, repeatEveryN })}
        </Text>
      </View>
      <View style={[styles.optionsRow, { alignItems: "center" }]}>
        {REPEAT_OPTIONS.map((opt) => (
          <Chip
            key={opt.key}
            label={opt.label}
            selected={repeatCycle === opt.key}
            onPress={() => {
              // Aynı çipe tekrar dokunmak kurulan "3 haftada bir"i sıfırlamaz.
              if (opt.key === repeatCycle) return;
              onRepeatCycleChange(opt.key);
              onRepeatEveryNChange(1);
            }}
          />
        ))}
      </View>

      {repeatCycle !== "custom" && (
        <View style={[styles.stepperRow, { borderColor: colors.border }]}>
          <Text style={[typography.body, { color: colors.textSecondary, flex: 1 }]}>
            {t("habitForm.repeat.frequency")}
          </Text>
          <Pressable
            onPress={() => onRepeatEveryNChange(Math.max(MIN_EVERY_N, repeatEveryN - 1))}
            disabled={repeatEveryN <= MIN_EVERY_N}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t("habitForm.repeat.decrease")}
            style={[styles.stepperButton, { borderColor: colors.border, opacity: repeatEveryN <= MIN_EVERY_N ? 0.35 : 1 }]}
          >
            <Feather name="minus" size={16} color={colors.text} />
          </Pressable>
          <Text style={[typography.bodyStrong, styles.stepperValue, { color: colors.accent }]}>
            {repeatCycleLabel({ repeatCycle, repeatEveryN })}
          </Text>
          <Pressable
            onPress={() => onRepeatEveryNChange(Math.min(MAX_EVERY_N, repeatEveryN + 1))}
            disabled={repeatEveryN >= MAX_EVERY_N}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t("habitForm.repeat.increase")}
            style={[styles.stepperButton, { borderColor: colors.border, opacity: repeatEveryN >= MAX_EVERY_N ? 0.35 : 1 }]}
          >
            <Feather name="plus" size={16} color={colors.text} />
          </Pressable>
        </View>
      )}

      {repeatCycle === "weekly" && (
        <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(120)} style={{ marginTop: spacing.lg }}>
          <WeekdaySelector
            value={repeatDaysOfWeek}
            onChange={onRepeatDaysOfWeekChange}
          />
          {weeklyNeedsDay && (
            <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.sm }]}>
              {t("habitForm.repeat.pickDay")}
            </Text>
          )}
        </Animated.View>
      )}

      {(repeatCycle === "monthly" || repeatCycle === "yearly" || repeatEveryN > 1) && (
        <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(120)} style={{ marginTop: spacing.lg }}>
          <Pressable
            onPress={() => setShowAnchorDatePicker(true)}
            style={styles.timeRow}
          >
            <Text style={[typography.body, { color: colors.textSecondary }]}>
              {repeatCycle === "monthly" && repeatEveryN <= 1
                ? t("habitForm.repeat.dayOfMonthLabel")
                : repeatCycle === "yearly" && repeatEveryN <= 1
                  ? t("habitForm.repeat.date")
                  : t("habitForm.repeat.startDate")}
            </Text>
            <View style={styles.timeValue}>
              <Text style={[typography.bodyStrong, { color: colors.accent }]}>
                {repeatCycle === "monthly" && repeatEveryN <= 1
                  ? formatDayOfMonth(repeatAnchorDate)
                  : formatMonthDay(repeatAnchorDate)}
              </Text>
              <Feather name="chevron-right" size={18} color={colors.textMuted} />
            </View>
          </Pressable>
          {nextText && (
            <Text style={[typography.caption, styles.hint, { color: colors.textSecondary }]}>{nextText}</Text>
          )}
        </Animated.View>
      )}

      {showAnchorDatePicker && (
        <DateTimePicker
          value={repeatAnchorDate}
          mode="date"
          display="default"
          onChange={(_, date) => {
            setShowAnchorDatePicker(false);
            if (date) onRepeatAnchorDateChange(date);
          }}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 15, fontFamily: fonts.extrabold },
  headingLink: { fontSize: 13, fontFamily: fonts.bold },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperValue: { minWidth: 96, textAlign: "center" },
  hint: { marginTop: spacing.xs },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  tagHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
  },
  timeValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
});
