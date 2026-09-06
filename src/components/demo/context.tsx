"use client";
import { createContext, useContext } from "react";
import type { Dispatch } from "react";
import type {
  State,
  Action,
  Client,
  Shelter,
  RecordFile,
} from "../../lib/demo/store";
export type ModalState = {
  type:
    | "quick"
    | "note"
    | "letter"
    | "review"
    | "callback"
    | "file"
    | "shelter"
    | "new"
    | "settings"
    | "reset";
  clientId?: string;
  file?: RecordFile;
  shelter?: Shelter;
} | null;
export const DemoContext = createContext<{
  state: State;
  dispatch: Dispatch<Action>;
  modal: (m: ModalState) => void;
  notify: (s: string) => void;
  go: (url: string) => void;
}>(null!);
export const useDemo = () => useContext(DemoContext);
export function requiredClient(state: State, id?: string): Client | undefined {
  return state.clients.find((c) => c.id === id);
}
