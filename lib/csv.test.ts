import { describe, expect, it } from "vitest";
import { csvField, toCsv } from "./csv";

describe("csvField", () => {
  it("leaves plain values untouched", () => {
    expect(csvField("Compra Mercadona")).toBe("Compra Mercadona");
  });

  it("quotes values containing a comma", () => {
    expect(csvField("Marco, Pepe")).toBe('"Marco, Pepe"');
  });

  it("doubles inner quotes and wraps in quotes", () => {
    expect(csvField('Dijo "hola"')).toBe('"Dijo ""hola"""');
  });

  it("quotes values containing a newline", () => {
    expect(csvField("línea 1\nlínea 2")).toBe('"línea 1\nlínea 2"');
  });
});

describe("toCsv", () => {
  it("joins headers and rows with commas and CRLF, prefixed with a BOM", () => {
    const csv = toCsv(
      ["Fecha", "Descripción"],
      [
        ["2026-01-01", "Compra"],
        ["2026-01-02", "Cena, pizza"],
      ]
    );

    expect(csv).toBe(
      "﻿Fecha,Descripción\r\n2026-01-01,Compra\r\n2026-01-02,\"Cena, pizza\"\r\n"
    );
  });
});
