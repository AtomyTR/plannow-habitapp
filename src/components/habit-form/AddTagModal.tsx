// Alışkanlık formunun etiket bölümündeki "+ Ekle" ile açılan küçük alt sayfa.
//
// Kullanıcıyı "Etiketleri Yönet" ekranına göndermeden, akışı bölmeden yeni bir
// özel etiket (isim + emoji) eklemesini sağlar. Alanlar, emoji seçenekleri ve
// doğrulama kuralı bilerek app/settings/tags.tsx ile BİREBİR aynıdır — aynı işin
// iki yerde farklı davranması kafa karışıklığı yaratırdı.
//
// Bu bileşen hiçbir şey kaydetmez; sadece geçerli bir (isim, emoji) çifti
// üretip onSubmit ile yukarı verir. Kalıcılık tamamen store'un işidir.

import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { isValidTagLabel, SUGGESTED_TAG_EMOJIS } from "../../data/tags";
import { useAppTheme } from "../../theme/ThemeProvider";
import { useI18n } from "../../languages";
import { fonts, radius, shadow, spacing, typography } from "../../theme/tokens";
import { PressableScale } from "../ui/PressableScale";

// app/settings/tags.tsx içindeki liste ile aynı sıra ve içerik.

// Tek doğrulama kuralı: boş ya da yalnızca boşluktan oluşan ad kabul edilmez.

type AddTagModalProps = {
  visible: boolean;
  onSubmit: (label: string, emoji: string) => void;
  onClose: () => void;
};

export function AddTagModal({ visible, onSubmit, onClose }: AddTagModalProps) {
  const { colors } = useAppTheme();
  const { t } = useI18n();
  // Alt menü telefonun gezinme tuşlarının altında kalmasın.
  const insets = useSafeAreaInsets();
  const [label, setLabel] = useState("");
  const [emoji, setEmoji] = useState(SUGGESTED_TAG_EMOJIS[0]);

  // Her açılışta temiz başla; yarım kalmış bir önceki giriş taşınmasın.
  useEffect(() => {
    if (visible) {
      setLabel("");
      setEmoji(SUGGESTED_TAG_EMOJIS[0]);
    }
  }, [visible]);

  const canAdd = isValidTagLabel(label);

  const handleAdd = () => {
    if (!canAdd) return;
    onSubmit(label.trim(), emoji);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* Klavye açıldığında alt sayfa yukarı kayar; giriş alanı klavyenin
          altında kalmaz. Android'de de "padding": modal kendi penceresinde
          açıldığı ve kenardan kenara çizildiği için sistem pencereyi
          klavyeye göre küçültmez, kaydırmayı biz yapmalıyız. */}
      <KeyboardAvoidingView style={styles.fill} behavior="padding">
        <Pressable style={styles.backdrop} onPress={onClose}>
          <Pressable
            style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: spacing.lg + insets.bottom }, shadow.raised]}
            onPress={() => {}}
          >
            <View style={styles.grabber} />
            <Text style={[typography.title, { color: colors.text }]}>{t("habitForm.addTag.title")}</Text>

            <View style={styles.emojiRow}>
              {SUGGESTED_TAG_EMOJIS.map((e) => (
                <Pressable
                  key={e}
                  onPress={() => setEmoji(e)}
                  hitSlop={4}
                  style={[
                    styles.emojiOption,
                    {
                      borderColor: e === emoji ? colors.accent : colors.border,
                      backgroundColor: colors.surfaceMuted,
                    },
                  ]}
                >
                  <Text style={styles.emojiText}>{e}</Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              value={label}
              onChangeText={setLabel}
              placeholder={t("habitForm.addTag.placeholder")}
              placeholderTextColor={colors.textMuted}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleAdd}
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            />

            <View style={styles.footer}>
              <Pressable onPress={onClose} hitSlop={8}>
                <Text style={[typography.body, { color: colors.textSecondary }]}>{t("common.cancel")}</Text>
              </Pressable>
              <PressableScale
                onPress={handleAdd}
                disabled={!canAdd}
                style={[
                  styles.confirmButton,
                  { backgroundColor: canAdd ? colors.black : colors.textMuted },
                ]}
              >
                <Text style={[typography.bodyStrong, { color: colors.white }]}>{t("common.add")}</Text>
              </PressableScale>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
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
  grabber: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: radius.sm,
    backgroundColor: "rgba(0,0,0,0.15)",
    marginBottom: spacing.xs,
  },
  emojiRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  emojiOption: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiText: { fontSize: 16 },
  input: {
    fontSize: 15,
    fontFamily: fonts.regular,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  confirmButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
  },
});
