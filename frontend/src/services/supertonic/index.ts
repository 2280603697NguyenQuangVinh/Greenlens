export type { SupertonicInitState } from "@/services/supertonic/supertonicSpeech"
export {
  cancelSupertonicPlayback,
  cancelSupertonicSpeech,
  hasPendingSupertonicSpeech,
  initSupertonic,
  isSupertonicReady,
  prefetchSupertonicSpeech,
  speakSupertonicSegments,
  speakSupertonicText,
  subscribeSupertonicInit,
  unlockSupertonicAudio,
} from "@/services/supertonic/supertonicSpeech"
export { isSupertonicEnabled } from "@/services/supertonic/config"
export { startSupertonicPreload, unlockSupertonicOnGesture } from "@/services/supertonic/preload"
