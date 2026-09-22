// "Hedef miktarı belirle" bölümü. Anahtar kapalıyken tek satır; açıldığında
// altında iki kutu belirir: miktar (örn. 5) ve birim (örn. km).
// Bu iki kutu metin olarak tutulur; sayıya çevirme kaydetme anında yapılır.

import { StyleSheet, TextInput } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useAppTheme } from "../../theme/ThemeProvider";
import { useI18n } from "../../languages";
import { fonts, radius } from "../../theme/tokens";
import { SettingsRow } from "../ui/SettingsRow";

type HabitTargetSectionProps = {
  hasTarget: boolean;
  onHasTargetChange: (value: boolean) => void;
  targetAmount: string;
  onTargetAmountChange: (value: string) => void;
  targetUnit: string;
  onTargetUnitChange: (value: string) => void;
};

export function HabitTargetSection({
  hasTarget,
  onHasTargetChange,
  targetAmount,
  onTargetAmountChange,
  targetUnit,
  onTargetUnitChange,
}: HabitTargetSectionProps) {
  const { colors } = useAppTheme();
  const { t } = useI18n();

  return (
    <>
      <SettingsRow
        title={t("habitForm.target.title")}
        description={t("habitForm.target.description")}
        value={hasTarget}
        onValueChange={onHasTargetChange}
      />
      {hasTarget && (
        <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(120)} style={styles.targetRow}>
          <TextInput
            value={targetAmount}
            onChangeText={onTargetAmountChange}
            placeholder={t("habitForm.target.amountPlaceholder")}
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            style={[styles.targetInput, { color: colors.text, backgroundColor: colors.surfaceMuted }]}
          />
          <TextInput
            value={targetUnit}
            onChangeText={onTargetUnitChange}
            placeholder={t("habitForm.target.unitPlaceholder")}
            placeholderTextColor={colors.textMuted}
            style={[styles.targetInput, { color: colors.text, backgroundColor: colors.surfaceMuted }]}
          />
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  targetRow: { flexDirection: "row", gap: 8 },
  targetInput: {
    flex: 1,
    height: 48,
    fontSize: 14,
    fontFamily: fonts.bold,
    paddingHorizontal: 12,
    borderRadius: radius.md,
  },
});
