import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "../../theme/ThemeProvider";
import { useI18n } from "../../languages";
import { radius, spacing, typography } from "../../theme/tokens";

// JS Date#getDay() sırası: 0=Pazar..6=Cumartesi. Ekranda Pazartesi'den başlar.
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const WEEKDAYS = [1, 2, 3, 4, 5];
const WEEKEND = [0, 6];

type WeekdaySelectorProps = {
  value: number[];
  onChange: (days: number[]) => void;
};

/** Küçük, çerçeveli hızlı seçim çipi (Hafta içi, Hafta sonu). */
function QuickChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[
        styles.quickChip,
        { borderColor: selected ? colors.accent : colors.border },
      ]}
    >
      <Text style={[typography.caption, { color: selected ? colors.accent : colors.textSecondary }]}>{label}</Text>
    </Pressable>
  );
}

export function WeekdaySelector({ value, onChange }: WeekdaySelectorProps) {
  const { colors } = useAppTheme();
  const { t } = useI18n();

  const toggleDay = (day: number) => {
    onChange(value.includes(day) ? value.filter((d) => d !== day) : [...value, day].sort());
  };

  const isSet = (days: number[]) =>
    days.length === value.length && days.every((d) => value.includes(d));

  return (
    <View style={{ gap: spacing.md }}>
      <View style={styles.dayRow}>
        {DAY_ORDER.map((day) => {
          const selected = value.includes(day);
          return (
            <Pressable
              key={day}
              onPress={() => toggleDay(day)}
              hitSlop={6}
              style={[
                styles.dayCircle,
                {
                  backgroundColor: selected ? colors.accent : colors.surfaceMuted,
                  borderColor: selected ? colors.accent : colors.border,
                },
              ]}
            >
              <Text style={[typography.caption, { color: selected ? colors.white : colors.text }]}>
                {t(`habitForm.weekday.${day}` as "habitForm.weekday.0")}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.quickRow}>
        <QuickChip label={t("habitForm.weekday.weekdays")} selected={isSet(WEEKDAYS)} onPress={() => onChange(WEEKDAYS)} />
        <QuickChip label={t("habitForm.weekday.weekend")} selected={isSet(WEEKEND)} onPress={() => onChange(WEEKEND)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dayRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  quickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  quickChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
});
