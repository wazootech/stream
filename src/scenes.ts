import { join } from "node:path"
import { pathToFileURL } from "node:url"
import { BRAND } from "./brand.ts"
import { audio, micFilters, musicSource } from "./audio.ts"
import { gameSource } from "./game.ts"
import { layouts, SIDE } from "./layouts.ts"
import { abgr, scene, source } from "./obs.ts"
import type { Json, Place } from "./obs.ts"

/** Canvas the layouts are designed for. YouTube wants 16:9. */
export const CANVAS = { width: 1920, height: 1080 } as const

export interface SceneCollection extends Json {
  name: string
  sources: Json[]
  scene_order: { name: string }[]
}

export interface SceneOptions {
  /** Absolute path to this repo's `overlays/` directory. */
  overlaysDir: string
  name?: string
}

export function buildSceneCollection(options: SceneOptions): SceneCollection {
  const { width: W, height: H } = CANVAS
  const page = (file: string, query = "") =>
    pathToFileURL(join(options.overlaysDir, file)).href + query
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
    })

  const full: Place = { x: 0, y: 0, w: W, h: H }

  const backdrop = source("color_source_v3", "Backdrop", {
    color: abgr(...BRAND.backdropRgb),
    width: W,
    height: H,
  })
  const display = source("monitor_capture", "Display", {
    monitor: 0,
    method: 0,
    capture_cursor: true,
  })
  const webcam = source("dshow_input", "Webcam", {})
  const game = gameSource()
  const hud = browser("HUD", page("hud.html", "?layout=strip"), W - SIDE, 270)
  const chat = browser("Chat", page("chat.html"), SIDE, H - 270)
  const chatSmall = browser("Chat Small", page("chat.html"), SIDE, H - 570)
  const hudBar = browser("HUD Bar", page("hud.html", "?layout=compact"), W, 120)
  const starting = browser(
    "Screen: Starting",
    page("screen.html", "?mode=starting"),
    W,
    H,
  )
  const onBreak = browser("Screen: Break", page("screen.html", "?mode=break"), W, H)
  // Subscriber, member, and Super Chat alerts. Transparent, so it sits on top
  // of every scene and only draws while an alert is playing.
  const alerts = browser("Alerts", page("alerts.html"), W, H)
  // Background music for the waiting and break scenes only. It sits under the
  // opaque backdrop, because audio files with cover art also draw a picture.
  const music = musicSource()

  const parts = {
    backdrop,
    display,
    webcam,
    game,
    hud,
    chat,
    chatSmall,
    hudBar,
    starting,
    onBreak,
    music,
  }
  const layers = layouts(parts, W, H)
  const scenes = Object.entries(layers).map(([name, stack]) =>
    scene(name, [...stack, [alerts, full]]),
  )

  const sources = [
    ...scenes,
    backdrop,
    display,
    webcam,
    game,
    hud,
    chat,
    chatSmall,
    hudBar,
    starting,
    onBreak,
    alerts,
    music,
  ]

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
  }
}
