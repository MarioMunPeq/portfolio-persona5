export interface Track {
  title: string;
  file: string;
}

export const TRACKS: Track[] = [
  { title: "No More What Ifs", file: "No More What Ifs.mp3" },
  { title: "Beneath the Mask", file: "Beneath the Mask.mp3" },
  { title: "Phantom", file: "Phantom.mp3" },
  { title: "Tokyo Daylight", file: "Tokyo Daylight.mp3" },
  { title: "What's Going On", file: "What's Going On.mp3" },
];

export const DEFAULT_VOLUME = 0.7;
