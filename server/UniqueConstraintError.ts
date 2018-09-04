import { QueryFailedError } from "typeorm";

import ApiError from "@common/ApiError";
import { ErrorCode } from "@common/ErrorCode";

export default class UniqueConstraintError extends ApiError {
    static is(err: any): err is QueryFailedError {
        return err && err.name === "QueryFailedError" && (err as any).code === 23505; // unique constraint error
    }

    constructor(err: QueryFailedError) {
        super(`Unsatisfied unique constraint: ${(err as any).detail}`, ErrorCode.NotUnique, err);
    }
}
