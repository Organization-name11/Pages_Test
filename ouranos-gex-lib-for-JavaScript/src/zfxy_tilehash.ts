
import { ZFXYTile, getChildren, getParent, ZFXY_ROOT_TILE } from "./zfxy";

/**
 * tilehash を ZFXYTile に変換
 * - 先頭の '-' は f の符号
 * - 残りは 1..N の数字。各桁が親タイルの children のインデックス(1-based)
 */
export function parseZFXYTilehash(th: string): ZFXYTile {
  if (th == null) {
    throw new Error("parseZFXYTilehash: tilehash が未定義です");
  }

  let negativeF = false;
  let s = th.trim();

  // 先頭の符号処理
  if (s.startsWith("-")) {
    negativeF = true;
    s = s.slice(1);
  }

  // 空はエラー（仕様に合わせてフォールバックにしても可）
  if (s.length === 0) {
    throw new Error("parseZFXYTilehash: '-' のみ、または空文字です");
  }

  // ルートから降りる
  let children = getChildren();            // ルートの子
  let lastChild: ZFXYTile | null = null;

  for (const ch of s) {
    const idx = Number(ch) - 1;
    if (!Number.isInteger(idx) || idx < 0 || idx >= children.length) {
      throw new Error(`parseZFXYTilehash: 文字 '${ch}' が不正です（範囲外または非数字）`);
    }
    lastChild = { ...children[idx] };
    children = getChildren(lastChild);
  }

  if (!lastChild) {
    // ここに来るのは通常 s.length === 0 のときだが、上で弾いている
    // 仕様でフォールバックにするなら以下：
    // lastChild = { ...ZFXY_ROOT_TILE };
    throw new Error("parseZFXYTilehash: lastChild が得られませんでした");
  }

  // 符号処理
  if (negativeF) {
    lastChild.f = -Math.abs(lastChild.f);
  }

  return lastChild;
}

/**
 * ZFXYTile から tilehash を生成
 * - 子の位置を 1..N の数字で表す
 * - f の符号は先頭の '-' で表現
 */
export function generateTilehash(tile: ZFXYTile): string {
  let { f, x, y, z } = tile;
  const originalF = f;
  let out = "";

  while (z > 0) {
    const thisTile: ZFXYTile = { f: Math.abs(f), x, y, z };
    const parent = getParent(thisTile);
    const childrenOfParent = getChildren(parent);

    const positionInParent = childrenOfParent.findIndex(
      (child) =>
        child.f === Math.abs(f) &&
        child.x === x &&
        child.y === y &&
        child.z === z
    );

    if (positionInParent < 0) {
      // データの不整合（親の子配列に該当タイルが見つからない）
      throw new Error("generateTilehash: 親の children に一致する子が見つかりません");
    }

    out = String(positionInParent + 1) + out;

    // 一段親へ遡る
    f = parent.f;
    x = parent.x;
    y = parent.y;
    z = parent.z;
  }

  // 先頭の符号
  return (originalF < 0 ? "-" : "") + out;
}
