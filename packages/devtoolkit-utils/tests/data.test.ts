import { describe, it, expect } from 'vitest';
import {
  evaluateJsonPath,
  jsonFormat,
  jsonMinify,
  jsonValidate,
  jsonToCsv,
  csvToJson,
} from '../src';

describe('JSON utilities', () => {
  it('jsonFormat pretty-prints', () => {
    expect(jsonFormat('{"a":1}')).toBe('{\n  "a": 1\n}');
  });

  it('jsonMinify removes whitespace', () => {
    expect(jsonMinify('{ "a" : 1 }')).toBe('{"a":1}');
  });

  it('jsonValidate returns true for valid JSON', () => {
    expect(jsonValidate('{"a":1}')).toBe(true);
    expect(jsonValidate('not json')).toBe(false);
  });

  it('evaluateJsonPath resolves paths', () => {
    const obj = { store: { books: [{ title: 'A' }, { title: 'B' }] } };
    expect(evaluateJsonPath(obj, '$.store.books[0].title')).toEqual(['A']);
    expect(evaluateJsonPath(obj, '$.store.books.*.title')).toEqual(['A', 'B']);
    expect(evaluateJsonPath(obj, '$')).toEqual([obj]);
  });
});

describe('CSV conversion', () => {
  it('jsonToCsv converts array', () => {
    const json = '[{"name":"Alice","age":30},{"name":"Bob","age":25}]';
    const csv = jsonToCsv(json);
    expect(csv).toContain('name,age');
    expect(csv).toContain('Alice,30');
    expect(csv).toContain('Bob,25');
  });

  it('csvToJson parses CSV', () => {
    const csv = 'name,age\nAlice,30\nBob,25';
    const result = JSON.parse(csvToJson(csv));
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Alice');
    expect(result[1].age).toBe('25');
  });

  it('handles quoted fields with commas', () => {
    const json = '[{"name":"Smith, John","city":"NY"}]';
    const csv = jsonToCsv(json);
    expect(csv).toContain('"Smith, John"');
  });
});
