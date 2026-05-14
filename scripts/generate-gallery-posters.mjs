import { encode, decode } from "blurhash";
import sharp from "sharp";
import { execSync } from "child_process";
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const galleryDir = "./public/assets/gallery";
const outputFile = "./src/data/gallery-posters.json";

const files = readdirSync(galleryDir).filter((f) => f.endsWith(".mp4"));

// Load existing posters so we only process new files
let result = {};
try {
  result = JSON.parse(readFileSync(outputFile, "utf-8"));
} catch {}

const newFiles = files.filter((f) => !result[f]);
if (newFiles.length === 0) {
  console.log("All gallery posters up to date.");
  process.exit(0);
}

for (const file of newFiles) {
  const inputPath = join(galleryDir, file);
  const tmpFrame = join(tmpdir(), `k4mera-poster-${file}.png`);

  try {
    // Extract first frame, scaled to 64px wide (preserving aspect ratio)
    execSync(
      `ffmpeg -i "${inputPath}" -vframes 1 -vf scale=64:-1 "${tmpFrame}" -y -loglevel quiet`
    );

    const { data, info } = await sharp(tmpFrame)
      .raw()
      .ensureAlpha()
      .toBuffer({ resolveWithObject: true });

    // Encode to blurhash
    const hash = encode(
      new Uint8ClampedArray(data),
      info.width,
      info.height,
      4,
      3
    );

    // Decode back to a 32x32 image
    const decoded = decode(hash, 32, 32);

    // Convert raw RGBA to PNG
    const pngBuffer = await sharp(Buffer.from(decoded), {
      raw: { width: 32, height: 32, channels: 4 },
    })
      .png()
      .toBuffer();

    result[file] = `data:image/png;base64,${pngBuffer.toString("base64")}`;
    console.log(`✓ ${file}`);
  } catch (e) {
    console.error(`✗ ${file}: ${e.message}`);
  }
}

mkdirSync("./src/data", { recursive: true });
writeFileSync(outputFile, JSON.stringify(result, null, 2));
console.log(`\nWritten ${Object.keys(result).length} posters to ${outputFile}`);
