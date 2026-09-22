// "Dönem" bölümü: alışkanlığın aktif olduğu tarih aralığı.
//
// Yan yana iki tarih kutusu vardır — solda başlangıç, sağda (isteğe bağlı)
// bitiş. Aralarındaki tire, bunun tek bir aralık olduğunu gösterir.
// Aralığın dışında kalan günlerde alışkanlığın sırası gelmez; bu kural
// utils/habitSchedule.ts içinde uygulanır ve oradan takvime, seriye ve
// tutarlılık oranına kendiliğinden yansır.
//
// İki tarih de boş bırakılabilir. Boş bir alan "o yönde sınır yok" demektir:
// başlangıcı olmayan bir alışkanlık geçmişte de, bitişi olmayan bir alışkanlık
// gelecekte de süresiz aktiftir. Bu yüzden dönem alanlarına hiç dokunulmamış
// eski alışkanlıklar eskisi gibi çalışmaya devam eder.

import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAppTheme } from "../../theme/ThemeProvider";
import { useI18n } from "../../languages";
import { fonts, radius, spacing } from "../../theme/tokens";
import { toDateKey } from "../../utils/date";

// "20.09.2026" biçimi (referans).
function formatDate(date: Date) {
  const key = toDateKey(date); // YYYY-MM-DD
  const [y, m, d] = key.split("-");
  return `${d}.${m}.${y}`;
}

type HabitPeriodSectionProps = {
  startDate: Date | null;
  onStartDateChange: (date: Date | null) => void;
  endDate: Date | null;
  onEndDateChange: (date: Date | null) => void;
};

export function HabitPeriodSection({
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
}: HabitPeriodSectionProps) {
  const { colors } = useAppTheme();
  const { t } = useI18n();
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Bitiş, başlangıçtan önce olamaz. Seçiciye zaten `minimumDate` verilir ama
  // her platform bunu aynı katılıkta uygulamaz; bu yüzden gelen değer burada
  // da sessizce başlangıca çekilir. Kullanıcı engellenmez, geçersiz aralık
  // hiç oluşmaz.
  const clampToStart = (date: Date, start: Date | null) =>
    start && toDateKey(date) < toDateKey(start) ? start : date;

  const handleStartChange = (date: Date) => {
    onStartDateChange(date);
    // Başlangıç ileri kaydırılıp bitişi geçtiyse, bitiş de onunla birlikte
    // taşınır — aksi halde arkada geçersiz bir aralık kalırdı.
    if (endDate) onEndDateChange(clampToStart(endDate, date));
  };

  return (
    <>
      <Text style={[styles.heading, { color: colors.text }]}>{t("habitForm.period.title")}</Text>

      <View style={styles.row}>
        <Pressable
          onPress={() => setShowStartPicker(true)}
          style={[styles.dateBox, { backgroundColor: colors.surfaceMuted }]}
        >
          <Text
            style={[styles.dateText, { color: startDate ? colors.text : colors.textSecondary }]}
            numberOfLines={2}
          >
            {startDate ? formatDate(startDate) : t("habitForm.period.start")}
          </Text>
          {startDate ? (
            <Pressable onPress={() => onStartDateChange(null)} hitSlop={8}>
              <Feather name="x" size={17} color={colors.textSecondary} />
            </Pressable>
          ) : (
            <Feather name="calendar" size={17} color={colors.textSecondary} />
          )}
        </Pressable>

        <Text style={[styles.dash, { color: colors.textSecondary }]}>–</Text>

        <Pressable
          onPress={() => setShowEndPicker(true)}
          style={[styles.dateBox, { backgroundColor: colors.surfaceMuted }]}
        >
          <Text
            style={[styles.dateText, { color: endDate ? colors.text : colors.textSecondary }]}
            numberOfLines={2}
          >
            {endDate ? formatDate(endDate) : t("habitForm.period.endOptional")}
          </Text>
          {endDate ? (
            <Pressable onPress={() => onEndDateChange(null)} hitSlop={8}>
              <Feather name="x" size={17} color={colors.textSecondary} />
            </Pressable>
          ) : (
            <Feather name="calendar" size={17} color={colors.textSecondary} />
          )}
        </Pressable>
      </View>

      {showStartPicker && (
        <DateTimePicker
          value={startDate ?? new Date()}
          mode="date"
          display="default"
          onChange={(_, date) => {
            setShowStartPicker(false);
            if (date) handleStartChange(date);
          }}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={endDate ?? startDate ?? new Date()}
          mode="date"
          display="default"
          minimumDate={startDate ?? undefined}
          onChange={(_, date) => {
            setShowEndPicker(false);
            if (date) onEndDateChange(clampToStart(date, startDate));
          }}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 15, fontFamily: fonts.extrabold, marginBottom: spacing.md },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  dateBox: {
    flex: 1,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dateText: { flex: 1, fontSize: 14, fontFamily: fonts.bold },
  dash: { fontSize: 14, fontFamily: fonts.bold },
});
