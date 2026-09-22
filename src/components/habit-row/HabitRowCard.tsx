// Bu dosya: ana sayfadaki tek bir alışkanlık kartı (referanstaki kart).
//
// Kart, alışkanlığın kendi renginden türetilmiş pastel, buzlu-cam bir zemine
// sahiptir. Üstte ikon dairesi + başlık + düzenle butonu, altında durum/hedef
// çipleri, ardından "Döngü" ve "Etiket" satırları gelir.
//
// Kullanıcı bu kartla üç şey yapabilir:
//   • "Devam ediyor" / "Tamamlandı" çipine dokunmak → tamamlar / geri alır
//   • Sağa uzun kaydırmak (kartın %45'inden fazla)  → aynı şey
//   • Sola uzun kaydırmak (kartın %45'inden fazla)  → alışkanlığı siler (toz efektiyle)
//   • Sağ üstteki kaleme basmak → düzenleme ekranını açar
// Kartın kendisine dokunmak HİÇBİR şey yapmaz: kaydırırken ya da sayfayı
// kaydırırken kazara tamamlama olmasın.
//
// Tamamlama kutlaması (konfeti) bu kartın üstünde patlar — şiddetine ana
// sayfa karar verir, buraya `celebrate` olarak gelir.
//
// "Hareketi azalt" açıkken tüm animasyonlar atlanır ve durumlar anında
// son haline geçer.

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Feather from "@expo/vector-icons/Feather";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ConfettiBurst, ConfettiIntensity } from "../ui/ConfettiBurst";
import { DUST_COUNT, DUST_DURATION, DustParticle } from "./DustParticle";
import { useAppTheme } from "../../theme/ThemeProvider";
import { useI18n } from "../../languages";
import { darkTones, fonts, layout, PRESS_SPRING, radius, shadow, spacing, tones, toneKeyForColor, toneKeyForTag } from "../../theme/tokens";
import { HabitIcon } from "../ui/tagIcons";
import { Habit, HabitTag } from "../../types/habit";

// Kaydırma eşiği kartın genişliğine oranlanır: kazara hafif bir kaydırma
// tamamlama/silme yapmasın. Sağa kartın %45'inden fazla = tamamla, sola %45 = sil.
const ACTION_RATIO = 0.45;
const MAX_DRAG_RATIO = 0.6;
const FALLBACK_WIDTH = 320;

// Kritik sönümlü yay: hedefe yaklaşıp orada durur, sıçramaz.
const SETTLE_SPRING = { damping: 16, stiffness: 160, mass: 0.4 } as const;

type HabitRowCardProps = {
  habit: Habit;
  /** "Her gün saat 17:00" gibi döngü metni. */
  cycleText: string;
  /** Alışkanlığın etiketi; yoksa null. */
  tag: HabitTag | null;
  completed: boolean;
  /** Kararlı (stable) fonksiyonlar beklenir; kart memo'ludur. */
  onToggle: (habit: Habit) => void;
  onDelete: (habit: Habit) => void;
  /** Bu kartın üstünde konfeti patlatılacaksa şiddeti; yoksa null/undefined. */
  celebrate?: ConfettiIntensity | null;
  onCelebrationDone?: (habitId: string) => void;
};

// memo: bir karta dokununca yalnızca o kart yeniden çizilir, diğerleri değil.
export const HabitRowCard = memo(function HabitRowCard({
  habit,
  cycleText,
  tag,
  completed,
  onToggle,
  onDelete,
  celebrate = null,
  onCelebrationDone,
}: HabitRowCardProps) {
  const { colors, isDark } = useAppTheme();
  const { t } = useI18n();
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const dragX = useSharedValue(0); // sağa pozitif (tamamla), sola negatif (sil)
  const cardWidth = useSharedValue(FALLBACK_WIDTH);
  const pressScale = useSharedValue(1);
  const settle = useSharedValue(completed ? 1 : 0); // ikon dairesindeki onay işareti
  const dustProgress = useSharedValue(0);
  const [deleting, setDeleting] = useState(false);

  const commit = useCallback(() => onToggle(habit), [onToggle, habit]);
  const remove = useCallback(() => onDelete(habit), [onDelete, habit]);
  const celebrationDone = useCallback(() => onCelebrationDone?.(habit.id), [onCelebrationDone, habit.id]);

  // `completed`, kartın kendi hareketi dışındaki nedenlerle de değişebilir
  // (örn. gün şeridinde başka güne geçilirken kart örneği yeniden kullanılır).
  useEffect(() => {
    const target = completed ? 1 : 0;
    settle.value = reducedMotion ? target : withSpring(target, SETTLE_SPRING);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completed, habit.id, reducedMotion]);

  // Jestler her render'da yeniden kurulmasın (her yeni nesne native tarafta
  // yeniden bağlanır); yalnızca bağımlılıkları değişince kurulur.
  const cardGesture = useMemo(() => {
    const pan = Gesture.Pan()
      // Yatay hareket 24 px'i geçmeden jest başlamaz; dikey kaydırma (liste)
      // 12 px'i geçerse jest iptal olur ve sayfa normal kayar.
      .activeOffsetX([-24, 24])
      .failOffsetY([-12, 12])
      .onUpdate((e) => {
        const max = cardWidth.value * MAX_DRAG_RATIO;
        dragX.value = Math.max(-max, Math.min(max, e.translationX));
      })
      .onEnd(() => {
        const threshold = cardWidth.value * ACTION_RATIO;
        if (dragX.value < -threshold) {
          // Gerçek onDelete(), toz animasyonu bitene kadar ertelenir; kart
          // listeden anında değil, animasyon bittikten sonra kaybolur.
          if (reducedMotion) {
            runOnJS(remove)();
            return;
          }
          dragX.value = withTiming(-cardWidth.value, { duration: 220 });
          dustProgress.value = withTiming(1, { duration: DUST_DURATION }, (finished) => {
            if (finished) runOnJS(remove)();
          });
          runOnJS(setDeleting)(true);
          return;
        }

        const shouldToggle = dragX.value > threshold;
        dragX.value = reducedMotion ? 0 : withTiming(0, { duration: 200 });
        if (shouldToggle) runOnJS(commit)();
      });

    // Kart basma geri bildirimi: parmak değince hafifçe küçülür, kalkınca (ya da
    // kaydırma başlayınca) sıçramadan eski boyuna döner. Bu jest HİÇBİR EYLEM
    // yapmaz — tamamlama/silme yalnızca uzun kaydırma ya da çipe dokunmayla olur.
    const press = Gesture.Tap()
      .maxDuration(60000)
      .onBegin(() => {
        pressScale.value = reducedMotion ? 1 : withSpring(0.97, PRESS_SPRING);
      })
      .onFinalize(() => {
        pressScale.value = reducedMotion ? 1 : withSpring(1, PRESS_SPRING);
      });

    return Gesture.Race(pan, press);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion, commit, remove]);

  const foregroundStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: dragX.value }, { scale: pressScale.value }],
  }));

  const completeBackdropStyle = useAnimatedStyle(() => ({
    opacity: Math.min(Math.max(dragX.value, 0) / (cardWidth.value * ACTION_RATIO), 1),
  }));

  const deleteBackdropStyle = useAnimatedStyle(() => ({
    opacity: Math.min(Math.max(-dragX.value, 0) / (cardWidth.value * ACTION_RATIO), 1),
  }));

  const checkStyle = useAnimatedStyle(() => ({
    opacity: settle.value,
    transform: [{ scale: 0.7 + settle.value * 0.3 }],
  }));

  const palette = isDark ? darkTones : tones;
  const tone = palette[toneKeyForColor(habit.color)];
  const tagTone = tag ? palette[toneKeyForTag(tag.id)] : null;

  return (
    <View>
      <View style={styles.cardWrap} onLayout={(e) => { cardWidth.value = e.nativeEvent.layout.width; }}>
        <Animated.View
          style={[styles.backdrop, styles.completeBackdrop, { backgroundColor: colors.success }, completeBackdropStyle]}
        >
          <MaterialIcons name="check" size={24} color="#FFFFFF" />
        </Animated.View>
        <Animated.View
          style={[styles.backdrop, styles.deleteBackdrop, { backgroundColor: colors.danger }, deleteBackdropStyle]}
        >
          <MaterialIcons name="delete" size={22} color="#FFFFFF" />
        </Animated.View>

        {/* Zemin TAM OPAK: gölge/elevation yalnızca opak bir görünümde
            güvenlidir (yarı saydamda Android arkasına dikdörtgen çizer). */}
        <GestureDetector gesture={cardGesture}>
          <Animated.View
            style={[
              styles.card,
              shadow.raised,
              { backgroundColor: tone.bg, borderColor: tone.border },
              foregroundStyle,
            ]}
          >
            <View style={styles.topRow}>
              <View style={[styles.iconTile, { backgroundColor: colors.accent }]}>
                <HabitIcon icon={habit.icon} tagId={tag?.id} size={22} color="#FFFFFF" />
                <Animated.View style={[styles.iconCheck, { backgroundColor: colors.success }, checkStyle]}>
                  <MaterialIcons name="check" size={11} color="#FFFFFF" />
                </Animated.View>
              </View>
              <Text
                style={[styles.title, { color: colors.text }, completed && styles.titleDone]}
                numberOfLines={2}
              >
                {habit.title}
              </Text>
              <View style={styles.editSpacer} />
            </View>

            <View style={styles.chipRow}>
              <Pressable
                onPress={commit}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={completed ? t("home.card.undo") : t("home.card.markDone")}
                style={[
                  styles.pill,
                  {
                    backgroundColor: completed ? colors.success : colors.glass,
                    borderColor: completed ? colors.success : colors.border,
                  },
                ]}
              >
                {completed && <Feather name="check" size={12} color="#FFFFFF" />}
                <Text style={[styles.pillText, { color: completed ? "#FFFFFF" : colors.textSecondary }]}>
                  {completed ? t("home.card.done") : t("home.card.inProgress")}
                </Text>
              </Pressable>
              {habit.hasTarget && habit.targetAmount ? (
                <View style={[styles.pill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Feather name="flag" size={12} color={colors.text} />
                  <Text style={[styles.pillText, { color: colors.text }]}>
                    {habit.targetAmount}
                    {habit.targetUnit ? ` ${habit.targetUnit}` : ""}
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>{t("home.card.cycle")}</Text>
              <View style={[styles.tagChip, { backgroundColor: tone.border }]}>
                <Text style={[styles.pillText, { color: tone.strong }]}>{cycleText}</Text>
              </View>
            </View>

            {tag && tagTone ? (
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>{t("home.card.tag")}</Text>
                <View style={[styles.tagChip, { backgroundColor: tagTone.bg }]}>
                  <Text style={[styles.pillText, { color: tagTone.strong }]}>{tag.label}</Text>
                </View>
              </View>
            ) : null}
          </Animated.View>
        </GestureDetector>

        {/* GestureDetector'ın alt ağacının dışında, kendi başına bir Pressable:
            RNGH bu dokunuşu asla ele geçiremez, tamamlama tap'iyle karışmaz. */}
        <Pressable
          onPress={() => router.push({ pathname: "/habit/add", params: { id: habit.id } })}
          hitSlop={8}
          accessibilityLabel={t("home.card.edit")}
          style={[styles.editButton, { backgroundColor: tone.border }]}
        >
          <Feather name="edit-3" size={17} color={tone.strong} />
        </Pressable>

        {deleting && (
          <View style={styles.dustField} pointerEvents="none">
            {Array.from({ length: DUST_COUNT }).map((_, i) => (
              <DustParticle
                key={i}
                progress={dustProgress}
                angle={(i / DUST_COUNT) * Math.PI * 2}
                color={colors.danger}
              />
            ))}
          </View>
        )}
      </View>

      {/* Tamamlama konfetisi: kartın DIŞINDA, sarmalayıcıda durur. */}
      {celebrate && (
        <View style={styles.confettiAnchor} pointerEvents="none">
          <ConfettiBurst intensity={celebrate} onDone={celebrationDone} />
        </View>
      )}
    </View>
  );
});

const CARD_PADDING = layout.cardPadding;

const styles = StyleSheet.create({
  cardWrap: { marginHorizontal: 0 },
  backdrop: {
    ...StyleSheet.absoluteFill,
    borderRadius: radius.xl,
    justifyContent: "center",
  },
  completeBackdrop: { alignItems: "flex-start", paddingLeft: 20 },
  deleteBackdrop: { alignItems: "flex-end", paddingRight: 20 },
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    // Kart yukarıdan aşağı hafifçe sıkı: yatay boşluk aynı, dikeyler azaltıldı.
    paddingHorizontal: CARD_PADDING,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  topRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, minHeight: layout.touchTarget },
  iconTile: {
    width: layout.iconTile,
    height: layout.iconTile,
    borderRadius: layout.iconTileRadius,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCheck: {
    position: "absolute",
    right: -4,
    bottom: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { flex: 1, fontSize: 17, fontFamily: fonts.bold },
  titleDone: { textDecorationLine: "line-through", opacity: 0.6 },
  editSpacer: { width: layout.touchTarget },
  editButton: {
    position: "absolute",
    top: spacing.md,
    right: CARD_PADDING,
    width: layout.touchTarget,
    height: layout.touchTarget,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  pillText: { fontSize: 12, fontFamily: fonts.semibold },
  field: { gap: 4, alignItems: "flex-start" },
  fieldLabel: { fontSize: 12, fontFamily: fonts.bold },
  tagChip: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: radius.pill },
  confettiAnchor: { ...StyleSheet.absoluteFill },
  dustField: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
});
