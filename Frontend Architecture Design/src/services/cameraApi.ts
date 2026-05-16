export interface CameraAnalysisResult {
  name: string;
  type: string;
  confidence: number;
  funFact: string;
  xp: number;
}

const delay = (ms = 1500) => new Promise((resolve) => setTimeout(resolve, ms));

export async function uploadImage(
  _imageDataUrl?: string,
): Promise<CameraAnalysisResult> {
  await delay(2500);
  return {
    name: "Monarch Butterfly",
    type: "Insect",
    confidence: 98,
    funFact: "They travel up to 3,000 miles during migration!",
    xp: 50,
  };
}

export async function getScanHistory(): Promise<CameraAnalysisResult[]> {
  await delay(300);
  return [
    {
      name: "Oak Tree",
      type: "Plant",
      confidence: 92,
      funFact: "Oak trees can live for over 1,000 years.",
      xp: 30,
    },
  ];
}
