const UI_MODULES = import.meta.glob("./ui/*", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>

const UI_BY_NAME = Object.fromEntries(
  Object.entries(UI_MODULES).map(([path, url]) => {
    const name = path.split("/").pop() ?? path
    return [name, url]
  }),
)

export const BACKGROUND_IMAGE = new URL(
  "./Example Images/background.png",
  import.meta.url,
).href

export const MASCOT_IMAGE = new URL(
  "./Character/mascot/mascot.png",
  import.meta.url,
).href

export function getUiAsset(fileName: string) {
  return UI_BY_NAME[fileName] ?? ""
}
