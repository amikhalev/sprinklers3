import { update } from "serializr";

import * as s from "@common/sprinklersRpc";
import * as schema from "@common/sprinklersRpc/schema";

export class MqttProgram extends s.Program {
    onMessage(payload: string, topic: string | undefined) {
        if (topic === "running") {
            this.running = (payload === "true");
        } else if (topic == null) {
            this.updateFromJSON(JSON.parse(payload));
        }
    }

    updateFromJSON(json: any) {
        update(schema.program, this, json);
    }
}
