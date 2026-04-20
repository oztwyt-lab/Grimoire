import { View } from 'react-native';

// ─── Pixel art palette ────────────────────────────────────────────────────────
const C: Record<string, string | null> = {
  '.': null,        // transparent
  'H': '#3d0d7a',   // hat (dark purple)
  'G': '#e2b96f',   // gold (hat band, belt)
  'S': '#f5cba7',   // skin
  'E': '#1a1a2e',   // eye
  'R': '#1a237e',   // robe (dark blue)
  'L': '#3949ab',   // robe highlight (lighter blue)
  'B': '#100a05',   // boot
};

// ─── Walk frames (10 cols × 14 rows) ─────────────────────────────────────────
// Each character is exactly 10 chars wide.
const FRAMES: string[][] = [
  // Frame A — legs together
  [
    '...HHHH...', // 0  hat top
    '..HHGHH...', // 1  hat with gold band
    '.HHHHHHHH.', // 2  hat brim
    '...SSSS...', // 3  face top
    '..SESSSS..', // 4  face + eye (col 3)
    '..SSSSSS..', // 5  face
    '...SSSS...', // 6  chin
    '..RRRRR...', // 7  robe shoulder
    '.RRRLLRR..', // 8  robe body
    '.RGGGGGR..', // 9  belt
    '.RRRRRRRR.', // 10 robe lower
    '.RRRRRRRR.', // 11 robe lower 2
    '..RR..RR..', // 12 legs
    '..BB..BB..', // 13 boots
  ],
  // Frame B — legs apart (mid-stride)
  [
    '...HHHH...', // 0
    '..HHGHH...', // 1
    '.HHHHHHHH.', // 2
    '...SSSS...', // 3
    '..SESSSS..', // 4
    '..SSSSSS..', // 5
    '...SSSS...', // 6
    '..RRRRR...', // 7
    '.RRRLLRR..', // 8
    '.RGGGGGR..', // 9
    '.RRRRRRRR.', // 10
    '.RRRRRRRR.', // 11
    '.RR....RR.', // 12 legs wide
    '.BB....BB.', // 13 boots wide
  ],
];

const PIXEL = 5; // dp per pixel

type Props = { frame: 0 | 1 };

export default function PixelCharacter({ frame }: Props) {
  const rows = FRAMES[frame];
  return (
    <View>
      {rows.map((row, r) => (
        <View key={r} style={{ flexDirection: 'row' }}>
          {row.split('').map((code, col) => {
            const color = C[code];
            return (
              <View
                key={col}
                style={{ width: PIXEL, height: PIXEL, backgroundColor: color ?? 'transparent' }}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}
