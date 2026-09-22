import { Pressable, StyleSheet, Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useAppTheme } from "../../theme/ThemeProvider";
import { useI18n } from "../../languages";
import { darkTones, fonts, radius, tones, type ToneKey } from "../../theme/tokens";

type PlanRowProps = {
  /** "07:30" — saati olmayan plan için boş bırakılır. */
  time?: string;
  title: string;
  subtitle: string;
  tone: ToneKey;
  icon: React.ReactNode;
  done?: boolean;
  /** Verilirse sağda dokunulabilir bir tamamlama dairesi çıkar. */
  onToggle?: () => void;
  onPress?: () => void;
};

// Takvim.html'deki plan satırı: solda saat, sağda pastel kart (beyaz ikon
// karosu, başlık, alt yazı, tamamlama dairesi). Tamamlananlar %62 opaklıkta
// ve üstü çizili.
export function PlanRow({ time, title, subtitle, tone, icon, done, onToggle, onPress }: PlanRowProps) {
  const { colors, isDark } = useAppTheme();
  const { t: tx } = useI18n();
  const t = (isDark ? darkTones : tones)[tone];

  return (
    <View style={styles.row}>
      <Text style={[styles.time, { color: colors.textSecondary }]} allowFontScaling={false}>
        {time ?? ""}
      </Text>
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        style={[
          styles.card,
          { backgroundColor: t.bg, borderColor: t.border, opacity: done ? 0.62 : 1 },
        ]}
      >
        <View style={[styles.tile, { backgroundColor: colors.surface }]}>{icon}</View>
        <View style={styles.texts}>
          <Text
            style={[styles.title, { color: colors.text }, done && styles.done]}
            numberOfLines={2}
          >
            {title}
          </Text>
          <Text style={[styles.subtitle, { color: t.strong }]} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
        {onToggle ? (
          <Pressable
            onPress={onToggle}
            hitSlop={8}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: !!done }}
            accessibilityLabel={tx("calendar.complete")}
            style={[
              styles.check,
              done
                ? { backgroundColor: t.strong }
                : { backgroundColor: colors.surface, borderWidth: 2, borderColor: t.border },
            ]}
          >
            {done && <Feather name="check" size={14} color="#FFFFFF" />}
          </Pressable>
        ) : done ? (
          <View style={[styles.check, { backgroundColor: t.strong }]}>
            <Feather name="check" size={14} color="#FFFFFF" />
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 12, alignItems: "stretch" },
  time: { width: 44, paddingTop: 16, fontSize: 12, fontFamily: fonts.bold },
  card: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  tile: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  texts: { flex: 1, gap: 2 },
  title: { fontSize: 15, fontFamily: fonts.bold },
  done: { textDecorationLine: "line-through" },
  subtitle: { fontSize: 12, fontFamily: fonts.semibold },
  check: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
});
