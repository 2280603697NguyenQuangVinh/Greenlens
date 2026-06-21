declare module "@/services/supertonic/helper.js" {
  export class Style {
    ttl: unknown
    dp: unknown
  }

  export class TextToSpeech {
    sampleRate: number
    call(
      text: string,
      lang: string,
      style: Style,
      totalStep: number,
      speed?: number,
      silenceDuration?: number,
      progressCallback?: (step: number, total: number) => void,
    ): Promise<{ wav: number[]; duration: number[] }>
  }

  export function loadTextToSpeech(
    onnxDir: string,
    sessionOptions?: Record<string, unknown>,
    progressCallback?: (name: string, current: number, total: number) => void,
    configDir?: string,
  ): Promise<{ textToSpeech: TextToSpeech; cfgs: unknown }>

  export function loadVoiceStyle(
    voiceStylePaths: string[],
    verbose?: boolean,
  ): Promise<Style>

  export function writeWavFile(audioData: number[], sampleRate: number): ArrayBuffer
}
