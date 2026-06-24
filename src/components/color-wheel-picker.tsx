import { useMemo, useState } from 'react';
import { Modal, PanResponder, Pressable, TextInput, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop, Rect, Circle } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { clampByte, hexToRgb, hslToRgb, hueToHex, rgbToHex, rgbToHsl } from '@/lib/color';

const WHEEL_SIZE = 220;
const WHEEL_CENTER = WHEEL_SIZE / 2;
const WHEEL_OUTER_RADIUS = 100;
const WHEEL_INNER_RADIUS = 72;
const HANDLE_RADIUS = (WHEEL_OUTER_RADIUS + WHEEL_INNER_RADIUS) / 2;
const SEGMENT_COUNT = 60;

const SLIDER_WIDTH = 220;
const SLIDER_HEIGHT = 28;

function polarPoint(angleDeg: number, radius: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: WHEEL_CENTER + radius * Math.sin(rad),
    y: WHEEL_CENTER - radius * Math.cos(rad),
  };
}

function angleFromPoint(x: number, y: number): number {
  const dx = x - WHEEL_CENTER;
  const dy = y - WHEEL_CENTER;
  let angle = (Math.atan2(dx, -dy) * 180) / Math.PI;
  if (angle < 0) angle += 360;
  return angle;
}

function HueWheel({ hue, onChangeHue }: { hue: number; onChangeHue: (hue: number) => void }) {
  const segments = useMemo(() => {
    const step = 360 / SEGMENT_COUNT;
    return Array.from({ length: SEGMENT_COUNT }, (_, index) => {
      const start = index * step;
      const end = start + step;
      const outerStart = polarPoint(start, WHEEL_OUTER_RADIUS);
      const outerEnd = polarPoint(end, WHEEL_OUTER_RADIUS);
      const innerStart = polarPoint(start, WHEEL_INNER_RADIUS);
      const innerEnd = polarPoint(end, WHEEL_INNER_RADIUS);
      const path = [
        `M ${outerStart.x} ${outerStart.y}`,
        `A ${WHEEL_OUTER_RADIUS} ${WHEEL_OUTER_RADIUS} 0 0 1 ${outerEnd.x} ${outerEnd.y}`,
        `L ${innerEnd.x} ${innerEnd.y}`,
        `A ${WHEEL_INNER_RADIUS} ${WHEEL_INNER_RADIUS} 0 0 0 ${innerStart.x} ${innerStart.y}`,
        'Z',
      ].join(' ');
      return { path, color: hueToHex(start + step / 2) };
    });
  }, []);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          const { locationX, locationY } = event.nativeEvent;
          onChangeHue(angleFromPoint(locationX, locationY));
        },
        onPanResponderMove: (event) => {
          const { locationX, locationY } = event.nativeEvent;
          onChangeHue(angleFromPoint(locationX, locationY));
        },
      }),
    [onChangeHue]
  );

  const handlePoint = polarPoint(hue, HANDLE_RADIUS);

  return (
    <View style={{ width: WHEEL_SIZE, height: WHEEL_SIZE }} {...panResponder.panHandlers}>
      <Svg width={WHEEL_SIZE} height={WHEEL_SIZE}>
        {segments.map((segment, index) => (
          <Path key={index} d={segment.path} fill={segment.color} />
        ))}
        <Circle cx={handlePoint.x} cy={handlePoint.y} r={10} fill="#fff" stroke="#00000055" strokeWidth={2} />
      </Svg>
    </View>
  );
}

function LightnessSlider({
  lightness,
  hue,
  onChangeLightness,
}: {
  lightness: number;
  hue: number;
  onChangeLightness: (value: number) => void;
}) {
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          const x = Math.min(SLIDER_WIDTH, Math.max(0, event.nativeEvent.locationX));
          onChangeLightness((x / SLIDER_WIDTH) * 100);
        },
        onPanResponderMove: (event) => {
          const x = Math.min(SLIDER_WIDTH, Math.max(0, event.nativeEvent.locationX));
          onChangeLightness((x / SLIDER_WIDTH) * 100);
        },
      }),
    [onChangeLightness]
  );

  const pureHue = hueToHex(hue);
  const handleX = (lightness / 100) * SLIDER_WIDTH;

  return (
    <View style={{ width: SLIDER_WIDTH, height: SLIDER_HEIGHT + 16 }} {...panResponder.panHandlers}>
      <Svg width={SLIDER_WIDTH} height={SLIDER_HEIGHT} style={{ marginTop: 8 }}>
        <Defs>
          <LinearGradient id="lightnessGradient" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#000000" />
            <Stop offset="0.5" stopColor={pureHue} />
            <Stop offset="1" stopColor="#ffffff" />
          </LinearGradient>
        </Defs>
        <Rect width={SLIDER_WIDTH} height={SLIDER_HEIGHT} rx={SLIDER_HEIGHT / 2} fill="url(#lightnessGradient)" />
      </Svg>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 4,
          left: handleX - 4,
          width: 16,
          height: SLIDER_HEIGHT + 8,
          borderRadius: 8,
          backgroundColor: '#fff',
          borderWidth: 2,
          borderColor: '#00000055',
        }}
      />
    </View>
  );
}

type Props = {
  visible: boolean;
  initialColor: string;
  onClose: () => void;
  onSelect: (hex: string) => void;
};

export function ColorWheelPicker({ visible, initialColor, onClose, onSelect }: Props) {
  const theme = useTheme();
  const initialRgb = hexToRgb(initialColor) ?? { r: 60, g: 135, b: 247 };
  const initialHsl = rgbToHsl(initialRgb);

  const [hue, setHue] = useState(initialHsl.h);
  const [lightness, setLightness] = useState(initialHsl.l);
  const [rgbText, setRgbText] = useState({
    r: String(initialRgb.r),
    g: String(initialRgb.g),
    b: String(initialRgb.b),
  });

  const rgb = hslToRgb({ h: hue, s: 100, l: lightness });
  const hex = rgbToHex(rgb);

  function handleWheelChange(newHue: number) {
    setHue(newHue);
    const newRgb = hslToRgb({ h: newHue, s: 100, l: lightness });
    setRgbText({ r: String(newRgb.r), g: String(newRgb.g), b: String(newRgb.b) });
  }

  function handleLightnessChange(newLightness: number) {
    setLightness(newLightness);
    const newRgb = hslToRgb({ h: hue, s: 100, l: newLightness });
    setRgbText({ r: String(newRgb.r), g: String(newRgb.g), b: String(newRgb.b) });
  }

  function handleRgbFieldChange(channel: 'r' | 'g' | 'b', value: string) {
    const next = { ...rgbText, [channel]: value };
    setRgbText(next);
    const parsed = {
      r: clampByte(parseInt(next.r, 10) || 0),
      g: clampByte(parseInt(next.g, 10) || 0),
      b: clampByte(parseInt(next.b, 10) || 0),
    };
    const hsl = rgbToHsl(parsed);
    setHue(hsl.h);
    setLightness(hsl.l);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' }}>
        <ThemedView style={{ padding: Spacing.four, borderTopLeftRadius: 24, borderTopRightRadius: 24, alignItems: 'center' }}>
          <ThemedText type="default" style={{ marginBottom: Spacing.three }}>
            Custom color
          </ThemedText>

          <HueWheel hue={hue} onChangeHue={handleWheelChange} />
          <LightnessSlider hue={hue} lightness={lightness} onChangeLightness={handleLightnessChange} />

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three, marginTop: Spacing.three }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: hex, borderWidth: 1, borderColor: theme.backgroundSelected }} />
            {(['r', 'g', 'b'] as const).map((channel) => (
              <View key={channel} style={{ alignItems: 'center' }}>
                <ThemedText type="small" themeColor="textSecondary">
                  {channel.toUpperCase()}
                </ThemedText>
                <TextInput
                  value={rgbText[channel]}
                  onChangeText={(value) => handleRgbFieldChange(channel, value.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                  maxLength={3}
                  style={{
                    width: 48,
                    textAlign: 'center',
                    color: theme.text,
                    backgroundColor: theme.backgroundElement,
                    borderRadius: 8,
                    paddingVertical: 6,
                  }}
                />
              </View>
            ))}
          </View>

          <View style={{ flexDirection: 'row', gap: Spacing.three, marginTop: Spacing.four, alignSelf: 'stretch' }}>
            <Pressable
              onPress={onClose}
              style={{ flex: 1, paddingVertical: 12, borderRadius: 24, alignItems: 'center', backgroundColor: theme.backgroundElement }}
            >
              <ThemedText>Cancel</ThemedText>
            </Pressable>
            <Pressable
              onPress={() => onSelect(hex)}
              style={{ flex: 1, paddingVertical: 12, borderRadius: 24, alignItems: 'center', backgroundColor: theme.text }}
            >
              <ThemedText style={{ color: theme.background }}>Use this color</ThemedText>
            </Pressable>
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
}
