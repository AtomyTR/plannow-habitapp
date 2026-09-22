// "Saat Belirle" bölümü: alışkanlık için hatırlatma saati.
//
// Tekrar sıklığı ile bildirim arasındaki bağ burada görünür hale gelir:
// cihaz, yalnızca günlük ve haftalık gibi düzenli tekrarlar için bildirim
// planlayabilir. "3 günde bir", "ayda bir", "yılda bir" gibi sıklıklarda
// bildirim gönderilemez; seçilen saat sadece kullanıcının kendi notu olarak
// kaydedilir ve bu durum altta açıkça yazılır.
//
// Ayrıca telefonun bildirim izni kapalıysa hatırlatma hiç çalışmaz; bunu
// söylemek yerine sessiz kalmak kullanıcıyı çalışıyor sanmasına yol açardı.

import { useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import DateTimePicker from "@react-native-community/datetimepicker";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useAppTheme } from "../../theme/ThemeProvider";
import { useI18n } from "../../languages";
import { radius, spacing, typography } from "../../theme/tokens";
import { SettingsRow } from "../ui/SettingsRow";
import { useNotificationPermission } from "../../hooks/useNotificationPermission";
import { RepeatCycle } from "../../types/habit";
import { formatTime } from "./time";

type HabitReminderSectionProps = {
  hasReminderTime: boolean;
  onHasReminderTimeChange: (value: boolean) => void;
  reminderTime: Date;
  onReminderTimeChange: (date: Date) => void;
  repeatCycle: RepeatCycle;
  repeatEveryN: number;
};

export function HabitReminderSection({
  hasReminderTime,
  onHasReminderTimeChange,
  reminderTime,
  onReminderTimeChange,
  repeatCycle,
  repeatEveryN,
}: HabitReminderSectionProps) {
  const { colors } = useAppTheme();
  const { t } = useI18n();
  const [showTimePicker, setShowTimePicker] = useState(false);
  const { status: permissionStatus, openSettings } = useNotificationPermission();

  return (
    <>
      <SettingsRow
        title={t("habitForm.reminder.title")}
        description={hasReminderTime ? t("habitForm.reminder.at", { time: formatTime(reminderTime) }) : t("habitForm.reminder.description")}
        value={hasReminderTime}
        onValueChange={(v) => {
          onHasReminderTimeChange(v);
          if (v) setShowTimePicker(true);
        }}
        onPressText={hasReminderTime ? () => setShowTimePicker(true) : undefined}
      />

      {hasReminderTime && (
        <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(120)} style={{ gap: spacing.sm }}>
          {(repeatEveryN > 1 || repeatCycle === "monthly" || repeatCycle === "yearly") && (
            <Text style={[typography.small, { color: colors.textSecondary }]}>
              {t("habitForm.reminder.unsupportedCycle")}
            </Text>
          )}

          {/* İzin reddedilmişse hatırlatıcı sessizce hiç çalışmaz. Bunu
              söylememek, kullanıcıyı çalıştığını sanarak bekletmek olurdu.
              iOS ikinci kez izin sormaya izin vermediği için tek çıkış
              cihaz ayarlarıdır. */}
          {permissionStatus === "denied" && (
            <Pressable
              onPress={openSettings}
              style={[styles.permissionNotice, { borderColor: colors.danger }]}
            >
              <Feather name="bell-off" size={16} color={colors.danger} />
              <Text style={[typography.caption, { color: colors.text, flex: 1 }]}>
                {t("habitForm.reminder.permissionDenied")}
                <Text style={{ color: colors.accent }}> {t("habitForm.reminder.openSettings")}</Text>
              </Text>
            </Pressable>
          )}
        </Animated.View>
      )}

      {showTimePicker && (
        <DateTimePicker
          value={reminderTime}
          mode="time"
          display="default"
          onChange={(_, date) => {
            setShowTimePicker(false);
            if (date) onReminderTimeChange(date);
          }}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  permissionNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
});
