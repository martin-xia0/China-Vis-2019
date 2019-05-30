import React, {Component} from 'react';
import {StaticMap} from 'react-map-gl';
import MapboxLanguage from '@mapbox/mapbox-gl-language';
import {PhongMaterial} from '@luma.gl/core';
import {AmbientLight, PointLight, LightingEffect} from '@deck.gl/core';
import DeckGL from '@deck.gl/react';
import {PolygonLayer} from '@deck.gl/layers';
import {TripsLayer} from '@deck.gl/geo-layers';

// Set your mapbox token here
const MAPBOX_TOKEN = 'pk.eyJ1IjoieWlmemhhbmciLCJhIjoiY2p3NG1wdGU2MWp4aTQ4cXE0cDY2cW10OSJ9.MO1caW9zRx5ixTyi_8HSeQ'; // eslint-disable-line

// Source data CSV
const DATA_URL = {
  BUILDINGS:
      'https://raw.githubusercontent.com/uber-common/deck.gl-data/master/examples/trips/buildings.json', // eslint-disable-line
  TRIPS:
      'https://raw.githubusercontent.com/uber-common/deck.gl-data/master/examples/trips/trips.json' // eslint-disable-line
};

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

const material = new PhongMaterial({
  ambient: 0.1,
  diffuse: 0.6,
  shininess: 32,
  specularColor: [60, 64, 70]
});

const addControlHandler = (event) => {
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

  map.addLayer({
    'id': '3d-buildings',
    'source': 'composite',
    'source-layer': 'building',
    'filter': ['==', 'extrude', 'true'],
    'type': 'fill-extrusion',
    'minzoom': 15,
    'paint': {
      'fill-extrusion-color': '#aaa',
      'fill-extrusion-height': [
        "interpolate", ["linear"], ["zoom"],
        15, 0,
        15.05, ["get", "height"]
      ],
      'fill-extrusion-base': [
        "interpolate", ["linear"], ["zoom"],
        15, 0,
        15.05, ["get", "min_height"]
      ],
      'fill-extrusion-opacity': .6,
      'fill-extrusion-vertical-gradient': true
    }
  }, labelLayerId);
};

export const INITIAL_VIEW_STATE = {
  longitude: 104.036107,
  latitude: 30.461111,
  zoom: 12,
  pitch: 60,
  bearing: 0
};

export default class Trips extends Component {
  constructor(props) {
    super(props);
    this.state = {
      time: 0
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
      loopLength = 3600, // unit corresponds to the timestamp in source data
      animationSpeed = 30 // unit time per second
    } = this.props;
    const timestamp = Date.now() / 1000;
    const loopTime = loopLength / animationSpeed;

    this.setState({
      time: ((timestamp % loopTime) / loopTime) * loopLength
    });
    this._animationFrame = window.requestAnimationFrame(this._animate.bind(this));
  }

  _renderLayers() {
    const {buildings = DATA_URL.BUILDINGS, trips = DATA_URL.TRIPS, trailLength = 180} = this.props;

    return [
      new TripsLayer({
        id: 'trips',
        data: trips,
        getPath: d => d.segments,
        getColor: d => (d.vendor === 0 ? [253, 128, 93] : [23, 184, 190]),
        opacity: 0.3,
        widthMinPixels: 2,
        rounded: true,
        trailLength,
        currentTime: this.state.time
      }),
      new PolygonLayer({
        id: 'buildings',
        data: buildings,
        extruded: true,
        wireframe: false,
        opacity: 0.5,
        getPolygon: f => f.polygon,
        getElevation: f => f.height,
        getFillColor: [74, 80, 87],
        material
      })
    ];
  }

  render() {
    const {viewState, controller = true, baseMap = true} = this.props;

    return (
        <DeckGL
            layers={this._renderLayers()}
            effects={[lightingEffect]}
            initialViewState={INITIAL_VIEW_STATE}
            viewState={viewState}
            controller={controller}
        >
          {baseMap && (
              <StaticMap
                  reuseMaps
                  attributionControl={false}
                  mapStyle="mapbox://styles/mapbox/dark-v9"
                  preventStyleDiffing={true}
                  mapboxApiAccessToken={MAPBOX_TOKEN}
                  onLoad={addControlHandler}
              />
          )}
        </DeckGL>
    );
  }
}
