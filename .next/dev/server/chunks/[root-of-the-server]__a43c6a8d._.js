module.exports = [
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/lib/ouranos-gex-lib-for-javascript/zfxy.ts [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ZFXY_1M_ZOOM_BASE",
    ()=>ZFXY_1M_ZOOM_BASE,
    "ZFXY_ROOT_TILE",
    ()=>ZFXY_ROOT_TILE,
    "calculateZFXY",
    ()=>calculateZFXY,
    "getBBox",
    ()=>getBBox,
    "getCenterLngLat",
    ()=>getCenterLngLat,
    "getCenterLngLatAlt",
    ()=>getCenterLngLatAlt,
    "getChildren",
    ()=>getChildren,
    "getFloor",
    ()=>getFloor,
    "getLngLat",
    ()=>getLngLat,
    "getParent",
    ()=>getParent,
    "getSurrounding",
    ()=>getSurrounding,
    "isZFXYTile",
    ()=>isZFXYTile,
    "parseZFXYString",
    ()=>parseZFXYString,
    "zfxyWraparound",
    ()=>zfxyWraparound
]);
function isZFXYTile(tile) {
    return 'z' in tile && 'f' in tile && 'x' in tile && 'y' in tile;
}
const ZFXY_1M_ZOOM_BASE = 25;
const ZFXY_ROOT_TILE = {
    f: 0,
    x: 0,
    y: 0,
    z: 0
};
const rad2deg = 180 / Math.PI;
function getParent(tile, steps = 1) {
    const { f, x, y, z } = tile;
    if (steps <= 0) {
        throw new Error('steps must be greater than 0');
    }
    if (steps > z) {
        throw new Error(`Getting parent tile of ${tile}, ${steps} steps is not possible because it would go beyond the root tile (z=0)`);
    }
    return {
        f: f >> steps,
        x: x >> steps,
        y: y >> steps,
        z: z - steps
    };
}
function getChildren(tile = ZFXY_ROOT_TILE) {
    const { f, x, y, z } = tile;
    return [
        {
            f: f * 2,
            x: x * 2,
            y: y * 2,
            z: z + 1
        },
        {
            f: f * 2,
            x: x * 2 + 1,
            y: y * 2,
            z: z + 1
        },
        {
            f: f * 2,
            x: x * 2,
            y: y * 2 + 1,
            z: z + 1
        },
        {
            f: f * 2,
            x: x * 2 + 1,
            y: y * 2 + 1,
            z: z + 1
        },
        {
            f: f * 2 + 1,
            x: x * 2,
            y: y * 2,
            z: z + 1
        },
        {
            f: f * 2 + 1,
            x: x * 2 + 1,
            y: y * 2,
            z: z + 1
        },
        {
            f: f * 2 + 1,
            x: x * 2,
            y: y * 2 + 1,
            z: z + 1
        },
        {
            f: f * 2 + 1,
            x: x * 2 + 1,
            y: y * 2 + 1,
            z: z + 1
        }
    ];
}
function getSurrounding(tile = ZFXY_ROOT_TILE) {
    const { f, x, y, z } = tile;
    return [
        zfxyWraparound({
            f: f,
            x: x,
            y: y,
            z: z
        }),
        zfxyWraparound({
            f: f,
            x: x + 1,
            y: y,
            z: z
        }),
        zfxyWraparound({
            f: f,
            x: x,
            y: y + 1,
            z: z
        }),
        zfxyWraparound({
            f: f,
            x: x + 1,
            y: y + 1,
            z: z
        }),
        zfxyWraparound({
            f: f,
            x: x - 1,
            y: y,
            z: z
        }),
        zfxyWraparound({
            f: f,
            x: x,
            y: y - 1,
            z: z
        }),
        zfxyWraparound({
            f: f,
            x: x - 1,
            y: y - 1,
            z: z
        }),
        zfxyWraparound({
            f: f,
            x: x + 1,
            y: y - 1,
            z: z
        }),
        zfxyWraparound({
            f: f,
            x: x - 1,
            y: y + 1,
            z: z
        })
    ];
}
function parseZFXYString(str) {
    const match = str.match(/^\/?(\d+)\/(?:(\d+)\/)?(\d+)\/(\d+)$/);
    if (!match) {
        return undefined;
    }
    return {
        z: parseInt(match[1], 10),
        f: parseInt(match[2] || '0', 10),
        x: parseInt(match[3], 10),
        y: parseInt(match[4], 10)
    };
}
function getLngLat(tile) {
    const n = Math.PI - 2 * Math.PI * tile.y / Math.pow(2, tile.z);
    return {
        lng: tile.x / Math.pow(2, tile.z) * 360 - 180,
        lat: rad2deg * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)))
    };
}
function getCenterLngLat(tile) {
    const x = tile.x * 2 + 1, y = tile.y * 2 + 1, z = tile.z + 1;
    return getLngLat({
        x,
        y,
        z,
        f: 0
    });
}
function getCenterLngLatAlt(tile) {
    return {
        ...getCenterLngLat(tile),
        alt: getFloor(tile) + 2 ** ZFXY_1M_ZOOM_BASE / 2 ** (tile.z + 1)
    };
}
function getBBox(tile) {
    const nw = getLngLat(tile), se = getLngLat({
        ...tile,
        y: tile.y + 1,
        x: tile.x + 1
    });
    return [
        nw,
        se
    ];
}
function getFloor(tile) {
    return tile.f * 2 ** ZFXY_1M_ZOOM_BASE / 2 ** tile.z;
}
function calculateZFXY(input) {
    const meters = typeof input.alt !== 'undefined' ? input.alt : 0;
    if (meters <= -(2 ** ZFXY_1M_ZOOM_BASE) || meters >= 2 ** ZFXY_1M_ZOOM_BASE) {
        // TODO: make altitude unlimited?
        throw new Error(`ZFXY only supports altitude between -2^${ZFXY_1M_ZOOM_BASE} and +2^${ZFXY_1M_ZOOM_BASE}.`);
    }
    const f = Math.floor(2 ** input.zoom * meters / 2 ** ZFXY_1M_ZOOM_BASE);
    // Algorithm adapted from tilebelt.js
    const d2r = Math.PI / 180;
    const sin = Math.sin(input.lat * d2r);
    const z2 = 2 ** input.zoom;
    let x = z2 * (input.lng / 360 + 0.5);
    const y = z2 * (0.5 - 0.25 * Math.log((1 + sin) / (1 - sin)) / Math.PI);
    // Wrap Tile X
    x = x % z2;
    if (x < 0) x = x + z2;
    return {
        f: f,
        x: Math.floor(x),
        y: Math.floor(y),
        z: input.zoom
    };
}
function zfxyWraparound(tile) {
    const { z, f, x, y } = tile;
    return {
        z,
        f: Math.max(Math.min(f, 2 ** z), -(2 ** z)),
        x: x < 0 ? x + 2 ** z : x % 2 ** z,
        y: y < 0 ? y + 2 ** z : y % 2 ** z
    };
}
}),
"[project]/lib/ouranos-gex-lib-for-javascript/zfxy_tilehash.ts [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "generateTilehash",
    ()=>generateTilehash,
    "parseZFXYTilehash",
    ()=>parseZFXYTilehash
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ouranos$2d$gex$2d$lib$2d$for$2d$javascript$2f$zfxy$2e$ts__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ouranos-gex-lib-for-javascript/zfxy.ts [api] (ecmascript)");
;
function parseZFXYTilehash(th) {
    let negativeF = false;
    if (th[0] === '-') {
        negativeF = true;
        th = th.substring(1);
    }
    let children = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ouranos$2d$gex$2d$lib$2d$for$2d$javascript$2f$zfxy$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["getChildren"])();
    let lastChild;
    for (const c of th){
        lastChild = {
            ...children[parseInt(c, 10) - 1]
        };
        children = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ouranos$2d$gex$2d$lib$2d$for$2d$javascript$2f$zfxy$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["getChildren"])(lastChild);
    }
    if (negativeF) {
        lastChild.f = -lastChild.f;
    }
    return lastChild;
}
function generateTilehash(tile) {
    let { f, x, y, z } = tile;
    const originalF = f;
    let out = '';
    while(z > 0){
        const thisTile = {
            f: Math.abs(f),
            x: x,
            y: y,
            z: z
        };
        const parent = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ouranos$2d$gex$2d$lib$2d$for$2d$javascript$2f$zfxy$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["getParent"])(thisTile);
        const childrenOfParent = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ouranos$2d$gex$2d$lib$2d$for$2d$javascript$2f$zfxy$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["getChildren"])(parent);
        const positionInParent = childrenOfParent.findIndex((child)=>child.f === Math.abs(f) && child.x === x && child.y === y && child.z === z);
        out = (positionInParent + 1).toString() + out;
        f = parent.f;
        x = parent.x;
        y = parent.y;
        z = parent.z;
    }
    return (originalF < 0 ? '-' : '') + out;
}
}),
"[project]/lib/ouranos-gex-lib-for-javascript/tilebelt.ts [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "bboxToTile",
    ()=>bboxToTile,
    "getBboxZoom",
    ()=>getBboxZoom,
    "pointToTile",
    ()=>pointToTile
]);
const d2r = Math.PI / 180, r2d = 180 / Math.PI, MAX_ZOOM = 28;
function getBboxZoom(bbox) {
    for(let z = 0; z < MAX_ZOOM; z++){
        const mask = 1 << 32 - (z + 1);
        if ((bbox[0] & mask) !== (bbox[2] & mask) || (bbox[1] & mask) !== (bbox[3] & mask)) {
            return z;
        }
    }
    return MAX_ZOOM;
}
function bboxToTile(bboxCoords, minZoom) {
    const min = pointToTile(bboxCoords[0], bboxCoords[1], 32);
    const max = pointToTile(bboxCoords[2], bboxCoords[3], 32);
    const bbox = [
        min[0],
        min[1],
        max[0],
        max[1]
    ];
    const z = Math.min(getBboxZoom(bbox), typeof minZoom !== 'undefined' ? minZoom : MAX_ZOOM);
    if (z === 0) return [
        0,
        0,
        0
    ];
    const x = bbox[0] >>> 32 - z;
    const y = bbox[1] >>> 32 - z;
    return [
        x,
        y,
        z
    ];
}
function pointToTile(lon, lat, z) {
    var tile = pointToTileFraction(lon, lat, z);
    tile[0] = Math.floor(tile[0]);
    tile[1] = Math.floor(tile[1]);
    return tile;
}
/**
 * Get the precise fractional tile location for a point at a zoom level
 */ function pointToTileFraction(lon, lat, z) {
    var sin = Math.sin(lat * d2r), z2 = Math.pow(2, z), x = z2 * (lon / 360 + 0.5), y = z2 * (0.5 - 0.25 * Math.log((1 + sin) / (1 - sin)) / Math.PI);
    // Wrap Tile X
    x = x % z2;
    if (x < 0) x = x + z2;
    return [
        x,
        y,
        z
    ];
}
}),
"[project]/lib/ouranos-gex-lib-for-javascript/index.ts [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Space",
    ()=>Space
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ouranos$2d$gex$2d$lib$2d$for$2d$javascript$2f$zfxy$2e$ts__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ouranos-gex-lib-for-javascript/zfxy.ts [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ouranos$2d$gex$2d$lib$2d$for$2d$javascript$2f$zfxy_tilehash$2e$ts__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ouranos-gex-lib-for-javascript/zfxy_tilehash.ts [api] (ecmascript)");
(()=>{
    const e = new Error("Cannot find module '@turf/bbox'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
(()=>{
    const e = new Error("Cannot find module '@turf/boolean-intersects'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ouranos$2d$gex$2d$lib$2d$for$2d$javascript$2f$tilebelt$2e$ts__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ouranos-gex-lib-for-javascript/tilebelt.ts [api] (ecmascript)");
;
;
;
;
;
const DEFAULT_ZOOM = 25;
class Space {
    center;
    alt;
    zoom;
    zfxy;
    id;
    zfxyStr;
    tilehash;
    /**
   * Create a new Space
   *
   * @param input A LngLatWithAltitude or string containing either a ZFXY or tilehash-encoded ZFXY.
   * @param zoom Optional. Defaults to 25 when `input` is LngLatWithAltitude. Ignored when ZXFY or tilehash is provided.
   */ constructor(input, zoom){
        if (typeof input === 'string') {
            // parse string
            let zfxy = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ouranos$2d$gex$2d$lib$2d$for$2d$javascript$2f$zfxy$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["parseZFXYString"])(input) || (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ouranos$2d$gex$2d$lib$2d$for$2d$javascript$2f$zfxy_tilehash$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["parseZFXYTilehash"])(input);
            if (zfxy) {
                this.zfxy = zfxy;
                this._regenerateAttributesFromZFXY();
            } else {
                throw new Error(`parse ZFXY failed with input: ${input}`);
            }
            return;
        } else if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ouranos$2d$gex$2d$lib$2d$for$2d$javascript$2f$zfxy$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["isZFXYTile"])(input)) {
            this.zfxy = input;
            this._regenerateAttributesFromZFXY();
            return;
        } else {
            this.zfxy = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ouranos$2d$gex$2d$lib$2d$for$2d$javascript$2f$zfxy$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["calculateZFXY"])({
                ...input,
                zoom: typeof zoom !== 'undefined' ? zoom : DEFAULT_ZOOM
            });
        }
        this._regenerateAttributesFromZFXY();
    }
    /* - PUBLIC API - */ up(by = 1) {
        return this.move({
            f: by
        });
    }
    down(by = 1) {
        return this.move({
            f: -by
        });
    }
    north(by = 1) {
        return this.move({
            y: by
        });
    }
    south(by = 1) {
        return this.move({
            y: -by
        });
    }
    east(by = 1) {
        return this.move({
            x: by
        });
    }
    west(by = 1) {
        return this.move({
            x: -by
        });
    }
    move(by) {
        const newSpace = new Space(this.zfxy);
        newSpace.zfxy = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ouranos$2d$gex$2d$lib$2d$for$2d$javascript$2f$zfxy$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["zfxyWraparound"])({
            z: newSpace.zfxy.z,
            f: newSpace.zfxy.f + (by.f || 0),
            x: newSpace.zfxy.x + (by.x || 0),
            y: newSpace.zfxy.y + (by.y || 0)
        });
        newSpace._regenerateAttributesFromZFXY();
        return newSpace;
    }
    parent(atZoom) {
        const steps = typeof atZoom === 'undefined' ? 1 : this.zfxy.z - atZoom;
        return new Space((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ouranos$2d$gex$2d$lib$2d$for$2d$javascript$2f$zfxy$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["getParent"])(this.zfxy, steps));
    }
    children() {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ouranos$2d$gex$2d$lib$2d$for$2d$javascript$2f$zfxy$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["getChildren"])(this.zfxy).map((tile)=>new Space(tile));
    }
    /** Return an array of Space objects at the same zoom level that surround this Space
   * object. This method does not return the Space object itself, so the array will
   * contain 26 Space objects.
   */ surroundings() {
        return [
            ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ouranos$2d$gex$2d$lib$2d$for$2d$javascript$2f$zfxy$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["getSurrounding"])(this.zfxy).filter(({ z, f, x, y })=>`/${z}/${f}/${x}/${y}` !== this.zfxyStr).map((tile)=>new Space(tile)),
            ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ouranos$2d$gex$2d$lib$2d$for$2d$javascript$2f$zfxy$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["getSurrounding"])(this.up().zfxy).map((tile)=>new Space(tile)),
            ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ouranos$2d$gex$2d$lib$2d$for$2d$javascript$2f$zfxy$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["getSurrounding"])(this.down().zfxy).map((tile)=>new Space(tile))
        ];
    }
    /** Returns true if a point lies within this Space. If the position's altitude is not
   * specified, it is ignored from the calculation.
   */ contains(position) {
        const geom = this.toGeoJSON();
        const point = {
            type: 'Point',
            coordinates: [
                position.lng,
                position.lat
            ]
        };
        const floor = this.alt;
        const ceil = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ouranos$2d$gex$2d$lib$2d$for$2d$javascript$2f$zfxy$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["getFloor"])({
            ...this.zfxy,
            f: this.zfxy.f + 1
        });
        return turfBooleanIntersects(geom, point) && (typeof position.alt !== 'undefined' === true ? position.alt >= floor && position.alt < ceil : true);
    }
    /** Calculates the polygon of this Space and returns a 2D GeoJSON Polygon. */ toGeoJSON() {
        const [nw, se] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ouranos$2d$gex$2d$lib$2d$for$2d$javascript$2f$zfxy$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["getBBox"])(this.zfxy);
        return {
            type: 'Polygon',
            coordinates: [
                [
                    [
                        nw.lng,
                        nw.lat
                    ],
                    [
                        nw.lng,
                        se.lat
                    ],
                    [
                        se.lng,
                        se.lat
                    ],
                    [
                        se.lng,
                        nw.lat
                    ],
                    [
                        nw.lng,
                        nw.lat
                    ]
                ]
            ]
        };
    }
    /** Calculates the 3D polygon of this Space and returns the vertices of that polygon. */ vertices3d() {
        const [nw, se] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ouranos$2d$gex$2d$lib$2d$for$2d$javascript$2f$zfxy$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["getBBox"])(this.zfxy);
        const floor = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ouranos$2d$gex$2d$lib$2d$for$2d$javascript$2f$zfxy$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["getFloor"])(this.zfxy);
        const ceil = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ouranos$2d$gex$2d$lib$2d$for$2d$javascript$2f$zfxy$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["getFloor"])({
            ...this.zfxy,
            f: this.zfxy.f + 1
        });
        return [
            [
                nw.lng,
                nw.lat,
                floor
            ],
            [
                nw.lng,
                se.lat,
                floor
            ],
            [
                se.lng,
                se.lat,
                floor
            ],
            [
                se.lng,
                nw.lat,
                floor
            ],
            [
                nw.lng,
                nw.lat,
                ceil
            ],
            [
                nw.lng,
                se.lat,
                ceil
            ],
            [
                se.lng,
                se.lat,
                ceil
            ],
            [
                se.lng,
                nw.lat,
                ceil
            ]
        ];
    }
    static getSpaceById(id, zoom) {
        return new Space(id, zoom);
    }
    static getSpaceByLocation(loc, zoom) {
        return new Space(loc, zoom);
    }
    static getSpaceByZFXY(zfxyStr) {
        return new Space(zfxyStr);
    }
    /** Calculates the smallest spatial ID to fully contain the polygon. Currently only supports 2D polygons. */ static boundingSpaceForGeometry(geom, minZoom) {
        minZoom = minZoom || 25;
        const bbox = turfBBox(geom);
        const largestTile = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ouranos$2d$gex$2d$lib$2d$for$2d$javascript$2f$tilebelt$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["bboxToTile"])(bbox, minZoom);
        const [x, y, z] = largestTile;
        return new Space({
            x,
            y,
            z,
            f: 0
        });
    }
    /** Calculate an array of spaces that make up the polygon. Currently only supports 2D polygons. */ static spacesForGeometry(geom, zoom) {
        const z = zoom;
        if (z === 0) {
            // not recommended.
            return [
                new Space('0/0/0/0')
            ];
        }
        if (geom.type === 'GeometryCollection') {
            throw new Error('GeometryCollection not supported');
        }
        // this can be optimized a lot!
        const bbox = turfBBox(geom), min = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ouranos$2d$gex$2d$lib$2d$for$2d$javascript$2f$tilebelt$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["pointToTile"])(bbox[0], bbox[1], 32), max = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ouranos$2d$gex$2d$lib$2d$for$2d$javascript$2f$tilebelt$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["pointToTile"])(bbox[2], bbox[3], 32), minX = Math.min(min[0], max[0]) >>> 32 - z, minY = Math.min(min[1], max[1]) >>> 32 - z, maxX = (Math.max(max[0], min[0]) >>> 32 - z) + 1, maxY = (Math.max(max[1], min[1]) >>> 32 - z) + 1, spaces = [];
        // scanline polygon fill algorithm
        for(let x = minX; x <= maxX; x++){
            for(let y = minY; y <= maxY; y++){
                const space = new Space({
                    x,
                    y,
                    z,
                    f: 0
                });
                if (turfBooleanIntersects(geom, space.toGeoJSON())) {
                    spaces.push(space);
                }
            }
        }
        return spaces;
    }
    _regenerateAttributesFromZFXY() {
        this.alt = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ouranos$2d$gex$2d$lib$2d$for$2d$javascript$2f$zfxy$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["getFloor"])(this.zfxy);
        this.center = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ouranos$2d$gex$2d$lib$2d$for$2d$javascript$2f$zfxy$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["getCenterLngLatAlt"])(this.zfxy);
        this.zoom = this.zfxy.z;
        this.id = this.tilehash = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ouranos$2d$gex$2d$lib$2d$for$2d$javascript$2f$zfxy_tilehash$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["generateTilehash"])(this.zfxy);
        this.zfxyStr = `/${this.zfxy.z}/${this.zfxy.f}/${this.zfxy.x}/${this.zfxy.y}`;
    }
}
}),
"[project]/pages/api/spatial-id.ts [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>handler
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ouranos$2d$gex$2d$lib$2d$for$2d$javascript$2f$index$2e$ts__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ouranos-gex-lib-for-javascript/index.ts [api] (ecmascript)");
;
function handler(req, res) {
    const { lat, lon, zoom = '25', alt } = req.query;
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    const zoomNum = parseInt(zoom, 10);
    const altNum = alt !== undefined ? parseFloat(alt) : undefined;
    if (Number.isNaN(latNum) || Number.isNaN(lonNum)) {
        res.status(400).json({
            error: 'lat と lon は必須です'
        });
        return;
    }
    if (latNum < -85.0511287798 || latNum > 85.0511287798) {
        res.status(400).json({
            error: 'lat の範囲は ±85.0511287798'
        });
        return;
    }
    if (lonNum < -180 || lonNum > 180) {
        res.status(400).json({
            error: 'lon の範囲は ±180'
        });
        return;
    }
    if (zoomNum < 0 || zoomNum > 35) {
        res.status(400).json({
            error: 'zoom は 0〜35'
        });
        return;
    }
    try {
        const space = new __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ouranos$2d$gex$2d$lib$2d$for$2d$javascript$2f$index$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["Space"]({
            lng: lonNum,
            lat: latNum,
            alt: altNum
        }, zoomNum);
        res.setHeader('Access-Control-Allow-Origin', '*'); // デモ用CORS
        res.status(200).json({
            result: {
                zfxyStr: space.zfxyStr,
                tilehash: space.tilehash,
                zfxy: space.zfxy,
                zoom: space.zoom,
                center: space.center,
                alt: space.alt
            }
        });
    } catch (e) {
        res.setHeader('Access-Control-Allow-Origin', '*'); // デモ用CORS
        res.status(500).json({
            error: String(e)
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__a43c6a8d._.js.map