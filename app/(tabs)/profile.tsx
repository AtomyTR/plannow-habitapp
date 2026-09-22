// Bu ekran: profil (Profil.html) — "Haftan".
// Hesap/üyelik yoktur; burası kullanıcının kendi verisinden çıkarılan haftalık
// bir başarı özetidir. Sırasıyla: özet kartı, üç istatistik, günlük istikrar
// grafiği ve devam eden seriler.
//
// Sağ üstteki çöp kutusu silinen alışkanlıkların ekranına götürür.
//
// Buradaki hiçbir sayı diske yazılmaz; hepsi mevcut tamamlama kayıtlarından
// her açılışta yeniden hesaplanır.

import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAppTheme } from "../../src/theme/ThemeProvider";
import {
  darkTones,
  fonts,
  heroGradient,
  layout,
  radius,
  shadow,
  spacing,
  tones,
  toneKeyForColor,
  typography,
  type ToneKey,
} from "../../src/theme/tokens";
import { useHabitStore } from "../../src/services/habitStore";
import { monthName, addDays, startOfWeek, toDateKey } from "../../src/utils/date";
import { isHabitDueOn } from "../../src/utils/habitSchedule";
import {
  buildCompletionIndex,
  consistency,
  currentStreak,
} from "../../src/utils/gamification";
import { useTabBarClearance } from "../../src/hooks/useTabBarClearance";
import { buildMessage } from "../../src/components/profile/summaryMessage";
import { LanguageSheet } from "../../src/components/profile/LanguageSheet";
import { useI18n, type TranslationKey } from "../../src/languages";
import { HabitIcon } from "../../src/components/ui/tagIcons";

// Mesaj metni, kırılgan tek günlük oran yerine 30 günlük tutarlılıktan üretilir:
// tek bir kaçırılan gün 7 günlük pencerede %14'lük bir düşüş demektir ve haksız
// yere "başarısızlık" gibi okunur.
const MESSAGE_WINDOW_DAYS = 30;
const MAX_STREAK_ROWS = 5;
const CHART_HEIGHT = 96;
const MIN_BAR_PERCENT = 6;

// Pzt..Paz sırasıyla gün etiketleri (Profil.html grafiği).

export default function ProfileScreen() {
  const { colors, isDark } = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { habits, completions, loaded, trashedHabits, updateSettings } = useHabitStore();
  const { t } = useI18n();
  const [showLanguage, setShowLanguage] = useState(false);
  const scrollBottomPadding = useTabBarClearance(40);
  const trashCount = trashedHabits.length;
  const palette = isDark ? darkTones : tones;

  const completionIndex = useMemo(() => buildCompletionIndex(completions), [completions]);

  const summary = useMemo(() => {
    const visible = habits.filter((h) => !h.archived);
    const today = new Date();
    const todayKey = toDateKey(today);
    const monday = startOfWeek(today);
    const createdKeys = new Map(visible.map((h) => [h.id, toDateKey(new Date(h.createdAt))]));

    // Bu haftanın (Pzt-Paz) her günü: sırası gelen alışkanlık sayısı ve bunların
    // kaçının tamamlandığı. Gelecek günler hesaba girmez.
    const week = Array.from({ length: 7 }, (_, i) => {
      const date = addDays(monday, i);
      const key = toDateKey(date);
      const isFuture = key > todayKey;
      const due = isFuture
        ? []
        : visible.filter((h) => key >= createdKeys.get(h.id)! && isHabitDueOn(h, key));
      const done = due.filter((h) => completionIndex.get(h.id)?.has(key)).length;
      return { key, isToday: key === todayKey, isFuture, due: due.length, done };
    });

    const weekDue = week.reduce((n, d) => n + d.due, 0);
    const weekDone = week.reduce((n, d) => n + d.done, 0);
    const daysWithPlans = week.filter((d) => d.due > 0);
    const faithfulDays = daysWithPlans.filter((d) => d.done === d.due).length;

    const monthly = consistency(visible, completionIndex, MESSAGE_WINDOW_DAYS);
    // Her alışkanlığın serisi bir kez hesaplanır; en uzunu da buradan çıkar.
    const allStreaks = visible.map((h) => ({ habit: h, days: currentStreak(h, completionIndex) }));
    const streak = allStreaks.reduce((max, s) => Math.max(max, s.days), 0);

    const streaks = allStreaks
      .filter((s) => s.days > 0)
      .sort((a, b) => b.days - a.days)
      .slice(0, MAX_STREAK_ROWS);

    const sunday = addDays(monday, 6);
    const range =
      monday.getMonth() === sunday.getMonth()
        ? t("profile.range.sameMonth", { start: monday.getDate(), end: sunday.getDate(), month: monthName(sunday.getMonth()) })
        : t("profile.range.crossMonth", {
            start: monday.getDate(),
            startMonth: monthName(monday.getMonth()),
            end: sunday.getDate(),
            endMonth: monthName(sunday.getMonth()),
          });

    return {
      habitCount: visible.length,
      week,
      weekDone,
      weekRate: weekDue > 0 ? Math.round((weekDone / weekDue) * 100) : 0,
      faithfulDays,
      planDays: daysWithPlans.length,
      monthly,
      streak,
      streaks,
      range,
    };
  }, [habits, completionIndex, t]);

  const message = buildMessage({
    habitCount: summary.habitCount,
    completed: summary.monthly.completed,
    possible: summary.monthly.possible,
    rate: summary.monthly.rate,
    streak: summary.streak,
  });

  const tile = (key: ToneKey) => palette[key];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: scrollBottomPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerTexts}>
            <Text style={[typography.largeTitle, { color: colors.text }]}>{t("profile.title")}</Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>{summary.range}</Text>
          </View>
          <View style={styles.headerButtons}>
          <Pressable
            onPress={() => setShowLanguage(true)}
            accessibilityLabel={t("common.language")}
            style={[styles.trashButton, { backgroundColor: colors.panel }]}
          >
            <Feather name="globe" size={20} color={colors.text} />
          </Pressable>
          <Pressable
            onPress={() => router.push("/settings/trash")}
            accessibilityLabel={t("profile.trash")}
            style={[styles.trashButton, { backgroundColor: colors.panel }]}
          >
            <Feather name="trash-2" size={20} color={colors.text} />
            {trashCount > 0 && (
              <View style={[styles.trashBadge, { backgroundColor: colors.danger }]}>
                <Text style={styles.trashBadgeText}>{trashCount}</Text>
              </View>
            )}
          </Pressable>
          </View>
        </View>

        <LanguageSheet
          visible={showLanguage}
          onSelect={(language) => updateSettings({ language })}
          onClose={() => setShowLanguage(false)}
        />

        {loaded && (
          <>
            {/* Özet kartı: opak gradient, bu yüzden elevation güvenli. */}
            <View style={[styles.heroWrap, shadow.hero]}>
              <LinearGradient
                colors={heroGradient}
                locations={[0, 0.6, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.hero}
              >
                <Text style={styles.heroLabel}>{t("profile.heroLabel")}</Text>
                <Text style={styles.heroMessage}>{message}</Text>
                {summary.planDays > 0 && (
                  <Text style={styles.heroSub}>
                    {t(summary.planDays === 1 ? "profile.faithful.one" : "profile.faithful", { total: summary.planDays, n: summary.faithfulDays })}
                  </Text>
                )}
              </LinearGradient>
            </View>

            <View style={styles.statRow}>
              <StatTile
                tone={tile("mint")}
                icon={<Feather name="check" size={20} color={tile("mint").strong} />}
                value={`%${summary.weekRate}`}
                label={t("profile.stat.completion")}
              />
              <StatTile
                tone={tile("peach")}
                icon={<MaterialCommunityIcons name="fire" size={20} color={tile("peach").strong} />}
                value={`${summary.streak}`}
                label={t("profile.stat.longestStreak")}
              />
              <StatTile
                tone={tile("lavender")}
                icon={<Feather name="clock" size={20} color={tile("lavender").strong} />}
                value={`${summary.weekDone}`}
                label={t("profile.stat.completed")}
              />
            </View>

            <View style={[styles.card, { backgroundColor: colors.panel }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{t("profile.dailyConsistency")}</Text>
              <View style={styles.chart}>
                {summary.week.map((d, i) => {
                  const percent =
                    d.due > 0 ? Math.max(MIN_BAR_PERCENT, Math.round((d.done / d.due) * 100)) : MIN_BAR_PERCENT;
                  return (
                    <View key={d.key} style={styles.chartColumn}>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.bar,
                            {
                              height: `${percent}%`,
                              backgroundColor: d.isToday ? colors.accent : colors.chartBar,
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.chartLabel, { color: colors.textSecondary }]} numberOfLines={1}>
                        {t(`profile.chartDay.${i}` as TranslationKey)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: colors.panel }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{t("profile.activeStreaks")}</Text>
              {summary.streaks.length === 0 ? (
                <Text style={[typography.caption, { color: colors.textSecondary }]}>
                  {t("profile.noStreaks")}
                </Text>
              ) : (
                summary.streaks.map(({ habit, days }) => {
                  const tn = tile(toneKeyForColor(habit.color));
                  return (
                    <View key={habit.id} style={styles.streakRow}>
                      <View style={[styles.streakTile, { backgroundColor: tn.bg }]}>
                        <HabitIcon icon={habit.icon} tagId={habit.tagId} size={20} color={tn.strong} />
                      </View>
                      <Text style={[styles.streakTitle, { color: colors.text }]} numberOfLines={2}>
                        {habit.title}
                      </Text>
                      <View style={styles.streakBadge}>
                        <MaterialCommunityIcons name="fire" size={15} color={colors.streakIcon} />
                        <Text style={[styles.streakDays, { color: colors.streak }]}>{t(days === 1 ? "profile.days.one" : "profile.days", { n: days })}</Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </>
        )}

        <Text style={[styles.credit, { color: colors.textMuted }]}>{t("profile.credit")}</Text>
      </ScrollView>
    </View>
  );
}

function StatTile({
  tone,
  icon,
  value,
  label,
}: {
  tone: { bg: string; border: string; strong: string };
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.tile, { backgroundColor: tone.bg, borderColor: tone.border }]}>
      {icon}
      <Text style={[styles.tileValue, { color: colors.text }]} adjustsFontSizeToFit numberOfLines={1}>
        {value}
      </Text>
      <Text style={[styles.tileLabel, { color: tone.strong }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, gap: spacing.xl },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  headerTexts: { flex: 1, gap: 2 },
  headerButtons: { flexDirection: "row", gap: spacing.sm },
  trashButton: {
    width: layout.touchTarget,
    height: layout.touchTarget,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  trashBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  trashBadgeText: { color: "#FFFFFF", fontSize: 10, fontFamily: fonts.bold },
  credit: { fontSize: 11, fontFamily: fonts.medium, textAlign: "center" },
  heroWrap: { borderRadius: radius.xxl },
  hero: { borderRadius: radius.xxl, padding: 20, gap: 10 },
  heroLabel: { color: "#FFFFFF", opacity: 0.85, fontSize: 12, fontFamily: fonts.bold },
  heroMessage: { color: "#FFFFFF", fontSize: 20, lineHeight: 26, fontFamily: fonts.extrabold },
  heroSub: { color: "#FFFFFF", opacity: 0.9, fontSize: 13, fontFamily: fonts.semibold },
  statRow: { flexDirection: "row", gap: 10 },
  tile: { flex: 1, padding: 14, borderRadius: radius.lg, borderWidth: 1, gap: 8 },
  tileValue: { fontSize: 22, fontFamily: fonts.extrabold },
  tileLabel: { fontSize: 12, fontFamily: fonts.semibold },
  card: { padding: spacing.lg, borderRadius: radius.xl, gap: 14 },
  cardTitle: { fontSize: 15, fontFamily: fonts.extrabold },
  chart: { flexDirection: "row", gap: 8 },
  chartColumn: { flex: 1, alignItems: "center", gap: 6 },
  barTrack: { width: "100%", height: CHART_HEIGHT, justifyContent: "flex-end" },
  bar: { width: "100%", borderRadius: radius.xs },
  chartLabel: { fontSize: 11, fontFamily: fonts.bold },
  streakRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  streakTile: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  streakTitle: { flex: 1, fontSize: 15, fontFamily: fonts.bold },
  streakBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  streakDays: { fontSize: 13, fontFamily: fonts.extrabold },
});
