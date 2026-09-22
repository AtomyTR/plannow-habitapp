import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "../../theme/ThemeProvider";
import { useI18n } from "../../languages";
import { fonts, radius, shadow, typography } from "../../theme/tokens";
import { monthMatrix, toDateKey } from "../../utils/date";

// Takvim.html'deki başlıklar: Pzt Sal Çar Per Cum Cmt Paz (gün şeridindeki
// "Salı/Çarş/Perş" yazımından farklı, bilerek).
const GRID_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const;

const LEGEND = [
  { label: "calendar.habit", color: "dotGreen" },
  { label: "calendar.meeting", color: "dotViolet" },
  { label: "calendar.subscription", color: "dotOrange" },
] as const;

type MonthGridProps = {
  year: number;
  month: number; // 0 = Ocak
  selectedDate: string;
  /** O gün altında gösterilecek noktaların renkleri (en çok 3). */
  dotsFor: (dateKey: string) => string[];
  onSelectDate: (dateKey: string) => void;
};

// Ay ızgarası kartı: yarı saydam beyaz panel, Pzt-Paz başlıkları, 40 yüksekliğinde
// 12 yarıçaplı hücreler. Ay dışındaki günler boş bırakılır (referans). Seçili
// gün accent dolgulu; günlerin altında etkinlik türünü gösteren 4 px noktalar var.
export function MonthGrid({ year, month, selectedDate, dotsFor, onSelectDate }: MonthGridProps) {
  const { colors } = useAppTheme();
  const { t } = useI18n();
  const weeks = useMemo(() => monthMatrix(year, month), [year, month]);
  // Son haftalar tamamen ay dışıysa satırı hiç çizme (referansta 5 satır).
  const visibleWeeks = weeks.filter((week) => week.some((d) => d.getMonth() === month));

  return (
    <View style={[styles.card, { backgroundColor: colors.panel }, shadow.card]}>
      <View style={styles.row}>
        {GRID_WEEKDAYS.map((i) => (
          <Text key={i} style={[styles.weekday, { color: colors.textSecondary }]} numberOfLines={1}>
            {t(`calendar.gridWeekday.${i}`)}
          </Text>
        ))}
      </View>

      <View style={styles.weeks}>
        {visibleWeeks.map((week, wi) => (
          <View key={wi} style={styles.row}>
            {week.map((day) => {
              const key = toDateKey(day);
              const inMonth = day.getMonth() === month;
              if (!inMonth) return <View key={key} style={styles.cell} />;
              const selected = key === selectedDate;
              const dots = dotsFor(key).slice(0, 3);
              return (
                <Pressable
                  key={key}
                  onPress={() => onSelectDate(key)}
                  accessibilityLabel={`${day.getDate()}`}
                  style={[styles.cell, selected && { backgroundColor: colors.accent }]}
                >
                  <Text
                    style={[
                      typography.caption,
                      { fontSize: 14, color: selected ? "#FFFFFF" : colors.text },
                      selected && { fontFamily: fonts.bold },
                    ]}
                  >
                    {day.getDate()}
                  </Text>
                  <View style={styles.dots}>
                    {dots.map((c, i) => (
                      // Seçili günde de nokta kendi rengini korur; mavi zeminde
                      // seçilebilsin diye ince beyaz bir halka alır.
                      <View key={i} style={[selected ? styles.dotOnAccent : styles.dot, { backgroundColor: c }]} />
                    ))}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      {/* Noktaların ne anlama geldiği: hiç açıklamasız renkli nokta okunmaz. */}
      <View style={styles.legend}>
        {LEGEND.map((item) => (
          <View key={item.label} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: colors[item.color] }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>{t(item.label)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 14, borderRadius: radius.xl, gap: 6 },
  weeks: { gap: 6 },
  row: { flexDirection: "row", gap: 4 },
  weekday: { flex: 1, textAlign: "center", fontSize: 11, fontFamily: fonts.bold },
  cell: {
    flex: 1,
    height: 40,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  legend: { flexDirection: "row", justifyContent: "center", gap: 16, paddingTop: 6 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendText: { fontSize: 11, fontFamily: fonts.semibold },
  dots: { flexDirection: "row", alignItems: "center", gap: 2, height: 6 },
  dot: { width: 4, height: 4, borderRadius: 2 },
  dotOnAccent: { width: 6, height: 6, borderRadius: 3, borderWidth: 1, borderColor: "#FFFFFF" },
});
