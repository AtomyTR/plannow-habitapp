import { Pressable, PressableProps, StyleProp, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { PRESS_SPRING } from "../../theme/tokens";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type PressableScaleProps = PressableProps & {
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
};

// Ortak "basma geri bildirimi" bileşeni: basılınca hafifçe küçülür,
// bırakılınca yaylanarak eski haline döner. Kendine özel bir animasyona
// ihtiyacı olmayan tıklanabilir kart/butonlarda kullanılır.
export function PressableScale({ style, scaleTo = 0.96, ...props }: PressableScaleProps) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      {...props}
      onPressIn={(e) => {
        // Hareket azaltılmışsa ölçek geri bildirimi tamamen kapatılır; kısmi
        // veya yavaşlatılmış bir sürüm gösterilmez.
        if (!reducedMotion) scale.value = withSpring(scaleTo, PRESS_SPRING);
        props.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        if (!reducedMotion) scale.value = withSpring(1, PRESS_SPRING);
        props.onPressOut?.(e);
      }}
      style={[style, animatedStyle]}
    />
  );
}
