import { memo } from "react";
import { useI18n } from "../../languages";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "../../theme/ThemeProvider";
import { layout, radius, shadow, fonts } from "../../theme/tokens";
import { weekdayShort, parseDateKey, startOfWeek, toDateKey } from "../../utils/date";

type DayStripProps = {
  selectedDate: string;
  onSelect: (dateKey: string) => void;
  /** O günde sırası gelen bir alışkanlık varsa noktanın rengi; yoksa null. */
  dotColorFor?: (dateKey: string) => string | null;
};

// Haftanın yedi günü (Bugun.html): eşit genişlikte, 64 yüksekliğinde, 16
// yarıçaplı hücreler. Seçili gün accent renkli ve gölgeli, altında beyaz bir
// çizgi; diğerleri yarı saydam beyaz, altında (varsa) renkli bir nokta.
// Etiketler tam yazılır (Pzt Salı Çarş Perş Cuma Cmt Pazar); dar ekranda
// kesilmesin diye yazı küçülür, "…" ile kısaltılmaz.
// memo: yalnızca seçili gün ya da nokta renkleri değişince yeniden çizilir.
export const DayStrip = memo(function DayStrip({ selectedDate, onSelect, dotColorFor }: DayStripProps) {
  // Gün kısaltmaları seçili dilde; dil değişince memo'lu şerit de yeniden çizilir.
  useI18n();
  const { colors } = useAppTheme();
  const monday = startOfWeek(parseDateKey(selectedDate));

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  return (
    <View style={styles.row}>
      {days.map((d) => {
        const key = toDateKey(d);
        const isSelected = key === selectedDate;
        const dot = dotColorFor?.(key) ?? null;
        const fg = isSelected ? "#FFFFFF" : colors.text;
        return (
          <Pressable
            key={key}
            onPress={() => onSelect(key)}
            accessibilityLabel={`${d.getDate()}`}
            style={[
              styles.cell,
              isSelected && styles.cellSelected,
              { backgroundColor: isSelected ? colors.accent : colors.glass },
              isSelected && shadow.primary,
            ]}
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
              allowFontScaling={false}
              style={[styles.label, { color: fg, opacity: isSelected ? 1 : 0.6 }]}
            >
              {weekdayShort(d.getDay())}
            </Text>
            <Text numberOfLines={1} allowFontScaling={false} style={[styles.number, isSelected && styles.numberSelected, { color: fg }]}>
              {d.getDate()}
            </Text>
            {isSelected ? (
              <View style={styles.bar} />
            ) : (
              <View style={[styles.dot, { backgroundColor: dot ?? "transparent" }]} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  cell: {
    flex: 1,
    height: layout.dayCellHeight,
    borderRadius: radius.day,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingHorizontal: 2,
  },
  // Seçili gün (varsayılan olarak bugün) diğerlerinden bir tık büyük: daha geniş ve daha uzun.
  cellSelected: { flex: 1.25, height: layout.dayCellHeight + 10 },
  // Android'de özel fontlar kendi genişliğiyle ölçülüp (shrink-wrap) One UI'da
  // son rakam kesilebiliyordu ("22" -> "2"): metin hücre genişliğini tam
  // kaplar, ortalanır; includeFontPadding kapalı + sabit lineHeight dikey
  // kaymayı önler.
  label: { fontFamily: fonts.semibold, fontSize: 11, lineHeight: 14, textAlign: "center", width: "100%", includeFontPadding: false },
  number: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 22, textAlign: "center", width: "100%", includeFontPadding: false },
  numberSelected: { fontSize: 20, lineHeight: 25 },
  bar: { width: 14, height: 3, borderRadius: 2, backgroundColor: "#FFFFFF" },
  dot: { width: 5, height: 5, borderRadius: 3 },
});
