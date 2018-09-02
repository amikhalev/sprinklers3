export interface WithType<Type extends string = string> {
  type: Type;
}

export interface WithProgram {
  programId: number;
}

export type RunProgramRequest = WithProgram & WithType<"runProgram">;
export type CancelProgramRequest = WithProgram & WithType<"cancelProgram">;

export type UpdateProgramData = WithProgram & { data: any };
export type UpdateProgramRequest = UpdateProgramData &
  WithType<"updateProgram">;
export type UpdateProgramResponse = Response<"updateProgram", { data: any }>;

export interface WithSection {
  sectionId: number;
}

export type RunSectionData = WithSection & { duration: number };
export type RunSectionRequest = RunSectionData & WithType<"runSection">;
export type RunSectionResponse = Response<"runSection", { runId: number }>;

export type CancelSectionRequest = WithSection & WithType<"cancelSection">;

export interface CancelSectionRunIdData {
  runId: number;
}
export type CancelSectionRunIdRequest = CancelSectionRunIdData &
  WithType<"cancelSectionRunId">;

export interface PauseSectionRunnerData {
  paused: boolean;
}
export type PauseSectionRunnerRequest = PauseSectionRunnerData &
  WithType<"pauseSectionRunner">;

export type Request =
  | RunProgramRequest
  | CancelProgramRequest
  | UpdateProgramRequest
  | RunSectionRequest
  | CancelSectionRequest
  | CancelSectionRunIdRequest
  | PauseSectionRunnerRequest;

export type RequestType = Request["type"];

export interface SuccessResponseData<Type extends string = string>
  extends WithType<Type> {
  result: "success";
  message: string;
}

export interface ErrorResponseData<Type extends string = string>
  extends WithType<Type> {
  result: "error";
  message: string;
  code: number;
  name?: string;
  cause?: any;
}

export type Response<Type extends string = string, Res = {}> =
  | (SuccessResponseData<Type> & Res)
  | (ErrorResponseData<Type>);
