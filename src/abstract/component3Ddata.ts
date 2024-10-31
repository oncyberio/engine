import { PhysicsData } from "engine/space/mixins/physics/physicsdata";

export type { PhysicsData } from "engine/space/mixins/physics/physicsdata";

/**
 * @public
 *
 * Attach an identifier or a tag to a component, so that it can be easily accessed in
 * the {@link ComponentManager.byId} or {@link ComponentManager.byTag} methods
 */
export interface ScriptData {
  /**
   * Identifier for the script, can be used to access the script in the {@link ComponentManager.byId} method
   */
  identifier?: string;

  /**
   * Tag for the script, can be used to access the script in the {@link ComponentManager.byTag} method
   */
  tag?: string;

  /**
   * @internal
   */
  _isPlayer?: boolean;
}

/**
 * @public
 *
 * Base class for all components data interfaces. It contains the common properties for all components
 */
export interface Component3DData {
  /**
   * @internal
   */
  kit?: "cyber";

  /**
   * @internal
   */
  kind?: "builtin" | "script";

  /**
   * if not provided, an auto id will be generated
   */
  id?: string;

  /**
   * id of the parent component
   */
  parentId?: string;

  /**
   * @internal
   */
  prefabId?: string;

  /**
   * List of children components
   */
  children?: Record<string, Component3DData>;

  /**
   * name for the component. Defaults to ""
   */
  name?: string;

  /**
   * Type of the component (model, video, platform, kitbash, etc)
   */
  type: unknown;

  /**
   * Attach an identifier or a tag to a component, so that can be easily accessed in the {@link ComponentManager}
   */
  script?: ScriptData;

  /**
   * Physics paramaters for the component (rigidbody type, collider type, etc)
   */
  collider?: PhysicsData;

  /**
   * @internal
   */
  lock?: any;

  _batchId?: string;

  /**
   * @internal
   */
  _index?: number;

  /**
   * @internal
   */
  _hidden?: boolean;

  /**
   * @internal
   */
  _netBase?: string;

  /**
   * @internal
   */
  _netId?: string;
}

export interface RpcData {
  base: string;
  id: string;
}
