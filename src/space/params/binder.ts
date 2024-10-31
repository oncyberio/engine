import Emitter from "engine/events/emitter";
import Events from "engine/events/events";

import { Component3DEditor } from "../shared/uieditor";
import type { ParamsConfig } from "./parser";
import { IS_EDIT_MODE, IS_SERVER_MODE } from "engine/constants";
import { Engine } from "engine/index";
import { Component3D } from "engine/abstract/component3D";

export class ParamsBinder {
  //
  constructor(
    public host: Component3D,
    public instance: any,
    public config: ParamsConfig
  ) {
    //
    this.init();
  }

  traverseParams(
    fn: (opts: {
      key: string;
      path: string[];
      param: any;
      value: any;
    }) => boolean | void
  ) {
    //
    const instanceParams = this.config.params;

    if (instanceParams == null) return;

    const traverse = (opts, path, value) => {
      //
      if (opts.param.type === "group") {
        //
        const children = opts.param.children;

        for (let i = 0; i < children.length; i++) {
          //
          const child = children[i];

          const childDataKey = child.param.dataKey ?? child.key;

          const childPath = [...path, childDataKey];

          let stop = traverse(child, childPath, value[childDataKey]);

          if (stop) return true;
        }
      }

      return fn({
        key: opts.key,
        path,
        param: opts.param,
        value,
      });
    };

    for (let i = 0; i < instanceParams.length; i++) {
      //
      const opts = instanceParams[i];

      const dataKey = opts.param.dataKey ?? opts.key;

      const value = this.host.data[dataKey];

      let stop = traverse(opts, [opts.key], value);

      if (stop) break;
    }
  }

  init() {
    //
    const instanceParams = this.config.params;

    if (instanceParams == null) return;

    Object.keys(this.config.props).forEach((key) => {
      //
      const prop = this.config.props[key];

      const dataKey = prop.param.dataKey ?? key;

      const desc = prop.createDescriptor({
        host: this.host,
        key,
        path: [dataKey],
      });

      delete this.instance[key];

      if (desc != null) {
        //
        Object.defineProperty(this.instance, key, {
          ...desc,
          configurable: true,
        });
      }
    });

    const rpcMethods = Object.keys(this.config.rpcMethods);

    if (rpcMethods.length > 0) {
      //
      if (IS_SERVER_MODE) {
        this.instance.$$dispatchRpc = async (method, args) => {
          //
          if (
            !this.config.rpcMethods[method] ||
            typeof this.instance[method] !== "function"
          ) {
            throw new Error("Method not found");
          }

          return this.instance[method](...args);
        };
      } else {
        //
        rpcMethods.forEach((key) => {
          //
          this._setupRpcClient(key, this.config.rpcMethods[key]);
        });
      }
    }

    if (this.config.netState) {
      //
      if (IS_EDIT_MODE) {
        this.instance["netState"] = this.config.netState.getDefaultData();
      } else {
        const desc = this.config.netState.createDescriptor({
          host: this.host,
          key: "netState",
          path: ["netState"],
        });

        if (desc != null) {
          Object.defineProperty(this.instance, "netState", {
            ...desc,
            configurable: true,
          });
        }
      }
    }
  }

  private _setupRpcClient(method: string, opt: any = {}) {
    //
    this.instance[method] = (...args) => {
      //
      const hasReply = opt.reply ?? true;

      if (!hasReply) {
        //
        this._emitRpc(method, args, opt.timeout, null, null);

        return;
      }

      return new Promise((resolve, reject) => {
        //
        let timeout = opt.timeout ?? 5;

        let timeoutId = setTimeout(() => {
          reject(new Error("RPC timeout"));
        }, timeout * 1000);

        this._emitRpc(
          method,
          args,
          timeout,
          (result) => {
            //
            clearTimeout(timeoutId);
            resolve(result);
          },
          (err) => {
            //
            if (timeout) clearTimeout(timeoutId);
            reject(err);
          }
        );
      });
    };
  }

  private _emitRpc(
    method: string,
    args: any[],
    timeout: number,
    resolve,
    reject
  ) {
    //
    Emitter.emit(Events.RPC_REQUEST, {
      rpcId: "@@engine",
      data: {
        id: this.host._rpcId,
        method,
        args,
      },
      resolve,
      reject,
    });
  }

  createEditorClass() {
    //
    return class extends Component3DEditor {
      //
      gui = this.getParamsGui();

      getGUI() {
        return this.gui;
      }
    };
  }
}
