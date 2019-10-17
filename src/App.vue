<template>
  <div class="pbody">
    <div id="cesiumContainer"></div>
    <div id="maptalks-container"></div>
  </div>
</template>

<script>
import Cesium from 'cesium/Cesium';
import Bezier from 'bezier-js';
import * as THREE from 'three';
import * as maptalks from 'maptalks';
// import { CesiumLayer } from "./lib/maptalks/maptalks.cesium";
import { ThreeLayer } from 'maptalks.three';
import 'cesium/Widgets/widgets.css';
export default {
  name: 'CesiumScene',
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
      this.BezierInit();
    },
    maptalksInit() {
      Cesium.BingMapsApi.defaultKey = 'ApD3P1iMWEcs7okcQD2-idlF4bgGLMqF_p6ZKYovVeX80cmjpWzR5EZs9E_I2tXn';
      const map = new maptalks.Map('maptalks-container', {
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

      // const cesiumLayer = new CesiumLayer("cesium", { gray: false }).addTo(map);
      // //获取cesium scene对象
      // const scene = cesiumLayer.getCesiumScene();

      // const maptms = new Cesium.createTileMapServiceImageryProvider({
      //   url: "maps/vt?lyrs=s@189&gl=cn&x={x}&y={y}&z={z}"
      // });
      // scene.imageryLayers.addImageryProvider(maptms);

      // // 加载terrain高程数据
      // scene.terrainProvider = new Cesium.createWorldTerrain();
      // const terrainLayer = new Cesium.CesiumTerrainProvider({
      //   url: 'srtm_60_05'
      //   // url: 'http://assets.agi.com/stk-terraub/world',
      //   // requestVertexNormals: true,
      // });
      // scene.terrainProvider = terrainLayer;

      // this.threeInit();
    },
    threeInit() {
      const map = this.map;
      // the ThreeLayer to draw smoke
      var threeLayer = new ThreeLayer('t', {
        forceRenderOnMoving: true,
        forceRenderOnZooming: true,
        forceRenderOnRotating: true,
        opacity: 0.6
      });

      var clock;
      var smokeParticles = [];
      // prepare data, load mtl into three scene.
      threeLayer.prepareToDraw = function(gl, scene, camera) {
        var light = new THREE.DirectionalLight(new THREE.Color('rgb(255, 255, 255)'));
        light.position.set(-1, 0, 1);
        scene.add(light);

        clock = new THREE.Clock();
        var loader = new THREE.TextureLoader();

        loader.crossOrigin = '';
        const smokeImg = require('./assets/images/gray-smoke.png');

        loader.load(smokeImg, function onLoad(texture) {
          var smokeGeo = new THREE.PlaneBufferGeometry(250, 250);

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
            var v = threeLayer.coordinateToVector3(new maptalks.Coordinate(x, y));
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

      const viewer = new Cesium.Viewer('cesiumContainer', viewerOption);
      viewer.scene.globe.enableLighting = true;
      viewer.scene.globe.depthTestAgainstTerrain = true; // 防止模型漂移
      viewer._cesiumWidget._creditContainer.style.display = 'none'; // 隐藏版权
      this.viewer = viewer;

      // this.loadImager();

      // 飞行至指定位置
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(116.98747630488648, 36.23262766434629, 2523.9028939870395),
        orientation: {
          heading: 5.274448271294485,
          pitch: -0.6991358991569188,
          roll: 6.279643664014511
        }
      });
    },
    BezierInit() {
      const lonlat = [
        { x: 116.36, y: 30.56, z: 100 },
        { x: 116.355, y: 30.565, z: 80 },
        { x: 116.35, y: 30.57, z: 100 }
      ];
      const curvePoints = new Bezier(lonlat).getLUT();
      const points = [];
      curvePoints.map(p => points.push(p.x, p.y, p.z));
      console.log(points);
    },
    loadImager() {
      const viewer = this.viewer;
      // 添加注记
      viewer.imageryLayers.addImageryProvider(
        new Cesium.WebMapTileServiceImageryProvider({
          url:
            'cva_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=cva&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=39a4ceb78b2abd7a076551494f1c4fd0',
          layer: 'tdtAnnoLayer',
          style: 'default',
          format: 'image/jpeg',
          tileMatrixSetID: 'GoogleMapsCompatible',
          show: false
        })
      );
    },
    initCameraEnd() {
      const viewer = this.viewer;
      this.camera = viewer.camera;
      viewer.scene.camera.moveEnd.addEventListener(evt => {
        console.log(this.camera);
        const camera = this.camera;
        const heading = camera.heading;
        const pitch = camera.pitch;
        const roll = camera.roll;
        const position = camera.position;
        const cartographic = Cesium.Cartographic.fromCartesian(position);
        const longitude = Cesium.Math.toDegrees(cartographic.longitude);
        const latitude = Cesium.Math.toDegrees(cartographic.latitude);
        const height = cartographic.height;
        console.log(longitude + ',' + latitude + ',' + height + ',' + heading + ',' + pitch + ',' + roll);
      });
    },
    initScenePick() {
      const me = this;
      const viewer = this.viewer;
      const scene = viewer.scene;
      const points = [];
      const points2 = [];
      const points3 = [];
      const positions = [];
      this.sceneEventHandler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
      this.sceneEventHandler.setInputAction(movement => {
        const ray = viewer.camera.getPickRay(movement.position);
        const cartesian = viewer.scene.globe.pick(ray, viewer.scene);
        const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        const lng = Cesium.Math.toDegrees(cartographic.longitude);
        const lat = Cesium.Math.toDegrees(cartographic.latitude);
        const height = cartographic.height;
        points.push({ x: lng, y: lat, z: height + 42 });
        points2.push({ x: lng + 0.00005, y: lat + 0.00005, z: height + 42 });
        points3.push({ x: lng - 0.00005, y: lat - 0.00005, z: height + 42 });
        if (points.length === 2) {
          // 摆动区间
          me.swingArr = [
            { x: (points2[0].x + points2[1].x) / 2, y: (points2[0].y + points2[1].y) / 2, z: height + 28 },
            { x: (points3[0].x + points3[1].x) / 2, y: (points3[0].y + points3[1].y) / 2, z: height + 28 }
          ];
          const p11 = points[0];
          const p12 = { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2, z: height + 20 };
          const p13 = points[1];
          this.loadLine([p11, p12, p13]);
          const p21 = points2[0];
          const p22 = { x: (points2[0].x + points2[1].x) / 2, y: (points2[0].y + points2[1].y) / 2, z: height + 20 };
          const p23 = points2[1];
          this.loadLine([p21, p22, p23]);
          const p31 = points3[0];
          const p32 = { x: (points3[0].x + points3[1].x) / 2, y: (points3[0].y + points3[1].y) / 2, z: height + 20 };
          const p33 = points3[1];
          this.loadLine([p31, p32, p33]);
        }
        positions.push(lng, lat);
        console.log(positions);
        const worldPostion = scene.pickPosition(movement.position);
        const cartographic1 = Cesium.Cartographic.fromCartesian(worldPostion);
        console.log(cartographic + ',' + cartographic1);
        this.addGltfByEntities(worldPostion);
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    },
    addGltfByPrimitives(position) {
      // 异步加载模型
      const viewer = this.viewer;
      const modelMatrix = new Cesium.Transforms.eastNorthUpToFixedFrame(position);
      const model = viewer.scene.primitives.add(
        new Cesium.Model.fromGltf({
          url: 'srtm_60_05/电线杆2.glb', // 模型文件相对路径 ，支持gltf和glb两种文件格式
          modelMatrix,
          scale: 50 // 调整模型在地图中的大小
        })
      );
    },
    addGltfByEntities(position) {
      // 同步加载模型
      const viewer = this.viewer;
      // viewer.entities.removeAll();

      // const position = Cesium.Cartesian3.fromDegrees(-123.0744619, 44.0503706, height);
      const heading = Cesium.Math.toRadians(0);
      const pitch = 0;
      const roll = 0;
      const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
      const orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);

      const url = 'srtm_60_05/电线杆1.glb';
      const entity = viewer.entities.add({
        name: url,
        position,
        orientation,
        model: {
          uri: url,
          scale: 0.6,
          // minimumPixelSize: 200,
          // maximumScale: 250,
          runAnimations: true, // 是否显示动画
          clampAnimations: true, // 是否保持最后一针的动画
          // color:Cesium.Color.RED,// 颜色
          color: Cesium.Color.fromAlpha(Cesium.Color.RED, parseFloat(1.0)), // 包含透明度的颜色
          colorBlendMode: Cesium.ColorBlendMode.MIX, // 常用的有三个HIGHLIGHT,REPLACE,MIX
          colorBlendAmount: 0.1 // 这个属性必须是MIX混合属性才能生效,见colorBlendMode
        }
      });
      // viewer.trackedEntity = entity;
    },
    addLine(positions) {
      // positions [{x,y,z},{x,y,z}...]  points [x,y,z,x,y,z...]

      const me = this;
      const viewer = this.viewer;
      const start = Cesium.JulianDate.fromDate(new Date(2019, 10, 16, 12, 0, 0));
      const midle = Cesium.JulianDate.addSeconds(start, 2, new Cesium.JulianDate());
      const stop = Cesium.JulianDate.addSeconds(start, 4, new Cesium.JulianDate());
      viewer.clock.startTime = start.clone();
      viewer.clock.stopTime = stop.clone();
      viewer.clock.currentTime = start.clone();
      viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
      viewer.clock.multiplier = 1;
      viewer.clock.shouldAnimate = true;
      this.wirePositon = new Cesium.CallbackProperty((time, result) => {
        const currentTime = Cesium.JulianDate.toDate(time);
        const secood = currentTime.getSeconds();
        const polyline = me.polelineEntity.polyline;
        const oldCoord = polyline.coord;
        const swingArr = me.swingArr;
        const height = oldCoord[1].z;
        let x = oldCoord[1].x;
        let y = oldCoord[1].y;
        if (secood < 2) {
          x += 0.0000025;
          y += 0.0000025;
          // height += 1
        } else {
          x -= 0.0000025;
          y -= 0.0000025;
          // height -= 1
        }
        const p = { x, y, z: height };
        const positions1 = [oldCoord[0], p, oldCoord[2]];
        const points = this.getBezier(positions1);
        me.polelineEntity.polyline.coord = positions1;
        return Cesium.Cartesian3.fromDegreesArrayHeights(points);
      }, false);
      const polelineEntity = viewer.entities.add({
        name: 'Orange line with black outline at height and following the surface',
        polyline: {
          positions: this.wirePositon,
          width: 2,
          material: new Cesium.PolylineOutlineMaterialProperty({
            color: Cesium.Color.fromBytes(127, 127, 127, 204),
            outlineWidth: 1,
            arcType: Cesium.ArcType.RHUMB,
            outlineColor: Cesium.Color.fromBytes(127, 127, 127, 204)
          })
        }
      });
      polelineEntity.polyline.coord = positions;
      this.polelineEntity = polelineEntity;
      // this.lineSwing();
    },
    loadTelePoleByData() {
      const Cartesian = [
        { x: -2336342.7989116465, y: 4589405.027140834, z: 3750686.555703235 },
        { x: -2336044.570262557, y: 4589577.91963994, z: 3750677.8739677137 }
      ];
      const lnglatheight = [
        { x: 116.97943135941252, y: 36.24942296439618, z: 232.20968931984262 },
        { x: 116.97562128548716, y: 36.24929053846515, z: 241.96765896501879 }
      ];
      // 同步加载模型
      const viewer = this.viewer;
      const url = 'srtm_60_05/电线杆1.glb';
      Cartesian.forEach((item, index, arr) => {
        const position = new Cesium.Cartesian3(item.x, item.y, item.z);
        const heading = Cesium.Math.toRadians(0);
        const pitch = 0;
        const roll = 0;
        const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
        const orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);

        const entity = viewer.entities.add({
          name: url,
          // position, // need depthTestAgainstTerrain = true
          position: Cesium.Cartesian3.fromDegrees(lnglatheight[index].x, lnglatheight[index].y, lnglatheight[index].z),
          orientation,
          model: {
            uri: url,
            scale: 0.6,
            // minimumPixelSize: 200,
            // maximumScale: 250,
            runAnimations: true, // 是否显示动画
            clampAnimations: true, // 是否保持最后一针的动画
            // color:Cesium.Color.RED,// 颜色
            color: Cesium.Color.fromAlpha(Cesium.Color.RED, parseFloat(1.0)), // 包含透明度的颜色
            colorBlendMode: Cesium.ColorBlendMode.MIX, // 常用的有三个HIGHLIGHT,REPLACE,MIX
            colorBlendAmount: 0.1 // 这个属性必须是MIX混合属性才能生效,见colorBlendMode
          }
        });
      });
    },
    loadLineByData() {
      const me = this;
      const viewer = this.viewer;
      const start = Cesium.JulianDate.fromDate(new Date(2019, 10, 16, 12, 0, 0));
      const midle = Cesium.JulianDate.addSeconds(start, 2, new Cesium.JulianDate());
      const stop = Cesium.JulianDate.addSeconds(start, 4, new Cesium.JulianDate());
      viewer.clock.startTime = start.clone();
      viewer.clock.stopTime = stop.clone();
      viewer.clock.currentTime = start.clone();
      viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
      viewer.clock.multiplier = 1;
      viewer.clock.shouldAnimate = true;
      const startPoints = [
        116.97943135941252,
        36.24942296439618,
        232.20968931984262,
        116.97945241815192,
        36.24936083927869,
        232.33457102495984,
        116.97942305031313,
        36.249492237446425,
        231.74044207730992
      ];
      const endPoints = [
        116.97562128548716,
        36.24929053846515,
        241.96765896501879,
        116.97562199183655,
        36.24922231811628,
        242.11267302880728,
        116.97561889320934,
        36.24935343993917,
        241.8326815307327
      ];
      const linePath1 = [
        { x: startPoints[0], y: startPoints[1], z: startPoints[2] + 44 },
        {
          x: (startPoints[0] + endPoints[0]) / 2,
          y: (startPoints[1] + endPoints[1]) / 2,
          z: (startPoints[2] + endPoints[2]) / 2 + 20
        },
        { x: endPoints[0], y: endPoints[1], z: endPoints[2] + 44 }
      ];
      const linePath2 = [
        { x: startPoints[3], y: startPoints[4], z: startPoints[5] + 44 },
        {
          x: (startPoints[3] + endPoints[3]) / 2,
          y: (startPoints[4] + endPoints[4]) / 2,
          z: (startPoints[5] + endPoints[5]) / 2 + 20
        },
        { x: endPoints[3], y: endPoints[4], z: endPoints[5] + 44 }
      ];
      const linePath3 = [
        { x: startPoints[6], y: startPoints[7], z: startPoints[8] + 44 },
        {
          x: (startPoints[6] + endPoints[6]) / 2,
          y: (startPoints[7] + endPoints[7]) / 2,
          z: (startPoints[8] + endPoints[8]) / 2 + 20
        },
        { x: endPoints[6], y: endPoints[7], z: endPoints[8] + 44 }
      ];
      const PATH = [linePath1, linePath2, linePath3];
      const wirePositon1 = new Cesium.CallbackProperty((time, result) => {
        const currentTime = Cesium.JulianDate.toDate(time);
        const secood = currentTime.getSeconds();
        const polyline = me.polelineEntity1.polyline;
        const oldCoord = polyline.coord;
        const height = oldCoord[1].z;
        let x = oldCoord[1].x;
        let y = oldCoord[1].y;
        if (secood < 2) {
          x += 0.0000025;
          y += 0.0000025;
        } else {
          x -= 0.0000025;
          y -= 0.0000025;
        }
        const p = { x, y, z: height };
        const positions = [oldCoord[0], p, oldCoord[2]];
        const points = me.getBezier(positions);
        me.polelineEntity1.polyline.coord = positions;
        return Cesium.Cartesian3.fromDegreesArrayHeights(points);
      }, false);
      const polelineEntity1 = viewer.entities.add({
        name: 'Orange line with black outline at height and following the surface',
        polyline: {
          positions: wirePositon1,
          width: 2,
          material: new Cesium.PolylineOutlineMaterialProperty({
            color: Cesium.Color.fromBytes(127, 127, 127, 204),
            outlineWidth: 1,
            arcType: Cesium.ArcType.RHUMB,
            outlineColor: Cesium.Color.fromBytes(127, 127, 127, 204)
          })
        }
      });
      polelineEntity1.polyline.coord = PATH[0];
      me.polelineEntity1 = polelineEntity1;

      const wirePositon2 = new Cesium.CallbackProperty((time, result) => {
        const currentTime = Cesium.JulianDate.toDate(time);
        const secood = currentTime.getSeconds();
        const polyline = me.polelineEntity2.polyline;
        const oldCoord = polyline.coord;
        const height = oldCoord[1].z;
        let x = oldCoord[1].x;
        let y = oldCoord[1].y;
        if (secood < 2) {
          x += 0.0000025;
          y += 0.0000025;
        } else {
          x -= 0.0000025;
          y -= 0.0000025;
        }
        const p = { x, y, z: height };
        const positions = [oldCoord[0], p, oldCoord[2]];
        const points = this.getBezier(positions);
        me.polelineEntity2.polyline.coord = positions;
        return Cesium.Cartesian3.fromDegreesArrayHeights(points);
      }, false);
      const polelineEntity2 = viewer.entities.add({
        name: 'Orange line with black outline at height and following the surface',
        polyline: {
          positions: wirePositon2,
          width: 2,
          material: new Cesium.PolylineOutlineMaterialProperty({
            color: Cesium.Color.fromBytes(127, 127, 127, 204),
            outlineWidth: 1,
            arcType: Cesium.ArcType.RHUMB,
            outlineColor: Cesium.Color.fromBytes(127, 127, 127, 204)
          })
        }
      });
      polelineEntity2.polyline.coord = PATH[1];
      me.polelineEntity2 = polelineEntity2;

      const wirePositon3 = new Cesium.CallbackProperty((time, result) => {
        const currentTime = Cesium.JulianDate.toDate(time);
        const secood = currentTime.getSeconds();
        const polyline = me.polelineEntity3.polyline;
        const oldCoord = polyline.coord;
        const height = oldCoord[1].z;
        let x = oldCoord[1].x;
        let y = oldCoord[1].y;
        if (secood < 2) {
          x += 0.0000025;
          y += 0.0000025;
        } else {
          x -= 0.0000025;
          y -= 0.0000025;
        }
        const p = { x, y, z: height };
        const positions = [oldCoord[0], p, oldCoord[2]];
        const points = this.getBezier(positions);
        me.polelineEntity3.polyline.coord = positions;
        return Cesium.Cartesian3.fromDegreesArrayHeights(points);
      }, false);
      const polelineEntity3 = viewer.entities.add({
        name: 'Orange line with black outline at height and following the surface',
        polyline: {
          positions: wirePositon3,
          width: 2,
          material: new Cesium.PolylineOutlineMaterialProperty({
            color: Cesium.Color.fromBytes(127, 127, 127, 204),
            outlineWidth: 1,
            arcType: Cesium.ArcType.RHUMB,
            outlineColor: Cesium.Color.fromBytes(127, 127, 127, 204)
          })
        }
      });
      polelineEntity3.polyline.coord = PATH[2];
      me.polelineEntity3 = polelineEntity3;
    },
    getBezier(positions) {
      // input [{x,y,z}] out [x,y,z,x,y,z...]
      const curvePoints = new Bezier(positions).getLUT();
      const points = [];
      curvePoints.map(p => points.push(p.x, p.y, p.z));
      return points;
    },
    lineSwing() {
      // 线条舞动
      const polyline = this.polelineEntity.polyline;
      const oldCoord = polyline.coord;
      const swingArr = this.swingArr;
      let height = oldCoord[1].z;
      let x = oldCoord[1].x;
      let y = oldCoord[1].y;
      // height += 1;
      if (height > 242) {
        height -= 1;
        x = swingArr[0].x;
        y = swingArr[0].y;
      } else {
        height += 1;
        x = swingArr[1].x;
        y = swingArr[1].y;
      }
      const p = { x, y, z: height };
      const positions = [oldCoord[0], p, oldCoord[2]];
      console.log(positions);
      polyline.position = this.getBezier(positions);
      polyline.coord = positions;
      requestAnimationFrame(this.lineSwing);
    },
    loadFreezeRoad() {
      const viewer = this.viewer;
      fetch('srtm_60_05/jn_road.json').then(response => {
        response.json().then(res => {
          const RoadPoint = res.data;
          const polygon = new Cesium.PolygonGeometry({
            polygonHierarchy: new Cesium.PolygonHierarchy(Cesium.Cartesian3.fromDegreesArray(RoadPoint)),
            extrudedHeight: 0,
            height: 3,
            vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT
          });
          const inc = new Cesium.GeometryInstance({
            geometry: polygon
          });
          const Road = new Cesium.Primitive({
            geometryInstances: [inc],
            appearance: new Cesium.EllipsoidSurfaceAppearance({
              aboveGround: true
            }),
            show: true
          });
          const RoadMaterial = new Cesium.Material({
            fabric: {
              type: 'Image',
              uniforms: {
                image: 'srtm_60_05/images/ice2.jpg'
              }
            }
          });
          Road.appearance.material = RoadMaterial;
          viewer.scene.primitives.add(Road);
        });
      });
    },
    loadFogByPostProcessStage() {
      // 暂弃
      let fogStage = Cesium.PostProcessStageLibrary.createBrightnessStage();
      // 2 整个场景通过后期渲染变亮 1为保持不变 大于1变亮 0-1变暗 uniforms后面为对应glsl里面定义的uniform参数
      const brightness = 0;
      fogStage.uniforms.brightness = brightness;
      const fs =
        '  uniform sampler2D colorTexture;\n' +
        '  uniform sampler2D depthTexture;\n' +
        '  varying vec2 v_textureCoordinates;\n' +
        '  void main(void)\n' +
        '  {\n' +
        '      vec4 origcolor=texture2D(colorTexture, v_textureCoordinates);\n' +
        '      vec4 fogcolor=vec4(0.8,0.8,0.8,0.6);\n' +
        '\n' +
        '      float depth = czm_readDepth(depthTexture, v_textureCoordinates);\n' +
        '      vec4 depthcolor=texture2D(depthTexture, v_textureCoordinates);\n' +
        '\n' +
        '      float f=(depthcolor.r-0.22)/0.2;\n' +
        '      if(f<0.0) f=0.0;\n' +
        '      else if(f>1.0) f=1.0;\n' +
        '      gl_FragColor = mix(origcolor,fogcolor,f);\n' +
        '   }';
      fogStage = new Cesium.PostProcessStage({
        name: 'self',
        // sampleMode: PostProcessStageSampleMode.NEAREST, // LINEAR NEAREST
        fragmentShader: fs
      });
      fogStage.colorR = 0.22;
      fogStage.enabled = true;
      const viewer = this.viewer;
      viewer.scene.postProcessStages.add(fogStage);
      this.animateFog();
    },
    animateFog() {
      const viewer = this.viewer;
      const fogArr = viewer.scene.postProcessStages._activeStages;
      if (fogArr.length !== 0) {
        // viewer.scene.postProcessStages.remove(fogArr[0]);
        const oldFogStage = fogArr[0];
        const colorR = oldFogStage.colorR + 0.001;
        const fs =
          '  uniform sampler2D colorTexture;\n' +
          '  uniform sampler2D depthTexture;\n' +
          '  varying vec2 v_textureCoordinates;\n' +
          '  void main(void)\n' +
          '  {\n' +
          '      vec4 origcolor=texture2D(colorTexture, v_textureCoordinates);\n' +
          '      vec4 fogcolor=vec4(0.8,0.8,0.8,0.6);\n' +
          '\n' +
          '      float depth = czm_readDepth(depthTexture, v_textureCoordinates);\n' +
          '      vec4 depthcolor=texture2D(depthTexture, v_textureCoordinates);\n' +
          '\n' +
          '      float f=(depthcolor.r-' +
          colorR +
          ')/0.2;\n' +
          '      if(f<0.0) f=0.0;\n' +
          '      else if(f>1.0) f=1.0;\n' +
          '      gl_FragColor = mix(origcolor,fogcolor,f);\n' +
          '   }';

        // let fogStage = Cesium.PostProcessStageLibrary.createBrightnessStage();
        // fogStage = new Cesium.PostProcessStage({
        //   name: 'self',
        //   fragmentShader: fs
        // });
        // fogStage.enabled = true;
        oldFogStage._fragmentShader = fs;
        oldFogStage.colorR = colorR;
        // viewer.scene.postProcessStages.add(oldFogStage);
      }
      requestAnimationFrame(this.animateFog);
    },
    loadFotByClass() {
      const fog = this.viewer.scene.fog;
      fog.density = 0.0003; // [0.0, 1.0] default 0.0002
      // fog.screenSpaceErrorFactor = 2; // default 2
      // fog.minimumBrightness = 0.03; // default 0.03
      fog.enabled = true;
      console.log(fog);
    },
    loadFreezeRoadByPrimitive() {
      const viewer = this.viewer;
      fetch('srtm_60_05/jn_road.json').then(response => {
        response.json().then(res => {
          const RoadPoint = res.data;
          const polygon = new Cesium.PolygonGeometry({
            polygonHierarchy: new Cesium.PolygonHierarchy(Cesium.Cartesian3.fromDegreesArrayHeights(RoadPoint)),
            extrudedHeight: 0,
            height: 250,
            vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT
          });
          const inc = new Cesium.GeometryInstance({
            geometry: polygon
          });
          const Road = new Cesium.Primitive({
            geometryInstances: [inc],
            appearance: new Cesium.EllipsoidSurfaceAppearance({
              aboveGround: true
            }),
            show: true
          });
          const a = 0.9;
          const colorg = new Cesium.Color((a * 3.0) / 255, (a * 42.0) / 255, (a * 111.0) / 255, 1.0);
          const RoadMaterial = new Cesium.Material({
            fabric: {
              // type: 'Image',
              // uniforms: {
              //   image: 'srtm_60_05/images/ice2.jpg'
              // }
              type: 'Water',
              uniforms: {
                baseWaterColor: colorg,
                specularIntensity: 0.0001,
                normalMap: 'srtm_60_05/images/riverNormal.jpg',
                frequency: 500.0,
                animationSpeed: 0.0,
                amplitude: 10.0
              }
            }
          });
          Road.appearance.material = RoadMaterial;
          viewer.scene.primitives.add(Road);
        });
      });
    },
    loadFreezeRoadByEntities() {
      const viewer = this.viewer;
      fetch('srtm_60_05/jn_road_nh.json').then(response => {
        response.json().then(res => {
          const RoadPoint = res.data;
          // let a = 0.9;
          // let colorg = new Cesium.Color((a * 3.0) / 255, (a * 42.0) / 255, (a * 111.0) / 255, 1.0);
          // const RoadMaterial = Cesium.Color.fromCssColorString('#ff0').withAlpha(0.5);
          const material = new Cesium.ImageMaterialProperty({
            image: 'srtm_60_05/images/ice1.jpg'
          });
          // with height by fromDegreesArrayHeights, no heigt by fromDegreesArray
          const hierarchy = Cesium.Cartesian3.fromDegreesArray(RoadPoint);
          const roadEntity = viewer.entities.add({
            name: 'freezeRoad',
            polygon: new Cesium.PolygonGraphics({ hierarchy, material })
          });
        });
      });
    },
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
