import { Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useAppTheme } from "../../theme/ThemeProvider";
import { useI18n } from "../../languages";
import { fonts, radius, spacing } from "../../theme/tokens";
import { HABIT_ICON_GROUPS, type HabitIconName } from "../../data/habitIcons";

type IconPickerModalProps = {
  visible: boolean;
  value?: string;
  onSelect: (icon: HabitIconName) => void;
  onClose: () => void;
};

// Alışkanlık ikonu seçici: gruplara ayrılmış, kaydırılabilir ikon ızgarası.
// Bir ikona basınca seçilir ve pencere kapanır.
export function IconPickerModal({ visible, value, onSelect, onClose }: IconPickerModalProps) {
  const { colors } = useAppTheme();
  const { t } = useI18n();
  // Alt menü telefonun gezinme tuşlarının altında kalmasın.
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        {/* Karartma ayrı bir katman; sheet onun ÇOCUĞU değil kardeşi. Sheet'i
            dokunmatik bir Pressable'ın içine koymak, telefonda listenin
            kaydırma ve ikonların dokunma jestlerini yakalıyordu. */}
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={t("habitForm.close")} />

        <View style={[styles.sheet, { height: Math.round(height * 0.7), backgroundColor: colors.surface }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>{t("habitForm.icon.title")}</Text>
            <Pressable onPress={onClose} hitSlop={12} accessibilityLabel={t("habitForm.close")}>
              <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.content, { paddingBottom: spacing.xxxl + insets.bottom }]}
            keyboardShouldPersistTaps="handled"
          >
            {HABIT_ICON_GROUPS.map((group) => (
              <View key={group.title} style={styles.group}>
                <Text style={[styles.groupTitle, { color: colors.textSecondary }]}>{group.title}</Text>
                <View style={styles.grid}>
                  {group.icons.map((name) => {
                    const selected = name === value;
                    return (
                      <Pressable
                        key={name}
                        onPress={() => {
                          onSelect(name);
                          onClose();
                        }}
                        accessibilityLabel={name}
                        accessibilityState={{ selected }}
                        style={[
                          styles.cell,
                          { backgroundColor: selected ? colors.accent : colors.surfaceMuted },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={name}
                          size={24}
                          color={selected ? "#FFFFFF" : colors.text}
                        />
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.lg,
    overflow: "hidden",
  },
  scroll: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  title: { fontSize: 18, fontFamily: fonts.extrabold },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.lg },
  group: { gap: spacing.sm },
  groupTitle: { fontSize: 12, fontFamily: fonts.bold },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  cell: { width: 48, height: 48, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
});
