
import { ZFXYTile, getChildren, getParent, ZFXY_ROOT_TILE } from "./zfxy";

/**
 * tilehash を ZFXYTile に変換
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
    s = s.slice(1);                  // ← '-' を取り除いた残りが s
  }

  // 入力が空の場合は仕様に合わせて決定する
  // 1) ルートへフォールバックするなら以下：
  // if (s.length === 0) {
  //   const root = { ...ZFXY_ROOT_TILE };
  //   if (negativeF) root.f = -Math.abs(root.f);
  //   return root;                   // ★ ここで確実に return
  // }

  // 2) 空を許容しないならエラーにする：
  if (s.length === 0) {
    throw new Error("parseZFXYTilehash: '-' のみ、または空文字です");
  }

  // ルートから降りる
  let children = getChildren();      // ルートの子
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
    // ここに到達するのは s.length === 0 のケースだが、上で弾いているため通常は来ない
    // フォールバックする仕様にするなら:
    // lastChild = { ...ZFXY_ROOT_TILE };
    // それでも return する
    throw new Error("parseZFXYTilehash: lastChild が得られませんでした");
  }

  if (negativeF) {
    lastChild.f = -Math.abs(lastChild.f);
  }

  return lastChild;                  // ★ 正常系は必ず return
}
