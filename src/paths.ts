import { sep as pathSeparator } from "path";

export function isContainedOn(parent: string, child: string): boolean {
  if (parent === child) {
    return true;
  }

  if (!parent.endsWith(pathSeparator)) {
    parent += pathSeparator;
  }

  if (isWindowsPath(parent)) {
    parent = parent.toLowerCase();
    child = child.toLowerCase();
  }

  return child.startsWith(parent);
}

function isWindowsPath(path: string): boolean {
  return /^[a-zA-Z]:\\/.test(path);
}
