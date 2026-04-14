import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createLogger, type Logger, type LogLevel } from "./logger";

describe("createLogger", () => {
  let stdoutSpy: ReturnType<typeof vi.spyOn>;
  let stderrSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
    delete process.env.LOG_LEVEL;
  });

  it("creates a logger with all expected methods", () => {
    const log = createLogger("Test");
    expect(typeof log.debug).toBe("function");
    expect(typeof log.info).toBe("function");
    expect(typeof log.warn).toBe("function");
    expect(typeof log.error).toBe("function");
    expect(typeof log.child).toBe("function");
  });

  it("info messages are written to stdout", () => {
    const log = createLogger("MyModule");
    log.info("hello world");

    expect(stdoutSpy).toHaveBeenCalledTimes(1);
    const output = stdoutSpy.mock.calls[0][0] as string;
    expect(output).toContain("MyModule");
    expect(output).toContain("hello world");
  });

  it("error messages are written to stderr", () => {
    const log = createLogger("ErrModule");
    log.error("something broke");

    expect(stderrSpy).toHaveBeenCalledTimes(1);
    const output = stderrSpy.mock.calls[0][0] as string;
    expect(output).toContain("ErrModule");
    expect(output).toContain("something broke");
  });

  it("warn messages are written to stderr", () => {
    const log = createLogger("WarnModule");
    log.warn("heads up");

    expect(stderrSpy).toHaveBeenCalledTimes(1);
    const output = stderrSpy.mock.calls[0][0] as string;
    expect(output).toContain("WarnModule");
    expect(output).toContain("heads up");
  });

  it("respects LOG_LEVEL environment variable", () => {
    process.env.LOG_LEVEL = "warn";
    const log = createLogger("Filtered");

    log.info("should be suppressed");
    log.warn("should appear");

    expect(stdoutSpy).not.toHaveBeenCalled();
    expect(stderrSpy).toHaveBeenCalledTimes(1);
    const output = stderrSpy.mock.calls[0][0] as string;
    expect(output).toContain("should appear");
  });

  it("debug messages are suppressed by default (LOG_LEVEL=info)", () => {
    const log = createLogger("DebugTest");
    log.debug("debug msg");

    expect(stdoutSpy).not.toHaveBeenCalled();
    expect(stderrSpy).not.toHaveBeenCalled();
  });

  it("debug messages appear when LOG_LEVEL=debug", () => {
    process.env.LOG_LEVEL = "debug";
    const log = createLogger("DebugTest");
    log.debug("debug msg");

    expect(stdoutSpy).toHaveBeenCalledTimes(1);
    const output = stdoutSpy.mock.calls[0][0] as string;
    expect(output).toContain("debug msg");
  });

  it("error method serializes Error objects", () => {
    const log = createLogger("ErrObj");
    const err = new Error("test error");
    log.error("operation failed", err);

    expect(stderrSpy).toHaveBeenCalledTimes(1);
    const output = stderrSpy.mock.calls[0][0] as string;
    expect(output).toContain("operation failed");
    expect(output).toContain("test error");
  });

  it("error method handles non-Error values", () => {
    const log = createLogger("ErrStr");
    log.error("operation failed", "string error");

    expect(stderrSpy).toHaveBeenCalledTimes(1);
    const output = stderrSpy.mock.calls[0][0] as string;
    expect(output).toContain("string error");
  });

  it("child logger includes parent module name", () => {
    const log = createLogger("Parent");
    const child = log.child("Child");
    child.info("from child");

    expect(stdoutSpy).toHaveBeenCalledTimes(1);
    const output = stdoutSpy.mock.calls[0][0] as string;
    expect(output).toContain("Parent:Child");
  });

  it("includes extra metadata in output", () => {
    const log = createLogger("Meta");
    log.info("with data", { userId: 42, action: "login" });

    expect(stdoutSpy).toHaveBeenCalledTimes(1);
    const output = stdoutSpy.mock.calls[0][0] as string;
    expect(output).toContain("42");
    expect(output).toContain("login");
  });
});
