import { useEffect, useRef, useState } from "react";
import { goBack } from "../../src/utils/navigation";
import { EntryTypeSwitch } from "../../src/components/habit-form/EntryTypeSwitch";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useAppTheme } from "../../src/theme/ThemeProvider";
import { fonts, layout, radius, shadow, spacing, typography } from "../../src/theme/tokens";
import { SettingsRow } from "../../src/components/ui/SettingsRow";
import { Chip } from "../../src/components/ui/Chip";
import { PressableScale } from "../../src/components/ui/PressableScale";
import { useConfetti } from "../../src/services/confetti";
import { useHabitStore } from "../../src/services/habitStore";
import { weekdayName, monthName, isValidDateKey, parseDateKey, toDateKey } from "../../src/utils/date";
import {
  DEFAULT_MEETING_REMINDER_MINUTES,
  MEETING_REMINDER_OPTIONS,
} from "../../src/data/reminder";
import { translate, useI18n } from "../../src/languages";

// Saat ekranda bir tarih (Date) nesnesiyle seçilir, ama kayıtta "14:30" gibi
// düz bir metin olarak saklanır. Aşağıdaki iki fonksiyon bu ikisi arasında
// gidip gelir.

// Date -> "14:30"
function formatTime(date: Date) {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

// "14:30" -> bugünün tarihinde, saati 14:30'a ayarlanmış bir Date
function parseTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function formatFullDate(date: Date) {
  return translate("date.dayTitle", {
    weekday: weekdayName(date.getDay()),
    day: date.getDate(),
    month: monthName(date.getMonth()),
  });
}

// Bu ekran: toplantı ekleme ve düzenleme formu.
// Kullanıcı buradan toplantının adını, tarihini, saatini ve kaç dakika önce
// hatırlatılacağını seçer.
//
// Aynı ekran hem "yeni ekle" hem "düzenle" için kullanılır — fark, adrese bir
// `id` verilip verilmediğidir. `id` varsa o toplantı bulunur, form onun mevcut
// değerleriyle açılır ve başlıkta silme seçeneği belirir.
//
// Toplantı ekleme/düzenleme ekranı. İki giriş yolu:
// 1) Ekleme — `date` param'ı takvimde seçili günü önceden doldurur (opsiyonel).
// 2) Düzenleme — `id` param'ı varsa mevcut toplantı verisiyle doldurulur.
// Konfetinin görülebilmesi için ekranın açık kaldığı süre. ConfettiBurst'ün
// kendi süresi 750 ms; burada tamamını beklemek ekranı gereksiz asılı
// tutardı — patlamanın başladığının görülmesi yeterli.
const CONFETTI_VIEW_MS = 500;

// Form, düzenlenecek kaydı yalnızca ilk render'da state'e alır. Depo henüz
// yüklenmeden açılırsa (soğuk açılış / derin bağlantı) form boş "yeni kayıt"
// olarak açılır ve kaydetmek kopya oluşturur; bu yüzden yüklenmesi beklenir.
export default function AddMeetingScreen() {
  const { loaded } = useHabitStore();
  if (!loaded) return null;
  return <AddMeetingScreenForm />;
}

function AddMeetingScreenForm() {
  const { colors } = useAppTheme();
  const { t } = useI18n();
  const router = useRouter();
  const { id: editingId, date: initialDate } = useLocalSearchParams<{ id?: string; date?: string }>();
  const { meetings, addMeeting, updateMeeting, deleteMeeting } = useHabitStore();
  const { fire: fireConfetti } = useConfetti();

  const existing = editingId ? meetings.find((m) => m.id === editingId) : undefined;
  const isEditing = !!existing;

  const [title, setTitle] = useState(existing?.title ?? "");
  const [date, setDate] = useState<Date>(
    existing?.date ? parseDateKey(existing.date) : isValidDateKey(initialDate) ? parseDateKey(initialDate) : new Date()
  );
  const [time, setTime] = useState<Date>(existing?.time ? parseTime(existing.time) : new Date());
  const [hasReminder, setHasReminder] = useState(existing?.hasReminder ?? true);
  const [reminderMinutesBefore, setReminderMinutesBefore] = useState(
    existing?.reminderMinutesBefore ?? DEFAULT_MEETING_REMINDER_MINUTES
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const canSave = title.trim().length > 0;

  // Formdaki alanları, kaydedilecek toplantı kaydına çevirir.
  // Tarih ve saat, ekranda kullanılan Date nesnelerinden düz metne dönüştürülür;
  // hatırlatıcı kapalıysa "kaç dakika önce" bilgisi hiç kaydedilmez.
  const buildPayload = () => ({
    title: title.trim(),
    date: toDateKey(date),
    time: formatTime(time),
    hasReminder,
    reminderMinutesBefore: hasReminder ? reminderMinutesBefore : undefined,
  });

  // Kaydet'e iki kez hızlıca dokunulursa toplantı iki kez eklenirdi.
  // `disabled` yeterli değil: iki dokunuş aynı render'da işlenebilir ve
  // ikincisi, birincinin state değişikliğini görmeden çalışır.
  const savingRef = useRef(false);

  // Konfetinin görülebilmesi için geri dönüş geciktiriliyor. Bu bekleme
  // sırasında kullanıcı geri tuşuna basarsa ekran zaten kapanır; zamanlayıcı
  // temizlenmezse ardından İKİNCİ bir goBack(router) daha çalışır ve kullanıcı
  // bir ekran fazla geri gider.
  const backTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (backTimerRef.current) clearTimeout(backTimerRef.current);
    };
  }, []);

  // Kaydetme: düzenlemede mevcut kayıt güncellenir ve hemen geri dönülür.
  // Yeni toplantıda ise önce konfeti oynar, geri dönüş kısa bir an beklenir —
  // böylece kutlama ekran kapanmadan görülebilir.
  const handleSave = () => {
    if (!canSave || savingRef.current) return;
    savingRef.current = true;

    if (isEditing && existing) {
      updateMeeting(existing.id, buildPayload());
      goBack(router);
    } else {
      addMeeting(buildPayload());
      fireConfetti();
      backTimerRef.current = setTimeout(() => goBack(router), CONFETTI_VIEW_MS);
    }
  };

  const handleDelete = () => {
    if (!existing) return;
    Alert.alert(t("meeting.delete.title"), t("meeting.delete.message", { title: existing.title }), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () => {
          deleteMeeting(existing.id);
          goBack(router);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Habit/add ile birebir aynı başlık: iki ekran arasında geçerken
          arka plan, başlık ve düğmeler değişmesin. */}
      <View style={styles.header}>
        <Text
          style={[styles.headerTitle, { color: colors.text }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
        >
          {isEditing ? t("meeting.header.edit") : t("meeting.header.new")}
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
          accessibilityLabel={t("meeting.close")}
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
          contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.xl }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {!isEditing && (
            <View style={{ marginBottom: spacing.lg }}>
              <EntryTypeSwitch current="meeting" />
            </View>
          )}
          <Text style={[typography.bodyStrong, { color: colors.text }]}>
            {t("meeting.name.label")} <Text style={{ color: colors.danger }}>*</Text>
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={t("meeting.name.placeholder")}
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { color: colors.text, backgroundColor: colors.surfaceMuted }]}
          />

          <View style={styles.spacer} />

          <Pressable onPress={() => setShowDatePicker((v) => (Platform.OS === "ios" ? !v : true))} style={[styles.pickerRow, { borderColor: colors.border }]}>
            <Text style={[typography.body, { color: colors.textSecondary }]}>{t("meeting.date")}</Text>
            <View style={styles.pickerValue}>
              <Text style={[typography.bodyStrong, { color: colors.accent }]}>{formatFullDate(date)}</Text>
              <MaterialIcons name="chevron-right" size={18} color={colors.textMuted} />
            </View>
          </Pressable>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(_, picked) => {
                // Android'de seçici bir diyalogdur ve her seçimde kapanır; iOS'ta
                // satır içi durur, satıra tekrar dokunulunca kapanır.
                if (Platform.OS === "android") setShowDatePicker(false);
                if (picked) setDate(picked);
              }}
            />
          )}

          <Pressable
            onPress={() => setShowTimePicker((v) => (Platform.OS === "ios" ? !v : true))}
            style={[styles.pickerRow, { borderColor: colors.border }]}
          >
            <Text style={[typography.body, { color: colors.textSecondary }]}>{t("meeting.time")}</Text>
            <View style={styles.pickerValue}>
              <Text style={[typography.bodyStrong, { color: colors.accent }]}>{formatTime(time)}</Text>
              <MaterialIcons name="chevron-right" size={18} color={colors.textMuted} />
            </View>
          </Pressable>

          {showTimePicker && (
            <DateTimePicker
              value={time}
              mode="time"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(_, picked) => {
                // Android'de seçici bir diyalogdur ve her seçimde kapanır; iOS'ta
                // satır içi durur, satıra tekrar dokunulunca kapanır.
                if (Platform.OS === "android") setShowTimePicker(false);
                if (picked) setTime(picked);
              }}
            />
          )}

          <View style={styles.spacer} />

          <SettingsRow title={t("meeting.reminder.title")} value={hasReminder} onValueChange={setHasReminder} />
          {hasReminder && (
            <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(120)}>
              <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.sm }]}>
                {t("meeting.reminder.when")}
              </Text>
              <View style={styles.reminderOptions}>
                {MEETING_REMINDER_OPTIONS.map((opt) => (
                  <Chip
                    key={opt.minutes}
                    label={opt.label}
                    selected={reminderMinutesBefore === opt.minutes}
                    onPress={() => setReminderMinutesBefore(opt.minutes)}
                  />
                ))}
              </View>
            </Animated.View>
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
  input: {
    fontSize: 16,
    fontFamily: fonts.regular,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  spacer: { height: spacing.lg },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
  },
  pickerValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  reminderOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  footer: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.lg },
  saveButton: { height: 54, borderRadius: radius.lg, alignItems: "center", justifyContent: "center" },
  saveText: { color: "#FFFFFF", fontSize: 16, fontFamily: fonts.extrabold },
});
