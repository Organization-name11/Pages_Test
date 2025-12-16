
// /workspaces/Pages_Test/lib/ouranos-gex-lib-for-javascript/zfxy_tilehash.ts
import type { ZFXYTile } from "./zfxy";
import { getChildren, getParent } from "./zfxy";

/**
 * タイルハッシュをパースして ZFXYTile を返す。
 * 仕様：
 * - 先頭が '-' の場合、f を負（sign）として扱う
 * - 続く各文字は '1'〜'8'（親の子タイル位置 1-based）
 * - 左から順に降りていき、最終タイルを返す
 */
export function parseZFXYTilehash(th: string): ZFXYTile {
  let negativeF = false;
  if (th[0] === '-') {
    negativeF = true;
    th = th.substring(1);
  }

  // ルートの子からスタート
  let children: ZFXYTile[] = getChildren(); // 8要素が期待される
  let lastChild: ZFXYTile | undefined;

  for (const c of th) {
    const idx = parseInt(c, 10) - 1;

    // 文字検証（'1'〜'8'のみ許容）
    if (!Number.isFinite(idx) || idx < 0 || idx >= children.length) {
      throw new Error(`Invalid tilehash character '${c}' in '${negativeF ? '-' : ''}${th}'`);
    }

    // noUncheckedIndexedAccess 環境でも安全に値を取得
    const child = children.at(idx);
    if (!child) {
      // 実行時には起きないはずだが、静的解析上の安全性のためガード
      throw new Error(`Invalid tilehash character '${c}' in '${negativeF ? '-' : ''}${th}'`);
    }

    lastChild = child;                // 直接代入（プロパティ完全）
    children = getChildren(lastChild); // 次階層へ
  }

  if (!lastChild) {
    // 空文字列や '-' のみは不正
    throw new Error(`Invalid tilehash '${negativeF ? '-' : ''}${th}'`);
  }

  // 負符号の場合は f を反転（他のプロパティはそのまま）
  const finalTile = negativeF ? { ...lastChild, f: -lastChild.f } : lastChild;

  return finalTile;
}

/**
 * ZFXYTile からタイルハッシュ文字列を生成する。
 * 仕様：
 * - f が負なら先頭に '-' を付ける
 * - 親を辿りながら、その親の children の中で自分が何番目か（1〜8）を左側に連結
 */
export function generateTilehash(tile: ZFXYTile): string {
  let { f, x, y, z } = tile;
  const originalF = f;
  let out = '';

  while (z > 0) {
    // f はインデックス探索用に絶対値を用いる
    const thisTile: ZFXYTile = { f: Math.abs(f), x, y, z };
    const parent = getParent(thisTile);
    const childrenOfParent: ZFXYTile[] = getChildren(parent);

    const positionInParent = childrenOfParent.findIndex(
      (child) =>
        child.f === Math.abs(f) &&
        child.x === x &&
        child.y === y &&
        child.z === z
    );

    if (positionInParent < 0) {
      throw new Error(
        `Could not determine position in parent for tile ${JSON.stringify(thisTile)}`
      );
    }

    // 1-based の文字を連結
    out = (positionInParent + 1).toString() + out;

    // 親へ移動
    f = parent.f;
    x = parent.x;
    y = parent.y;
    z = parent.z;
  }

  // 先頭符号（負の場合のみ）
  return (originalF < 0 ? '-' : '') + out;
}
