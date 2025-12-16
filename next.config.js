
// next.config.js
/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

// GitHub Pages の公開URLが https://<user>.github.io/Pages_Test/ の場合
const repoName = 'Pages_Test';

module.exports = {
  // 静的エクスポートを有効化（Next.js 16以降の推奨設定）
  output: 'export',

  // GitHub Pages のサブパス対応（プロジェクトページの場合のみ必要）
  basePath: isProd ? `/${repoName}` : '',
  assetPrefix: isProd ? `/${repoName}/` : '',

  // next/image を静的出力で扱うために必須
  images: {
    unoptimized: true,
  },

  // 必要に応じて追加設定（例：trailingSlashなど）
  // trailingSlash: true, // GitHub Pages  // trailingSlash: true, // GitHub Pagesでディレクトリ構造を安定させたい場合
}