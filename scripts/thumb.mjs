import sharp from "sharp";
const [,, inp, out, l, t, w, h] = process.argv;
const img = sharp(inp);
const pipe = l ? img.extract({ left: +l, top: +t, width: +w, height: +h }) : img;
await pipe.resize(248, 248, { fit: "cover" }).webp({ quality: 82 }).toFile(out);
console.log("wrote", out);
