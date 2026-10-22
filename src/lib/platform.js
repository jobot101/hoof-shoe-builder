// Where the app is running decides how photos come in and files go out:
//   native  - Android / iPhone app (Capacitor): camera plugin, Documents folder, share sheet
//   claude  - inside a Claude artifact: the viewer's download prompt
//   web     - Safari / Chrome (GitHub Pages): browser download and Web Share
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";

const isNative = Capacitor.isNativePlatform();
const platform = Capacitor.getPlatform();
const isIOS = platform === "ios" || /iPhone|iPad/.test(navigator.userAgent);

let claudeDownloads = null;
if (!isNative && window.claude && typeof window.claude.use === "function") {
  claudeDownloads = window.claude.use("downloads").catch(() => null);
}
export const target = isNative ? "native" : claudeDownloads ? "claude" : "web";
export const usesNativePicker = isNative;

function toBytes(data) {
  return typeof data === "string" ? new TextEncoder().encode(data) : data;
}
function base64(data) {
  const bytes = toBytes(data);
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
async function writeNative(directory, name, data) {
  const r = await Filesystem.writeFile({ path: "ShoeBuilder/" + name, data: base64(data), directory, recursive: true });
  return r.uri;
}
function browserDownload(f) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([toBytes(f.data)], { type: "application/octet-stream" }));
  a.download = f.name;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 30000);
}

/** Save files. Returns a plain description of where they went. */
export async function saveFiles(files) {
  if (isNative) {
    try {
      for (const f of files) await writeNative(Directory.Documents, f.name, f.data);
      return platform === "ios" ? "Files › On My iPhone › Shoe Builder › ShoeBuilder" : "Documents › ShoeBuilder";
    } catch (e) {
      // Older Android without access to the public Documents folder: hand the STL to the share sheet.
      const uri = await writeNative(Directory.Data, files[0].name, files[0].data);
      await Share.share({ title: files[0].name, files: [uri], dialogTitle: "Save " + files[0].name });
      return "the place you picked";
    }
  }
  if (claudeDownloads) {
    const dl = await claudeDownloads;
    if (!dl) throw new Error("Saving isn't available in this view. Open it in the Claude app or on claude.ai.");
    const stl = files.find((f) => /\.stl$/i.test(f.name)) || files[0];
    try {
      await dl.save({ filename: stl.name, data: new Blob([toBytes(stl.data)]) });
    } catch (e) {
      if (e && e.code === "declined") throw new Error("Save cancelled.");
      if (e && e.code === "rate_limited") throw new Error("A save prompt is already open. Finish that one first.");
      throw new Error("Couldn't save the file (" + ((e && e.code) || "error") + ").");
    }
    return "your downloads";
  }
  const list = files.filter((f) => /\.stl$/i.test(f.name));
  const out = list.length ? list : files;
  for (let i = 0; i < out.length; i++) {
    browserDownload(out[i]);
    if (i < out.length - 1) await new Promise((r) => setTimeout(r, 600));
  }
  return isIOS ? "Files › Downloads" : "Downloads";
}

/** Open the share sheet with one file (falls back to saving). */
export async function shareFile(f) {
  if (isNative) {
    const uri = await writeNative(Directory.Cache, f.name, f.data);
    await Share.share({ title: f.name, files: [uri], dialogTitle: "Send " + f.name });
    return null;
  }
  if (!claudeDownloads && navigator.share && navigator.canShare) {
    const file = new File([toBytes(f.data)], f.name, { type: "model/stl" });
    if (navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: f.name });
      return null;
    }
  }
  return saveFiles([f]);
}

export const canShare = isNative || (!claudeDownloads && !!navigator.share);

/** Native camera / photo library. Returns a data URL, or null if cancelled. */
export async function pickPhotoNative() {
  const p = await Camera.getPhoto({
    resultType: CameraResultType.DataUrl,
    source: CameraSource.Prompt,
    quality: 92,
    correctOrientation: true,
    width: 3000,
    promptLabelHeader: "Sole photo",
    promptLabelPhoto: "Choose from photos",
    promptLabelPicture: "Take photo",
  });
  return p && p.dataUrl;
}

export function isCancel(e) {
  return /cancel/i.test(String((e && e.message) || e));
}
