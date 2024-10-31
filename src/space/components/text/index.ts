import { DefaultComponentFactory } from "engine/abstract/defaultcomponentfactory";
import { TextComponent } from "./textcomponent";
import FontMeshFactory from "engine/components/font";

export class TextComponentFactory extends DefaultComponentFactory<TextComponent> {
  //
  Type = TextComponent;

  static info = {
    type: "text",
    title: "Text",
    image:
      "https://res.cloudinary.com/ugc-oo-oo/image/upload/v1722271320/290724-text.jpg",
    draggable: true,
    transform: true,
  };

  static getTitle(data: any) {
    return (
      data.name || data.text.slice(0, 10) + (data.text.length > 10 ? "..." : "")
    );
  }

  static {
    //
    const defaultData = {
      kit: "cyber",
      type: "text",
      name: "",
      text: "Placeholder",
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      align: "left",
      font: "aeonik-bold",
      lineHeight: 60,
      textColor: "#ffffff",
      textTransform: "none",
      width: 500,
      opacity: 1,
      meta: {
        addedBy: "",
        placeholder: null,
      },
    };

    this.createDataWrapper({
      defaultData,
    });
  }

  dispose() {
    FontMeshFactory.dispose();
  }
}
