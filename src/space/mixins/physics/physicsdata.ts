import { ColliderType } from "engine/components/physics/types/collideropts";

import { RigidBodyType } from "engine/components/physics/types/rigidbodyopts";

/**
 * @public
 *
 * This interface describes the data schema used to attach collision data to a component.
 *
 * See {@link Component3DData.collider}
 */
export interface PhysicsData {
    /**
     * If this is false, no collider will be attached to the component
     */
    enabled?: boolean;

    /**
     * The type of rigidbody to attach to the component
     */
    rigidbodyType?: RigidBodyType;
    /**
     * The type of collider to attach to the component
     */
    colliderType?: ColliderType;
    /**
     * If this is true, the collider will be a sensor
     *
     * See {@link https://rapier.rs/docs/user_guides/javascript/colliders/#collider-type | Rapier Documentation} for more info
     */
    sensor?: boolean;

    /**
     * Properties for dynamic rigid bodies
     */
    dynamicProps?: DynamicProps;

    groups?: number;

    /**
     * @deprecated use translationLock instead
     */
    enabledTranslation?: [boolean, boolean, boolean];

    /**
     * @deprecated use rotationLock instead
     */
    enabledRotation?: [boolean, boolean, boolean];

    /**
     * Locks the translation of the rigid body along the x, y, and z axes
     */
    translationLock?: [boolean, boolean, boolean];

    /**
     * Locks the rotation of the rigid body along the x, y, and z axes
     */
    rotationLock?: [boolean, boolean, boolean];
}

/**
 * Data properties for a dynamic rigid body
 */
export interface DynamicProps {
    /**
     * The mass of the rigid body
     */
    mass?: number;

    /**
     * The friction of the rigid body
     */
    friction?: number;

    /**
     * The restitution of the rigid body
     */
    restitution?: number;

    /**
     * The density of the rigid body
     */
    density?: number;
}
