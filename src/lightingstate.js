import Emitter from "engine/events/emitter";

import Events from "engine/events/events";

export var CURRENT_LIGHTING_STATE = null;

export function SET_LIGHTING_STATE(STATE) {
  if (STATE != CURRENT_LIGHTING_STATE) {
    CURRENT_LIGHTING_STATE = STATE;
    Emitter.emit(Events.LIGHTING, CURRENT_LIGHTING_STATE);
  }
}
