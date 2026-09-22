// Alışkanlık formunun en üst parçası (YeniAliskanlik.html): 52 yüksekliğinde,
// accent kenarlıklı ad kutusu. Solda ikon, sağda alışkanlığın rengini seçtiren
// küçük renkli yuvarlak. Renk seçme penceresinin açık/kapalı olması geçici bir
// ekran durumu olduğu için burada tutulur, forma taşınmaz.

import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useAppTheme } from "../../theme/ThemeProvider";
import { useI18n } from "../../languages";
import { fonts, radius } from "../../theme/tokens";
import { ColorPickerModal } from "../ui/ColorPickerModal";
import { IconPickerModal } from "../ui/IconPickerModal";
import { isHabitIcon } from "../../data/habitIcons";

type HabitTitleFieldProps = {
  title: string;
  onTitleChange: (title: string) => void;
  color: string;
  onColorChange: (color: string) => void;
  icon: string;
  onIconChange: (icon: string) => void;
  /** Yeni kayıtta sayfa açılır açılmaz klavye gelsin (hızlı ekleme). */
  autoFocus?: boolean;
  /** Klavyedeki "Bitti" tuşu — başlık yazılıysa doğrudan kaydeder. */
  onSubmit?: () => void;
};

export function HabitTitleField({
  title,
  onTitleChange,
  color,
  onColorChange,
  icon,
  onIconChange,
  autoFocus,
  onSubmit,
}: HabitTitleFieldProps) {
  const { colors } = useAppTheme();
  const { t } = useI18n();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);

  return (
    <>
      <View style={[styles.box, { borderColor: colors.accent, backgroundColor: colors.surface }]}>
        {/* Soldaki kutuya basınca ikon seçici açılır. */}
        <Pressable
          onPress={() => setShowIconPicker(true)}
          hitSlop={6}
          accessibilityLabel={t("habitForm.title.iconA11y")}
          style={[styles.iconTile, { backgroundColor: colors.accentSoft }]}
        >
          <MaterialCommunityIcons
            name={isHabitIcon(icon) ? icon : "star-outline"}
            size={22}
            color={colors.accent}
          />
        </Pressable>
        <TextInput
          value={title}
          onChangeText={onTitleChange}
          placeholder={t("habitForm.title.placeholder")}
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={t("habitForm.title.a11y")}
          autoFocus={autoFocus}
          returnKeyType="done"
          onSubmitEditing={onSubmit}
          style={[styles.input, { color: colors.text }]}
        />
        <Pressable
          onPress={() => setShowColorPicker(true)}
          hitSlop={8}
          accessibilityLabel={t("habitForm.title.colorA11y")}
          style={[styles.colorDot, { backgroundColor: color, borderColor: colors.border }]}
        />
      </View>

      <IconPickerModal
        visible={showIconPicker}
        value={icon}
        onSelect={onIconChange}
        onClose={() => setShowIconPicker(false)}
      />

      <ColorPickerModal
        visible={showColorPicker}
        value={color}
        onSelect={onColorChange}
        onClose={() => setShowColorPicker(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  box: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 10,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  iconTile: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  input: { flex: 1, fontSize: 16, fontFamily: fonts.semibold, paddingVertical: 10 },
  colorDot: { width: 26, height: 26, borderRadius: 13, borderWidth: 2 },
});
