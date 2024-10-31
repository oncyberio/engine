import {
  CANVAS,
  IS_DESKTOP,
  REAL_DPI,
  GPU_TIER,
  SUPPORT_OFFSCREEN_CANVAS_WEBGL,
  COMPRESSED_SUPPORT,
} from "engine/constants";

import Stats from "stats.js";

var THREEx = THREEx || {};

// globalThis.THREEx = THREEx;

import renderer from "engine/renderer";

import Emitter from "engine/events/emitter";

import { STATS } from "engine/constants";

class RenderStats {
  constructor() {
    if (STATS) {
      var container = document.createElement("div");
      container.className = "stats-gl";
      container.style.cssText = "width:150px;opacity:0.9;cursor:pointer";

      var msDiv = document.createElement("div");
      msDiv.style.cssText = "padding:0 0 3px 3px;text-align:left;";
      container.appendChild(msDiv);

      var msText = document.createElement("div");
      msText.style.cssText =
        "font-family:Helvetica,Arial,sans-serif;font-size:9px;font-weight:bold;line-height:15px";
      msText.innerHTML = "WebGLRenderer";
      msText.style.color = "rgb(255 255 255)";
      msText.style.backgroundColor = "rgb(0 0 0)";

      msDiv.appendChild(msText);

      var msTexts = [];
      var nLines = 16;
      for (var i = 0; i < nLines; i++) {
        msTexts[i] = document.createElement("div");
        msTexts[i].style.cssText =
          "font-family:Helvetica,Arial,sans-serif;font-size:9px;font-weight:bold;line-height:15px";
        msDiv.appendChild(msTexts[i]);
        msTexts[i].innerHTML = "-";
        msTexts[i].style.color = "rgb(255 255 255)";
        msTexts[i].style.backgroundColor = "#000000e0";
      }

      this.lastTime = Date.now();

      container.style.position = "fixed";

      container.style.left = "0px";

      container.style.bottom = "0px";

      container.style.zIndex = "1000000000000";

      this.domElement = container;

      this.msTexts = msTexts;

      this.added = false;

      this.fpsStats = new Stats();

      this.fpsStats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    }
  }

  export() {
    return {
      geometries: renderer.info.memory.geometries,
      textures: renderer.info.memory.textures,
      calls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      points: renderer.info.render.points,
    };
  }

  update() {
    if (this.added == false) {
      document.body.appendChild(this.domElement);

      this.added = true;

      document.body.appendChild(this.fpsStats.dom);
    }

    this.fpsStats.update();

    if (Date.now() - this.lastTime < 1000 / 30) return;
    this.lastTime = Date.now();

    var i = 0;

    this.msTexts[i++].textContent = "gputier " + GPU_TIER.tier;

    this.msTexts[i++].textContent =
      "Platform : " + (IS_DESKTOP ? "Desktop" : "Mobile");
    this.msTexts[i++].textContent = "REAL_DPI : " + REAL_DPI;

    this.msTexts[i++].textContent =
      "supp off webgl : " + SUPPORT_OFFSCREEN_CANVAS_WEBGL;

    this.msTexts[i++].textContent =
      "Programs: " + renderer.info.programs.length;
    this.msTexts[i++].textContent =
      "Geometries: " + renderer.info.memory.geometries;
    this.msTexts[i++].textContent =
      "Textures: " + renderer.info.memory.textures;
    this.msTexts[i++].textContent = "events: " + Emitter.getEventCount();

    this.msTexts[i++].textContent = "Calls: " + renderer.info.render.calls;
    this.msTexts[i++].textContent =
      "Triangle: " + renderer.info.render.triangles;
    this.msTexts[i++].textContent = "Points: " + renderer.info.render.points;

    this.msTexts[i++].textContent = "compressed support " + COMPRESSED_SUPPORT;
  }
}

export default new RenderStats();
