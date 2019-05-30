import React, {Component} from 'react';
import {StaticMap} from 'react-map-gl';
import MapboxLanguage from '@mapbox/mapbox-gl-language';
import {PhongMaterial} from '@luma.gl/core';
import {AmbientLight, PointLight, LightingEffect} from '@deck.gl/core';
import DeckGL from '@deck.gl/react';
import renderLayers from './components/layers'
import {fromJS} from 'immutable';

const mapStyle = fromJS({
    version: 8,
    sources: {
        points: {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: [
                    {type: 'Feature', geometry: {type: 'Point', coordinates: [-122.45, 37.78]}}
                ]
            }
        }
    },
    layers: [
        {
            id: 'my-layer',
            type: 'circle',
            source: 'points',
            paint: {
                'circle-color': '#f00',
                'circle-radius': 4
            }
        }
    ]
});


// Set your mapbox token here
const MAPBOX_TOKEN = 'pk.eyJ1IjoieWlmemhhbmciLCJhIjoiY2p3NG1wdGU2MWp4aTQ4cXE0cDY2cW10OSJ9.MO1caW9zRx5ixTyi_8HSeQ'; // eslint-disable-line

const ambientLight = new AmbientLight({
    color: [255, 255, 255],
    intensity: 1.0
});

const pointLight = new PointLight({
    color: [255, 255, 255],
    intensity: 2.0,
    position: [-74.05, 40.7, 8000]
});

const lightingEffect = new LightingEffect({ambientLight, pointLight});

const mapOnLoadHandler = (event) => {
    const map = event && event.target;
    if (map) {
        map.addControl(new MapboxLanguage({
            defaultLanguage: 'zh',
        }));
        map.setLayoutProperty('country-label-lg', 'text-field', ['get', 'name_zh']);
    }

    // Insert the layer beneath any symbol layer.
    let layers = map.getStyle().layers;

    let labelLayerId;
    for (let i = 0; i < layers.length; i++) {
        if (layers[i].type === 'symbol' && layers[i].layout['text-field']) {
            labelLayerId = layers[i].id;
            break;
        }
    }

    // 3D building
    // map.addLayer({
    //     'id': '3d-buildings',
    //     'source': 'composite',
    //     'source-layer': 'building',
    //     'filter': ['==', 'extrude', 'true'],
    //     'type': 'fill-extrusion',
    //     'minzoom': 15,
    //     'paint': {
    //         'fill-extrusion-color': '#aaa',
    //         'fill-extrusion-height': [
    //             "interpolate", ["linear"], ["zoom"],
    //             15, 0,
    //             15.05, ["get", "height"]
    //         ],
    //         'fill-extrusion-base': [
    //             "interpolate", ["linear"], ["zoom"],
    //             15, 0,
    //             15.05, ["get", "min_height"]
    //         ],
    //         'fill-extrusion-opacity': .6,
    //         'fill-extrusion-vertical-gradient': true
    //     }
    // }, labelLayerId);
};

export const INITIAL_VIEW_STATE = {
    longitude: 104.036107,
    latitude: 30.461111,
    zoom: 12,
    pitch: 60,
    bearing: 0
};

export default class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hour: 17,
            time: 0,
            display: {
                trips: true,
            }
        };
    }

    componentDidMount() {
        this._animate();
    }

    componentWillUnmount() {
        if (this._animationFrame) {
            window.cancelAnimationFrame(this._animationFrame);
        }
    }

    _animate() {
        const {
            loopLength = 1800, // unit corresponds to the timestamp in source data
            animationSpeed = 20 // unit time per second
        } = this.props;
        const timestamp = Date.now() / 1000;
        const loopTime = loopLength / animationSpeed;

        this.setState({
            time: ((timestamp % loopTime) / loopTime) * loopLength
        });
        this._animationFrame = window.requestAnimationFrame(this._animate.bind(this));
    }

    _initialize(gl) {
        gl.blendFunc(gl.SRC_ALPHA, gl.DST_ALPHA);
        gl.blendEquation(gl.FUNC_ADD);
    }

    render() {
        const {viewState, controller = true} = this.props;

        return (
            <DeckGL
                layers={renderLayers({
                    display: this.state.display,
                    currTime: this.state.time,
                    hour: this.state.hour
                })}
                effects={[lightingEffect]}
                initialViewState={INITIAL_VIEW_STATE}
                viewState={viewState}
                controller={controller}
                onWebGLInitialized={this._initialize}
                fp64={true}
            >
                <StaticMap
                    reuseMaps
                    attributionControl={false}
                    mapStyle="mapbox://styles/mapbox/dark-v9"
                    preventStyleDiffing={true}
                    mapboxApiAccessToken={MAPBOX_TOKEN}
                    onLoad={mapOnLoadHandler}
                />
            </DeckGL>
        );
    }
}
