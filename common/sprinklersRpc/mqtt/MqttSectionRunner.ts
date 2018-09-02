import { update } from "serializr";

import * as s from "@common/sprinklersRpc";
import * as schema from "@common/sprinklersRpc/schema";

export class MqttSectionRunner extends s.SectionRunner {
  onMessage(payload: string) {
    this.updateFromJSON(JSON.parse(payload));
  }

  updateFromJSON(json: any) {
    update(schema.sectionRunner, this, json);
  }
}
