export type RGB = readonly [red: number, green: number, blue: number];

export type SkinColorSamples = {
  cheeks: readonly RGB[];
  forehead: readonly RGB[];
};

export type Undertone = "warm" | "cool" | "neutral" | "olive";

export type UndertoneAnalysis = {
  undertone: Undertone;
  averageRgb: RGB;
  lab: { lightness: number; a: number; b: number };
  hueAngle: number;
};

function averageRgb(samples: readonly RGB[]): RGB {
  if (samples.length === 0) {
    throw new RangeError("At least one skin color sample is required.");
  }

  const total = samples.reduce(
    ([red, green, blue], sample) => {
      for (const channel of sample) {
        if (!Number.isFinite(channel) || channel < 0 || channel > 255) {
          throw new RangeError("RGB channels must be finite values from 0 to 255.");
        }
      }

      return [red + sample[0], green + sample[1], blue + sample[2]];
    },
    [0, 0, 0],
  );

  return [
    total[0] / samples.length,
    total[1] / samples.length,
    total[2] / samples.length,
  ];
}

function srgbToLinear(channel: number): number {
  const value = channel / 255;
  return value <= 0.04045
    ? value / 12.92
    : ((value + 0.055) / 1.055) ** 2.4;
}

function rgbToLab([red, green, blue]: RGB): UndertoneAnalysis["lab"] {
  const linearRed = srgbToLinear(red);
  const linearGreen = srgbToLinear(green);
  const linearBlue = srgbToLinear(blue);

  const x = (linearRed * 0.4124564 + linearGreen * 0.3575761 + linearBlue * 0.1804375) / 0.95047;
  const y = linearRed * 0.2126729 + linearGreen * 0.7151522 + linearBlue * 0.072175;
  const z = (linearRed * 0.0193339 + linearGreen * 0.119192 + linearBlue * 0.9503041) / 1.08883;

  const pivot = (value: number) =>
    value > 0.008856451679
      ? Math.cbrt(value)
      : value / 0.1284185493 + 0.1379310345;
  const xPivot = pivot(x);
  const yPivot = pivot(y);
  const zPivot = pivot(z);

  return {
    lightness: 116 * yPivot - 16,
    a: 500 * (xPivot - yPivot),
    b: 200 * (yPivot - zPivot),
  };
}

function classifyUndertone(hueAngle: number, chroma: number): Undertone {
  if (chroma < 8) return "neutral";
  if (hueAngle >= 75 && hueAngle <= 115) return "olive";
  if (hueAngle >= 50 && hueAngle < 75) return "warm";
  if (hueAngle < 50 || hueAngle > 340) return "cool";
  return "neutral";
}

export function analyzeUndertone(samples: SkinColorSamples): UndertoneAnalysis {
  const average = averageRgb([...samples.cheeks, ...samples.forehead]);
  const lab = rgbToLab(average);
  const hueAngle = (Math.atan2(lab.b, lab.a) * 180 / Math.PI + 360) % 360;
  const chroma = Math.hypot(lab.a, lab.b);
  const undertone = classifyUndertone(hueAngle, chroma);
  const analysis = { undertone, averageRgb: average, lab, hueAngle };

  console.log("Estimated skin undertone:", undertone, analysis);
  return analysis;
}
