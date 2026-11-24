import { randomUUID } from "node:crypto"

/** Matches the version stamp OBS 32 writes into saved sources. */
const PREV_VER = 537001986

export type Json = Record<string, unknown>

export interface Place {
  x: number
  y: number
  w: number
  h: number
}

/** OBS stores colors as little-endian ABGR integers. */
export const abgr = (r: number, g: number, b: number): number =>
  ((0xff << 24) | (b << 16) | (g << 8) | r) >>> 0

export function source(
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
  }
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
  }
}

export function scene(name: string, layers: [Json, Place][]): Json {
  const items = layers.map(([src, place], i) => item(i + 1, src, place))
  return source(
    "scene",
    name,
    {
      items,
      id_counter: items.length,
      custom_size: false,
    },
    { hotkeys: { "OBSBasic.SelectScene": [] } },
  )
}
