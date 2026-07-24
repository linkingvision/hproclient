import { useSiteInfo } from "../../store/site-info";
import "ol/ol.css";
import { Cluster, OSM, Vector as VectorSource } from 'ol/source';
import VectorLayer from "ol/layer/Vector";
import { Map, View, Feature } from "ol";
import { Style, Icon, Circle, Text } from "ol/style";
import Fill from "ol/style/Fill";
import { Point, Polygon, LineString } from "ol/geom";
import { fromLonLat, transform, toLonLat, get } from "ol/proj";
import Stroke from "ol/style/Stroke";
import Pointer from "ol/interaction/Pointer";
import { getVectorContext } from 'ol/render';
import { unByKey } from 'ol/Observable';
import { boundingExtent } from 'ol/extent';
import { DiscoveredDevice } from "../../types/site-info";

const siteStore = useSiteInfo();
const getDeviceInfo = (): { target: DiscoveredDevice | null; access_token: string; session: string; root: string; username: string;} => {
    const devices = siteStore.siteDevices;
    if (!devices || devices.length === 0) {
        return { target: null, access_token: '', session: '', root: '', username: '' };
    }
    const target = devices.find((site: DiscoveredDevice) => site.login === true) || devices[0] || null;
    if (!target) {
        return { target: null, access_token: '', session: '', root: '', username: '' };
    }
    const protocol = target.enableHttps ? 'https' : 'http';
    const port = target.enableHttps ? Number(target.httpsPort) : Number(target.httpPort);
    return {
        target,
        access_token: target.access_token || '',
        session: target.session || '',
        root: `${protocol}://${target.ipv4Address}:${port}`,
        username: target.username ? decodeURIComponent(target.username) : ''
    };
}

// ==================== customed interface ====================

export interface LayerConfig {
    map?: Map | null;
    coordinate: number[];
    type?: string;
    cluster?: boolean;
    cameraName?: string;
    cameraToken: string;
    accessToken?: string;
    accessDoorStatus?: boolean;
    cameraType: string;
    angle?: number;
    rotationAngle?: number;
    drawIcon?: boolean;
    id?: string | number;
    whetherDelete?: boolean;
    RejectOperation?: boolean | string;
    callback: (back: CallbackData) => void;
    enableScan?: boolean;
    radius?: number;
}

export interface CallbackData {
    type: string;
    id: string | number;
    center: number[];
    angle?: number;
    rotationAngle?: number;
    radius?: number;
    cameraToken: string;
    cameraName?: string;
    cameraType?: string;
    accessToken?: string;
    accessDoorStatus?: boolean;
    whetherDelete?: boolean;
    callbackType: string;
    feature?: any[];
}

export interface CameraColorConfig {
    cameraIconUrl: string;
    circularFillColor: string;
    circularstrokeColor: string;
    controlColor: string;
    controRadiuslColor: string;
}

// ==================== customed class ====================

class h5sMap {
    public map: Map | null;
    public layers: Record<string, h5slayer | h5sCluster>;
    public this_: h5slayer | h5sCluster | null;
    public features: Feature<Point>[];
    public ClusterFeatures: Feature<Point>[];
    public feature_: Feature<Point> | null;
    public coordinate_: number[] | null;
    public clusterSource: Cluster<Feature> | null;
    public flagLayercam: VectorLayer<any> | null;
    public cluster: LayerConfig[];
    public dragInteractionInstance: Pointer;
    public styleCache: Record<string, any>;

    constructor(map: Map) {
        this.map = map;
        this.layers = {};
        this.this_ = null;
        this.features = [];
        this.ClusterFeatures = [];
        this.feature_ = null;
        this.coordinate_ = null;
        this.clusterSource = null;
        this.flagLayercam = null;
        this.cluster = [];
        this.dragInteractionInstance = this.dragInteraction();
        this.map.addInteraction(this.dragInteractionInstance);
        this.styleCache = {};
        this.addCluster();
    }

    addCluster(): void {
        this.clusterSource = new Cluster({
            distance: 40,
            source: new VectorSource(),
        });
        const flagLayercam = new VectorLayer({
            source: this.clusterSource,
            className: "flagLayercam",
            style: this.clusterStyle.call(this) as any
        });
        this.flagLayercam = flagLayercam;
        this.map?.addLayer(flagLayercam);
    }

    clusterStyle(): (feature: any) => Style | undefined {
        return (feature: any) => {
            let style: Style | undefined;
            const size = (feature.get('features') as any[]).length;
            const { root } = getDeviceInfo();
            if (size === 1) {
                style = (feature.get('features') as Feature<Point>[])[0].get("cameraStyle") as Style;
            } else {
                style = new Style({
                    image: new Icon({
                        src: root + "/img/camera.png",
                        scale: 0.15,
                        rotation: Math.PI,
                    }),
                    text: new Text({
                        text: size.toString(),
                        fill: new Fill({
                            color: '#fff',
                        }),
                        font: '13px Arial',
                        offsetX: 10,
                        offsetY: -8,
                        textAlign: "center",
                        backgroundFill: new Fill({
                            color: '#fa6400',
                        }),
                        padding: [2, 3, 0, 5],
                    }),
                });
            }
            return style;
        };
    }

    addLayer(conf: LayerConfig): void {
        conf.map = this.map;
        this.cluster.push(conf);
        if (conf.type === "camera" && conf.cluster) {
            if (this.layers["flagLayercam"]) {
                (this.layers["flagLayercam"] as h5sCluster).addClusterFeature(conf);
            } else {
                let layer = new h5sCluster(this.clusterSource!);
                layer.addClusterFeature(conf);
                this.layers["flagLayercam"] = layer;
            }
        } else {
            let layer = new h5slayer(conf);
            layer.start(conf.coordinate);
            this.layers[layer.cameraToken] = layer;
        }
    }

    removeLayer(): void {
        if (this.this_ && 'remove' in this.this_) {
            (this.this_ as h5slayer).remove();
        }
    }

    updateCamera(color: string, data: any, accessDoorStatus?: boolean): void {
        const target = this.this_ as h5slayer;
        if (!target) return;

        target.accessDoorStatus = accessDoorStatus !== undefined ? accessDoorStatus : false;
        let colorValue = target.getCameraColorEnum(color);
        target.cameraType = color;
        target.cameraIconUrl = colorValue.cameraIconUrl;
        const { root } = getDeviceInfo();
        const cameraStyle = new Style({
            image: new Icon({
                src: root + target.cameraIconUrl,
                anchor: [0, 0.5],
                scale: 0.15,
                rotation: target.type === 'view' || target.type === 'accessDoor' ? 0 : Math.PI - target.rotationAngle * Math.PI / 180,
            }),
        });
        this.coordinate_ = [data.longitude, data.latitude];
        const cameraFeature = new Feature({
            geometry: new Point(this.coordinate_)
        });
        cameraFeature.set('cameraToken', target.cameraToken);
        cameraFeature.setId("cameraid" + target.cameraToken);
        cameraFeature.setStyle(cameraStyle);

        const source = target.layer?.getSource();
        if (source) {
            source.removeFeature(source.getFeatureById("cameraid" + target.cameraToken) as Feature<Point>);
            source.addFeature(cameraFeature);
        }

        if (target.type === "camera") {
            target.circularFillColor = colorValue.circularFillColor;
            target.circularstrokeColor = colorValue.circularstrokeColor;
            const newFeature = target.getCircularFeature();
            const circularStyle = new Style({
                fill: new Fill({
                    color: target.circularFillColor
                }),
                stroke: new Stroke({
                    color: target.circularstrokeColor, width: 2
                }),
            });

            newFeature.set('cameraToken', target.cameraToken);
            newFeature.setId("circularid" + target.cameraToken);
            newFeature.setStyle(circularStyle);

            if (source) {
                source.removeFeature(source.getFeatureById("circularid" + target.cameraToken) as Feature<Polygon>);
                source.addFeature(newFeature);
            }

            target.controRadiuslColor = colorValue.controRadiuslColor;
            const cameraStyle1 = new Style({
                image: new Circle({
                    radius: 5,
                    fill: new Fill({
                        color: target.controRadiuslColor,
                    }),
                    rotation: 0,
                }),
            });
            let coordinateControl = [
                this.coordinate_[0] + data.radius * Math.cos((data.rotationAngle) * Math.PI / 180),
                this.coordinate_[1] + data.radius * Math.sin((data.rotationAngle) * Math.PI / 180)
            ];
            const radiusFeature = new Feature({
                geometry: new Point(coordinateControl)
            });
            radiusFeature.set('cameraToken', target.cameraToken);
            radiusFeature.setId("radiusid" + target.cameraToken);
            radiusFeature.setStyle(cameraStyle1);

            if (source) {
                source.removeFeature(source.getFeatureById("radiusid" + target.cameraToken) as Feature<Point>);
                source.addFeature(radiusFeature);
            }
        }
        target.map?.render();
        if (accessDoorStatus === undefined) {
            target.Callback('Update');
        }
    }

    deleteCamera(): void {
        const target = this.this_ as h5slayer;
        if (!target) return;

        target.whetherDelete = false;
        const source = target.layer?.getSource();
        if (target.type === "camera" && source) {
            source.removeFeature(source.getFeatureById("circularid" + target.cameraToken) as Feature<Polygon>);
            source.removeFeature(source.getFeatureById("angleid1" + target.cameraToken) as Feature<Point>);
            source.removeFeature(source.getFeatureById("angleid2" + target.cameraToken) as Feature<Point>);
            source.removeFeature(source.getFeatureById("radiusid" + target.cameraToken) as Feature<Point>);
        }
        if (source) {
            source.removeFeature(source.getFeatureById("cameraid" + target.cameraToken) as Feature<Point>);
        }
        target.Callback('Delete');
    }

    dragInteraction(): Pointer {
        return new Pointer({
            handleDownEvent: this.handleDownEvent.bind(this) as (event:any)=>boolean,
            handleDragEvent: this.handleDragEvent.bind(this),
            handleUpEvent: this.handleUpEvent.bind(this),
        });
    }

    handleDownEvent(event: any): boolean | undefined {
        let h5sMapInstance = this;
        if (this.flagLayercam) {
            (this.flagLayercam as any).getFeatures(event.pixel).then((clickedFeatures: any[]) => {
                if (clickedFeatures.length) {
                    const features = clickedFeatures[0].get('features') as Feature<Point>[];
                    if (features.length > 1) {
                        const coordinates = features.map((r) => (r.getGeometry() as any).getCoordinates());
                        const uniqueCoordinates = new Set(coordinates.map(coord => coord.join(',')));
                        if (uniqueCoordinates.size === 1) {
                            h5sMapInstance.ClusterFeatures = features;
                        }
                        const extent = boundingExtent(
                            features.map((r) => (r.getGeometry() as any).getCoordinates()),
                        );
                        this.map?.getView()?.fit(extent, { duration: 1000, padding: [20, 20, 20, 20] });
                    } else {
                        h5sMapInstance.feature_ = features[0];
                    }
                    h5sMapInstance.this_ = h5sMapInstance.layers["flagLayercam"];
                }
            });
        }

        let feature = this.map?.forEachFeatureAtPixel(event.pixel, (feature) => {
            return feature;
        }) as Feature<Point> | undefined;

        if (!feature) {
            return;
        }

        if (!feature.get("cameraToken")) {
            return true;
        }
        this.this_ = this.layers[feature.get("cameraToken")];

        if (event.originalEvent.button === 2) {
            const target = this.this_ as h5slayer;
            if (target && !target.RejectOperation) return;
            if (target) target.Callback('Delete');
        } else {
            const target = this.this_ as h5slayer;
            if (target) {
                target.unByKey();
                this.coordinate_ = event.coordinate;
                if (feature) {
                    this.feature_ = feature;
                    this.features = target.layer?.getSource()?.getFeatures() as Feature<Point>[] || [];
                } else {
                    this.coordinate_ = null;
                    this.feature_ = null;
                }
            }
            return !!feature;
        }
    }

    handleDragEvent(event: any): void {
        const target = this.this_ as h5slayer;
        if (!target || !target.RejectOperation) return;
        let deltaX: number, deltaY: number, geometry: any, newFeature: Feature<Polygon>, circularStyle: Style;

        switch (this.feature_?.getId()) {
            case "cameraid" + target.cameraToken:
                deltaX = event.coordinate[0] - this.coordinate_![0];
                deltaY = event.coordinate[1] - this.coordinate_![1];
                this.features.forEach((item) => {
                    geometry = item.getGeometry();
                    geometry?.translate(deltaX, deltaY);
                });
                target.coordinateControl[0] = deltaX + target.coordinateControl[0];
                target.center[0] = deltaX + target.center[0];
                target.coordinateControl[1] = deltaY + target.coordinateControl[1];
                target.center[1] = deltaY + target.center[1];
                break;
            case "radiusid" + target.cameraToken:
                this.handleRadiusEvent(event);
                break;
            case "angleid1" + target.cameraToken:
                target.endAngle = target.handleEventAngle(event);
                target.startAngle = -target.endAngle;
                newFeature = target.getCircularFeature();

                circularStyle = new Style({
                    fill: new Fill({
                        color: target.circularFillColor
                    }),
                    stroke: new Stroke({
                        color: target.circularstrokeColor, width: 2
                    }),
                });

                newFeature.set('cameraToken', target.cameraToken);
                newFeature.setId("circularid" + target.cameraToken);
                newFeature.setStyle(circularStyle);
                target.layer?.getSource()?.removeFeature(target.layer?.getSource()?.getFeatureById("circularid" + target.cameraToken) as Feature<Polygon>);
                target.layer?.getSource()?.addFeature(newFeature);
                target.map?.render();
                break;
            case "angleid2" + target.cameraToken:
                target.endAngle = target.handleEventAngle(event);
                target.startAngle = -target.endAngle;
                newFeature = target.getCircularFeature();

                circularStyle = new Style({
                    fill: new Fill({
                        color: target.circularFillColor
                    }),
                    stroke: new Stroke({
                        color: target.circularstrokeColor, width: 2
                    }),
                });
                newFeature.set('cameraToken', target.cameraToken);
                newFeature.setId("circularid" + target.cameraToken);
                newFeature.setStyle(circularStyle);
                target.layer?.getSource()?.removeFeature(target.layer?.getSource()?.getFeatureById("circularid" + target.cameraToken) as Feature<Polygon>);
                target.layer?.getSource()?.addFeature(newFeature);
                target.map?.render();
                break;
            default:
                break;
        }

        if (this.coordinate_) {
            this.coordinate_[0] = event.coordinate[0];
            this.coordinate_[1] = event.coordinate[1];
        }
    }

    handleUpEvent(event: any): boolean {
        const target = this.this_;
        if (!target) return false;

        if ('enableScan' in target && (target as h5slayer).enableScan) {
            (target as h5slayer).addscan();
        }
        if (this.feature_) {
            const cameraToken = this.feature_.get("cameraToken");
            const matchingItem = this.cluster.find(item => item.cameraToken === cameraToken);

            if (matchingItem) {
                const callbackArgs: any[] = matchingItem.cluster ? [this.feature_, 'Update'] : ['Update'];
                (target as any).Callback(...callbackArgs);
            }
        } else if (this.ClusterFeatures.length > 1) {
            (target as h5sCluster).Callback(this.ClusterFeatures, 'Update', 'Cluster');
        }
        this.coordinate_ = null;
        this.feature_ = null;
        return false;
    }

    handleRadiusEvent(event: any): void {
        const target = this.this_ as h5slayer;
        if (!target) return;

        let deltaX = event.coordinate[0] - this.coordinate_![0];
        let deltaY = event.coordinate[1] - this.coordinate_![1];
        let centerdeltaX = event.coordinate[0] - target.center[0];
        let centerdeltaY = event.coordinate[1] - target.center[1];
        let radiusFeature = target.layer?.getSource()?.getFeatureById("radiusid" + target.cameraToken) as Feature<Point>;
        let radiusgeometry = radiusFeature?.getGeometry() as any;
        radiusgeometry?.translate(deltaX, deltaY);

        target.rotationAngle = Math.atan2(centerdeltaY, centerdeltaX) * (180 / Math.PI);
        let circularFeature = target.layer?.getSource()?.getFeatureById("cameraid" + target.cameraToken) as Feature<Point>;
        let style = circularFeature?.getStyle() as Style;
        (style.getImage() as any).setRotation(Math.PI - target.rotationAngle * Math.PI / 180);
        circularFeature.setStyle(style);

        target.radius = target.calculateDistance(target.center[0], target.center[1], event.coordinate[0], event.coordinate[1]);
        const newFeature = target.getCircularFeature();
        let circularStyle = new Style({
            fill: new Fill({
                color: target.circularFillColor
            }),
            stroke: new Stroke({
                color: target.circularstrokeColor, width: 2
            }),
        });
        newFeature.set('cameraToken', target.cameraToken);
        newFeature.setId("circularid" + target.cameraToken);
        newFeature.setStyle(circularStyle);
        target.layer?.getSource()?.removeFeature(target.layer?.getSource()?.getFeatureById("circularid" + target.cameraToken) as Feature<Polygon>);
        target.layer?.getSource()?.addFeature(newFeature);

        target.map?.render();
    }

    destroy(): void {
        if (this.map && this.dragInteractionInstance) {
            this.map.removeInteraction(this.dragInteractionInstance);
        }

        if (this.flagLayercam && this.map) {
            this.map.removeLayer(this.flagLayercam);
            this.flagLayercam = null;
        }

        for (const key in this.layers) {
            const layerObj = this.layers[key];
            if (layerObj && this.map) {
                if ('layer' in layerObj && layerObj.layer) {
                    this.map.removeLayer(layerObj.layer);
                }
            }
        }
        this.layers = {};
        this.features = [];
        this.feature_ = null;
        this.coordinate_ = null;

        if (this.clusterSource) {
            this.clusterSource.clear();
            this.clusterSource = null;
        }

        this.cluster = [];
        this.styleCache = {};
        this.map = null;
    }
}

class h5slayer {
    public map: Map;
    public projection: any;
    public draw: boolean;
    public layer: VectorLayer<any> | null;
    public radius: number;
    public cameraName?: string;
    public cameraToken: string;
    public accessToken: string;
    public accessDoorStatus: boolean;
    public type: string;
    public cameraIconUrl: string;
    public center: number[];
    public startAngle: number;
    public endAngle: number;
    public rotationAngle: number;
    public coordinateControl: number[];
    public cameraType: string;
    public controlColor: string;
    public controRadiuslColor: string;
    public circularFillColor: string;
    public circularstrokeColor: string;
    public drawIcon: boolean;
    public id: string | number;
    public whetherDelete: boolean;
    public RejectOperation: boolean;
    public callback: (back: CallbackData) => void;
    public enableScan: boolean;
    public direction: number;
    public totalRotation: number;
    public flashGeom: any;
    public listenerKey: any;

    constructor(conf: LayerConfig) {
        this.map = conf.map!;
        this.projection = conf.map!.getView().getProjection();
        this.draw = true;
        this.layer = null;
        if (this.projection.code_ === "EPSG:4326") {
            this.radius = 0.007;
        } else {
            this.radius = 1000;
        }
        this.cameraName = conf.cameraName;
        this.cameraToken = conf.cameraToken;
        this.accessToken = conf.accessToken || '';
        this.accessDoorStatus = conf.accessDoorStatus || false;
        this.type = conf.type || 'camera';
        this.cameraIconUrl = this.getCameraColorEnum(conf.cameraType).cameraIconUrl;
        this.center = [];
        this.startAngle = conf.angle !== undefined ? -Math.floor(conf.angle / 2) : -45;
        this.endAngle = conf.angle !== undefined ? Math.floor(conf.angle / 2) : 45;
        this.rotationAngle = conf.rotationAngle || 0;
        this.coordinateControl = [];
        this.cameraType = conf.cameraType;
        this.controlColor = this.getCameraColorEnum(conf.cameraType).controlColor || "#ff2d51";
        this.controRadiuslColor = this.getCameraColorEnum(conf.cameraType).controRadiuslColor || "#ff2d51";
        this.circularFillColor = this.getCameraColorEnum(conf.cameraType).circularFillColor || 'rgba(0, 0, 255, 0.2)';
        this.circularstrokeColor = this.getCameraColorEnum(conf.cameraType).circularstrokeColor || '#ffcc33';
        this.drawIcon = conf.drawIcon || false;
        this.id = conf.id || '';
        this.whetherDelete = conf.whetherDelete !== undefined ? conf.whetherDelete : true;
        this.RejectOperation = conf.RejectOperation === "false" || conf.RejectOperation === false ? false : true;
        this.callback = conf.callback;
        this.enableScan = conf.enableScan || false;
        this.direction = 1;
        this.totalRotation = 0;
        this.flashGeom = null;
        this.listenerKey = null;

        if (conf.radius) {
            this.radius = conf.radius;
        }
    }

    start(e: number[]): void {
        this.layer = new VectorLayer({
            className: "VectorLayerCam",
            source: new VectorSource(),
        });
        this.layer.set('id', this.cameraToken);
        this.layer.set('type', this.type);
        this.map.addLayer(this.layer);
        if (this.cameraToken !== undefined && this.draw) {
            this.addcamera(e);
            if (!this.drawIcon) {
                this.addCircular(e);
                this.addRadiusControl(e);
                if (this.enableScan) {
                    this.addscan();
                }
            }
            this.draw = false;
        }
        this.Callback('Add');
    }

    remove(): void {
        if (this.layer) {
            this.map.removeLayer(this.layer);
            this.layer = null;
        }
    }

    singleclick(e: any): void {
        console.log(this.cameraToken);
    }

    getCameraColorEnum(pream: string): CameraColorConfig {
        let color: Record<string, CameraColorConfig> = {};
        if (!this.accessToken) {
            if (this.type === "camera") {
                color = {
                    "USC_MAP_CAM_COLOR_DEFAULT": {
                        cameraIconUrl: '/img/camera.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                    "USC_MAP_CAM_COLOR_BLUE": {
                        cameraIconUrl: '/img/camera.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                    "USC_MAP_CAM_COLOR_GREEN": {
                        cameraIconUrl: '/img/camera_green.png',
                        circularFillColor: "rgba(105, 226, 66, 0.2)",
                        circularstrokeColor: "rgba(105, 226, 66, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(105, 226, 66, 1)",
                    },
                    "USC_MAP_CAM_COLOR_YELLOW": {
                        cameraIconUrl: '/img/camera_orange.png',
                        circularFillColor: "rgba(243, 179, 64, 0.2)",
                        circularstrokeColor: "rgba(243, 179, 64, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(243, 179, 64, 1)",
                    },
                };
            } else if (this.type === "view") {
                color = {
                    "USC_MAP_CAM_COLOR_DEFAULT": {
                        cameraIconUrl: '/img/view.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                    "USC_MAP_CAM_COLOR_BLUE": {
                        cameraIconUrl: '/img/view.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                    "USC_MAP_CAM_COLOR_GREEN": {
                        cameraIconUrl: '/img/view_green.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                    "USC_MAP_CAM_COLOR_YELLOW": {
                        cameraIconUrl: '/img/view_orange.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                };
            } else if (this.type === "link") {
                color = {
                    "USC_MAP_CAM_COLOR_DEFAULT": {
                        cameraIconUrl: '/img/link.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                    "USC_MAP_CAM_COLOR_BLUE": {
                        cameraIconUrl: '/img/link.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                    "USC_MAP_CAM_COLOR_GREEN": {
                        cameraIconUrl: '/img/link_green.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                    "USC_MAP_CAM_COLOR_YELLOW": {
                        cameraIconUrl: '/img/link_orange.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                };
            }
        } else {
            if (!this.accessDoorStatus) {
                color = {
                    "USC_MAP_CAM_COLOR_DEFAULT": {
                        cameraIconUrl: '/img/access_off.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                    "USC_MAP_CAM_COLOR_BLUE": {
                        cameraIconUrl: '/img/access_off.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                    "USC_MAP_CAM_COLOR_GREEN": {
                        cameraIconUrl: '/img/access_off_green.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                    "USC_MAP_CAM_COLOR_YELLOW": {
                        cameraIconUrl: '/img/access_off_orange.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                };
            } else {
                color = {
                    "USC_MAP_CAM_COLOR_DEFAULT": {
                        cameraIconUrl: '/img/access_on.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                    "USC_MAP_CAM_COLOR_BLUE": {
                        cameraIconUrl: '/img/access_on.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                    "USC_MAP_CAM_COLOR_GREEN": {
                        cameraIconUrl: '/img/access_on_green.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                    "USC_MAP_CAM_COLOR_YELLOW": {
                        cameraIconUrl: '/img/access_on_orange.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                };
            }
        }
        return color[pream];
    }

    addcamera(e: number[]): void {
        this.center = e;
        const coordinate = e;
        const { root } = getDeviceInfo();
        const cameraStyle = new Style({
            image: new Icon({
                src: root + this.cameraIconUrl,
                anchor: [0, 0.5],
                scale: 0.15,
                rotation: this.type === 'view' || this.type === 'accessDoor' ? 0 : Math.PI - this.rotationAngle * Math.PI / 180,
            }),
        });
        const cameraFeature = new Feature({
            geometry: new Point(coordinate)
        });
        cameraFeature.set('cameraToken', this.cameraToken);
        cameraFeature.setId("cameraid" + this.cameraToken);
        cameraFeature.setStyle(cameraStyle);
        this.layer?.getSource()?.addFeature(cameraFeature);
    }

    addCircular(e: number[]): void {
        const feature = this.getCircularFeature();
        let circularStyle = new Style({
            fill: new Fill({
                color: this.circularFillColor
            }),
            stroke: new Stroke({
                color: this.circularstrokeColor,
                width: 2,
            }),
        });
        feature.set('cameraToken', this.cameraToken);
        feature.setId("circularid" + this.cameraToken);
        feature.setStyle(circularStyle);
        this.layer?.getSource()?.addFeature(feature);
    }

    addRadiusControl(e: number[]): void {
        const cameraStyle = new Style({
            image: new Circle({
                radius: 5,
                fill: new Fill({
                    color: this.controRadiuslColor,
                }),
                rotation: 0,
            }),
        });
        let coordinateControl = [
            this.center[0] + this.radius * Math.cos((this.rotationAngle) * Math.PI / 180),
            this.center[1] + this.radius * Math.sin((this.rotationAngle) * Math.PI / 180)
        ];
        const radiusFeature = new Feature({
            geometry: new Point(coordinateControl)
        });
        radiusFeature.set('cameraToken', this.cameraToken);
        radiusFeature.setId("radiusid" + this.cameraToken);
        radiusFeature.setStyle(cameraStyle);
        this.layer?.getSource()?.addFeature(radiusFeature);
    }

    addAngle(coordinate: number[], angleid: string): void {
        const cameraStyle = new Style({
            image: new Circle({
                radius: 5,
                fill: new Fill({
                    color: this.controlColor,
                }),
                stroke: new Stroke({
                    color: "rgba(151, 151, 151, 1)",
                    width: 2
                }),
                rotation: 0,
            }),
        });
        const radiusFeature = new Feature({
            geometry: new Point(coordinate)
        });
        radiusFeature.set('cameraToken', this.cameraToken);
        radiusFeature.setId(angleid);
        radiusFeature.setStyle(cameraStyle);

        const source = this.layer?.getSource();
        if (source) {
            const existingFeature = source.getFeatureById(angleid);
            if (existingFeature) {
                source.removeFeature(existingFeature);
            }
            source.addFeature(radiusFeature);
        }
    }

    getCircularFeature(): Feature<Polygon> {
        const coords = this.createCirclePointCoords(this.center, this.radius, this.startAngle, this.endAngle, 360);
        const CreatePolygon = new Polygon([coords]);
        return new Feature({ geometry: CreatePolygon });
    }

    createCirclePointCoords(center: number[], circleRadius: number, startAngle: number, endAngle: number, pointsToFind: number): number[][] {
        let angleToAdd = 360 / pointsToFind;
        let coords: number[][] = [center];
        let angle = startAngle;

        for (let i = 0; i < pointsToFind; i++) {
            if (angle > endAngle) break;
            let coordX = center[0] + circleRadius * Math.cos((angle + this.rotationAngle) * Math.PI / 180);
            let coordY = center[1] + circleRadius * Math.sin((angle + this.rotationAngle) * Math.PI / 180);
            coords.push([coordX, coordY]);
            angle = angle + angleToAdd;
        }

        this.addAngle(coords[1], "angleid1" + this.cameraToken);
        this.addAngle(coords[coords.length - 1], "angleid2" + this.cameraToken);
        this.coordinateControl = coords[Math.floor(coords.length / 2)];
        return coords;
    }

    handleEventAngle(e: any): number {
        let vectorBA = { x: e.coordinate[0] - this.center[0], y: e.coordinate[1] - this.center[1] };
        let vectorBC = { x: this.coordinateControl[0] - this.center[0], y: this.coordinateControl[1] - this.center[1] };

        let dotProduct = vectorBA.x * vectorBC.x + vectorBA.y * vectorBC.y;

        let lengthBA = Math.sqrt(vectorBA.x * vectorBA.x + vectorBA.y * vectorBA.y);
        let lengthBC = Math.sqrt(vectorBC.x * vectorBC.x + vectorBC.y * vectorBC.y);

        let angle = Math.acos(dotProduct / (lengthBA * lengthBC));
        let degree = angle * 180 / Math.PI;

        return degree;
    }

    calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    Callback(callbackType?: string): void {
        let back: CallbackData = {
            type: this.type,
            id: this.id,
            center: this.center,
            angle: Math.abs(this.endAngle) + Math.abs(this.startAngle),
            rotationAngle: this.rotationAngle,
            radius: this.radius,
            cameraToken: this.cameraToken,
            cameraName: this.cameraName,
            cameraType: this.cameraType,
            accessToken: this.accessToken,
            accessDoorStatus: this.accessDoorStatus,
            whetherDelete: this.whetherDelete,
            callbackType: callbackType ? callbackType : '',
        };
        this.callback(back);
    }

    animate(event: any): void {
        if (Math.abs(this.totalRotation) >= (Math.abs(this.startAngle) + Math.abs(this.endAngle)) / 2 * Math.PI / 180) {
            this.direction *= -1;
        }

        const vectorContext = getVectorContext(event);
        const rotation = Math.PI / 180 * this.direction;

        const style = new Style({
            stroke: new Stroke({
                color: this.createSpectrumColor(),
                width: 2,
            }),
        });
        this.flashGeom.rotate(rotation, this.center);
        vectorContext.setStyle(style);
        vectorContext.drawGeometry(this.flashGeom);
        this.map.render();

        this.totalRotation += rotation;
    }

    addscan(): void {
        const lineCoordinates = [this.center, this.coordinateControl];
        const lineGeometry = new LineString(lineCoordinates);
        const feature = new Feature(lineGeometry);
        feature.setId("scan" + this.cameraToken);
        const style = new Style({
            stroke: new Stroke({
                color: 'rgba(255, 0, 0, 0)',
                width: 2,
            }),
        });
        feature.setStyle(style);
        this.flashGeom = feature.getGeometry()?.clone();
        
        const source = this.layer?.getSource();
        if (source) {
            source.removeFeature(source.getFeatureById("scan" + this.cameraToken) as Feature);
            source.addFeature(feature);
        }
        this.addPostrender();
    }

    createSpectrumColor(): string {
        const hue = (this.totalRotation * 180 / Math.PI) % 360;
        const saturation = 100;
        const lightness = 50;
        const alpha = 1 - Math.abs(this.totalRotation) / (Math.abs(this.startAngle) * Math.PI / 180);
        return `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
    }

    addPostrender(): void {
        this.listenerKey = this.layer?.on('postrender', this.animate.bind(this));
    }

    unByKey(): void {
        this.totalRotation = 0;
        unByKey(this.listenerKey);
    }
}

class h5sCluster {
    public clusterSource: Cluster<Feature>;
    public features: Record<string, h5sFeature>;

    constructor(clusterSource: Cluster<Feature>) {
        this.clusterSource = clusterSource;
        this.features = {};
    }

    addClusterFeature(conf: LayerConfig): void {
        let feature = new h5sFeature(conf, this.clusterSource);
        feature.addClusterFeature();
        this.features[feature.cameraToken] = feature;
    }

    Callback(feature: any, callbackType: string, Cluster?: string): void {
        if (!Cluster) {
            let cameraToken = feature.get("cameraToken");
            this.features[cameraToken].Callback(callbackType);
        } else {
            let cameraToken = feature[0].get("cameraToken");
            this.features[cameraToken].Callback(callbackType, feature);
        }
    }
}

class h5sFeature {
    public clusterSource: Cluster<Feature>;
    public map: Map | null | undefined;
    public radius: number;
    public cameraName?: string;
    public cameraToken: string;
    public type: string;
    public cameraIconUrl: string;
    public center: number[];
    public startAngle: number;
    public endAngle: number;
    public rotationAngle: number;
    public coordinateControl: number[];
    public cameraType: string;
    public drawIcon: boolean;
    public id: string | number;
    public whetherDelete: boolean;
    public callback: (back: CallbackData) => void;
    public accessToken?: string;
    public accessDoorStatus?: boolean;

    constructor(conf: LayerConfig, clusterSource: Cluster<Feature>) {
        this.clusterSource = clusterSource;
        this.map = conf.map;
        this.radius = conf.radius || 1000;
        this.cameraName = conf.cameraName;
        this.cameraToken = conf.cameraToken;
        this.type = conf.type || 'camera';
        this.accessToken = conf.accessToken || '';
        this.accessDoorStatus = conf.accessDoorStatus || false;
        this.cameraIconUrl = this.getCameraColorEnum(conf.cameraType).cameraIconUrl;
        this.center = conf.coordinate;
        this.startAngle = conf.angle !== undefined ? -Math.floor(conf.angle / 2) : -45;
        this.endAngle = conf.angle !== undefined ? Math.floor(conf.angle / 2) : 45;
        this.rotationAngle = conf.rotationAngle || 0;

        this.coordinateControl = [];
        this.cameraType = conf.cameraType;
        this.drawIcon = conf.drawIcon || false;
        this.id = conf.id || '';
        this.whetherDelete = conf.whetherDelete !== undefined ? conf.whetherDelete : true;
        this.callback = conf.callback;
    }

    addClusterFeature(): void {
        if (this.cameraToken !== undefined) {
            const coordinate = this.center;

            const cameraFeature = new Feature({
                geometry: new Point(coordinate)
            });
            cameraFeature.set('cameraToken', this.cameraToken);
            cameraFeature.setId("cameraid" + this.cameraToken);
            cameraFeature.set('cameraStyle', this.getCameraStyle());
            this.clusterSource.getSource()?.addFeature(cameraFeature);
        }
    }

    getCameraColorEnum(pream: string): CameraColorConfig {
        let color: Record<string, CameraColorConfig> = {};
        if (!this.accessToken) {
            if (this.type === "camera") {
                color = {
                    "USC_MAP_CAM_COLOR_DEFAULT": {
                        cameraIconUrl: '/img/camera.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                    "USC_MAP_CAM_COLOR_BLUE": {
                        cameraIconUrl: '/img/camera.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                    "USC_MAP_CAM_COLOR_GREEN": {
                        cameraIconUrl: '/img/camera_green.png',
                        circularFillColor: "rgba(105, 226, 66, 0.2)",
                        circularstrokeColor: "rgba(105, 226, 66, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(105, 226, 66, 1)",
                    },
                    "USC_MAP_CAM_COLOR_YELLOW": {
                        cameraIconUrl: '/img/camera_orange.png',
                        circularFillColor: "rgba(243, 179, 64, 0.2)",
                        circularstrokeColor: "rgba(243, 179, 64, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(243, 179, 64, 1)",
                    },
                };
            } else if (this.type === "view") {
                color = {
                    "USC_MAP_CAM_COLOR_DEFAULT": {
                        cameraIconUrl: '/img/view.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                    "USC_MAP_CAM_COLOR_BLUE": {
                        cameraIconUrl: '/img/view.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                    "USC_MAP_CAM_COLOR_GREEN": {
                        cameraIconUrl: '/img/view_green.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                    "USC_MAP_CAM_COLOR_YELLOW": {
                        cameraIconUrl: '/img/view_orange.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                };
            } else if (this.type === "link") {
                color = {
                    "USC_MAP_CAM_COLOR_DEFAULT": {
                        cameraIconUrl: '/img/link.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                    "USC_MAP_CAM_COLOR_BLUE": {
                        cameraIconUrl: '/img/link.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                    "USC_MAP_CAM_COLOR_GREEN": {
                        cameraIconUrl: '/img/link_green.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                    "USC_MAP_CAM_COLOR_YELLOW": {
                        cameraIconUrl: '/img/link_orange.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                };
            }
        } else {
            if (!this.accessDoorStatus) {
                color = {
                    "USC_MAP_CAM_COLOR_DEFAULT": {
                        cameraIconUrl: '/img/access_off.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                    "USC_MAP_CAM_COLOR_BLUE": {
                        cameraIconUrl: '/img/access_off.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                    "USC_MAP_CAM_COLOR_GREEN": {
                        cameraIconUrl: '/img/access_off_green.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                    "USC_MAP_CAM_COLOR_YELLOW": {
                        cameraIconUrl: '/img/access_off_orange.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                };
            } else {
                color = {
                    "USC_MAP_CAM_COLOR_DEFAULT": {
                        cameraIconUrl: '/img/access_on.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                    "USC_MAP_CAM_COLOR_BLUE": {
                        cameraIconUrl: '/img/access_on.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                    "USC_MAP_CAM_COLOR_GREEN": {
                        cameraIconUrl: '/img/access_on_green.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                    "USC_MAP_CAM_COLOR_YELLOW": {
                        cameraIconUrl: '/img/access_on_orange.png',
                        circularFillColor: "rgba(7, 201, 255, 0.2)",
                        circularstrokeColor: "rgba(7, 201, 255, 1)",
                        controlColor: "rgba(255, 255, 255, 1)",
                        controRadiuslColor: "rgba(3, 153, 254, 1)",
                    },
                };
            }
        }
        return color[pream];
    }

    getCameraStyle(): Style {
        const { root } = getDeviceInfo();
        return new Style({
            image: new Icon({
                src: root + this.cameraIconUrl,
                anchor: [0, 0.5],
                scale: 0.15,
                rotation: this.type === 'view' || this.type === 'accessDoor' ? 0 : Math.PI - this.rotationAngle * Math.PI / 180,
            }),
        });
    }

    Callback(callbackType?: string, feature?: any[]): void {
        let back: CallbackData = {
            type: this.type,
            id: this.id,
            center: this.center,
            cameraToken: this.cameraToken,
            cameraName: this.cameraName,
            callbackType: callbackType ? callbackType : '',
            feature: feature ? feature : [],
        };
        this.callback(back);
    }
}

export default h5sMap;