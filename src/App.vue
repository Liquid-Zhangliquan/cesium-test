<template>
  <div class="pbody">
    <div id="cesiumContainer"></div>
    <div id="maptalks-container"></div>
  </div>
</template>

<script>
import Cesium from "cesium/Cesium";
import * as THREE from "three";
import * as maptalks from "maptalks";
import { CesiumLayer } from "./lib/maptalks/maptalks.cesium";
import { ThreeLayer } from "maptalks.three";
import "cesium/Widgets/widgets.css";
console.log(THREE)
export default {
  name: "CesiumScene",
  data() {
    return {};
  },
  mounted() {
    this.init();
  },
  methods: {
    init() {
      this.maptalksInit();
      this.cesiumInit();
    },
    maptalksInit() {
      Cesium.BingMapsApi.defaultKey =
        "ApD3P1iMWEcs7okcQD2-idlF4bgGLMqF_p6ZKYovVeX80cmjpWzR5EZs9E_I2tXn";
      const map = new maptalks.Map("maptalks-container", {
        center: [116.96331820577404, 36.256177496939216], //[-1.25968, 51.74625],//[121.392825741, 31.1456282355],
        zoom: 15,
        pitch: 64,
        bearing: -48,
        // fov: 36.86989764584402,
        centerCross: true,
        baseLayer: new maptalks.TileLayer('googlemap', {
          style: 'Satellite',
          urlTemplate: 'http://www.google.cn/maps/vt?lyrs=s@189&gl=cn&x={x}&y={y}&z={z}'
        })
      });
      this.map = map;

      const cesiumLayer = new CesiumLayer("cesium", { gray: false }).addTo(map);
      //获取cesium scene对象
      const scene = cesiumLayer.getCesiumScene();

      const maptms = new Cesium.createTileMapServiceImageryProvider({
        url: "maps/vt?lyrs=s@189&gl=cn&x={x}&y={y}&z={z}"
      });
      scene.imageryLayers.addImageryProvider(maptms);

      // 加载terrain高程数据
      scene.terrainProvider = new Cesium.createWorldTerrain();
      // const terrainLayer = new Cesium.CesiumTerrainProvider({
      //   url: 'srtm_60_05'
      //   // url: 'http://assets.agi.com/stk-terraub/world',
      //   // requestVertexNormals: true,
      // });
      // scene.terrainProvider = terrainLayer;

      // this.threeInit();
    },
    threeInit() {
      const map = this.map
      // the ThreeLayer to draw smoke
      var threeLayer = new ThreeLayer("t", {
        forceRenderOnMoving: true,
        forceRenderOnZooming: true,
        forceRenderOnRotating: true,
        opacity: 0.6
      });

      var clock;
      var smokeParticles = [];
      // prepare data, load mtl into three scene.
      threeLayer.prepareToDraw = function(gl, scene, camera) {
        var light = new THREE.DirectionalLight(
          new THREE.Color("rgb(255, 255, 255)")
        );
        light.position.set(-1, 0, 1);
        scene.add(light);

        clock = new THREE.Clock();
        var loader = new THREE.TextureLoader();

        loader.crossOrigin = "";
        const smokeImg = require('./asset/images/gray-smoke.png')

        loader.load(smokeImg, function onLoad(texture) {
          var smokeGeo = new THREE.PlaneBufferGeometry(50, 50);

          var smokeMaterial = new THREE.MeshLambertMaterial({
            map: texture,
            transparent: true
          });

          for (var p = 0, l = 100; p < l; p++) {
            var particle = new THREE.Mesh(smokeGeo, smokeMaterial);
            var extent = map.getExtent();
            var x = extent.xmin + Math.random() * extent.getWidth();
            var y = extent.ymin + Math.random() * extent.getHeight();
            // var x = extent.xmin + extent.getWidth() / 10 * (p % 10);
            // var y = extent.ymin + extent.getHeight() / 10 * Math.floor(p / 10);
            var v = threeLayer.coordinateToVector3(
              new maptalks.Coordinate(x, y)
            );
            particle.position.set(v.x, v.y, Math.random() * 360);

            particle.rotation.z = Math.random() * 360;
            scene.add(particle);
            smokeParticles.push(particle);
          }

          animate();
        });
      };

      function animate() {
        var delta = clock.getDelta();
        requestAnimationFrame(animate);

        [].forEach.call(smokeParticles, function(sp) {
          sp.rotation.z += delta * 0.2;
        });

        threeLayer.renderScene();
      }

      threeLayer.draw = function() {
        this.renderScene();
      };

      threeLayer.drawOnInteracting = function() {
        this.renderScene();
      };

      threeLayer.addTo(map);
    },
    cesiumInit() {
      const viewerOption = {
        geocoder: false, // 地理位置查询定位控件
        homeButton: false, // 默认相机位置控件
        timeline: false, // 时间滚动条控件
        navigationHelpButton: false, // 默认的相机控制提示控件
        fullscreenButton: false, // 全屏控件
        scene3DOnly: true, // 每个几何实例仅以3D渲染以节省GPU内存
        baseLayerPicker: false, // 底图切换控件
        animation: false, // 控制场景动画的播放速度控件
        terrainProvider: new Cesium.createWorldTerrain() // 世界地形
        // infoBox : false,
        // selectionIndicator : false,
        // shadows : true,
        // shouldAnimate : true
      };

      const viewer = new Cesium.Viewer("cesiumContainer", viewerOption);
      viewer.scene.globe.enableLighting = true;
      viewer.scene.globe.depthTestAgainstTerrain = true; // 防止模型漂移
      viewer._cesiumWidget._creditContainer.style.display = "none"; // 隐藏版权
      this.viewer = viewer;

      // this.loadImager();

      // 飞行至指定位置
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          116.98747630488648,
          36.23262766434629,
          2523.9028939870395
        ),
        orientation: {
          heading: 5.274448271294485,
          pitch: -0.6991358991569188,
          roll: 6.279643664014511
        }
      });
    },
    loadImager() {
      const viewer = this.viewer;
      // 添加注记
      viewer.imageryLayers.addImageryProvider(
        new Cesium.WebMapTileServiceImageryProvider({
          url:
            "cva_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=cva&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=39a4ceb78b2abd7a076551494f1c4fd0",
          layer: "tdtAnnoLayer",
          style: "default",
          format: "image/jpeg",
          tileMatrixSetID: "GoogleMapsCompatible",
          show: false
        })
      );
    },
    initCameraEnd() {
      const viewer = this.viewer;
      this.camera = viewer.camera;
      viewer.scene.camera.moveEnd.addEventListener(() => {
        // console.log(this.camera);
        // const camera = this.camera;
        // const heading = camera.heading;
        // const pitch = camera.pitch;
        // const roll = camera.roll;
        // const position = camera.position;
        // const cartographic = new Cesium.Cartographic.fromCartesian(position);
        // const longitude = new Cesium.Math.toDegrees(cartographic.longitude);
        // const latitude = new Cesium.Math.toDegrees(cartographic.latitude);
        // const height = cartographic.height;
        // console.log(longitude + ',' + latitude + ',' + height + ',' + heading + ',' + pitch + ',' + roll);
      });
    }
  }
};
</script>

<style>
html,
body {
  width: 100%;
  height: 100%;
  margin: 0px;
  padding: 0px;
}
.pbody {
  width: 100%;
  height: 100%;
  margin: 0px;
  padding: 0px;
}
#cesiumContainer {
  margin: 0px;
  padding: 0px;
  width: 50%;
  height: 100%;
  float: left;
}
#maptalks-container {
  margin: 0px;
  padding: 0px;
  width: 50%;
  height: 100%;
  float: left;
}
</style>
