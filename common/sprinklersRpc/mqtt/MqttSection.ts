import { update } from "serializr";

import * as s from "@common/sprinklersRpc";
import * as schema from "@common/sprinklersRpc/schema";

export class MqttSection extends s.Section {
  onMessage(payload: string, topic: string | undefined) {
    if (topic === "state") {
      this.state = payload === "true";
    } else if (topic == null) {
      this.updateFromJSON(JSON.parse(payload));
    }
  }

  updateFromJSON(json: any) {
    update(schema.section, this, json);
  }
}
