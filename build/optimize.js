import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import imagemin from 'imagemin';
import imageminWebp from 'imagemin-webp';
import imageminMozjpeg from 'imagemin-mozjpeg';
import imageminPngquant from 'imagemin-pngquant';
import imageminSvgo from 'imagemin-svgo';
import { minify as terserMinify } from 'terser';
import postcss from 'postcss';
import cssnano from 'cssnano';
import autoprefixer from 'autoprefixer';
import { glob } from 'glob';
import { createHash } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = Object.freeze({
  BUILD_DIR: path.join(__dirname, '..', 'dist'),
  SOURCE_DIR: path.join(__dirname, '..'),
  IMAGE_QUALITY: {
    webp: 80,
    jpeg: 85,
    png: 90,
  },
  IMAGE_SIZES: [320, 640, 1024, 1920],
  MAX_IMAGE_WIDTH: 1920,
  CACHE_DURATION: 31536000,
  GZIP_LEVEL: 9,
});

const SUPPORTED_IMAGE_FORMATS = Object.freeze(
  new Set(['.jpg', '.jpeg', '.png', '.svg', '.webp'])
);

const logger = {
  info: (msg, meta = {}) => {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: msg,
        ...meta,
      })
    );
  },
  error: (msg, error = null, meta = {}) => {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        message: msg,
        error: error?.message,
        stack: error?.stack,
        ...meta,
      })
    );
  },
  warn: (msg, meta = {}) => {
    console.warn(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'WARN',
        message: msg,
        ...meta,
      })
    );
  },
};

class OptimizationError extends Error {
  constructor(message, cause = null, context = {}) {
    super(message);
    this.name = 'OptimizationError';
    this.cause = cause;
    this.context = context;
  }
}

async function ensureDirectory(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
    logger.info('Created directory', { path: dirPath });
  }
}

function calculateHash(content) {
  return createHash('sha256').update(content).digest('hex').substring(0, 8);
}

async function optimizeImage(inputPath, outputDir) {
  const startTime = performance.now();
  const ext = path.extname(inputPath).toLowerCase();
  const basename = path.basename(inputPath, ext);
  const relativePath = path.relative(CONFIG.SOURCE_DIR, inputPath);

  if (!SUPPORTED_IMAGE_FORMATS.has(ext)) {
    logger.warn('Unsupported image format', { path: inputPath, ext });
    return [];
  }

  try {
    await ensureDirectory(outputDir);

    const optimizedFiles = [];

    if (ext === '.svg') {
      const svgBuffer = await fs.readFile(inputPath);
      const optimized = await imagemin.buffer(svgBuffer, {
        plugins: [
          imageminSvgo({
            plugins: [
              { name: 'removeViewBox', active: false },
              { name: 'cleanupIDs', active: true },
              { name: 'removeUnusedNS', active: true },
            ],
          }),
        ],
      });

      const outputPath = path.join(outputDir, `${basename}.svg`);
      await fs.writeFile(outputPath, optimized);

      const originalSize = svgBuffer.length;
      const optimizedSize = optimized.length;
      const savings = ((1 - optimizedSize / originalSize) * 100).toFixed(2);

      optimizedFiles.push({
        path: outputPath,
        format: 'svg',
        size: optimizedSize,
      });

      logger.info('Optimized SVG', {
        input: relativePath,
        output: path.basename(outputPath),
        originalSize,
        optimizedSize,
        savings: `${savings}%`,
        duration: `${(performance.now() - startTime).toFixed(2)}ms`,
      });

      return optimizedFiles;
    }

    const image = sharp(inputPath);
    const metadata = await image.metadata();

    const targetWidth = Math.min(metadata.width, CONFIG.MAX_IMAGE_WIDTH);

    const webpBuffer = await image
      .resize(targetWidth, null, {
        withoutEnlargement: true,
        fit: 'inside',
      })
      .webp({ quality: CONFIG.IMAGE_QUALITY.webp })
      .toBuffer();

    const webpPath = path.join(outputDir, `${basename}.webp`);
    await fs.writeFile(webpPath, webpBuffer);

    optimizedFiles.push({
      path: webpPath,
      format: 'webp',
      size: webpBuffer.length,
    });

    if (ext === '.jpg' || ext === '.jpeg') {
      const jpegBuffer = await image
        .resize(targetWidth, null, {
          withoutEnlargement: true,
          fit: 'inside',
        })
        .jpeg({ quality: CONFIG.IMAGE_QUALITY.jpeg, progressive: true })
        .toBuffer();

      const optimized = await imagemin.buffer(jpegBuffer, {
        plugins: [imageminMozjpeg({ quality: CONFIG.IMAGE_QUALITY.jpeg })],
      });

      const jpegPath = path.join(outputDir, `${basename}.jpg`);
      await fs.writeFile(jpegPath, optimized);

      optimizedFiles.push({
        path: jpegPath,
        format: 'jpeg',
        size: optimized.length,
      });
    } else if (ext === '.png') {
      const pngBuffer = await image
        .resize(targetWidth, null, {
          withoutEnlargement: true,
          fit: 'inside',
        })
        .png({ compressionLevel: 9 })
        .toBuffer();

      const optimized = await imagemin.buffer(pngBuffer, {
        plugins: [
          imageminPngquant({
            quality: [0.8, 0.9],
            speed: 1,
          }),
        ],
      });

      const pngPath = path.join(outputDir, `${basename}.png`);
      await fs.writeFile(pngPath, optimized);

      optimizedFiles.push({
        path: pngPath,
        format: 'png',
        size: optimized.length,
      });
    }

    const totalSize = optimizedFiles.reduce((sum, file) => sum + file.size, 0);

    logger.info('Optimized image', {
      input: relativePath,
      formats: optimizedFiles.map((f) => f.format).join(', '),
      totalSize,
      duration: `${(performance.now() - startTime).toFixed(2)}ms`,
    });

    return optimizedFiles;
  } catch (error) {
    throw new OptimizationError(
      `Failed to optimize image: ${relativePath}`,
      error,
      { inputPath, outputDir }
    );
  }
}

async function optimizeCSS(inputPath, outputPath) {
  const startTime = performance.now();
  const relativePath = path.relative(CONFIG.SOURCE_DIR, inputPath);

  try {
    const css = await fs.readFile(inputPath, 'utf-8');
    const originalSize = Buffer.byteLength(css, 'utf-8');

    const result = await postcss([
      autoprefixer({
        overrideBrowserslist: ['> 1%', 'last 2 versions', 'not dead'],
      }),
      cssnano({
        preset: [
          'default',
          {
            discardComments: { removeAll: true },
            normalizeWhitespace: true,
            minifyFontValues: true,
            minifySelectors: true,
          },
        ],
      }),
    ]).process(css, {
      from: inputPath,
      to: outputPath,
    });

    const optimizedSize = Buffer.byteLength(result.css, 'utf-8');
    const savings = ((1 - optimizedSize / originalSize) * 100).toFixed(2);

    await ensureDirectory(path.dirname(outputPath));
    await fs.writeFile(outputPath, result.css, 'utf-8');

    if (result.map) {
      await fs.writeFile(`${outputPath}.map`, result.map.toString(), 'utf-8');
    }

    logger.info('Optimized CSS', {
      input: relativePath,
      output: path.basename(outputPath),
      originalSize,
      optimizedSize,
      savings: `${savings}%`,
      duration: `${(performance.now() - startTime).toFixed(2)}ms`,
    });

    return { path: outputPath, size: optimizedSize };
  } catch (error) {
    throw new OptimizationError(
      `Failed to optimize CSS: ${relativePath}`,
      error,
      { inputPath, outputPath }
    );
  }
}

async function optimizeJS(inputPath, outputPath) {
  const startTime = performance.now();
  const relativePath = path.relative(CONFIG.SOURCE_DIR, inputPath);

  try {
    const code = await fs.readFile(inputPath, 'utf-8');
    const originalSize = Buffer.byteLength(code, 'utf-8');

    const result = await terserMinify(code, {
      compress: {
        dead_code: true,
        drop_console: false,
        drop_debugger: true,
        keep_classnames: false,
        keep_fnames: false,
        passes: 2,
      },
      mangle: {
        toplevel: true,
        safari10: true,
      },
      format: {
        comments: false,
        ecma: 2020,
      },
      sourceMap: {
        filename: path.basename(outputPath),
        url: `${path.basename(outputPath)}.map`,
      },
    });

    if (!result.code) {
      throw new Error('Minification produced no output');
    }

    const optimizedSize = Buffer.byteLength(result.code, 'utf-8');
    const savings = ((1 - optimizedSize / originalSize) * 100).toFixed(2);

    await ensureDirectory(path.dirname(outputPath));
    await fs.writeFile(outputPath, result.code, 'utf-8');

    if (result.map) {
      await fs.writeFile(
        `${outputPath}.map`,
        JSON.stringify(result.map),
        'utf-8'
      );
    }

    logger.info('Optimized JavaScript', {
      input: relativePath,
      output: path.basename(outputPath),
      originalSize,
      optimizedSize,
      savings: `${savings}%`,
      duration: `${(performance.now() - startTime).toFixed(2)}ms`,
    });

    return { path: outputPath, size: optimizedSize };
  } catch (error) {
    throw new OptimizationError(
      `Failed to optimize JavaScript: ${relativePath}`,
      error,
      { inputPath, outputPath }
    );
  }
}

async function copyFile(source, destination) {
  try {
    await ensureDirectory(path.dirname(destination));
    await fs.copyFile(source, destination);
    const stats = await fs.stat(destination);

    logger.info('Copied file', {
      source: path.relative(CONFIG.SOURCE_DIR, source),
      destination: path.relative(CONFIG.BUILD_DIR, destination),
      size: stats.size,
    });

    return { path: destination, size: stats.size };
  } catch (error) {
    throw new OptimizationError(`Failed to copy file: ${source}`, error, {
      source,
      destination,
    });
  }
}

async function processAssets() {
  const startTime = performance.now();
  const results = {
    images: [],
    css: [],
    js: [],
    html: [],
    other: [],
    errors: [],
  };

  try {
    logger.info('Starting asset optimization', {
      buildDir: CONFIG.BUILD_DIR,
      sourceDir: CONFIG.SOURCE_DIR,
    });

    await ensureDirectory(CONFIG.BUILD_DIR);

    const imagePatterns = Array.from(SUPPORTED_IMAGE_FORMATS).map(
      (ext) => `**/*${ext}`
    );
    const imageFiles = await glob(imagePatterns, {
      cwd: CONFIG.SOURCE_DIR,
      ignore: ['node_modules/**', 'dist/**', 'build/**', '.git/**'],
      absolute: true,
    });

    logger.info('Found images to optimize', { count: imageFiles.length });

    for (const imagePath of imageFiles) {
      try {
        const relativePath = path.relative(CONFIG.SOURCE_DIR, imagePath);
        const outputDir = path.join(
          CONFIG.BUILD_DIR,
          path.dirname(relativePath)
        );

        const optimized = await optimizeImage(imagePath, outputDir);
        results.images.push(...optimized);
      } catch (error) {
        logger.error('Image optimization failed', error, {
          path: imagePath,
        });
        results.errors.push({
          type: 'image',
          path: imagePath,
          error: error.message,
        });
      }
    }

    const cssFiles = await glob('**/*.css', {
      cwd: CONFIG.SOURCE_DIR,
      ignore: ['node_modules/**', 'dist/**', 'build/**', '.git/**'],
      absolute: true,
    });

    logger.info('Found CSS files to optimize', { count: cssFiles.length });

    for (const cssPath of cssFiles) {
      try {
        const relativePath = path.relative(CONFIG.SOURCE_DIR, cssPath);
        const outputPath = path.join(CONFIG.BUILD_DIR, relativePath);

        const optimized = await optimizeCSS(cssPath, outputPath);
        results.css.push(optimized);
      } catch (error) {
        logger.error('CSS optimization failed', error, { path: cssPath });
        results.errors.push({
          type: 'css',
          path: cssPath,
          error: error.message,
        });
      }
    }

    const jsFiles = await glob('**/*.js', {
      cwd: CONFIG.SOURCE_DIR,
      ignore: [
        'node_modules/**',
        'dist/**',
        'build/**',
        '.git/**',
        'scripts/**',
      ],
      absolute: true,
    });

    logger.info('Found JavaScript files to optimize', { count: jsFiles.length });

    for (const jsPath of jsFiles) {
      try {
        const relativePath = path.relative(CONFIG.SOURCE_DIR, jsPath);
        const outputPath = path.join(CONFIG.BUILD_DIR, relativePath);

        const optimized = await optimizeJS(jsPath, outputPath);
        results.js.push(optimized);
      } catch (error) {
        logger.error('JavaScript optimization failed', error, { path: jsPath });
        results.errors.push({
          type: 'js',
          path: jsPath,
          error: error.message,
        });
      }
    }

    const htmlFiles = await glob('**/*.html', {
      cwd: CONFIG.SOURCE_DIR,
      ignore: ['node_modules/**', 'dist/**', 'build/**', '.git/**'],
      absolute: true,
    });

    logger.info('Found HTML files to copy', { count: htmlFiles.length });

    for (const htmlPath of htmlFiles) {
      try {
        const relativePath = path.relative(CONFIG.SOURCE_DIR, htmlPath);
        const outputPath = path.join(CONFIG.BUILD_DIR, relativePath);

        const copied = await copyFile(htmlPath, outputPath);
        results.html.push(copied);
      } catch (error) {
        logger.error('HTML copy failed', error, { path: htmlPath });
        results.errors.push({
          type: 'html',
          path: htmlPath,
          error: error.message,
        });
      }
    }

    const duration = performance.now() - startTime;

    const summary = {
      duration: `${(duration / 1000).toFixed(2)}s`,
      images: {
        count: results.images.length,
        totalSize: results.images.reduce((sum, f) => sum + f.size, 0),
      },
      css: {
        count: results.css.length,
        totalSize: results.css.reduce((sum, f) => sum + f.size, 0),
      },
      js: {
        count: results.js.length,
        totalSize: results.js.reduce((sum, f) => sum + f.size, 0),
      },
      html: {
        count: results.html.length,
        totalSize: results.html.reduce((sum, f) => sum + f.size, 0),
      },
      errors: results.errors.length,
    };

    logger.info('Asset optimization completed', summary);

    if (results.errors.length > 0) {
      logger.warn('Some assets failed to optimize', {
        errorCount: results.errors.length,
        errors: results.errors,
      });
    }

    return results;
  } catch (error) {
    logger.error('Asset optimization process failed', error);
    throw new OptimizationError('Asset optimization failed', error);
  }
}

async function main() {
  try {
    logger.info('Build optimization started');

    const results = await processAssets();

    const hasErrors = results.errors.length > 0;
    const exitCode = hasErrors ? 1 : 0;

    logger.info('Build optimization finished', {
      success: !hasErrors,
      exitCode,
    });

    process.exit(exitCode);
  } catch (error) {
    logger.error('Build optimization failed with fatal error', error);
    process.exit(1);
  }
}

main();