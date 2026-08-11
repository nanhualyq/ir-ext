import { describe, test, expect } from 'bun:test';
import { matchBookmarks } from '../matchBookmarks';
import type { BookmarkNode } from '../matchBookmarks';

function bk(id: string, url: string, title = ''): BookmarkNode {
  return { id, url, title };
}

describe('Tier 1 — exact match', () => {
  test('URL 完全匹配', () => {
    const bookmarks = [bk('1', 'https://example.com/a/b', 'Page')];
    const result = matchBookmarks(bookmarks, 'https://example.com/a/b', 'Other');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
    expect(result[0].tier).toBe(1);
  });

  test('title 完全匹配', () => {
    const bookmarks = [bk('1', 'https://example.com/x', 'My Page')];
    const result = matchBookmarks(bookmarks, 'https://example.com/y', 'My Page');
    expect(result).toHaveLength(1);
    expect(result[0].tier).toBe(1);
  });

  test('URL 和 title 同时命中仍返回 tier 1', () => {
    const bookmarks = [bk('1', 'https://example.com/a', 'Same')];
    const result = matchBookmarks(bookmarks, 'https://example.com/a', 'Same');
    expect(result).toHaveLength(1);
    expect(result[0].tier).toBe(1);
  });

  test('title 为空字符串时不匹配空 title', () => {
    const bookmarks = [bk('1', 'https://example.com/x', '')];
    const result = matchBookmarks(bookmarks, 'https://other.com/y', '');
    expect(result).toHaveLength(0);
  });
});

describe('Tier 1 short-circuit', () => {
  test('Tier 1 命中时不回落到 Tier 2', () => {
    const bookmarks = [
      bk('1', 'https://example.com/a', 'Exact'),
      bk('2', 'https://example.com/a#hash', 'HashDiff'),
    ];
    const result = matchBookmarks(bookmarks, 'https://example.com/a', '');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
    expect(result[0].tier).toBe(1);
  });
});

describe('Tier 2 — hash 差异', () => {
  test('相同 URL 不同 hash → 匹配', () => {
    const bookmarks = [bk('1', 'https://example.com/page#foo')];
    const result = matchBookmarks(bookmarks, 'https://example.com/page#bar', '');
    expect(result).toHaveLength(1);
    expect(result[0].tier).toBe(2);
  });

  test('有 hash vs 无 hash → 匹配', () => {
    const bookmarks = [bk('1', 'https://example.com/page#section')];
    const result = matchBookmarks(bookmarks, 'https://example.com/page', '');
    expect(result).toHaveLength(1);
    expect(result[0].tier).toBe(2);
  });

  test('不同 path 不匹配', () => {
    const bookmarks = [bk('1', 'https://example.com/other')];
    const result = matchBookmarks(bookmarks, 'https://example.com/page', '');
    expect(result).toHaveLength(0);
  });
});

describe('Tier 3 — searchParams 差异', () => {
  test('追踪参数不同 → 匹配', () => {
    const bookmarks = [
      bk('1', 'https://example.com/page?utm_source=google&id=123'),
    ];
    const result = matchBookmarks(
      bookmarks,
      'https://example.com/page?utm_medium=cpc&id=123',
      '',
    );
    expect(result).toHaveLength(1);
    expect(result[0].tier).toBe(3);
  });

  test('有参数 vs 无参数 → 匹配', () => {
    const bookmarks = [bk('1', 'https://example.com/page?foo=bar')];
    const result = matchBookmarks(bookmarks, 'https://example.com/page', '');
    expect(result).toHaveLength(1);
    // 无参数 URL 是有参数 URL 的子串，Tier 2 includes 即可命中
    expect(result[0].tier).toBe(2);
  });

  test('相同 path 不同 searchParams，Tier 2 不含 → Tier 3', () => {
    // 两个 URL 都有参数，path 相同但 searchParams 不同
    const bookmarks = [
      bk('1', 'https://example.com/page?foo=bar&baz=1'),
    ];
    const result = matchBookmarks(
      bookmarks,
      'https://example.com/page?a=b&c=d',
      '',
    );
    expect(result).toHaveLength(1);
    // Tier 2: path 相同，includes 检查搜索参数不同 → 不匹配
    // Tier 3: 去掉 searchParams 后均为 example.com/page → 匹配
    expect(result[0].tier).toBe(3);
  });

  test('参数顺序不同 → Tier 3 匹配', () => {
    const bookmarks = [bk('1', 'https://example.com/page?b=2&a=1')];
    const result = matchBookmarks(
      bookmarks,
      'https://example.com/page?a=1&b=2',
      '',
    );
    expect(result).toHaveLength(1);
    expect(result[0].tier).toBe(3);
  });
});

describe('Tier 4 — path 裁剪', () => {
  test('子路径匹配父路径', () => {
    const bookmarks = [bk('1', 'https://example.com/a/b/c')];
    const result = matchBookmarks(bookmarks, 'https://example.com/a/b', '');
    expect(result).toHaveLength(1);
    expect(result[0].tier).toBe(4);
  });

  test('父路径匹配子路径', () => {
    const bookmarks = [bk('1', 'https://example.com/a')];
    const result = matchBookmarks(bookmarks, 'https://example.com/a/b/c', '');
    expect(result).toHaveLength(1);
    expect(result[0].tier).toBe(4);
  });

  test('根路径匹配', () => {
    const bookmarks = [bk('1', 'https://example.com/')];
    const result = matchBookmarks(
      bookmarks,
      'https://example.com/any/path',
      '',
    );
    expect(result).toHaveLength(1);
    expect(result[0].tier).toBe(4);
  });

  test('不同域名不匹配', () => {
    const bookmarks = [bk('1', 'https://other.com/a/b')];
    const result = matchBookmarks(bookmarks, 'https://example.com/a', '');
    expect(result).toHaveLength(0);
  });
});

describe('归一化处理', () => {
  test('http vs https', () => {
    const bookmarks = [bk('1', 'http://example.com/page')];
    const result = matchBookmarks(
      bookmarks,
      'https://example.com/page',
      '',
    );
    expect(result).toHaveLength(1);
    expect(result[0].tier).toBe(1);
  });

  test('www 前缀差异', () => {
    const bookmarks = [bk('1', 'https://www.example.com/page')];
    const result = matchBookmarks(
      bookmarks,
      'https://example.com/page',
      '',
    );
    expect(result).toHaveLength(1);
    expect(result[0].tier).toBe(1);
  });

  test('trailing slash 差异', () => {
    const bookmarks = [bk('1', 'https://example.com/page/')];
    const result = matchBookmarks(
      bookmarks,
      'https://example.com/page',
      '',
    );
    expect(result).toHaveLength(1);
    expect(result[0].tier).toBe(1);
  });
});

describe('边界情况', () => {
  test('空书签列表', () => {
    const result = matchBookmarks([], 'https://example.com', '');
    expect(result).toHaveLength(0);
  });

  test('无 url 的书签节点', () => {
    const bookmarks: BookmarkNode[] = [{ id: '1', title: 'No URL' }];
    const result = matchBookmarks(bookmarks, 'https://example.com', '');
    expect(result).toHaveLength(0);
  });

  test('完全不相关 → 返回空', () => {
    const bookmarks = [bk('1', 'https://other.com/completely/different')];
    const result = matchBookmarks(
      bookmarks,
      'https://example.com/page',
      'Unrelated',
    );
    expect(result).toHaveLength(0);
  });

  test('path 为 / 的边界', () => {
    const bookmarks = [bk('1', 'https://example.com/')];
    const result = matchBookmarks(bookmarks, 'https://example.com/', '');
    expect(result).toHaveLength(1);
    expect(result[0].tier).toBe(1);
  });

  test('多个书签混合 tier 取最高优先级（短路）', () => {
    const bookmarks = [
      bk('1', 'https://example.com/a#hash', 'Tier2Candidate'),
      bk('2', 'https://example.com/a?x=1', 'Tier3Candidate'),
      bk('3', 'https://example.com/a', 'Tier1Exact'),
    ];
    const result = matchBookmarks(bookmarks, 'https://example.com/a', '');
    // Tier 1 命中，短路返回
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('3');
    expect(result[0].tier).toBe(1);
  });
});
