/**
 * @public
 */
var eventList = {
  //
  CAMERA_MOVED: "camera_moved",

  //
  SPACE_CREATED: "space_init",

  SPACE_DISPOSED: "space_disposed",

  //
  BEFORE_RENDER: "before_render",

  UPDATE: "update",

  DAWN_UPDATE: "dawn_update",

  PRE_UPDATE: "pre_update",

  PHYSICS_UPDATE: "physics_update",

  JUST_AFTER_PHYSICS_UPDATE: "just_after_physics_update",

  AFTER_PHYSICS_UPDATE: "after_physics_update",

  POST_UPDATE: "post_update",

  DUSK_UPDATE: "dusk_update",

  FIXED_UPDATE: "fixed_update",

  AFTER_FIXED_UPDATE: "after_fixed_update",

  FIXED_INTERPOLATE: "fixed_interpolate",

  PAUSE: "pause",

  PLAY: "play",

  RESIZE: "resize",

  PRE_RENDER: "pre_render",

  MIRROR: "mirror",

  OCCLUSION: "occlusion",

  LIGHTING: "lighting",

  KEY_DOWN: "keydown",

  KEY_UP: "keyup",

  MOUSE_DOWN: "mousedown",

  MOUSE_MOVE: "mousemove",

  MOUSE_UP: "mouseup",

  MOUSE_LEAVE: "mouseleave",

  CLICK: "click",

  CHILD_ADDED: "child_added",

  CHILD_REMOVED: "child_removed",

  DBL_CLICK: "dblclick",

  WHEEL: "wheel",

  JOYSTICK: "joystick",

  PINCH_ZOOM: "pinch_zoom",

  PINCH_START: "pinch_start",

  PINCH_END: "pinch_end",

  //

  COMPONENT_ADDED: "component_added",

  COMPONENT_REMOVED: "component_removed",

  //
  COMPONENT_FACTORY_INIt: "component_factory_init",

  COMPONENT_FACTORY_ADDED: "component_factory_added",

  COMPONENT_FACTORY_REMOVED: "component_factory_removed",

  //

  GAME_INIT: "GAME_INIT",

  GAME_SPACE_LOADED: "GAME_SPACE_LOADED",

  GAME_READY: "GAME_READY",

  GAME_START: "GAME_START",

  GAME_DAWN_UPDATE: "GAME_DAWN_UPDATE",

  GAME_UPDATE: "GAME_UPDATE",

  GAME_FRAME: "GAME_FRAME",

  GAME_FIXED_UPDATE: "GAME_FIXED_UPDATE",

  GAME_AFTER_FIXED_UPDATE: "GAME_AFTER_FIXED_UPDATE",

  GAME_FIXED_INTERPOLATE: "GAME_FIXED_INTERPOLATE",

  GAME_DISPOSE: "GAME_DISPOSE",

  GAME_END: "GAME_END",

  GAME_PAUSE: "GAME_PAUSE",

  GAME_RESUME: "GAME_RESUME",

  GAME_POST_READY: "GAME_POST_READY",

  //

  GAME_NOTIFY_PAUSE: "GAME_NOTIFY_PAUSE",

  GAME_NOTIFY_RESUME: "GAME_NOTIFY_RESUME",

  //
  RPC_REQUEST: "RPC_REQUEST",
};

export default eventList;
