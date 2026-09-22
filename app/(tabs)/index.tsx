// Bu ekran: ana sayfa.
// Üstte gün şeridi, altında o günün alışkanlıkları var.
//
// Kullanıcı yukarıdaki gün şeridinden bir gün seçer; ekrandaki her şey
// (başlık, filtre sayıları, alışkanlık listesi) o güne göre
// yeniden hesaplanır.
//
// Kullanıcı bir alışkanlığı işaretleyince:
//   1. Tamamlama kaydedilir
//   2. O kartın üstünde konfeti patlar
//   3. Seri 7/30/100. güne ulaştıysa konfeti daha büyük patlar
//
// Sağ alttaki + butonu yeni alışkanlık ekleme formunu açar.

import { useCallback, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAppTheme } from "../../src/theme/ThemeProvider";
import { useI18n } from "../../src/languages";
import { spacing, toneKeyForColor, typography } from "../../src/theme/tokens";
import { DayStrip } from "../../src/components/ui/DayStrip";
import { FAB } from "../../src/components/ui/FAB";
import { BottomFade } from "../../src/components/ui/BottomFade";
import { HomeHeader } from "../../src/components/home/HomeHeader";
import { HabitListSection } from "../../src/components/home/HabitListSection";
import { useHabitStore } from "../../src/services/habitStore";
import { Habit } from "../../src/types/habit";
import { formatDayTitle, parseDateKey, toDateKey } from "../../src/utils/date";
import { isHabitDueOn } from "../../src/utils/habitSchedule";
import { buildCompletionIndex, currentStreak, isStreakMilestone } from "../../src/utils/gamification";
import type { ConfettiIntensity } from "../../src/components/ui/ConfettiBurst";
import { useTabBarClearance } from "../../src/hooks/useTabBarClearance";

export default function HomeScreen() {
  const { colors } = useAppTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    habits,
    completions,
    settings,
    loaded,
    isCompletedOn,
    toggleCompletion,
    deleteHabit,
  } = useHabitStore();
  const scrollBottomPadding = useTabBarClearance(40);

  const today = toDateKey(new Date());
  const [selectedDate, setSelectedDate] = useState(today);

  // O an konfeti patlayan kartlar: alışkanlık id'si → patlamanın şiddeti.
  // Tek bir kart yerine liste tutulmasının sebebi: iki alışkanlık hızlı art
  // arda tamamlandığında ilkinin patlaması yarıda kesilmesin. Her kart kendi
  // kutlamasını bitirince listeden kendini düşürür.
  const [celebrating, setCelebrating] = useState<Map<string, ConfettiIntensity>>(
    () => new Map()
  );

  const endCelebration = useCallback((habitId: string) => {
    setCelebrating((prev) => {
      if (!prev.has(habitId)) return prev;
      const next = new Map(prev);
      next.delete(habitId);
      return next;
    });
  }, []);
  // Aynı kilometre taşının (aynı alışkanlık + aynı seri sayısı) bir oturum
  // içinde tekrar tekrar BÜYÜK kutlanmasını engeller — kullanıcı işareti
  // kaldırıp yeniden koyduğunda 7. gün patlaması bir daha atılmaz. Sıradan
  // konfeti bu kısıtlamaya tabi değildir, her tamamlamada atılır.
  const celebratedMilestonesRef = useRef<Set<string>>(new Set());

  // Her tamamlamada o kartın üstünde konfeti patlatır. Tamamlama bugüne aitse
  // ve kaydedildikten SONRAKİ seri tam 7/30/100'e denk geliyorsa, patlama
  // belirgin şekilde daha büyük olan "milestone" varyantına yükselir.
  const celebrateCompletion = (habit: Habit) => {
    let intensity: ConfettiIntensity = "normal";

    // Seri "bugünden geriye" hesaplanır; geçmiş bir güne işaret koymak bugünün
    // serisini kutlamayı gerektirmez — o durumda sıradan konfeti yeterli.
    if (selectedDate === today) {
      // Sadece bu alışkanlığın kayıtları: tüm listeyi indekslemeye gerek yok.
      const index = buildCompletionIndex(completions.filter((c) => c.habitId === habit.id));
      let dates = index.get(habit.id);
      if (!dates) {
        dates = new Set<string>();
        index.set(habit.id, dates);
      }
      // `completions` bu render'da henüz güncellenmemiş olabilir; yeni
      // tamamlamayı indekse elle ekleyerek sonucu şimdiden hesapla.
      dates.add(selectedDate);

      const streak = currentStreak(habit, index);
      const key = `${habit.id}:${streak}`;
      if (isStreakMilestone(streak) && !celebratedMilestonesRef.current.has(key)) {
        celebratedMilestonesRef.current.add(key);
        intensity = "milestone";
      }
    }

    setCelebrating((prev) => new Map(prev).set(habit.id, intensity));
  };

  // --- Seçili güne ait başlıklar -----------------------------------------

  const selectedDateObj = parseDateKey(selectedDate);
  const headerTitle = formatDayTitle(selectedDateObj);
  // --- O günün alışkanlıkları ---------------------------------------------

  // Seçili günde "sırası gelmiş" alışkanlıklar — tekrar döngüsü hesabı
  // isHabitDueOn() içinde yapılır (bkz. utils/habitSchedule.ts).
  const dueHabits = habits
    .filter((h) => !h.archived)
    .filter((h) => isHabitDueOn(h, selectedDate));

  const isCompletedToday = (habit: Habit) => isCompletedOn(habit.id, selectedDate);


  // Sıralama. Normalde kullanıcının kendi belirlediği sıra (`order`) geçerli.
  // "Tamamlanmamışlar üstte" ayarı açıksa önce yapılmamışlar gelir, kendi
  // içlerinde yine `order` sırasını korurlar.
  // Listede tüm (arşivlenmemiş) alışkanlıklar görünür; o gün sırası
  // gelmeyenler gizlenmez, sadece sırası gelenlerin altına dizilir.
  const dueIds = new Set(dueHabits.map((h) => h.id));
  const sorted = habits
    .filter((h) => !h.archived)
    .sort((a, b) => {
      const aDue = dueIds.has(a.id) ? 0 : 1;
      const bDue = dueIds.has(b.id) ? 0 : 1;
      if (aDue !== bDue) return aDue - bDue;
      if (settings.incompleteFirst) {
        const aDone = isCompletedToday(a) ? 1 : 0;
        const bDone = isCompletedToday(b) ? 1 : 0;
        if (aDone !== bDone) return aDone - bDone;
      }
      return a.order - b.order;
    });

  // Kart kaydırılınca/işaretlenince: önce kaydet, sonra (yeni bir tamamlama
  // ise) kutla. Zaten işaretliyken tekrar basmak işareti kaldırır ve konfeti
  // patlamaz.
  const handleToggleHabit = (habit: Habit) => {
    const wasCompleted = isCompletedToday(habit);
    toggleCompletion(habit.id, selectedDate);
    if (!wasCompleted) celebrateCompletion(habit);
  };

  // Kartlar memo'lu: onlara her render'da aynı kalan fonksiyonlar verilir,
  // güncel mantık ref üzerinden okunur. Böylece bir tik yalnızca o kartı çizer.
  const latestHandlers = useRef({ toggle: handleToggleHabit, remove: (habit: Habit) => deleteHabit(habit.id) });
  latestHandlers.current = { toggle: handleToggleHabit, remove: (habit: Habit) => deleteHabit(habit.id) };
  const onToggleHabit = useCallback((habit: Habit) => latestHandlers.current.toggle(habit), []);
  const onDeleteHabit = useCallback((habit: Habit) => latestHandlers.current.remove(habit), []);

  // Gün şeridindeki nokta: o gün sırası gelen ilk alışkanlığın pastel ailesine
  // göre turuncu / mor / yeşil; hiç alışkanlık yoksa nokta çıkmaz.
  // Tamamlama işaretinden bağımsızdır; yalnızca alışkanlıklar/tema değişince
  // yeniden hesaplanır ve gün başına sonuç önbelleğe alınır.
  const dotColorFor = useMemo(() => {
    const visible = habits.filter((h) => !h.archived).sort((a, b) => a.order - b.order);
    const cache = new Map<string, string | null>();
    return (dateKey: string): string | null => {
      const cached = cache.get(dateKey);
      if (cached !== undefined) return cached;
      const first = visible.find((h) => isHabitDueOn(h, dateKey));
      let color: string | null = null;
      if (first) {
        const tone = toneKeyForColor(first.color);
        color =
          tone === "mint" ? colors.dotGreen : tone === "butter" || tone === "peach" ? colors.dotOrange : colors.dotViolet;
      }
      cache.set(dateKey, color);
      return color;
    };
  }, [habits, colors]);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: scrollBottomPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <HomeHeader title={headerTitle} onPressSettings={() => router.push("/settings")} />

        <DayStrip selectedDate={selectedDate} onSelect={setSelectedDate} dotColorFor={dotColorFor} />

        <View style={styles.sectionHeader}>
          <Text style={[typography.sectionTitle, { color: colors.text }]}>{t("home.habits")}</Text>
          <Pressable onPress={() => router.push("/feed")} hitSlop={10}>
            <Text style={[typography.bodyStrong, styles.link, { color: colors.accent }]}>{t("home.seeAll")}</Text>
          </Pressable>
        </View>

        <HabitListSection
          loaded={loaded}
          habits={sorted}
          dueCount={sorted.length}
          isCompleted={isCompletedToday}
          onToggle={onToggleHabit}
          onDelete={onDeleteHabit}
          celebrating={celebrating}
          onCelebrationDone={endCelebration}
        />
      </ScrollView>

      <BottomFade />

      <FAB onPress={() => router.push("/habit/add")} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  // Referans: yan boşluk 20, bölümler arası 20.
  content: { paddingHorizontal: spacing.xl, gap: spacing.xl },
  sectionHeader: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  link: { fontSize: 13 },
});
