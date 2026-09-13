import { writeFileSync } from "node:fs";
import { join } from "node:path";

// 1x1 transparent/white pixel JPEG in base64
const base64Jpeg =
  "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";

const targetPath = join(process.cwd(), "public", "qris.jpg");
writeFileSync(targetPath, Buffer.from(base64Jpeg, "base64"));
console.log("Created public/qris.jpg");
