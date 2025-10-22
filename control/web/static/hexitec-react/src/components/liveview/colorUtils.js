const regionColors = [
    { fill: 'rgba(255, 165, 0, 0.3)', stroke: 'rgb(255, 165, 0)' },  // Orange
    { fill: 'rgba(0, 255, 255, 0.3)', stroke: 'rgb(0, 255, 255)' },  // Cyan
    { fill: 'rgba(255, 0, 255, 0.3)', stroke: 'rgb(255, 0, 255)' },  // Magenta
    { fill: 'rgba(0, 255, 0, 0.3)', stroke: 'rgb(0, 255, 0)' },      // Lime
    { fill: 'rgba(255, 255, 0, 0.3)', stroke: 'rgb(255, 255, 0)' },  // Yellow
];

export const getRegionColor = (regionId) => {
    return regionColors[regionId % regionColors.length];
};