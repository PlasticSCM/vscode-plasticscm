export interface ICmdResult {
  stdout?: string;
  stderr?: string;
  success: boolean;
}

export interface ICmShell {
  readonly isRunning: boolean;

  start(path: string): boolean;
  exec(command: string, args: string[]) : ICmdResult;
  stop(): void;
}

export class CmShell implements ICmShell {
  public get isRunning(): boolean {
    throw new Error('Method not implemented.');
  }

  constructor(startDir: string) {
    this.mStartDir = startDir;
  }

  start(path: string): boolean {
    throw new Error('Method not implemented.');
  }
  stop(): void {
    throw new Error('Method not implemented.');
  }

  exec(command: string, args: string[]) : ICmdResult {
    return {
      success: true,
    };
  }

  private readonly mStartDir: string;
}
