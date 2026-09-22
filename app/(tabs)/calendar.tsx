// Bu ekran: takvim (Takvim.html).
// Üstte ay başlığı ve ay ızgarası, altında yaklaşan toplantılar, seçili günün
// planları (saat sırasıyla alışkanlıklar + toplantılar) ve abonelikler.
//
// Izgarada günlerin altındaki noktalar: yeşil = o gün sırası gelen alışkanlık,
// mor = toplantı, turuncu = abonelik ödemesi.
//
// Bir güne basmak o günü seçer ve plan listesi değişir. Plandaki alışkanlığın
// dairesine basmak o günü tamamlar / geri alır. Sağ alttaki + seçili gün için
// yeni toplantı ekler.

import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAppTheme } from "../../src/theme/ThemeProvider";
import { useI18n } from "../../src/languages";
import { layout, radius, spacing, toneKeyForColor, typography } from "../../src/theme/tokens";
import { FAB } from "../../src/components/ui/FAB";
import { HabitIcon } from "../../src/components/ui/tagIcons";
import { MonthGrid } from "../../src/components/calendar/MonthGrid";
import { MeetingList } from "../../src/components/calendar/MeetingList";
import { PlanRow } from "../../src/components/calendar/PlanRow";
import { SubscriptionRow } from "../../src/components/subscription/SubscriptionRow";
import { PressableScale } from "../../src/components/ui/PressableScale";
import { useHabitStore } from "../../src/services/habitStore";
import { monthName, monthMatrix, parseDateKey, toDateKey } from "../../src/utils/date";
import { isHabitDueOn } from "../../src/utils/habitSchedule";
import { formatTRY, monthlyTotal, renewalDaysInMonth, renewalKeyInMonth, yearlyTotal } from "../../src/utils/subscription";
import { useTabBarClearance } from "../../src/hooks/useTabBarClearance";

export default function CalendarScreen() {
  const { colors } = useAppTheme();
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { habits, meetings, subscriptions, loaded, isCompletedOn, toggleCompletion } = useHabitStore();
  const scrollBottomPadding = useTabBarClearance(40);

  const todayKey = toDateKey(new Date());
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const selectedObj = parseDateKey(selectedDate);

  // Görüntülenen ay, seçili günden bağımsız takip edilir.
  const [viewYear, setViewYear] = useState(selectedObj.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedObj.getMonth());

  const activeHabits = useMemo(() => habits.filter((h) => !h.archived), [habits]);

  // Görüntülenen ayda ödemesi düşen günler.
  const daysWithRenewals = useMemo(
    () => renewalDaysInMonth(subscriptions, viewYear, viewMonth),
    [subscriptions, viewYear, viewMonth]
  );
  const daysWithMeetings = useMemo(() => new Set(meetings.map((m) => m.date)), [meetings]);

  // Ay ızgarasındaki noktalar: yeşil alışkanlık, mor toplantı, turuncu abonelik.
  const dotsFor = useMemo(() => {
    const dueDays = new Set<string>();
    for (const week of monthMatrix(viewYear, viewMonth)) {
      for (const day of week) {
        const key = toDateKey(day);
        if (activeHabits.some((h) => isHabitDueOn(h, key))) dueDays.add(key);
      }
    }
    return (key: string) => {
      const dots: string[] = [];
      if (dueDays.has(key)) dots.push(colors.dotGreen);
      if (daysWithMeetings.has(key)) dots.push(colors.dotViolet);
      if (daysWithRenewals.has(key)) dots.push(colors.dotOrange);
      return dots;
    };
  }, [activeHabits, viewYear, viewMonth, daysWithMeetings, daysWithRenewals, colors]);

  // "Toplantılar" bölümü seçili günün toplantılarını (saat sırasıyla) gösterir.
  // Toplantılar plan listesinde tekrar edilmez.
  const dayMeetings = useMemo(
    () => meetings.filter((m) => m.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time)),
    [meetings, selectedDate]
  );

  // Seçili günün planı: sırası gelen alışkanlıklar ve yenilenen abonelikler,
  // saat sırasıyla; saati olmayanlar en sona. (Toplantılar kendi bölümünde.)
  const dayPlans = useMemo(() => {
    const habitPlans = activeHabits
      .filter((h) => isHabitDueOn(h, selectedDate))
      .map((h) => ({
        kind: "habit" as const,
        id: h.id,
        time: h.hasReminderTime ? h.reminderTime : undefined,
        habit: h,
      }));
    // O gün yenilenen (ödemesi düşen) abonelikler: saatleri yoktur, alışkanlığın
    // ve toplantıların ardından listelenir.
    const subscriptionPlans = subscriptions
      .filter((sub) => {
        const d = parseDateKey(selectedDate);
        return renewalKeyInMonth(sub, d.getFullYear(), d.getMonth()) === selectedDate;
      })
      .map((sub) => ({ kind: "subscription" as const, id: sub.id, time: undefined, subscription: sub }));
    return [...habitPlans, ...subscriptionPlans].sort((a, b) => {
      if (a.time && b.time) return a.time.localeCompare(b.time);
      if (a.time) return -1;
      if (b.time) return 1;
      return 0;
    });
  }, [activeHabits, subscriptions, selectedDate]);

  const subscriptionTotals = useMemo(
    () => ({ monthly: formatTRY(monthlyTotal(subscriptions)), yearly: formatTRY(yearlyTotal(subscriptions)) }),
    [subscriptions]
  );

  const goToMonth = (delta: number) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const goToToday = () => {
    const now = new Date();
    setSelectedDate(todayKey);
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
  };

  const addMeeting = () => router.push({ pathname: "/meeting/add", params: { date: selectedDate } });

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
          <Text
            style={[typography.largeTitle, styles.headerTitle, { color: colors.text }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {monthName(viewMonth)} {viewYear}
          </Text>
          <View style={styles.headerButtons}>
            <IconButton icon="chevron-left" label={t("calendar.prevMonth")} onPress={() => goToMonth(-1)} />
            <IconButton icon="chevron-right" label={t("calendar.nextMonth")} onPress={() => goToMonth(1)} />
            <IconButton icon="calendar" label={t("calendar.goToday")} onPress={goToToday} />
          </View>
        </View>

        <MonthGrid
          year={viewYear}
          month={viewMonth}
          selectedDate={selectedDate}
          dotsFor={dotsFor}
          onSelectDate={setSelectedDate}
        />

        <SectionHeader title={t("calendar.meetings")} actionLabel={t("calendar.add")} onAction={addMeeting} />
        <MeetingList
          loaded={loaded}
          meetings={dayMeetings}
          onPressMeeting={(id) => router.push({ pathname: "/meeting/add", params: { id } })}
          onAdd={addMeeting}
        />

        <SectionHeader
          title={t("calendar.dayTitle", { day: selectedObj.getDate(), month: monthName(selectedObj.getMonth()) })}
          right={t(dayPlans.length === 1 ? "calendar.planCount.one" : "calendar.planCount.other", { n: dayPlans.length })}
        />
        {loaded && dayPlans.length === 0 ? (
          <Text style={[typography.caption, { color: colors.textSecondary }]}>{t("calendar.noPlans")}</Text>
        ) : (
          <View style={styles.plans}>
            {dayPlans.map((p) => {
              if (p.kind === "subscription") {
                return (
                  <PlanRow
                    key={`s-${p.id}`}
                    title={p.subscription.name}
                    subtitle={t("calendar.subscriptionSubtitle", { amount: formatTRY(p.subscription.amount) })}
                    tone="rose"
                    icon={<Feather name="credit-card" size={18} color="#A04066" />}
                    onPress={() => router.push({ pathname: "/subscription/add", params: { id: p.id } })}
                  />
                );
              }
              const tone = toneKeyForColor(p.habit.color);
              const done = isCompletedOn(p.habit.id, selectedDate);
              const target =
                p.habit.hasTarget && p.habit.targetAmount
                  ? `${p.habit.targetAmount}${p.habit.targetUnit ? ` ${p.habit.targetUnit}` : ""}`
                  : null;
              return (
                <PlanRow
                  key={`h-${p.id}`}
                  time={p.time}
                  title={p.habit.title}
                  subtitle={target ?? (p.habit.hasReminderTime ? t("calendar.reminder") : t("calendar.habit"))}
                  tone={tone}
                  done={done}
                  icon={<HabitIcon icon={p.habit.icon} tagId={p.habit.tagId} size={20} color={colors.text} />}
                  onToggle={() => toggleCompletion(p.habit.id, selectedDate)}
                />
              );
            })}
          </View>
        )}

        {loaded && (
          <>
            <View style={styles.subsHeader}>
              <Feather name="credit-card" size={20} color={colors.text} />
              <Text style={[typography.title, { color: colors.text, flex: 1 }]}>{t("calendar.subscriptions")}</Text>
              {subscriptions.length > 0 && (
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={[typography.bodyStrong, { color: colors.text }]}>
                    {subscriptionTotals.monthly}
                    <Text style={[typography.caption, { color: colors.textSecondary }]}>{t("calendar.perMonth")}</Text>
                  </Text>
                  <Text style={[typography.small, { color: colors.textSecondary }]}>
                    {t("calendar.perYear", { amount: subscriptionTotals.yearly })}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.subscriptionList}>
              {subscriptions.map((sub) => (
                <SubscriptionRow
                  key={sub.id}
                  subscription={sub}
                  onPress={() => router.push({ pathname: "/subscription/add", params: { id: sub.id } })}
                />
              ))}

              {/* Ekleme butonu listenin İÇİNDE: sağ alttaki + toplantı ekler. */}
              <PressableScale
                onPress={() => router.push("/subscription/add")}
                style={[styles.addRow, { borderColor: "rgba(22,23,43,0.14)" }]}
              >
                <Feather name="plus" size={18} color={colors.textSecondary} />
                <Text style={[typography.body, { color: colors.textSecondary }]}>
                  {subscriptions.length > 0 ? t("calendar.addSubscription") : t("calendar.addFirstSubscription")}
                </Text>
              </PressableScale>
            </View>
          </>
        )}
      </ScrollView>

      <FAB onPress={addMeeting} />
    </View>
  );
}

function IconButton({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      style={[styles.iconButton, { backgroundColor: colors.panel }]}
    >
      <Feather name={icon} size={20} color={colors.text} />
    </Pressable>
  );
}

function SectionHeader({
  title,
  actionLabel,
  onAction,
  right,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  right?: string;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[typography.title, { color: colors.text }]}>{title}</Text>
      {actionLabel ? (
        <Pressable onPress={onAction} hitSlop={10}>
          <Text style={[typography.bodyStrong, { fontSize: 13, color: colors.accent }]}>{actionLabel}</Text>
        </Pressable>
      ) : right ? (
        <Text style={[typography.caption, { color: colors.textSecondary }]}>{right}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, gap: spacing.xl },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  headerTitle: { flex: 1 },
  headerButtons: { flexDirection: "row", gap: 6 },
  iconButton: {
    width: layout.touchTarget,
    height: layout.touchTarget,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeader: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  plans: { gap: 10 },
  subsHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  subscriptionList: { gap: spacing.md },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: "dashed",
  },
});
