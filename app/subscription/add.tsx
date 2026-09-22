// Bu ekran: abonelik ekleme ve düzenleme.
//
// Aynı ekran her iki iş için kullanılır — fark, adrese bir `id` verilip
// verilmediğidir. `id` varsa o abonelik bulunur, form mevcut değerleriyle
// açılır ve başlıkta silme seçeneği belirir.
//
// Formda ne var: hazır servis kısayolları, ad, tutar, döngü (aylık/yıllık),
// ilk ödeme günü, renk ve isteğe bağlı hatırlatma.
//
// Tutar TL olarak girilir. Dolar kesen üyelikler için kullanıcı TL karşılığını
// yazar: kur çevirimi internet gerektirir, uygulama ise tamamen yereldir ve
// eskimiş bir kur sessizce yanlış bir toplam gösterirdi.

import { goBack } from "../../src/utils/navigation";
import { useEffect, useRef, useState } from "react";
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
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useAppTheme } from "../../src/theme/ThemeProvider";
import { fonts, radius, spacing, typography } from "../../src/theme/tokens";
import { Chip } from "../../src/components/ui/Chip";
import { SettingsRow } from "../../src/components/ui/SettingsRow";
import { PressableScale } from "../../src/components/ui/PressableScale";
import { ColorPickerModal } from "../../src/components/ui/ColorPickerModal";
import { SubscriptionIcon } from "../../src/components/subscription/SubscriptionIcon";
import { useHabitStore } from "../../src/services/habitStore";
import { monthName, parseDateKey, toDateKey } from "../../src/utils/date";
import { formatTRY, nextRenewalKey, renewalLabel } from "../../src/utils/subscription";
import {
  CYCLE_OPTIONS,
  DEFAULT_SUBSCRIPTION_COLOR,
  DEFAULT_SUBSCRIPTION_REMINDER_DAYS,
  SUBSCRIPTION_PRESETS,
  SUBSCRIPTION_REMINDER_OPTIONS,
} from "../../src/data/subscriptions";
import { translate, useI18n } from "../../src/languages";

function formatFullDate(date: Date) {
  return translate("subscription.fullDate", {
    day: date.getDate(),
    month: monthName(date.getMonth()),
    year: date.getFullYear(),
  });
}

// Form, düzenlenecek kaydı yalnızca ilk render'da state'e alır. Depo henüz
// yüklenmeden açılırsa (soğuk açılış / derin bağlantı) form boş "yeni kayıt"
// olarak açılır ve kaydetmek kopya oluşturur; bu yüzden yüklenmesi beklenir.
export default function AddSubscriptionScreen() {
  const { loaded } = useHabitStore();
  if (!loaded) return null;
  return <AddSubscriptionScreenForm />;
}

function AddSubscriptionScreenForm() {
  const { colors } = useAppTheme();
  const { t } = useI18n();
  const router = useRouter();
  const { id: editingId } = useLocalSearchParams<{ id?: string }>();
  const { subscriptions, addSubscription, updateSubscription, deleteSubscription } = useHabitStore();

  const existing = editingId ? subscriptions.find((s) => s.id === editingId) : undefined;
  const isEditing = !!existing;

  const [name, setName] = useState(existing?.name ?? "");
  // Tutar metin olarak tutulur: sayıya çevirmek yalnızca kaydederken anlamlı.
  // State'te sayı tutulsaydı kullanıcı alanı boşaltamaz ya da "12." yazamazdı.
  const [amount, setAmount] = useState(existing ? String(existing.amount) : "");
  const [cycle, setCycle] = useState<"monthly" | "yearly">(existing?.cycle ?? "monthly");
  const [firstBillingDate, setFirstBillingDate] = useState<Date>(
    existing ? parseDateKey(existing.firstBillingDate) : new Date()
  );
  const [color, setColor] = useState(existing?.color ?? DEFAULT_SUBSCRIPTION_COLOR);
  const [iconKey, setIconKey] = useState<string | undefined>(existing?.iconKey);
  const [hasReminder, setHasReminder] = useState(existing?.hasReminder ?? false);
  const [reminderDaysBefore, setReminderDaysBefore] = useState(
    existing?.reminderDaysBefore ?? DEFAULT_SUBSCRIPTION_REMINDER_DAYS
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Virgüllü giriş ("12,90") da kabul edilir; Türkçe klavyede ondalık ayracı
  // virgüldür ve kullanıcıyı nokta yazmaya zorlamanın bir sebebi yok.
  const parsedAmount = Number(amount.replace(",", "."));
  const amountIsValid = amount.trim().length > 0 && Number.isFinite(parsedAmount) && parsedAmount > 0;
  const canSave = name.trim().length > 0 && amountIsValid;

  const buildPayload = () => ({
    name: name.trim(),
    amount: parsedAmount,
    cycle,
    firstBillingDate: toDateKey(firstBillingDate),
    color,
    iconKey,
    hasReminder,
    reminderDaysBefore: hasReminder ? reminderDaysBefore : undefined,
  });

  // Hızlı iki dokunuş, goBack(router) henüz gerçekleşmeden handleSave'i ikinci
  // kez çalıştırıp aynı aboneliği iki kez ekleyebiliyordu. Bir ref (state
  // değil — aynı karede okunup yazılması gerekiyor) bunu tek sefere kilitler.
  const savingRef = useRef(false);
  useEffect(() => {
    savingRef.current = false;
  }, []);

  const handleSave = () => {
    if (!canSave || savingRef.current) return;
    savingRef.current = true;

    if (isEditing && existing) {
      updateSubscription(existing.id, buildPayload());
    } else {
      addSubscription(buildPayload());
    }
    goBack(router);
  };

  const handleDelete = () => {
    if (!existing) return;
    Alert.alert(t("subscription.delete.title"), t("subscription.delete.message", { name: existing.name }), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () => {
          deleteSubscription(existing.id);
          goBack(router);
        },
      },
    ]);
  };

  // Hazır servis seçimi ad, renk ve simgeyi doldurur; tutar kişiye özeldir.
  const applyPreset = (preset: (typeof SUBSCRIPTION_PRESETS)[number]) => {
    setName(preset.name);
    setColor(preset.color);
    setIconKey(preset.iconKey);
  };

  // Kullanıcının girdiği değerlerle bir sonraki ödeme gününü şimdiden gösterir;
  // "ilk ödeme günü" alanının ne işe yaradığını anlatmanın en kısa yolu.
  const previewRenewal = amountIsValid
    ? nextRenewalKey({
        ...buildPayload(),
        id: "",
        createdAt: "",
      })
    : null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => goBack(router)} hitSlop={12} style={styles.headerButton}>
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text
          style={[typography.title, { color: colors.text, flex: 1, textAlign: "center" }]}
          numberOfLines={1}
        >
          {isEditing ? t("subscription.header.edit") : t("subscription.header.new")}
        </Text>
        {isEditing ? (
          <Pressable onPress={handleDelete} hitSlop={12} style={styles.headerButton}>
            <MaterialIcons name="delete-outline" size={22} color={colors.danger} />
          </Pressable>
        ) : (
          <View style={styles.headerButton} />
        )}
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
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Yalnızca yeni eklerken: düzenlemede servis zaten seçilmiş,
              kısayolları göstermek kullanıcının girdiğini ezme riski taşır. */}
          {!isEditing && (
            <>
              <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.sm }]}>
                {t("subscription.presets")}
              </Text>
              <View style={styles.presets}>
                {SUBSCRIPTION_PRESETS.map((p) => (
                  <Chip
                    key={p.name}
                    label={p.name}
                    selected={name === p.name}
                    onPress={() => applyPreset(p)}
                    leading={
                      <SubscriptionIcon
                        name={p.name}
                        // Seçili çipin zemini koyu olduğu için glif beyaza döner;
                        // aksi halde marka rengi koyu zeminde okunmaz olurdu.
                        color={name === p.name ? colors.white : p.color}
                        iconKey={p.iconKey}
                        size={16}
                        plain
                      />
                    }
                  />
                ))}
              </View>
              <View style={styles.spacer} />
            </>
          )}

          <Text style={[typography.bodyStrong, { color: colors.text }]}>
            {t("subscription.name.label")} <Text style={{ color: colors.danger }}>*</Text>
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Claude, Adobe, Spotify..."
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { color: colors.text, backgroundColor: colors.surfaceMuted }]}
          />

          <Text style={[typography.bodyStrong, { color: colors.text, marginTop: spacing.xl }]}>
            {t("subscription.amount.label")} <Text style={{ color: colors.danger }}>*</Text>
          </Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="800"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
            style={[styles.input, { color: colors.text, backgroundColor: colors.surfaceMuted }]}
          />
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm }]}>
            {t("subscription.amount.hint")}
          </Text>

          <View style={styles.spacer} />

          <Text style={[typography.bodyStrong, { color: colors.text, marginBottom: spacing.sm }]}>
            {t("subscription.cycle.title")}
          </Text>
          <View style={styles.presets}>
            {CYCLE_OPTIONS.map((opt) => (
              <Chip
                key={opt.key}
                label={opt.label}
                selected={cycle === opt.key}
                onPress={() => setCycle(opt.key)}
              />
            ))}
          </View>

          <Pressable
            onPress={() => setShowDatePicker(true)}
            style={[styles.pickerRow, { borderColor: colors.border, marginTop: spacing.xl }]}
          >
            <Text style={[typography.body, { color: colors.textSecondary }]}>{t("subscription.firstBilling")}</Text>
            <View style={styles.pickerValue}>
              <Text style={[typography.bodyStrong, { color: colors.accent }]}>
                {formatFullDate(firstBillingDate)}
              </Text>
              <MaterialIcons name="chevron-right" size={18} color={colors.textMuted} />
            </View>
          </Pressable>

          {showDatePicker && (
            <DateTimePicker
              value={firstBillingDate}
              mode="date"
              display="default"
              onChange={(_, picked) => {
                setShowDatePicker(false);
                if (picked) setFirstBillingDate(picked);
              }}
            />
          )}

          {previewRenewal && (
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm }]}>
              {t("subscription.nextPayment", {
                when: renewalLabel(previewRenewal),
                amount: formatTRY(parsedAmount),
              })}
            </Text>
          )}

          <Pressable
            onPress={() => setShowColorPicker(true)}
            style={[styles.pickerRow, { borderColor: colors.border }]}
          >
            <Text style={[typography.body, { color: colors.textSecondary }]}>{t("subscription.color")}</Text>
            <View style={styles.pickerValue}>
              <View style={[styles.colorDot, { backgroundColor: color }]} />
              <MaterialIcons name="chevron-right" size={18} color={colors.textMuted} />
            </View>
          </Pressable>

          <ColorPickerModal
            visible={showColorPicker}
            value={color}
            onSelect={setColor}
            onClose={() => setShowColorPicker(false)}
          />

          <View style={styles.spacer} />

          <SettingsRow
            title={t("subscription.reminder.title")}
            description={t("subscription.reminder.description")}
            value={hasReminder}
            onValueChange={setHasReminder}
          />
          {hasReminder && (
            <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(120)}>
              <Text
                style={[
                  typography.caption,
                  { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.sm },
                ]}
              >
                {t("subscription.reminder.when")}
              </Text>
              <View style={styles.presets}>
                {SUBSCRIPTION_REMINDER_OPTIONS.map((opt) => (
                  <Chip
                    key={opt.days}
                    label={opt.label}
                    selected={reminderDaysBefore === opt.days}
                    onPress={() => setReminderDaysBefore(opt.days)}
                  />
                ))}
              </View>
            </Animated.View>
          )}
        </ScrollView>

        <View
          style={[
            styles.footer,
            { backgroundColor: colors.glassStrong },
          ]}
        >
          <PressableScale
            onPress={handleSave}
            disabled={!canSave}
            style={[
              styles.saveButton,
              { backgroundColor: canSave ? colors.black : colors.textMuted },
            ]}
          >
            <Text style={[typography.bodyStrong, { color: colors.white }]}>{t("common.save")}</Text>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerButton: {
    width: 44,
    height: 44,
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
  presets: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
  },
  pickerValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  colorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  footer: {
    padding: spacing.lg,
  },
  saveButton: {
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
});
