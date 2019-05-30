import {TripsLayer} from 'deck.gl';
import mydata from '../data/time-divided/17.json';

const tmp = mydata;

export default function renderLayers(props) {
    const {
        display, currTime,
        dataUrl = './data/time-divided/', hour = 0, timeOffset = 1525104000, trailLength = 100
    } = props;

    return [
        display.trips && new TripsLayer({
            id: 'trips',
            data: mydata,
            getPath: d => d.track.map(p => [p[1], p[2], p[0] - timeOffset - hour * 3600]),
            getColor: [253, 128, 93],
            opacity: 1,
            widthMinPixels: 2,
            rounded: true,
            trailLength,
            currentTime: currTime,
            pickable: true,
            autoHighlight: true
        })
    ]
};