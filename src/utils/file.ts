import fs from "fs";
import { TokenInfo } from "../prepareAirdrop";
import { PROGRESS_FILE_PATH } from "./constants";

export function writeJson(data: TokenInfo[]) {
  let json = JSON.stringify(data, null, 2);
  fs.writeFileSync(PROGRESS_FILE_PATH, json);
}

export function readJson(): TokenInfo[] {
  return JSON.parse(fs.readFileSync(PROGRESS_FILE_PATH).toString());
}
