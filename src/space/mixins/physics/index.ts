import { Component3D, ComponentOpts } from "engine/abstract/component3D";
import { ComponentMixin } from "engine/abstract/componentmixin";
import PhysicsRapierWrapper from "engine/components/physics/rapier/wrapper";
import { PhysicsData } from "./physicsdata";
import { ColliderOpts, RigidBodyOpts } from "engine/components/physics/types";
import {
    COLLIDER_TYPES,
    RIGIDBODY_TYPES,
} from "engine/components/physics/constants";
import { Matrix4, Mesh, Vector3 } from "three";
import { ComponentFactoryOptions } from "engine/abstract/componentfactory";

export class ComponentPhysicsMixin implements ComponentMixin {
    //
    private physics: PhysicsRapierWrapper;

    constructor(public opts: ComponentFactoryOptions) {
        //
        this.physics = opts.space.physics;
    }

    private _getMeshBounds(component: Component3D, mesh: Mesh, scale: Vector3) {
        //
        if (mesh.geometry.boundingBox == null) {
            mesh.geometry.computeBoundingBox();
        }

        const box3 = mesh.geometry.boundingBox.clone();

        // console.log( mesh.matrix )

        mesh.updateMatrix();

        box3.applyMatrix4(mesh.matrix).applyMatrix4(
            new Matrix4().makeScale(scale.x, scale.y, scale.z)
        );

        const size = box3.getSize(new Vector3());

        const center = box3.getCenter(new Vector3());

        const radius = Math.max(size.x, size.z) * 0.5;

        return {
            width: size.x,
            height: size.y,
            depth: size.z,
            center,
            radius,
        };
    }

    private _getMeshBoundingSphere(
        component: Component3D,
        mesh: Mesh,
        scale: Vector3
    ) {
        //
        if (mesh.geometry.boundingSphere == null) {
            mesh.geometry.computeBoundingSphere();
        }

        let radius =
            mesh.geometry.boundingSphere.radius *
            Math.max(
                scale.x * mesh.scale.x,
                scale.y * mesh.scale.y,
                scale.z * mesh.scale.z
            );

        const center = mesh.geometry.boundingSphere.center.clone();

        center.add(mesh.position);

        return {
            center,
            radius,
        };
    }

    private toIndexedGeometry(vertices: Float32Array): {
        vertices: Float32Array;
        indices: Uint32Array;
    } {
        const uniqueVertices = [];
        const indices = [];
        const vertexMap = new Map();

        // Iterate through each vertex in the input array
        for (let i = 0; i < vertices.length; i += 3) {
            const vertexString = `${vertices[i]},${vertices[i + 1]},${
                vertices[i + 2]
            }`;

            // Check if we've already encountered this vertex
            if (vertexMap.has(vertexString)) {
                // If we have, use the existing index
                indices.push(vertexMap.get(vertexString));
            } else {
                // If not, add it to our list of unique vertices
                const index = uniqueVertices.length / 3;
                uniqueVertices.push(
                    vertices[i],
                    vertices[i + 1],
                    vertices[i + 2]
                );
                vertexMap.set(vertexString, index);
                indices.push(index);
            }
        }

        return {
            vertices: new Float32Array(uniqueVertices),
            indices: new Uint32Array(indices),
        };
    }

    private _getColliderOpts(
        component: Component3D,
        opts: Partial<ColliderOpts>,
        scale: Vector3,
        colliderMesh?: Mesh
    ): ColliderOpts {
        //
        const mesh = colliderMesh ?? component.getCollisionMesh();

        if (mesh == null) return null;

        let colliderOpts: ColliderOpts = { ...opts } as ColliderOpts;

        if (colliderOpts.type === COLLIDER_TYPES.SPHERE) {
            //
            const bounds = this._getMeshBoundingSphere(component, mesh, scale);

            colliderOpts.radius ??= bounds.radius;

            colliderOpts.position ??= { ...bounds.center };

            //
        } else if (colliderOpts.type === COLLIDER_TYPES.CUBE) {
            //
            const { width, height, depth, center } = this._getMeshBounds(
                component,
                mesh,
                scale
            );

            colliderOpts.width ??= width;
            colliderOpts.height ??= height;
            colliderOpts.depth ??= depth;

            colliderOpts.position ??= { ...center };

            //
        } else if (colliderOpts.type === COLLIDER_TYPES.CYLINDER) {
            //
            const { radius, height, center } = this._getMeshBounds(
                component,
                mesh,
                scale
            );

            colliderOpts.radius ??= radius;
            colliderOpts.height ??= height;
            colliderOpts.position ??= { ...center };

            //
        } else if (colliderOpts.type === COLLIDER_TYPES.CAPSULE) {
            //

            const { radius, height, center } = this._getMeshBounds(
                component,
                mesh,
                scale
            );

            colliderOpts.radius ??= radius;
            colliderOpts.height ??= height - radius * 2;
            colliderOpts.position ??= { ...center };

            //
        } else if (colliderOpts.type === COLLIDER_TYPES.MESH) {
            //
            const clone = mesh.geometry.clone();

            mesh.updateMatrix();

            clone.applyMatrix4(mesh.matrix);

            let vertices = clone.attributes.position.array as Float32Array;
            let indices = clone.index?.array as Uint32Array;

            if (indices == null) {
                //
                const res = this.toIndexedGeometry(vertices);
                vertices = res.vertices;
                indices = res.indices;
            }

            // apply scale
            for (let i = 0; i < vertices.length; i += 3) {
                vertices[i] *= scale.x;
                vertices[i + 1] *= scale.y;
                vertices[i + 2] *= scale.z;
            }

            colliderOpts.vertices = vertices;
            colliderOpts.indices = indices;
        }

        return colliderOpts;
    }

    private _SIMPLE_getColliderOpts(
        component: Component3D,
        opts: PhysicsData,
        scale: Vector3
    ): ColliderOpts[] {
        //
        opts = component._getCollisionInfo(opts);

        let colliderArray = Array.isArray(opts) ? opts : [opts];

        let res = [];

        colliderArray.forEach((opts) => {
            const _opts = {
                type: (
                    opts.colliderType ||
                    (opts as any).type ||
                    COLLIDER_TYPES.MESH
                ).toUpperCase() as any,
                isSensor: opts.sensor ?? false,
                restitution: opts.dynamicProps?.restitution,
                friction: opts.dynamicProps?.friction,
                groups: opts.groups,
                mass: opts.dynamicProps?.mass,
            };

            res.push(
                this._getColliderOpts(
                    component,
                    _opts,
                    scale,
                    opts.colliderMesh
                )
            );
        });

        return res;
    }

    /**
     * @internal
     */
    private _getRigidBodyOpts(
        component: Component3D,
        opts: PhysicsData
    ): RigidBodyOpts {
        //
        component.updateWorldMatrix(true, true);

        const position = component.positionWorld ?? component.position;

        const quaternion = component.quaternionWorld ?? component.quaternion;

        const scale = component.scaleWorld ?? component.scale;

        // For now we only support one collider per rigidbody
        const colliderOpts = this._SIMPLE_getColliderOpts(
            component,
            opts,
            scale
        );

        if (colliderOpts == null) debugger;

        const rigidbodyOpts: RigidBodyOpts = {
            type: (
                opts.rigidbodyType || RIGIDBODY_TYPES.FIXED
            ).toUpperCase() as any,
            position: { x: position.x, y: position.y, z: position.z },
            quaternion: {
                x: quaternion.x,
                y: quaternion.y,
                z: quaternion.z,
                w: quaternion.w,
            },
            translationLock: opts.translationLock ?? [false, false, false],
            rotationLock: opts.rotationLock ?? [false, false, false],
            colliders: colliderOpts,
        };

        return rigidbodyOpts;
    }

    async init(component: Component3D) {
        //
        const colliderOpts = component.data.collider;

        if (!colliderOpts?.enabled || component.getCollisionMesh() == null)
            return;

        const rigidBodyOpts = this._getRigidBodyOpts(component, colliderOpts);

        if (rigidBodyOpts == null) return;

        const body = this.physics.createRigidBody({
            component,
            rigitBodyOpts: rigidBodyOpts,
        });

        component.rigidBody = body;

        component.collider = body.colliders[0];
    }

    update() {}

    dispose(component: Component3D) {
        //
        if (component.rigidBody != null) {
            this.physics.removeRigidBody(component.rigidBody);
        }
    }
}
