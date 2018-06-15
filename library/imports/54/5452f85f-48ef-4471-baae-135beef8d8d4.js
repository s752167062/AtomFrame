"use strict";
cc._RF.push(module, '5452fhfSO9EcbquE1vu+NjU', 'memoryDetector');
// Script/AtomFrame/memoryDetector.js

"use strict";

cc.Class({
    extends: cc.Component,

    properties: {
        TAG: "MemoryDetector"
    },

    ctor: function ctor() {
        console.log("-new:" + this.TAG);
    },

    onLoad: function onLoad() {
        console.log("-load:" + this.TAG);
    },

    onDestroy: function onDestroy() {
        console.log("-destory:" + this.TAG);
    },

    showMemoryStatus: function showMemoryStatus() {
        if (cc.sys.isNative) {
            return;
        }

        var _memLabel = null;
        var profiler = cc.profiler;
        profiler.showStats();

        var createMemLabel = function createMemLabel() {
            _memLabel = document.createElement('div');
            profiler._fps = document.getElementById('fps');
            profiler._fps.style.height = '100px';

            var style = _memLabel.style;
            style.color = 'rgb(0, 255, 255)';
            style.font = 'bold 12px Helvetica, Arial';
            style.lineHeight = '20px;';
            style.width = '100%';
            profiler._fps.appendChild(_memLabel);
        };

        createMemLabel();

        var afterVisit = function afterVisit() {
            var count = 0;
            var totalBytes = 0;
            var locTexrues = cc.textureCache._textures;

            for (var key in locTexrues) {
                var selTexture = locTexrues[key];
                count++;
                totalBytes += selTexture.getPixelWidth() * selTexture.getPixelHeight() * 4;
            }

            var locTextureColorsCache = cc.textureCache._textureColorsCache;

            for (var _key in locTextureColorsCache) {
                var selCanvasColorsArr = locTextureColorsCache[_key];
                for (var selCanvasKey in selCanvasColorsArr) {
                    var selCanvas = selCanvasColorsArr[selCanvasKey];
                    count++;
                    totalBytes += selCanvas.width * selCanvas.height * 4;
                }
            }

            _memLabel.innerHTML = "  Memory  " + (totalBytes / (1024.0 * 1024.0)).toFixed(2) + " M";
        };

        cc.director.on(cc.Director.EVENT_AFTER_VISIT, afterVisit);
        this._inited = true;
    }
});

cc._RF.pop();