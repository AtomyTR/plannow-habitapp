// Bu ekran: akış (tüm alışkanlıklar).
// Kullanıcının bütün alışkanlıkları, etiketlerine göre gruplanmış halde
// listelenir; etiketi olmayanlar en sonda "Etiketsiz" başlığı altında toplanır.
//
// En üstte kaç alışkanlığın devam ettiğini gösteren koyu bir rozet var.
// Her kart o alışkanlığın son günlerdeki durumunu ve 30 günlük tutarlılığını
// gösterir. Sağ alttaki + butonu yeni alışkanlık ekler.

import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "../../src/theme/ThemeProvider";
import { useI18n } from "../../src/languages";
import { radius, spacing, typography } from "../../src/theme/tokens";
import { useHabitStore } from "../../src/services/habitStore";
import { buildCompletionIndex, consistency } from "../../src/utils/gamification";
import { HabitGroupSection } from "../../src/components/feed/HabitGroupSection";
import { FAB } from "../../src/components/ui/FAB";
import { Habit } from "../../src/types/habit";
import { useRouter } from "expo-router";
import { useTabBarClearance } from "../../src/hooks/useTabBarClearance";

export default function FeedScreen() {
  const { colors } = useAppTheme();
  const { t } = useI18n();
  const router = useRouter();
  const { habits, isCompletedOn, loaded, tags, completions } = useHabitStore();
  const scrollBottomPadding = useTabBarClearance(40);

  // useMemo ile sarılı olması şart: aşağıdaki gruplama ve tutarlılık
  // hesaplarının bağımlılığı bu dizi. Her render'da yeni bir dizi üretilseydi
  // o memo'lar hiç işe yaramaz, her render'da baştan hesaplanırdı.
  const visibleHabits = useMemo(
    () => habits.filter((h) => !h.archived).sort((a, b) => a.order - b.order),
    [habits]
  );

  // Tamamlama indeksi bir kez kurulur; her kart için yeniden kurmak listeyi
  // alışkanlık sayısıyla kare biçiminde yavaşlatırdı.
  const consistencyByHabit = useMemo(() => {
    const index = buildCompletionIndex(completions);
    const map = new Map<string, ReturnType<typeof consistency>>();
    for (const habit of visibleHabits) {
      map.set(habit.id, consistency([habit], index, 30));
    }
    return map;
  }, [completions, visibleHabits]);

  // Alışkanlıkları etiketlerine göre gruplar; etiketsiz olanlar en sona,
  // "Etiketsiz" başlığı altında toplanır.
  const groups = useMemo(() => {
    const byTag = new Map<string, Habit[]>();
    const untagged: Habit[] = [];
    for (const h of visibleHabits) {
      if (h.tagId) {
        const list = byTag.get(h.tagId) ?? [];
        list.push(h);
        byTag.set(h.tagId, list);
      } else {
        untagged.push(h);
      }
    }
    // Grupların sırası etiket listesinin sırasını izler — kullanıcı her
    // açtığında aynı düzeni görsün.
    const tagged = tags.filter((tag) => byTag.has(tag.id)).map((tag) => ({
      title: tag.label,
      items: byTag.get(tag.id) ?? [],
    }));
    return untagged.length > 0
      ? [...tagged, { title: t("feed.untagged"), items: untagged }]
      : tagged;
  }, [visibleHabits, tags, t]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={[typography.largeTitle, { color: colors.text }]}>{t("feed.title")}</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingTop: spacing.lg, paddingBottom: scrollBottomPadding }}
        showsVerticalScrollIndicator={false}
      >
        {loaded && (
          <>
            <View style={[styles.pill, { backgroundColor: colors.black, marginHorizontal: spacing.lg }]}>
              <Text style={[typography.caption, { color: colors.white }]}>
                {t("feed.inProgress", { n: visibleHabits.length })}
              </Text>
            </View>

            {groups.length === 0 ? (
              <Text
                style={[
                  typography.body,
                  { color: colors.textMuted, paddingHorizontal: spacing.lg, marginTop: spacing.xl },
                ]}
              >
                {t("feed.empty")}
              </Text>
            ) : (
              groups.map((group) => (
                <HabitGroupSection
                  key={group.title}
                  title={group.title}
                  habits={group.items}
                  isCompletedOn={isCompletedOn}
                  consistencyByHabit={consistencyByHabit}
                />
              ))
            )}
          </>
        )}
      </ScrollView>

      <FAB onPress={() => router.push("/habit/add")} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: spacing.lg },
  pill: {
    alignSelf: "flex-start",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
  },
});
