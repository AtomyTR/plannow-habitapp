import { StyleSheet, Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useAppTheme } from "../../theme/ThemeProvider";
import { radius, shadow, spacing, typography } from "../../theme/tokens";
import { PressableScale } from "../ui/PressableScale";
import { SubscriptionIcon } from "./SubscriptionIcon";
import { Subscription } from "../../types/habit";
import { CYCLE_LABELS } from "../../data/subscriptions";
import { daysUntil, formatTRY, nextRenewalKey, renewalLabel } from "../../utils/subscription";
import { useI18n } from "../../languages";

// Abonelik listesindeki tek satır: solda marka simgesi, ortada ad ve bir
// sonraki yenileme, sağda tutar.
//
// Yenileme tarihi kayıtta tutulmaz, her çizimde hesaplanır — böylece tarih
// geçtiğinde satır kendiliğinden bir sonraki aya kayar.

// Yenilemeye bu kadar veya daha az gün kalmışsa tarih vurgulanır. Amaç
// "yakında para çıkacak"ı fark ettirmek; her satırı renklendirmek değil.
const IMMINENT_DAYS = 3;

type SubscriptionRowProps = {
  subscription: Subscription;
  onPress: () => void;
};

export function SubscriptionRow({ subscription, onPress }: SubscriptionRowProps) {
  const { colors } = useAppTheme();
  // Etiketler seçili dilde üretilir; dil değişince satır yeniden çizilsin.
  useI18n();

  const renewalKey = nextRenewalKey(subscription);
  const label = renewalLabel(renewalKey);
  // Eskiden etiket metni karşılaştırılıyordu ("bugün"/"yarın"/"3 gün…");
  // dile bağlı olmasın diye gün sayısı üzerinden aynı kural uygulanır.
  const daysLeft = daysUntil(renewalKey);
  const isImminent = daysLeft <= 1 || daysLeft === IMMINENT_DAYS;

  return (
    <PressableScale
      onPress={onPress}
      style={[styles.row, { backgroundColor: colors.surface }, shadow.raised]}
    >
      <SubscriptionIcon
        name={subscription.name}
        color={subscription.color}
        iconKey={subscription.iconKey}
      />

      <View style={{ flex: 1 }}>
        <Text style={[typography.bodyStrong, { color: colors.text }]} numberOfLines={1}>
          {subscription.name}
        </Text>
        <View style={styles.metaRow}>
          <Feather name="credit-card" size={12} color={colors.textMuted} />
          <Text
            style={[
              typography.caption,
              { color: isImminent ? colors.accent : colors.textMuted },
            ]}
          >
            {label}
          </Text>
          {subscription.hasReminder && (
            <MaterialIcons name="notifications-none" size={13} color={colors.textMuted} />
          )}
        </View>
      </View>

      <View style={styles.amountColumn}>
        <Text style={[typography.bodyStrong, { color: colors.text }]}>
          {formatTRY(subscription.amount)}
        </Text>
        <Text style={[typography.small, { color: colors.textMuted }]}>
          {CYCLE_LABELS[subscription.cycle]}
        </Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: 2,
  },
  amountColumn: {
    alignItems: "flex-end",
  },
});
