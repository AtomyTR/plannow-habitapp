// Bu ekran: alışkanlık ekleme ve düzenleme formu.
// Kullanıcı buradan ad, renk, hedef miktarı, tekrar sıklığı, hatırlatma saati
// ve etiket seçer; en altta "Kaydet" düğmesiyle kaydeder.
//
// Aynı ekran hem "yeni ekle" hem "düzenle" için kullanılır — fark, adrese bir
// `id` verilip verilmediğidir. `id` varsa o alışkanlık bulunur, form onun
// mevcut değerleriyle açılır ve başlıkta silme/arşivleme seçenekleri belirir.
//
// Ekranın kendisi sadece formun iskeletini ve kaydetme mantığını tutar;
// her bölüm (renk, hedef, tekrar, hatırlatma, etiket) src/components/habit-form
// altında kendi dosyasındadır.
//
// Üç farklı giriş yolundan doldurulabilir:
// 1) Sıfırdan ekleme (route param yok)
// 2) Düzenleme — route'ta `id` varsa mevcut alışkanlık verisiyle doldurulur
// 3) Hazır şablondan açılış — `presetTitle`/`presetCycle`/`presetTagId`
//    ile önceden doldurulur, kullanıcı gözden geçirip kaydeder.

import { goBack } from "../../src/utils/navigation";
import { useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAppTheme } from "../../src/theme/ThemeProvider";
import { fonts, layout, radius, shadow, spacing } from "../../src/theme/tokens";
import { PressableScale } from "../../src/components/ui/PressableScale";
import { HabitTitleField } from "../../src/components/habit-form/HabitTitleField";
import { HabitTargetSection } from "../../src/components/habit-form/HabitTargetSection";
import { HabitRepeatSection } from "../../src/components/habit-form/HabitRepeatSection";
import { HabitReminderSection } from "../../src/components/habit-form/HabitReminderSection";
import { HabitTagSection } from "../../src/components/habit-form/HabitTagSection";
import { HabitPeriodSection } from "../../src/components/habit-form/HabitPeriodSection";
import { EntryTypeSwitch } from "../../src/components/habit-form/EntryTypeSwitch";
import { HabitArchiveRow } from "../../src/components/habit-form/HabitArchiveRow";
import { formatTime, parseTime } from "../../src/components/habit-form/time";
import { useHabitStore } from "../../src/services/habitStore";
import { HABIT_COLORS } from "../../src/data/colors";
import { isHabitIcon, randomHabitIcon } from "../../src/data/habitIcons";
import { RepeatCycle } from "../../src/types/habit";

const REPEAT_CYCLES: readonly RepeatCycle[] = ["daily", "weekly", "monthly", "yearly", "custom"];
const MAX_PRESET_TITLE = 100;
import { parseDateKey, toDateKey } from "../../src/utils/date";
import { useI18n } from "../../src/languages";

// Form, düzenlenecek kaydı yalnızca ilk render'da state'e alır. Depo henüz
// yüklenmeden açılırsa (soğuk açılış / derin bağlantı) form boş "yeni kayıt"
// olarak açılır ve kaydetmek kopya oluşturur; bu yüzden yüklenmesi beklenir.
export default function AddHabitScreen() {
  const { loaded } = useHabitStore();
  if (!loaded) return null;
  return <AddHabitScreenForm />;
}

function AddHabitScreenForm() {
  const { colors } = useAppTheme();
  const { t } = useI18n();
  const router = useRouter();
  const { id: editingId, presetTitle, presetCycle, presetTagId } = useLocalSearchParams<{
    id?: string;
    presetTitle?: string;
    presetCycle?: RepeatCycle;
    presetTagId?: string;
  }>();
  const { habits, tags, addHabit, updateHabit, deleteHabit, archiveHabit, unarchiveHabit } =
    useHabitStore();
  const existingHabit = editingId ? habits.find((h) => h.id === editingId) : undefined;
  // Parametreler plannow:// linkiyle dışarıdan gelebilir; yalnızca geçerli
  // değerler kabul edilir.
  const safePresetCycle = presetCycle && REPEAT_CYCLES.includes(presetCycle) ? presetCycle : undefined;
  const safePresetTagId = presetTagId && tags.some((t) => t.id === presetTagId) ? presetTagId : undefined;
  const safePresetTitle = presetTitle?.slice(0, MAX_PRESET_TITLE);
  const isEditing = !!existingHabit;

  // Formdaki her alanın başlangıç değeri şu sırayla belirlenir:
  // düzenlenen alışkanlığın mevcut değeri -> hazır şablondan gelen değer -> boş/varsayılan.
  const [title, setTitle] = useState(existingHabit?.title ?? safePresetTitle ?? "");
  const [color, setColor] = useState(
    existingHabit?.color ?? HABIT_COLORS[Math.floor(Math.random() * HABIT_COLORS.length)]
  );
  // Eski kayıtlarda ikon yoktur; düzenlerken de rastgele bir ikon atanmasın diye
  // yalnızca YENİ alışkanlıkta rastgele seçilir, eski kayıtta boş başlar.
  const [icon, setIcon] = useState<string>(
    isHabitIcon(existingHabit?.icon) ? existingHabit.icon : existingHabit ? "" : randomHabitIcon()
  );
  const [hasTarget, setHasTarget] = useState(existingHabit?.hasTarget ?? false);
  const [targetAmount, setTargetAmount] = useState(
    existingHabit?.targetAmount != null ? String(existingHabit.targetAmount) : ""
  );
  const [targetUnit, setTargetUnit] = useState(existingHabit?.targetUnit ?? "");
  const [repeatCycle, setRepeatCycle] = useState<RepeatCycle>(
    existingHabit?.repeatCycle ?? safePresetCycle ?? "daily"
  );
  const [repeatDaysOfWeek, setRepeatDaysOfWeek] = useState<number[]>(
    existingHabit?.repeatDaysOfWeek ?? []
  );
  const [repeatAnchorDate, setRepeatAnchorDate] = useState(
    existingHabit?.repeatAnchorDate
      ? parseDateKey(existingHabit.repeatAnchorDate)
      : existingHabit
        ? // Eski kayıtta referans yoksa isHabitDueOn createdAt'i kullanır; düzenleme
          // sırasında bugüne kaydırılırsa aylık/yıllık program sessizce değişirdi.
          new Date(existingHabit.createdAt)
        : new Date()
  );
  const [repeatEveryN, setRepeatEveryN] = useState(existingHabit?.repeatEveryN ?? 1);
  const [hasReminderTime, setHasReminderTime] = useState(existingHabit?.hasReminderTime ?? false);
  const [reminderTime, setReminderTime] = useState(
    existingHabit?.reminderTime ? parseTime(existingHabit.reminderTime) : new Date()
  );
  const [tagId, setTagId] = useState<string | undefined>(existingHabit?.tagId ?? safePresetTagId);

  // Dönem (alışkanlığın aktif olduğu aralık). Yeni bir alışkanlıkta başlangıç
  // bugüne öntanımlıdır. Düzenlemede ise bilinçli olarak öntanım YOKTUR: bu
  // alanları hiç görmemiş eski bir kayıt açılıp kaydedildiğinde ona kendiliğinden
  // bir başlangıç tarihi yazılmamalı — yazılsaydı o alışkanlığın geçmiş serisi
  // ve tutarlılık oranı geriye dönük olarak değişirdi.
  const [startDate, setStartDate] = useState<Date | null>(
    existingHabit
      ? existingHabit.startDate
        ? parseDateKey(existingHabit.startDate)
        : null
      : new Date()
  );
  const [endDate, setEndDate] = useState<Date | null>(
    existingHabit?.endDate ? parseDateKey(existingHabit.endDate) : null
  );

  // Haftalık bir alışkanlıkta en az bir gün seçilmeden kaydetmeye izin verme —
  // aksi halde alışkanlık hiçbir günde "sırası gelmiş" görünmez.
  const weeklyNeedsDay = repeatCycle === "weekly" && repeatDaysOfWeek.length === 0;
  // Hedef açıkken miktar pozitif bir sayı olmalı ("1,5" gibi virgüllü giriş de
  // kabul edilir); aksi halde NaN/0 kaydedilip ilerleme hesabı bozulurdu.
  const parsedTarget = Number(targetAmount.replace(",", "."));
  const targetInvalid = hasTarget && !(targetAmount.trim() && parsedTarget > 0);
  // Bitiş başlangıçtan önceyse alışkanlığın hiçbir günde sırası gelmez.
  const periodInvalid = !!startDate && !!endDate && toDateKey(endDate) < toDateKey(startDate);
  const canSave = title.trim().length > 0 && !weeklyNeedsDay && !targetInvalid && !periodInvalid;

  // Formdaki alanları, kaydedilecek alışkanlık kaydına çevirir.
  //
  // Buradaki asıl iş "o an anlamsız olan alanları boş bırakmak": kapalı bir
  // hedefin miktarı, haftalık olmayan bir alışkanlığın gün seçimi ya da
  // gerekmediği halde tutulan bir başlangıç tarihi kaydedilmez. Böylece kayıtta
  // yalnızca gerçekten geçerli olan bilgiler kalır.
  const buildPayload = () => ({
    title: title.trim(),
    color,
    icon: icon || undefined,
    hasTarget,
    targetAmount: hasTarget && parsedTarget > 0 ? parsedTarget : undefined,
    targetUnit: hasTarget && targetUnit.trim() ? targetUnit.trim() : undefined,
    repeatCycle,
    // 1 zaten "her <döngü>" demek; sadece gerçek bir çarpan varsa saklanır.
    repeatEveryN: repeatEveryN > 1 ? repeatEveryN : undefined,
    repeatDaysOfWeek: repeatCycle === "weekly" ? repeatDaysOfWeek : undefined,
    // Referans tarih yalnızca aylık/yıllık tekrarlarda ve "N X'de bir" gibi
    // özel aralıklarda anlamlıdır; sayım bu günden itibaren yapılır.
    repeatAnchorDate:
      repeatCycle === "monthly" || repeatCycle === "yearly" || repeatEveryN > 1
        ? toDateKey(repeatAnchorDate)
        : undefined,
    hasReminderTime,
    reminderTime: hasReminderTime ? formatTime(reminderTime) : undefined,
    tagId,
    // Boş bırakılan bir sınır kaydedilmez; tanımsız kalması "o yönde sınır yok"
    // anlamına gelir.
    startDate: startDate ? toDateKey(startDate) : undefined,
    endDate: endDate ? toDateKey(endDate) : undefined,
  });

  // Kaydetme: düzenlemede mevcut kayıt güncellenir, aksi halde yeni kayıt eklenir.
  // Her iki durumda da bir önceki ekrana dönülür.
  // Hızlı iki dokunuş, goBack(router) henüz gerçekleşmeden handleSave'i ikinci
  // kez çalıştırıp aynı alışkanlığı iki kez ekleyebiliyordu. Bir ref (state
  // değil — aynı karede okunup yazılması gerekiyor) bunu tek sefere kilitler.
  const savingRef = useRef(false);

  const handleSave = () => {
    if (!canSave || savingRef.current) return;
    savingRef.current = true;
    if (isEditing && existingHabit) {
      updateHabit(existingHabit.id, buildPayload());
      goBack(router);
    } else {
      addHabit(buildPayload());
      goBack(router);
    }
  };

  const handleDelete = () => {
    if (!existingHabit) return;
    Alert.alert(
      t("habitForm.delete.title"),
      t("habitForm.delete.message", { title: existingHabit.title }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: () => {
            deleteHabit(existingHabit.id);
            goBack(router);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <Text
          style={[styles.headerTitle, { color: colors.text }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
        >
          {isEditing ? t("habitForm.header.edit") : t("habitForm.header.new")}
        </Text>
        {isEditing && (
          <Pressable
            onPress={handleDelete}
            accessibilityLabel={t("common.delete")}
            style={[styles.roundButton, { backgroundColor: colors.segmented }]}
          >
            <Feather name="trash-2" size={18} color={colors.danger} />
          </Pressable>
        )}
        <Pressable
          onPress={() => goBack(router)}
          accessibilityLabel={t("habitForm.close")}
          style={[styles.roundButton, { backgroundColor: colors.segmented }]}
        >
          <Feather name="x" size={18} color={colors.text} />
        </Pressable>
      </View>

      {/* Android kenardan kenara (edge-to-edge) çizildiği için sistem pencereyi
          klavyeye göre küçültmez; iki platformda da "padding" ile içerik
          klavyenin üstüne itilir. */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {!isEditing && <EntryTypeSwitch current="habit" />}

          <HabitTitleField
            title={title}
            onTitleChange={setTitle}
            color={color}
            onColorChange={setColor}
            icon={icon}
            onIconChange={setIcon}
            autoFocus={!isEditing}
            onSubmit={isEditing ? undefined : handleSave}
          />

          <HabitTargetSection
            hasTarget={hasTarget}
            onHasTargetChange={setHasTarget}
            targetAmount={targetAmount}
            onTargetAmountChange={setTargetAmount}
            targetUnit={targetUnit}
            onTargetUnitChange={setTargetUnit}
          />


          <HabitRepeatSection
            repeatCycle={repeatCycle}
            onRepeatCycleChange={setRepeatCycle}
            repeatEveryN={repeatEveryN}
            onRepeatEveryNChange={setRepeatEveryN}
            repeatDaysOfWeek={repeatDaysOfWeek}
            onRepeatDaysOfWeekChange={setRepeatDaysOfWeek}
            repeatAnchorDate={repeatAnchorDate}
            onRepeatAnchorDateChange={setRepeatAnchorDate}
            weeklyNeedsDay={weeklyNeedsDay}
          />

          <HabitReminderSection
            hasReminderTime={hasReminderTime}
            onHasReminderTimeChange={setHasReminderTime}
            reminderTime={reminderTime}
            onReminderTimeChange={setReminderTime}
            repeatCycle={repeatCycle}
            repeatEveryN={repeatEveryN}
          />


          <HabitTagSection tags={tags} tagId={tagId} onTagIdChange={setTagId} />


          <HabitPeriodSection
            startDate={startDate}
            onStartDateChange={setStartDate}
            endDate={endDate}
            onEndDateChange={setEndDate}
          />

          {isEditing && existingHabit && (
            <>
              <HabitArchiveRow
                archived={existingHabit.archived}
                onPress={() => {
                  if (existingHabit.archived) {
                    unarchiveHabit(existingHabit.id);
                  } else {
                    archiveHabit(existingHabit.id);
                  }
                  goBack(router);
                }}
              />
            </>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <PressableScale
            onPress={handleSave}
            disabled={!canSave}
            style={[
              styles.saveButton,
              { backgroundColor: colors.accent, opacity: canSave ? 1 : 0.4 },
              canSave && shadow.primary,
            ]}
          >
            <Text style={styles.saveText}>{t("common.save")}</Text>
          </PressableScale>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingTop: 14,
    paddingBottom: spacing.md,
  },
  headerTitle: { flex: 1, fontSize: 21, fontFamily: fonts.extrabold },
  roundButton: {
    width: layout.touchTarget,
    height: layout.touchTarget,
    borderRadius: layout.touchTarget / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  // Referans: bölümler arası 12 px boşluk, aralarda 1 px ayraç.
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, gap: spacing.xl },
  footer: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.lg },
  saveButton: {
    height: 54,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: { color: "#FFFFFF", fontSize: 16, fontFamily: fonts.extrabold },
});
