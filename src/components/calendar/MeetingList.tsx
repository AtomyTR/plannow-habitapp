import { StyleSheet, Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useAppTheme } from "../../theme/ThemeProvider";
import { useI18n } from "../../languages";
import { darkTones, fonts, tones } from "../../theme/tokens";
import { PlanRow } from "./PlanRow";
import { Meeting } from "../../types/habit";

type MeetingListProps = {
  /** Store diskten okunana kadar hiçbir şey çizilmez. */
  loaded: boolean;
  /** Seçili günün toplantıları (saat sırasıyla). */
  meetings: Meeting[];
  onPressMeeting: (meetingId: string) => void;
  onAdd?: () => void;
};

// "Toplantılar" bölümü: seçili günün toplantıları pastel satırlar olarak; hiç yoksa
// yalnızca "Hiç toplantı yok." satırı.
export function MeetingList({ loaded, meetings, onPressMeeting }: MeetingListProps) {
  const { colors, isDark } = useAppTheme();
  const { t } = useI18n();
  const lav = (isDark ? darkTones : tones).lavender;

  if (!loaded) return null;

  // Boşken yalnızca tek satır: kart ve buton yer kaplamasın ("Ekle" bağlantısı
  // zaten bölüm başlığında).
  if (meetings.length === 0) {
    return <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t("calendar.noMeetings")}</Text>;
  }

  return (
    <View style={styles.list}>
      {meetings.map((m) => {
        return (
          <PlanRow
            key={m.id}
            time={m.time}
            title={m.title}
            subtitle={m.hasReminder ? t("calendar.withReminder") : t("calendar.meeting")}
            tone="lavender"
            icon={<Feather name="users" size={18} color={lav.strong} />}
            onPress={() => onPressMeeting(m.id)}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  emptyText: { fontSize: 13, fontFamily: fonts.semibold },
});
