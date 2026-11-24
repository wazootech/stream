import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { BRAND } from "./brand.ts";

/** Canvas the layouts are designed for. Twitch wants 16:9. */
export const CANVAS = { width: 1920, height: 1080 } as const;

/** Matches the version stamp OBS 32 writes into saved sources. */
const PREV_VER = 537001986;

type Json = Record<string, unknown>;

export interface SceneCollection extends Json {
  name: string;
  sources: Json[];
  scene_order: { name: string }[];
}

export interface SceneOptions {
  /** Absolute path to this repo's `overlays/` directory. */
  overlaysDir: string;
  name?: string;
}

interface Place {
  x: number;
  y: number;
  w: number;
  h: number;
}

const abgr = (r: number, g: number, b: number): number =>
  ((0xff << 24) | (b << 16) | (g << 8) | r) >>> 0;

function source(
  id: string,
  name: string,
  settings: Json,
  extra: Json = {},
): Json {
  return {
    prev_ver: PREV_VER,
    name,
    uuid: randomUUID(),
    id,
    versioned_id: id,
    settings,
    mixers: 0,
    sync: 0,
    flags: 0,
    volume: 1.0,
    balance: 0.5,
    enabled: true,
    muted: false,
    "push-to-mute": false,
    "push-to-mute-delay": 0,
    "push-to-talk": false,
    "push-to-talk-delay": 0,
    hotkeys: {},
    deinterlace_mode: 0,
    deinterlace_field_order: 0,
    monitoring_type: 0,
    private_settings: {},
    ...extra,
  };
}

function audio(
  id: string,
  name: string,
  volume: number,
  hotkeyPrefix: string,
  extra: Json = {},
): Json {
  return source(id, name, { device_id: "default" }, {
    mixers: 255,
    volume,
    hotkeys: {
      [`${hotkeyPrefix}.mute`]: [],
      [`${hotkeyPrefix}.unmute`]: [],
      [`${hotkeyPrefix}.push-to-mute`]: [],
      [`${hotkeyPrefix}.push-to-talk`]: [],
    },
    ...extra,
  });
}

/** Mic chain: denoise, level the peaks, then a safety limiter. */
function micFilters(): Json[] {
  const filter = (id: string, name: string, settings: Json) =>
    source(id, name, settings, { mixers: 255 });
  return [
    filter("noise_suppress_filter_v2", "Noise Suppression", {
      method: "rnnoise",
    }),
    filter("compressor_filter", "Compressor", {
      ratio: 4.0,
      threshold: -18.0,
      attack_time: 6.0,
      release_time: 60.0,
      output_gain: 3.0,
    }),
    filter("limiter_filter", "Limiter", { threshold: -2.0, release_time: 60.0 }),
  ];
}

function item(id: number, src: Json, place: Place): Json {
  return {
    name: src.name,
    source_uuid: src.uuid,
    visible: true,
    locked: false,
    rot: 0.0,
    pos: { x: place.x, y: place.y },
    scale: { x: 1.0, y: 1.0 },
    align: 5,
    bounds_type: 2, // scale to inner bounds, keeping aspect ratio
    bounds_align: 0, // centered
    bounds: { x: place.w, y: place.h },
    crop_left: 0,
    crop_top: 0,
    crop_right: 0,
    crop_bottom: 0,
    id,
    group_item_backup: false,
    scale_filter: "disable",
    blend_method: "default",
    blend_type: "normal",
    show_transition: { duration: 0 },
    hide_transition: { duration: 0 },
    private_settings: {},
  };
}

function scene(name: string, layers: [Json, Place][]): Json {
  const items = layers.map(([src, place], i) => item(i + 1, src, place));
  return source("scene", name, {
    items,
    id_counter: items.length,
    custom_size: false,
  }, { hotkeys: { "OBSBasic.SelectScene": [] } });
}

export function buildSceneCollection(options: SceneOptions): SceneCollection {
  const { width: W, height: H } = CANVAS;
  const page = (file: string, query = "") =>
    pathToFileURL(join(options.overlaysDir, file)).href + query;
  const browser = (name: string, url: string, width: number, height: number) =>
    source("browser_source", name, {
      url,
      is_local_file: false,
      width,
      height,
      fps: 30,
      reroute_audio: false,
      shutdown: false,
      restart_when_active: false,
    });

  const full: Place = { x: 0, y: 0, w: W, h: H };
  const SIDE = 480; // right-hand column in the main layout

  const backdrop = source("color_source_v3", "Backdrop", {
    color: abgr(...BRAND.backdropRgb),
    width: W,
    height: H,
  });
  const display = source("monitor_capture", "Display", {
    monitor: 0,
    method: 0,
    capture_cursor: true,
  });
  const webcam = source("dshow_input", "Webcam", {});
  const hud = browser("HUD", page("hud.html", "?layout=sidebar"), SIDE, H - 270);
  const hudBar = browser("HUD Bar", page("hud.html", "?layout=compact"), W, 120);
  const starting = browser("Screen: Starting", page("screen.html", "?mode=starting"), W, H);
  const labBreak = browser("Screen: Break", page("screen.html", "?mode=break"), W, H);
  const ending = browser("Screen: Ending", page("screen.html", "?mode=ending"), W, H);

  const mainLayers: [Json, Place][] = [
    [backdrop, full],
    [display, { x: 0, y: 0, w: W - SIDE, h: H }],
    [webcam, { x: W - SIDE, y: 0, w: SIDE, h: 270 }],
    [hud, { x: W - SIDE, y: 270, w: SIDE, h: H - 270 }],
  ];
  const focusLayers: [Json, Place][] = [
    [backdrop, full],
    [display, { x: 0, y: 0, w: W, h: H - 120 }],
    [hudBar, { x: 0, y: H - 120, w: W, h: 120 }],
  ];

  const scenes = [
    scene("Starting Soon", [[backdrop, full], [starting, full]]),
    scene("Main", mainLayers),
    scene("Focus", focusLayers),
    scene("Break", [[backdrop, full], [labBreak, full]]),
    scene("Ending", [[backdrop, full], [ending, full]]),
  ];

  const sources = [
    ...scenes,
    backdrop,
    display,
    webcam,
    hud,
    hudBar,
    starting,
    labBreak,
    ending,
  ];

  return {
    name: options.name ?? BRAND.collectionName,
    DesktopAudioDevice1: audio("wasapi_output_capture", "Desktop Audio", 0.6, "libobs"),
    AuxAudioDevice1: audio("wasapi_input_capture", "Mic/Aux", 1.0, "libobs", {
      filters: micFilters(),
    }),
    current_scene: "Starting Soon",
    current_program_scene: "Starting Soon",
    scene_order: scenes.map((s) => ({ name: s.name as string })),
    sources,
    groups: [],
    quick_transitions: [],
    transitions: [],
    saved_projectors: [],
    current_transition: "Fade",
    transition_duration: 300,
    preview_locked: false,
    scaling_enabled: false,
    scaling_level: -8,
    scaling_off_x: 0.0,
    scaling_off_y: 0.0,
    modules: {},
    version: 2,
  };
}
