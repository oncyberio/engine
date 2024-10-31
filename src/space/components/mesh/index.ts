import { DefaultComponentFactory } from "engine/abstract/defaultcomponentfactory";
import { MeshComponent } from "./meshcomponent";

export class MeshComponentFactory extends DefaultComponentFactory<MeshComponent> {
  //
  Type = MeshComponent;

  static info = {
    type: "mesh",
    title: "Mesh",
    image:
      "https://res.cloudinary.com/ugc-oo-oo/image/upload/v1722271320/290724-mesh.jpg",
    help: {
      desc: "A utility primitive shape mesh",
    },
    description: "A utility primitive shape mesh",
    tipNeeded: true,
    draggable: true,
    transform: true,
  };

  static {
    //
    const defaultData = {
      kit: "cyber",
      name: "",
      comment: "",
      type: "mesh",
      renderMode: "default",
      geometry: {
        type: "box",
        boxParams: {},
        sphereParams: {
          radius: 1,
          widthSegments: 32,
          heightSegments: 32,
        },
        cylinderParams: {
          radiusTop: 1,
          radiusBottom: 1,
          height: 1,
          radialSegments: 32,
          heightSegments: 1,
          openEnded: false,
        },
      },
      color: "#ff0000",
      opacity: 1,
      scale: { x: 1, y: 1, z: 1 },
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      display: true,
      displayInEditor: true,
    };

    this.createDataWrapper({
      defaultData,
    });
  }

  static getTitle(data: any) {
    return data.name || data.geometry?.type;
  }
}
