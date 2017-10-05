declare module "pino/pretty" {
    import { Transform } from "stream";

    interface Formatter {
        (value: any): string;
    }

    interface PrettyOptions {
        timeTransOnly?: boolean;
        formatter?: Formatter;
        levelFirst?: boolean;
        messageKey?: string;
        forceColor?: boolean;
    }

    interface Pretty {
        (opts: PrettyOptions): Transform;
    }

    const pretty: Pretty;
    export = pretty;
}
