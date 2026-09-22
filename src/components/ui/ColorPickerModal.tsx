import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { HsvColorPicker } from "./HsvColorPicker";
import { useAppTheme } from "../../theme/ThemeProvider";
import { useI18n } from "../../languages";
import { fonts, radius, shadow, spacing, typography } from "../../theme/tokens";
import { HABIT_COLORS } from "../../data/colors";

const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/;

type ColorPickerModalProps = {
  visible: boolean;
  value: string;
  onSelect: (color: string) => void;
  onClose: () => void;
};

export function ColorPickerModal({ visible, value, onSelect, onClose }: ColorPickerModalProps) {
  const { colors } = useAppTheme();
  const { t } = useI18n();
  // Alt menü telefonun gezinme tuşlarının altında kalmasın.
  const insets = useSafeAreaInsets();
  const [customHex, setCustomHex] = useState(value);
  // Damlalığa basınca parmakla seçilen renk alanı açılır.
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (visible) {
      setCustomHex(value);
      setShowPicker(false);
    }
  }, [visible, value]);

  const customIsValid = HEX_PATTERN.test(customHex);

  const handlePick = (color: string) => {
    onSelect(color);
    onClose();
  };

  const handleApplyCustom = () => {
    if (!customIsValid) return;
    onSelect(customHex.toUpperCase());
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Android'de Modal ayrı bir pencere: içindeki sürükleme jestleri için
          kendi GestureHandler kökü gerekir. */}
      <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Özel renk kodu yazarken sayfa klavyenin üstüne kayar. */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      {/* Arka plan sayfanın KARDEŞİ: sayfa düz bir View olduğu için renk
          kutusundaki sürükleme bir dokunma alanıyla yarışmaz. */}
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={t("common.cancel")} />
        <View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: spacing.lg + insets.bottom }, shadow.raised]}>
          <Text style={[typography.title, { color: colors.text }]}>{t("habitForm.color.title")}</Text>

          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: -spacing.sm }]}>
            {t("habitForm.color.presets")}
          </Text>
          <View style={styles.grid}>
            {HABIT_COLORS.map((color) => {
              const selected = color === value;
              return (
                <Pressable
                  key={color}
                  onPress={() => handlePick(color)}
                  style={[styles.swatch, { backgroundColor: color }]}
                  hitSlop={4}
                >
                  {selected && <MaterialIcons name="check" size={20} color="#FFFFFF" />}
                </Pressable>
              );
            })}
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Text style={[typography.caption, { color: colors.textSecondary }]}>{t("habitForm.color.custom")}</Text>
          {showPicker && (
            <HsvColorPicker value={customIsValid ? customHex : value} onChange={setCustomHex} />
          )}
          <View style={styles.customRow}>
            <View
              style={[
                styles.customPreview,
                { backgroundColor: customIsValid ? customHex : colors.surfaceMuted, borderColor: colors.border },
              ]}
            />
            <TextInput
              value={customHex}
              onChangeText={setCustomHex}
              placeholder="#3D63F5"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
              maxLength={7}
              style={[styles.customInput, { color: colors.text, borderColor: colors.border }]}
            />
            <Pressable
              onPress={() => setShowPicker((v) => !v)}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityState={{ expanded: showPicker }}
              accessibilityLabel={t("habitForm.color.eyedropper")}
              style={[
                styles.eyedropButton,
                { borderColor: showPicker ? colors.accent : colors.border, backgroundColor: showPicker ? colors.accentSoft : "transparent" },
              ]}
            >
              <MaterialCommunityIcons name="eyedropper" size={18} color={showPicker ? colors.accent : colors.text} />
            </Pressable>
            <Pressable
              onPress={handleApplyCustom}
              disabled={!customIsValid}
              hitSlop={6}
              style={[
                styles.applyButton,
                { backgroundColor: customIsValid ? colors.black : colors.textMuted },
              ]}
            >
              <Text style={[typography.caption, { color: colors.white }]}>{t("common.apply")}</Text>
            </Pressable>
          </View>

          <Pressable onPress={onClose} style={styles.cancelButton} hitSlop={8}>
            <Text style={[typography.body, { color: colors.textSecondary }]}>{t("common.cancel")}</Text>
          </Pressable>
        </View>
      </View>
      </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  eyedropButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    height: 1,
  },
  customRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  customPreview: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
  },
  customInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.regular,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  applyButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
});
