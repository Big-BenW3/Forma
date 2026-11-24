/**
 * Scene export: three.js scene graph -> optimised GLB + scene manifest.
 *
 * Pipeline, in order:
 *   1. The model script builds a three.js scene and calls `build.part(...)` on
 *      every interactive object. That gives the object its SEMANTIC NAME
 *      (e.g. `organelle_nucleus`), which becomes the glTF node name.
 *   2. We convert the graph to a glTF-Transform Document (nodes, meshes,
 *      materials, textures). Node `userData` becomes glTF `extras`.
 *   3. We optimise: dedup, prune, quantise vertex data and meshopt-compress.
 *      None of these steps rename nodes, but we re-read the written file and
 *      verify every semantic name survived (a silent rename to `mesh_0` would
 *      break the whole app, and nobody would notice until a card came up empty).
 *   4. We write `<scene>.glb` and `<scene>.manifest.json`. The app reads the
 *      MANIFEST, never the GLB's internals, to know what is interactive.
 *
 * Unity note: this repo generates its models in code because the build
 * environment cannot download source assets. The output contract (semantic
 * node names + manifest) is exactly what a Unity/Blender export should
 * produce, so any scene here can be replaced by a hand-authored GLB that keeps
 * the same node names without changing any other code.
 */
import * as THREE from "three";
import fs from "node:fs";
import path from "node:path";
import { Document, NodeIO, type Buffer as GBuffer, type Node as GNode } from "@gltf-transform/core";
import { ALL_EXTENSIONS, EXTTextureWebP } from "@gltf-transform/extensions";
import { dedup, meshopt, prune, quantize } from "@gltf-transform/functions";
import { MeshoptDecoder, MeshoptEncoder } from "meshoptimizer";
import { Manifest, SCHEMA_VERSION, type ManifestNode } from "../../../src/content/schema";

export interface PartSpec {
  id: string;
  name: string;
  group?: string;
  layer?: string;
  /** Direction the "Zoom to it" camera looks FROM, relative to the part. Default: front-right-above. */
  view?: [number, number, number];
  /** Framing tightness: bigger = further away. Default 2.4. */
  fit?: number;
  /** Where the callout dot sits. Default: bounding-box centre. */
  anchor?: "center" | "top" | [number, number, number];
  explode?: [number, number, number];
  decor?: boolean;
  /** Fades automatically when a non-shell part is selected (e.g. a cell membrane) */
  shell?: boolean;
}

export interface BuildOpts {
  sceneId: string;
  /** Default camera direction (looks FROM here toward the target) */
  view?: [number, number, number];
  fov?: number;
  /** Framing multiplier for the default camera */
  fit?: number;
  /** Multiplies every part's `fit`. Bilateral parts (both legs in one part) need to sit farther back. */
  partFitScale?: number;
  /** Override the default target (otherwise the scene's bounding-box centre) */
  target?: [number, number, number];
}

const round = (n: number) => Math.round(n * 1000) / 1000;
const r3 = (v: THREE.Vector3): [number, number, number] => [round(v.x), round(v.y), round(v.z)];

export class SceneBuild {
  readonly root = new THREE.Group();
  readonly groups: Record<string, { label: string; color: string }> = {};
  readonly layers: Array<{ id: string; label: string; covers?: boolean }> = [];
  private specs: Array<{ obj: THREE.Object3D; spec: PartSpec }> = [];

  constructor(readonly opts: BuildOpts) {
    this.root.name = opts.sceneId;
  }

  group(id: string, label: string, color: string) {
    this.groups[id] = { label, color };
  }

  /** Layers are declared outermost first. `covers`: opaque enough to hide what is beneath it. */
  layer(id: string, label: string, covers = false) {
    this.layers.push({ id, label, ...(covers ? { covers: true } : {}) });
  }

  /** Marks `obj` as an interactive semantic part and names it. */
  part<T extends THREE.Object3D>(obj: T, spec: PartSpec): T {
    if (this.specs.some((s) => s.spec.id === spec.id)) throw new Error(`duplicate semantic id: ${spec.id}`);
    obj.name = spec.id;
    obj.userData.semantic = true;
    if (spec.shell) obj.userData.shell = true;
    if (spec.layer) obj.userData.layer = spec.layer;
    if (spec.group) obj.userData.group = spec.group;
    if (spec.explode) obj.userData.explode = spec.explode;
    this.specs.push({ obj, spec });
    return obj;
  }

  // -------------------------------------------------------------------------

  private camFor(box: THREE.Box3, viewDir: [number, number, number], fit: number, fov: number) {
    const center = box.getCenter(new THREE.Vector3());
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const dist = (sphere.radius / Math.sin(THREE.MathUtils.degToRad(fov) / 2)) * (fit / 2.4) * 0.62;
    const dir = new THREE.Vector3(...viewDir).normalize();
    return { position: center.clone().addScaledVector(dir, dist), target: center, dist, radius: sphere.radius };
  }

  /** Builds the manifest after the whole graph exists (parents' transforms are final). */
  private buildManifest(): Manifest {
    this.root.updateMatrixWorld(true);
    const fov = this.opts.fov ?? 34;
    const all = new THREE.Box3().setFromObject(this.root);
    const defView = this.opts.view ?? [0.55, 0.45, 0.85];
    const def = this.camFor(all, defView, this.opts.fit ?? 2.4, fov);
    if (this.opts.target) def.target.set(...this.opts.target);

    const nodes: Record<string, ManifestNode> = {};
    for (const { obj, spec } of this.specs) {
      const box = new THREE.Box3().setFromObject(obj);
      const cam = this.camFor(box, spec.view ?? defView, (spec.fit ?? 2.4) * (this.opts.partFitScale ?? 1), fov);
      let anchor: THREE.Vector3;
      if (Array.isArray(spec.anchor)) anchor = new THREE.Vector3(...spec.anchor);
      else if (spec.anchor === "top") anchor = box.getCenter(new THREE.Vector3()).setY(box.max.y);
      else anchor = box.getCenter(new THREE.Vector3());
      nodes[spec.id] = {
        name: spec.name,
        ...(spec.group ? { group: spec.group } : {}),
        ...(spec.layer ? { layer: spec.layer } : {}),
        camera: { position: r3(cam.position), target: r3(cam.target) },
        anchor: r3(anchor),
        ...(spec.explode ? { explode: spec.explode } : {}),
        ...(spec.decor ? { decor: true } : {}),
      };
    }
    return Manifest.parse({
      schemaVersion: SCHEMA_VERSION,
      sceneId: this.opts.sceneId,
      glb: `/models/${this.opts.sceneId}.glb`,
      camera: {
        position: r3(def.position),
        target: r3(def.target),
        fov,
        minDistance: round(def.radius * 0.18),
        maxDistance: round(def.dist * 2.6),
      },
      groups: this.groups,
      layers: this.layers,
      bounds: { min: r3(all.min), max: r3(all.max) },
      nodes,
    });
  }

  // -------------------------------------------------------------------------

  private toDocument(): Document {
    const doc = new Document();
    const buffer = doc.createBuffer();
    const scene = doc.createScene(this.opts.sceneId);
    const matMap = new Map<string, ReturnType<Document["createMaterial"]>>();
    const geoMap = new Map<string, ReturnType<Document["createPrimitive"]>>();
    let webp: EXTTextureWebP | null = null;
    let counter = 0;

    const makeMaterial = (m: THREE.MeshStandardMaterial) => {
      const hit = matMap.get(m.uuid);
      if (hit) return hit;
      const gm = doc
        .createMaterial(m.name || `mat${matMap.size}`)
        .setBaseColorFactor([m.color.r, m.color.g, m.color.b, m.opacity])
        .setRoughnessFactor(m.roughness)
        .setMetallicFactor(m.metalness)
        .setEmissiveFactor([
          Math.min(1, m.emissive.r * m.emissiveIntensity),
          Math.min(1, m.emissive.g * m.emissiveIntensity),
          Math.min(1, m.emissive.b * m.emissiveIntensity),
        ]);
      if (m.transparent) gm.setAlphaMode("BLEND");
      if (m.side === THREE.DoubleSide) gm.setDoubleSided(true);
      const map = m.userData.map as { buffer: Buffer; mime: string } | undefined;
      if (map) {
        const tex = doc.createTexture(`${gm.getName()}_map`).setImage(new Uint8Array(map.buffer)).setMimeType(map.mime);
        if (map.mime === "image/webp") webp ??= doc.createExtension(EXTTextureWebP).setRequired(true);
        gm.setBaseColorTexture(tex);
      }
      matMap.set(m.uuid, gm);
      return gm;
    };

    const makePrimitive = (g: THREE.BufferGeometry, buf: GBuffer) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- gltf-transform wants a concrete typed array; the callers pass Float32Array or Uint32Array
      const accessor = (arr: ArrayLike<number>, type: "SCALAR" | "VEC2" | "VEC3", ctor: any) =>
        doc.createAccessor().setType(type).setArray(new ctor(arr)).setBuffer(buf);
      const prim = doc.createPrimitive().setAttribute("POSITION", accessor(g.getAttribute("position").array, "VEC3", Float32Array));
      if (g.getAttribute("normal")) prim.setAttribute("NORMAL", accessor(g.getAttribute("normal").array, "VEC3", Float32Array));
      if (g.getAttribute("uv")) prim.setAttribute("TEXCOORD_0", accessor(g.getAttribute("uv").array, "VEC2", Float32Array));
      if (g.getAttribute("color")) prim.setAttribute("COLOR_0", accessor(g.getAttribute("color").array, "VEC3", Float32Array));
      if (g.index) {
        const count = g.getAttribute("position").count;
        prim.setIndices(accessor(g.index.array, "SCALAR", count > 65535 ? Uint32Array : Uint16Array));
      }
      return prim;
    };

    const convert = (obj: THREE.Object3D, parent: GNode | null) => {
      const node = doc.createNode(obj.name || `n${counter++}`);
      node.setTranslation([obj.position.x, obj.position.y, obj.position.z]);
      node.setRotation([obj.quaternion.x, obj.quaternion.y, obj.quaternion.z, obj.quaternion.w]);
      node.setScale([obj.scale.x, obj.scale.y, obj.scale.z]);
      if (Object.keys(obj.userData).length) node.setExtras({ ...obj.userData });
      if (parent) parent.addChild(node);
      else scene.addChild(node);

      if ((obj as THREE.Mesh).isMesh) {
        const m = obj as THREE.Mesh;
        const material = makeMaterial(m.material as THREE.MeshStandardMaterial);
        const gMesh = doc.createMesh(`${obj.name || "mesh"}_geo`);
        // Geometry is shared across meshes that reuse it (e.g. repeated bolts) via the cache.
        let prim = geoMap.get(m.geometry.uuid);
        if (!prim) {
          prim = makePrimitive(m.geometry, buffer);
          geoMap.set(m.geometry.uuid, prim);
        }
        // A primitive can hold only one material, so clone per-material.
        const p2 = prim.clone().setMaterial(material);
        gMesh.addPrimitive(p2);
        node.setMesh(gMesh);
      }
      for (const child of obj.children) convert(child, node);
    };

    for (const child of this.root.children) convert(child, null);
    return doc;
  }

  /** Writes the GLB and manifest. Returns size and triangle statistics. */
  async write(outDir: string) {
    // Diagnostic: DEBUG_BOX=1 prints every part's size, which makes a runaway or misplaced mesh obvious.
    if (process.env.DEBUG_BOX) {
      this.root.updateMatrixWorld(true);
      for (const { obj, spec } of this.specs) {
        const b = new THREE.Box3().setFromObject(obj);
        const sz = b.getSize(new THREE.Vector3());
        let tris = 0;
        obj.traverse((o) => {
          const m = o as THREE.Mesh;
          if (m.isMesh) tris += (m.geometry.index ? m.geometry.index.count : m.geometry.getAttribute("position").count) / 3;
        });
        console.log(`${spec.id.padEnd(28)} ${String(tris).padStart(6)} tris  size ${sz.x.toFixed(3)} ${sz.y.toFixed(3)} ${sz.z.toFixed(3)}  min ${b.min.x.toFixed(2)},${b.min.y.toFixed(2)},${b.min.z.toFixed(2)}`);
      }
    }
    const manifest = this.buildManifest();
    const doc = this.toDocument();

    await MeshoptEncoder.ready;
    await MeshoptDecoder.ready;
    await doc.transform(
      dedup(),
      prune({ keepLeaves: true, keepExtras: true }),
      quantize({ quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 12, quantizeColor: 8 }),
      meshopt({ encoder: MeshoptEncoder, level: "high" }),
    );

    const io = new NodeIO()
      .registerExtensions(ALL_EXTENSIONS)
      .registerDependencies({ "meshopt.encoder": MeshoptEncoder, "meshopt.decoder": MeshoptDecoder });
    const glb = await io.writeBinary(doc);
    fs.mkdirSync(outDir, { recursive: true });
    const glbPath = path.join(outDir, `${this.opts.sceneId}.glb`);
    fs.writeFileSync(glbPath, glb);
    fs.writeFileSync(path.join(outDir, `${this.opts.sceneId}.manifest.json`), JSON.stringify(manifest, null, 1));

    // Verify the semantic names survived optimisation by reading the file back.
    const back = await io.readBinary(glb);
    const names = new Set(back.getRoot().listNodes().map((n) => n.getName()));
    const missing = Object.keys(manifest.nodes).filter((id) => !names.has(id));
    if (missing.length) throw new Error(`semantic nodes lost in export: ${missing.join(", ")}`);

    let tris = 0;
    for (const mesh of back.getRoot().listMeshes())
      for (const p of mesh.listPrimitives()) tris += (p.getIndices()?.getCount() ?? p.getAttribute("POSITION")!.getCount()) / 3;

    return {
      scene: this.opts.sceneId,
      kb: Math.round(glb.byteLength / 1024),
      triangles: Math.round(tris),
      parts: Object.keys(manifest.nodes).length,
    };
  }
}
