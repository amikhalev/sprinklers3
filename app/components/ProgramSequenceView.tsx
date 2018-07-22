import * as React from "react";

import { Duration } from "@common/Duration";
import { ProgramItem, Section} from "@common/sprinklersRpc";

export default function ProgramSequenceView({ sequence, sections }: {
    sequence: ProgramItem[], sections: Section[],
}) {
    const sequenceItems = sequence.map((item, index) => {
        const section = sections[item.section];
        const duration = Duration.fromSeconds(item.duration);
        return (
            <li key={index}>
                <em>"{section.name}"</em> for {duration.toString()}
            </li>
        );
    });
    return <ul>{sequenceItems}</ul>;
}
