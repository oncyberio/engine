// From: https://gist.github.com/605541#file_js_web_worker_pool.js
// Web Worker Pool
// size is the max number of arguments
import { DEBUG_WEBWORK, WEBWORK_DELAY } from "engine/constants";

import Emitter from "engine/events/emitter";

import Events from "engine/events/events";

export default class WorkerPool {
  constructor(source, size = 12, debug = false, opts = null) {
    this.jobs = [];

    this.source = source;

    this.opts = opts;

    this.size = size;

    this.jobID = 0;

    this.activeJobs = 0;

    this.pool = [];

    this.availableResolves = [];

    this.workerLength = 0;

    // let i = 0;

    // while (i < this.size) {

    //     const worker = this.createWorker(opts);

    //     i++;
    // }

    this.debug = false;

    if (debug) {
      setTimeout(() => {
        this.addDebug();
      }, 2000);
    }
  }

  createWorker() {
    const worker = new this.source();

    if (
      this.opts != null &&
      (this.opts.wasmBinary != null || this.opts.animation != null)
    ) {
      worker.postMessage({
        init: true,

        animation: this.opts.animation,

        wasmBinary: this.opts.wasmBinary,

        fps: this.opts.fps,
      });
    }

    worker.busy = false;

    worker.activated = 0;

    this.pool.push(worker);

    return worker;
  }

  addDebug() {
    var lineCSS =
      "font-family:Helvetica,Arial,sans-serif;font-size:9px;font-weight:bold;line-height:15px";

    var container = document.createElement("div");

    container.style.cssText = `
            width: 300px;
            opacity: 0.9;
            cursor: pointer;
            position: absolute;
            right: 0px;
            bottom: 0px;
            z-index: 1000;
            background: black;
            color: wheat;
            overflow: scroll;
            transform: scale(0.75, 0.75);
            transform-origin: 0% 100%;
        `;
    container.style.position = "absolute";

    container.style.left = "0px";

    container.style.bottom = "0px";

    container.style.zIndex = "1000";

    this.domElement = container;

    document.body.appendChild(this.domElement);

    this.postUpdate = this.updatedebug.bind(this);

    Emitter.on(Events.POST_UPDATE, this.postUpdate);
  }

  // url: the url of the worker script
  // msg: the initial message to pass to the worker
  // cb : the callback to recieve messages from postMessage.
  //      return true from cb to dismiss the worker and advance the queue.
  // ctx: the context for cb.apply
  async queueJob(url, msg, cb, ctx, abort, transferrable) {
    var job = {
      msg: msg,
      cb: cb,
      ctx: ctx,
      end: false,
      id: this.jobID++,
      abortcontroller: abort,
    };

    if (job.abortcontroller != null) {
      job.abortFunc = () => {
        if (job.abortcontroller != null) {
          job.abortcontroller.removeEventListener("abort", job.abortFunc);

          job.abortFuncEvent = null;
        }

        job.end = true;

        job.cancelled = true;

        if (job.worker != null) {
          if (job == job.worker.job) {
            worker.postMessage({ abort: true });

            this.triggerNext(job.worker);
          }
        } else {
          job.cb.call(job.ctx, {
            data: { error: true, cancel: true },
          });
        }
      };

      // this.activeAbort[job.datUrl] = true

      job.abortcontroller.addEventListener("abort", job.abortFunc);
    }

    this.activeJobs++;

    this.jobs.push(job);

    // console.log(this.activeJobs)

    var worker = await this.waitForAnAvailableWorker();

    if (job.end == true) {
      this.activeJobs--;

      worker.busy = false;

      // console.log(this.activeJobs)

      this.triggerNext(worker);

      return;
    }

    this.nextJob(job, worker, transferrable);
  }

  nextJob(job, worker, transferrable) {
    var that = this;

    (async function () {
      worker.activated++;

      worker.datUrl = job.msg.url;

      var func = function (e) {
        // worker.jobDone = true

        job.done = true;

        if (job.cb) {
          job.cb.call(job.ctx, e);

          that.triggerNext(worker);
        }
      };

      worker.job = job;

      job.worker = worker;

      worker.func = func;

      // worker.jobDone = false

      // worker.cb = job.cb

      worker.addEventListener("message", func, false);

      worker.postMessage(job.msg, transferrable);
    })();
  }

  triggerNext(worker) {
    // console.log( this.activeAbort )

    if (worker.func) {
      worker.removeEventListener("message", worker.func);
    }

    // worker.jobDone = true

    setTimeout(
      () => {
        if (worker.job) {
          this.activeJobs--;

          worker.job.cb = null;

          worker.job.end = true;

          worker.job = null;
        }

        worker.datUrl = null;

        worker.busy = false;

        var resolve = this.availableResolves.shift();

        if (resolve) {
          resolve(worker);
        }
      },
      WEBWORK_DELAY ? WEBWORK_DELAY : 16
    );
  }

  async newlyAvailableWorker() {
    return new Promise((resolve) => {
      this.availableResolves.push(resolve);
    });
  }

  async waitForAnAvailableWorker() {
    return new Promise(async (resolve, reject) => {
      let i = 0;

      var available = null;

      while (i < this.pool.length) {
        const worker = this.pool[i];

        if (worker.busy == false) {
          available = worker;

          i = this.pool.length;
        }

        i++;
      }

      if (available != null) {
        available.busy = true;

        resolve(available);
      } else {
        if (this.pool.length < this.size) {
          available = this.createWorker();
        } else {
          available = await this.newlyAvailableWorker();
        }

        available.busy = true;

        resolve(available);
      }
    });
  }

  updatedebug() {
    let i = 0;

    let str = "";

    str += "jobs " + this.activeJobs + " </br>";

    if (WEBWORK_DELAY) {
      str += "delay " + WEBWORK_DELAY + " </br>";
    }

    while (i < this.pool.length) {
      const w = this.pool[i];

      str += i + " : busy " + w.busy + " </br>";

      str += "url : " + w.datUrl + " </br>";

      // const a = ( w.done == true || w.cancelled == true  )
      // console.log(i + ' : done ' + a  + ' '  )

      i++;
    }

    this.domElement.innerHTML = str;
  }
}
