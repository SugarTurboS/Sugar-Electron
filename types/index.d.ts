declare namespace NodeJS {
  export interface Global {
    sugarElectron: any;
  }
}

declare namespace SugarElectron {
  export type IpcCallback = (
    result: any,
    option: { eventName: string; model: string; fromId: string; toId: string }
  ) => void;

  export type IpcResponseCallback = (
    result: any,
    next: (data: any) => void
  ) => void;
}
