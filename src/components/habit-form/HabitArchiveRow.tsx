// Sadece düzenleme sırasında görünen "Arşivle / Arşivden Çıkar" satırı.
//
// Arşivleme, silmenin yumuşak alternatifi olduğu için silme ikonundan ayrı ve
// daha az vurgulu bir yerde durur: alışkanlık listelerden kalkar ve hatırlatması
// susar, ama geçmiş kayıtları silinmez.

import { Pressable, StyleSheet, Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useAppTheme } from "../../theme/ThemeProvider";
import { useI18n } from "../../languages";
import { fonts, radius, spacing } from "../../theme/tokens";

type HabitArchiveRowProps = {
  archived: boolean;
  onPress: () => void;
};

export function HabitArchiveRow({ archived, onPress }: HabitArchiveRowProps) {
  const { colors } = useAppTheme();
  const { t } = useI18n();

  return (
    <Pressable onPress={onPress} style={[styles.archiveRow, { borderColor: colors.border }]}>
      <Feather name="archive" size={20} color={colors.textSecondary} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: colors.text }]}>
          {archived ? t("habitForm.archive.unarchive") : t("habitForm.archive.archive")}
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {archived
            ? t("habitForm.archive.unarchiveHint")
            : t("habitForm.archive.archiveHint")}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  archiveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  title: { fontSize: 15, fontFamily: fonts.bold },
  description: { fontSize: 12, fontFamily: fonts.semibold, marginTop: 2 },
});
