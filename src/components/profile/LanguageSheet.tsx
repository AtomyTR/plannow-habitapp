import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import { useAppTheme } from "../../theme/ThemeProvider";
import { radius, shadow, spacing, typography } from "../../theme/tokens";
import { LANGUAGES, languageName, useI18n, type Language } from "../../languages";

type LanguageSheetProps = {
  visible: boolean;
  onSelect: (language: Language) => void;
  onClose: () => void;
};

// Profildeki dil butonunun açtığı alt sayfa: Türkçe / English.
export function LanguageSheet({ visible, onSelect, onClose }: LanguageSheetProps) {
  const { colors } = useAppTheme();
  const { language, t } = useI18n();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: spacing.lg + insets.bottom }, shadow.raised]}
          onPress={() => {}}
        >
          <View style={styles.grabber} />
          <Text style={[typography.title, { color: colors.text }]}>{t("common.language")}</Text>
          {LANGUAGES.map((lang) => {
            const selected = lang === language;
            return (
              <Pressable
                key={lang}
                onPress={() => {
                  onSelect(lang);
                  onClose();
                }}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={[styles.option, { borderColor: selected ? colors.accent : colors.border }]}
              >
                <Text style={[typography.bodyStrong, { color: colors.text, flex: 1 }]}>
                  {languageName(lang)}
                </Text>
                {selected && <Feather name="check" size={20} color={colors.accent} />}
              </Pressable>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  grabber: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: radius.sm,
    backgroundColor: "rgba(0,0,0,0.15)",
    marginBottom: spacing.xs,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    borderWidth: 1.5,
    borderRadius: radius.lg,
  },
});
