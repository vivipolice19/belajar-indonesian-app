import { StyleSheet, View } from "react-native";
import Svg, { Circle, Ellipse, Path } from "react-native-svg";
import { design } from "../theme/designTokens";

type MascotIconProps = {
  size?: "sm" | "md" | "lg";
  expression?: "neutral" | "happy" | "celebrating";
};

const sizePx = { sm: 48, md: 64, lg: 96 } as const;

export function MascotIcon({ size = "md", expression = "neutral" }: MascotIconProps) {
  const px = sizePx[size];
  const fg = design.foreground;

  const eyes =
    expression === "happy" || expression === "celebrating" ? (
      <>
        <Circle cx="35" cy="45" r="3" fill={fg} />
        <Circle cx="65" cy="45" r="3" fill={fg} />
        <Path
          d="M 30 40 Q 35 35 40 40"
          stroke={fg}
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <Path
          d="M 60 40 Q 65 35 70 40"
          stroke={fg}
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </>
    ) : (
      <>
        <Circle cx="35" cy="45" r="4" fill={fg} />
        <Circle cx="65" cy="45" r="4" fill={fg} />
      </>
    );

  const mouth =
    expression === "celebrating" ? (
      <Ellipse cx="50" cy="65" rx="12" ry="8" fill={fg} />
    ) : expression === "happy" ? (
      <Path
        d="M 35 60 Q 50 70 65 60"
        stroke={fg}
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
      />
    ) : (
      <Path
        d="M 35 65 Q 50 68 65 65"
        stroke={fg}
        fill="none"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    );

  return (
    <View style={[styles.wrap, { width: px, height: px }]}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100">
        <Circle cx="50" cy="50" r="48" fill={design.primary} />
        <Circle cx="50" cy="50" r="46" fill={design.accent} />
        {eyes}
        {mouth}
        {expression === "celebrating" ? (
          <>
            <Circle cx="20" cy="20" r="3" fill={design.accent} />
            <Circle cx="80" cy="20" r="3" fill={design.accent} />
            <Circle cx="15" cy="35" r="2" fill={design.primary} />
            <Circle cx="85" cy="35" r="2" fill={design.primary} />
          </>
        ) : null}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: "center" },
});
