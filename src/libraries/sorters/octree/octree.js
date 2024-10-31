import {
    Vector3,
    Box3,
    Color,
    Box3Helper,
    Object3D,
    Sphere,
    Mesh,
    BoxGeometry,
    MeshBasicMaterial,
    LineBasicMaterial,
    BufferGeometry,
    BufferAttribute,
    Float32BufferAttribute,
} from "three";

import InstancedGeometry from "engine/abstract/instancedgeometry";

import InstancedBasic from "engine/materials/instancedbasic";

import InstancedBasicLines from "engine/materials/instancedlinebasic";

import Scene from "engine/scene";
import InstancedPipelineMesh from "engine/abstract/instancedpipelinemesh";

import InstancedPipelineBasicLine from "engine/abstract/instancedpipelinebasicline";

const colors = [
    new Color(0xffffff), // red for depth 0
    new Color(0xffffff), // green for depth 1
    new Color(0x0052ff), // blue for depth 2
    new Color(0x437438), // yellow for depth 3
    new Color(0xffff00),
    new Color(0xffffff),
];

let lastVertices = null;

let tempVec3 = new Vector3();
let tempVec3bis = new Vector3();

let boxDebugMaterial = null;
let debugLineMaterial = null;

let idn = -1;

class OctreeNode {
    constructor(boundary, depth = 0, parent = null) {
        this.boundary = boundary;
        this.children = [];
        this.objects = [];
        this.depth = depth;
        this.currentFrustum = null;
        this.parent = parent;

        this.id = idn++;
    }

    split() {
        let minX = this.boundary.min.x;
        let minY = this.boundary.min.y;
        let minZ = this.boundary.min.z;

        let maxX = this.boundary.max.x;
        let maxY = this.boundary.max.y;
        let maxZ = this.boundary.max.z;

        let midX = (minX + maxX) / 2;
        let midY = (minY + maxY) / 2;
        let midZ = (minZ + maxZ) / 2;

        let newDepth = this.depth + 1;

        this.children.push(
            new OctreeNode(
                new Box3(
                    new Vector3(minX, minY, minZ),
                    new Vector3(midX, midY, midZ)
                ),
                newDepth,
                this
            ),
            new OctreeNode(
                new Box3(
                    new Vector3(midX, minY, minZ),
                    new Vector3(maxX, midY, midZ)
                ),
                newDepth,
                this
            ),
            new OctreeNode(
                new Box3(
                    new Vector3(minX, midY, minZ),
                    new Vector3(midX, maxY, midZ)
                ),
                newDepth,
                this
            ),
            new OctreeNode(
                new Box3(
                    new Vector3(midX, midY, minZ),
                    new Vector3(maxX, maxY, midZ)
                ),
                newDepth,
                this
            ),
            new OctreeNode(
                new Box3(
                    new Vector3(minX, minY, midZ),
                    new Vector3(midX, midY, maxZ)
                ),
                newDepth,
                this
            ),
            new OctreeNode(
                new Box3(
                    new Vector3(midX, minY, midZ),
                    new Vector3(maxX, midY, maxZ)
                ),
                newDepth,
                this
            ),
            new OctreeNode(
                new Box3(
                    new Vector3(minX, midY, midZ),
                    new Vector3(midX, maxY, maxZ)
                ),
                newDepth,
                this
            ),
            new OctreeNode(
                new Box3(
                    new Vector3(midX, midY, midZ),
                    new Vector3(maxX, maxY, maxZ)
                ),
                newDepth,
                this
            )
        );
    }
}

export default class Octree {
    constructor(resolution, capacity = 30, maxDepth = 5) {
        const halfResolution = resolution * 0.5;
        const min = new Vector3(
            -halfResolution,
            -halfResolution,
            -halfResolution
        );
        const max = new Vector3(halfResolution, halfResolution, halfResolution);
        this.root = new OctreeNode(new Box3(min, max));
        this.root.isRoot = true;
        this.capacity = capacity;
        this.maxDepth = maxDepth;
    }

    insert(box, data) {
        data._id = idn++;

        let object = { box: box, data: data };

        if (!this.root.boundary.intersectsBox(box)) {
            while (!this.root.boundary.containsBox(box)) {
                this.expand();
            }
        }

        this._insertRecursive(this.root, object);
    }

    _insertRecursive(node, object) {
        if (node.children.length > 0) {
            for (let child of node.children) {
                if (child.boundary.intersectsBox(object.box)) {
                    this._insertRecursive(child, object);
                    return;
                }
            }
        }

        node.objects.push(object);

        if (
            node.objects.length >= this.capacity &&
            node.depth < this.maxDepth
        ) {
            node.split();
            let objects = [...node.objects];
            node.objects = [];

            for (let obj of objects) {
                this._insertRecursive(node, obj);
            }
        }
    }

    getBoxVertices(box) {
        let min = box.min;
        let max = box.max;

        if (lastVertices == null) {
            lastVertices = [
                new Vector3(min.x, min.y, min.z),
                new Vector3(min.x, min.y, max.z),
                new Vector3(min.x, max.y, min.z),
                new Vector3(min.x, max.y, max.z),
                new Vector3(max.x, min.y, min.z),
                new Vector3(max.x, min.y, max.z),
                new Vector3(max.x, max.y, min.z),
                new Vector3(max.x, max.y, max.z),
            ];
        } else {
            lastVertices[0].set(min.x, min.y, min.z);
            lastVertices[1].set(min.x, min.y, max.z);
            lastVertices[2].set(min.x, max.y, min.z);
            lastVertices[3].set(min.x, max.y, max.z);
            lastVertices[4].set(max.x, min.y, min.z);
            lastVertices[5].set(max.x, min.y, max.z);
            lastVertices[6].set(max.x, max.y, min.z);
            lastVertices[7].set(max.x, max.y, max.z);
        }

        return lastVertices;
    }

    query(
        frustum,
        opts = {
            tolerance: 0.05,
            distance: false,
            position: null,
            transparent: false,
        }
    ) {
        this.nbQuery = 0;

        this.queryOpts = opts;

        if (this.currentQueryResults) {
            this.currentQueryResults.same = false;
        }

        if (
            this.currentFrustum != null &&
            this.areFrustumsAlmostTheSame(
                this.currentFrustum,
                frustum,
                this.queryOpts.tolerance
            )
        ) {
            this.currentQueryResults.same = true;

            return this.currentQueryResults;
        }

        if (frustum.containsBox == null) {
            // Assuming you extend the THREE.Frustum class or add this as a utility function
            frustum.containsBox = (box) => {
                this.nbQuery++;
                const planes = frustum.planes;

                const vertices = this.getBoxVertices(box);

                for (let i = 0; i < 6; i++) {
                    const plane = planes[i];
                    let outsideCount = 0;

                    // Check each vertex of the box against the plane
                    for (let vertex of vertices) {
                        if (plane.distanceToPoint(vertex) < 0) {
                            outsideCount++;
                            return false; // We exit early as just one vertex outside is enough
                        }
                    }
                }

                return true;
            };
        }

        if (this.currentFrustum == null) {
            this.currentFrustum = frustum.clone();
        } else {
            this.currentFrustum.copy(frustum);
        }

        this.currentQueryResults = this._queryRecursive(this.root, frustum);

        if (
            this.queryOpts.distance == true &&
            this.queryOpts.transparent == false
        ) {
            this.currentQueryResults.boxes.sort(
                (a, b) => a.distance - b.distance
            );
        }

        return this.currentQueryResults;
    }

    _queryRecursive(node, frustum, depth = 0) {
        let dataResults = [];
        let boxResults = [];

        if (node.children.length > 2 && frustum.containsBox(node.boundary)) {
            const collected = this._collectAllData(node);
            dataResults.push(...collected.results);
            boxResults.push(...collected.boxes);
        } else {
            this.nbQuery++;
            const res = frustum.intersectsBox(node.boundary);

            if (res) {
                // if current node intersects and has objects, add its boundary
                if (node.objects.length > 0) {
                    if (this.queryOpts.distance == true) {
                        node.boundary.getCenter(tempVec3);
                        node.distance = this.getDistance(
                            node.boundary,
                            this.queryOpts.position
                        );
                    }
                    boxResults.push(node);
                }

                for (let object of node.objects) {
                    dataResults.push(object.data);
                }

                for (let child of node.children) {
                    const childQueryData = this._queryRecursive(
                        child,
                        frustum,
                        depth + 1
                    );
                    dataResults.push(...childQueryData.results);
                    boxResults.push(...childQueryData.boxes);
                }
            }
        }

        return {
            results: dataResults,
            boxes: boxResults,
        };
    }

    _collectAllData(node) {
        let dataResults = [];
        let boxResults = [];

        for (let object of node.objects) {
            dataResults.push(object.data);
        }

        if (node.objects.length > 0) {
            if (this.queryOpts.distance == true) {
                node.distance = this.getDistance(
                    node.boundary,
                    this.queryOpts.position
                );
            }
            boxResults.push(node);
        }

        for (let child of node.children) {
            const childCollectionData = this._collectAllData(child);
            dataResults.push(...childCollectionData.results);
            boxResults.push(...childCollectionData.boxes);
        }

        return {
            results: dataResults,
            boxes: boxResults,
        };
    }

    expand() {
        let biggerBoundary = new Box3(
            this.root.boundary.min.clone().multiplyScalar(2),
            this.root.boundary.max.clone().multiplyScalar(2)
        );

        let oldRoot = this.root;
        oldRoot.isRoot = false;

        this.root = new OctreeNode(biggerBoundary);
        this.root.isRoot = true;
        this.root.children.push(oldRoot);

        oldRoot.parent = this.root;

        this.updateDepths(this.root);
    }

    getDistance(box, position) {
        if (box.sphere == null) {
            let boundingSphere = new Sphere();

            box.getBoundingSphere(boundingSphere);

            box.sphere = boundingSphere;
        }

        let distanceToCenter = box.sphere.center.distanceTo(position);

        // 3. Get the distance from the surface of the bounding sphere to the point.
        let distanceToSurface = Math.max(
            0,
            distanceToCenter - box.sphere.radius
        );

        return distanceToSurface;
    }

    updateDepths(node, parentDepth = -1) {
        node.depth = parentDepth + 1;

        for (let child of node.children) {
            this.updateDepths(child, node.depth);
        }
    }

    shrink() {
        this._shrinkRecursive(this.root);
        // Additionally check if root can be shrunk further based on previous logic
        while (
            this.root.children.length === 1 &&
            this.root.objects.length === 0
        ) {
            const singleChildWithData = this.root.children[0];
            if (singleChildWithData) {
                this.root = singleChildWithData;
            } else {
                break;
            }
        }
    }

    _shrinkRecursive(node) {
        // Remove child nodes that don't have any objects and don't have child nodes
        node.children = node.children.filter((child) => {
            this._shrinkRecursive(child); // first prune child nodes
            return child.objects.length > 0 || child.children.length > 0;
        });
        return node.children.length > 0 || node.objects.length > 0;
    }

    getBoxesWithObjects() {
        return this._getBoxesWithObjectsRecursive(this.root);
    }

    _getBoxesWithObjectsRecursive(node) {
        let boxes = [];

        for (let child of node.children) {
            boxes.push(...this._getBoxesWithObjectsRecursive(child));
        }

        if (node.objects.length > 0) {
            boxes.push(node);
        }

        return boxes;
    }

    buildVisualRepresentation() {
        if (this.helper) {
            Scene.remove(this.helper);

            this.helper = null;
        }

        this.helper = new Object3D();

        Scene.add(this.helper);

        // cubes
        const g = new BoxGeometry(1, 1, 1);
        g.computeBoundingSphere();
        g.computeBoundingBox();
        this.instancedBasicMaterial = new InstancedBasic({
            color: 0xffffff,
            wireframe: false,
            transparent: true,
            opacity: 0.1,
            side: 0,
            depthTest: false,
            depthWrite: false,
        });

        this.instancedBasicLineMaterial = new InstancedBasicLines({
            color: 0x000000,
            transparent: true,
            opacity: 0.8,
            depthTest: true,
            depthWrite: false,
        });

        this.helperMesh = new InstancedPipelineMesh(
            new InstancedGeometry(new BoxGeometry(1, 1, 1), {
                scale: true,

                transparencySorting: true,

                rotation: true,

                boundingSphere: g.boundingSphere,

                name: "debug_boxes",
            }),
            this.instancedBasicMaterial,
            {
                visibleOnOcclusion: false,

                type: "DEBUG_BOXES",
            }
        );

        this.helper.add(this.helperMesh);

        const baseForLinesGeometry = new BufferGeometry();

        const indices = new Uint16Array([
            0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3,
            7,
        ]);

        const positions = [
            0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5,
            0.5, -0.5, -0.5, 0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, -0.5,
        ];

        baseForLinesGeometry.setIndex(new BufferAttribute(indices, 1));

        baseForLinesGeometry.setAttribute(
            "position",
            new Float32BufferAttribute(positions, 3)
        );

        this.helperLines = new InstancedPipelineBasicLine(
            new InstancedGeometry(baseForLinesGeometry, {
                scale: true,

                transparencySorting: true,

                rotation: true,

                boundingSphere: g.boundingSphere,

                name: "debug_boxes_lines",

                copyBuffer: this.helperMesh.geometry,
            }),
            this.instancedBasicLineMaterial,
            {
                visibleOnOcclusion: false,

                type: "DEBUG_BOXES_LINES",
            }
        );

        this.helper.add(this.helperLines);

        this.helperMesh.renderOrder = 10000;

        this.helperLines.renderOrder = 10000;

        globalThis.mmm = this.helperMesh;

        this._buildVisualRecursive(this.root);

        this.helper.setOpacity = (opacity) => {
            if (this.instancedBasicMaterial != null) {
                if (this.instancedBasicMaterial.originalOpacity == null) {
                    this.instancedBasicMaterial.originalOpacity =
                        this.instancedBasicMaterial.opacity;
                }

                this.instancedBasicMaterial.opacity =
                    this.instancedBasicMaterial.originalOpacity * opacity;
            }

            if (this.instancedBasicLineMaterial != null) {
                if (this.instancedBasicLineMaterial.originalOpacity == null) {
                    this.instancedBasicLineMaterial.originalOpacity =
                        this.instancedBasicLineMaterial.opacity;
                }

                this.instancedBasicLineMaterial.opacity =
                    this.instancedBasicLineMaterial.originalOpacity * opacity;
            }

            if (opacity == 0) {
                this.helperMesh.visible = false;

                this.helperLines.visible = false;

                this.helper.visible = false;
            } else {
                this.helperLines.visible = true;

                this.helperMesh.visible = true;

                this.helper.visible = true;
            }
        };

        return this.helper;
    }

    _buildVisualRecursive(node, depth = 0) {
        if (node.objects.length > 0 && depth > 0) {
            const color = colors[depth] || new Color(0x000000); // default to black if depth exceeds colors array

            node.boundary.getSize(tempVec3);

            node.boundary.getCenter(tempVec3bis);

            this.helperMesh.add({
                position: tempVec3bis,
                scale: tempVec3,
            });

            this.helperLines.add({
                position: tempVec3bis,
                scale: tempVec3,
            });
        }

        for (let child of node.children) {
            this._buildVisualRecursive(child, depth + 1);
        }
    }

    areVectorsAlmostTheSame(vec1, vec2, tolerance) {
        const diffX = vec1.x - vec2.x;
        const diffY = vec1.y - vec2.y;
        const diffZ = vec1.z - vec2.z;
        const diffSquaredLength = diffX * diffX + diffY * diffY + diffZ * diffZ;
        return diffSquaredLength <= tolerance * tolerance;
    }

    areScalarsAlmostTheSame(scalar1, scalar2, tolerance) {
        return Math.abs(scalar1 - scalar2) <= tolerance;
    }

    areFrustumsAlmostTheSame(frustum1, frustum2, tolerance = 0.01) {
        for (let i = 0; i < 6; i++) {
            const plane1 = frustum1.planes[i];
            const plane2 = frustum2.planes[i];

            if (
                !this.areVectorsAlmostTheSame(
                    plane1.normal,
                    plane2.normal,
                    tolerance
                ) ||
                !this.areScalarsAlmostTheSame(
                    plane1.constant,
                    plane2.constant,
                    tolerance
                )
            ) {
                return false;
            }
        }
        return true;
    }

    dispose() {
        if (this.helper) {
            Scene.remove(this.helper);
        }
    }

    validateChildInParentRecursively() {
        return this._validateChildInParentRecursively(this.root);
    }

    _validateChildInParentRecursively(root) {
        if (root.children.length === 0) {
            return true;
        }

        for (let child of root.children) {
            if (!root.boundary.containsBox(child.boundary)) {
                console.error("Child is not contained within parent!", {
                    parent: root,
                    child,
                });
                return false;
            }

            // Recursive check for the child's children
            if (!this._validateChildInParentRecursively(child)) {
                return false;
            }
        }

        return true;
    }

    validateContainment() {
        let invalidObjects = [];

        this._validateContainmentRecursive(this.root, invalidObjects);
        return invalidObjects;
    }

    _validateContainmentRecursive(node, invalidObjects) {
        for (let object of node.objects) {
            if (!node.boundary.containsBox(object.box)) {
                object.invalid = true;
                invalidObjects.push(object);
            }
        }

        for (let child of node.children) {
            this._validateContainmentRecursive(child, invalidObjects);
        }
    }

    expandOrShrinkRootAndAllDescendants() {
        this.expandOrShrinkNodeToContainAllDescendants(this.root);
    }

    expandOrShrinkNodeToContainAllDescendants(node) {
        if (!node) {
            return new Box3(); // Return an empty bounding box.
        }

        // This function expands the box to include the provided object's bounding box.
        // const expandBoxWithObject = (box, object) => {
        //     box.union(object.box);
        // };

        // This function recursively calculates the combined bounding box for the node and all its descendants.
        const getTightestBoundingBox = (node) => {
            // debugger;

            let tightBox = new Box3();

            // Initially set to node's box only if there are no children and objects.
            if (node.children.length === 0 && node.objects.length === 0) {
                tightBox.copy(node.boundary);
            }

            for (let object of node.objects) {
                // expandBoxWithObject(tightBox, object);
                tightBox.union(object.box);
            }

            for (let child of node.children) {
                let childBox = getTightestBoundingBox(child);
                tightBox.union(childBox);
            }

            return tightBox;
        };

        const newBoundary = getTightestBoundingBox(node);
        node.boundary.copy(newBoundary);

        if (newBoundary.min.x == null) {
            debugger;
        }

        for (let child of node.children) {
            this.expandOrShrinkNodeToContainAllDescendants(child);
        }
    }
}
