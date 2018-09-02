import * as React from "react";
import { Item, ItemImageProps } from "semantic-ui-react";

export default function DeviceImage(props: ItemImageProps) {
  return (
    <Item.Image {...props} src={require("@client/images/raspberry_pi.png")} />
  );
}
