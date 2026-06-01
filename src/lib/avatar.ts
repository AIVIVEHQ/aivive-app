import { createAvatar } from "@dicebear/core";
import { botttsNeutral } from "@dicebear/collection";

export function getFallbackAvatarUri(seed: string): string {
  return createAvatar(botttsNeutral, {
    seed: seed || "anon",
    radius: 50,
    backgroundType: ["gradientLinear", "solid"],
    backgroundColor: ["b6e3f4", "c0aede", "d1d4f9", "ffd5dc", "ffdfbf"],
  }).toDataUri();
}
