import React from 'react';
import { Form } from 'react-bootstrap';

interface ValueRangeControlProps {
    min: number;
    max: number;
    colormap: string;
    onRangeChange: Function;
}

export function ValueRangeControl({ min, max, colormap, onRangeChange }: ValueRangeControlProps) {
    const height = 400;
    const width = 30;
    const labelWidth = 75;
    const padding = 15;
    const verticalPadding = 20;
    const totalHeight = height + (2 * verticalPadding);

    const getColormapStops = (colormap: string) => {
        switch(colormap?.toLowerCase()) {
            case 'autumn':
                return [
                    { offset: "0%", color: 'rgb(255,0,0)' },
                    { offset: "100%", color: 'rgb(255,255,0)' }
                ];
            
            case 'bone':
                return [
                    { offset: "0%", color: 'rgb(0,0,0)' },
                    { offset: "40%", color: 'rgb(80,80,112)' },
                    { offset: "100%", color: 'rgb(255,255,255)' }
                ];
            
            case 'jet':
                return [
                    { offset: "0%", color: 'rgb(0,0,128)' },
                    { offset: "20%", color: 'rgb(0,0,255)' },
                    { offset: "40%", color: 'rgb(0,255,255)' },
                    { offset: "60%", color: 'rgb(255,255,0)' },
                    { offset: "80%", color: 'rgb(255,0,0)' },
                    { offset: "100%", color: 'rgb(128,0,0)' }
                ];

            case 'winter':
                return [
                    { offset: "0%", color: 'rgb(0,0,255)' },
                    { offset: "100%", color: 'rgb(0,255,128)' }
                ];

            case 'rainbow':
                return [
                    { offset: "0%", color: 'rgb(255,0,0)' },
                    { offset: "20%", color: 'rgb(255,255,0)' },
                    { offset: "40%", color: 'rgb(0,255,0)' },
                    { offset: "60%", color: 'rgb(0,255,255)' },
                    { offset: "80%", color: 'rgb(0,0,255)' },
                    { offset: "100%", color: 'rgb(255,0,255)' }
                ];

            case 'ocean':
                return [
                    { offset: "0%", color: 'rgb(0,0,0)' },
                    { offset: "50%", color: 'rgb(0,127,255)' },
                    { offset: "100%", color: 'rgb(255,255,255)' }
                ];

            case 'summer':
                return [
                    { offset: "0%", color: 'rgb(0,128,102)' },
                    { offset: "100%", color: 'rgb(255,255,102)' }
                ];

            case 'spring':
                return [
                    { offset: "0%", color: 'rgb(255,0,255)' },
                    { offset: "100%", color: 'rgb(255,255,0)' }
                ];

            case 'cool':
                return [
                    { offset: "0%", color: 'rgb(0,255,255)' },
                    { offset: "100%", color: 'rgb(255,0,255)' }
                ];

            case 'hsv':
                return [
                    { offset: "0%", color: 'rgb(255,0,0)' },
                    { offset: "33%", color: 'rgb(0,255,0)' },
                    { offset: "67%", color: 'rgb(0,0,255)' },
                    { offset: "100%", color: 'rgb(255,0,0)' }
                ];

            case 'pink':
                return [
                    { offset: "0%", color: 'rgb(30,0,0)' },
                    { offset: "50%", color: 'rgb(255,128,128)' },
                    { offset: "100%", color: 'rgb(255,255,255)' }
                ];

            case 'hot':
                return [
                    { offset: "0%", color: 'rgb(11,0,0)' },
                    { offset: "30%", color: 'rgb(255,0,0)' },
                    { offset: "60%", color: 'rgb(255,255,0)' },
                    { offset: "100%", color: 'rgb(255,255,255)' }
                ];

            case 'parula':
                return [
                    { offset: "0%", color: 'rgb(62,38,168)' },
                    { offset: "25%", color: 'rgb(27,139,239)' },
                    { offset: "50%", color: 'rgb(37,203,233)' },
                    { offset: "75%", color: 'rgb(246,219,45)' },
                    { offset: "100%", color: 'rgb(249,251,14)' }
                ];

            case 'magma':
                return [
                    { offset: "0%", color: 'rgb(0,0,4)' },
                    { offset: "25%", color: 'rgb(88,21,109)' },
                    { offset: "50%", color: 'rgb(201,42,103)' },
                    { offset: "75%", color: 'rgb(249,147,90)' },
                    { offset: "100%", color: 'rgb(252,253,191)' }
                ];

            case 'inferno':
                return [
                    { offset: "0%", color: 'rgb(0,0,4)' },
                    { offset: "25%", color: 'rgb(102,13,103)' },
                    { offset: "50%", color: 'rgb(216,54,49)' },
                    { offset: "75%", color: 'rgb(253,179,61)' },
                    { offset: "100%", color: 'rgb(252,255,164)' }
                ];

            case 'plasma':
                return [
                    { offset: "0%", color: 'rgb(13,8,135)' },
                    { offset: "25%", color: 'rgb(126,3,168)' },
                    { offset: "50%", color: 'rgb(204,71,120)' },
                    { offset: "75%", color: 'rgb(248,149,64)' },
                    { offset: "100%", color: 'rgb(240,249,33)' }
                ];

            case 'viridis':
                return [
                    { offset: "0%", color: 'rgb(68,1,84)' },
                    { offset: "25%", color: 'rgb(59,82,139)' },
                    { offset: "50%", color: 'rgb(33,145,140)' },
                    { offset: "75%", color: 'rgb(94,201,98)' },
                    { offset: "100%", color: 'rgb(253,231,37)' }
                ];

            case 'cividis':
                return [
                    { offset: "0%", color: 'rgb(0,32,76)' },
                    { offset: "25%", color: 'rgb(34,89,132)' },
                    { offset: "50%", color: 'rgb(90,142,169)' },
                    { offset: "75%", color: 'rgb(170,194,184)' },
                    { offset: "100%", color: 'rgb(251,235,166)' }
                ];

            case 'twilight':
                return [
                    { offset: "0%", color: 'rgb(226,217,226)' },
                    { offset: "33%", color: 'rgb(166,106,193)' },
                    { offset: "66%", color: 'rgb(112,50,126)' },
                    { offset: "100%", color: 'rgb(226,217,226)' }
                ];

            case 'twilight_shifted':
                return [
                    { offset: "0%", color: 'rgb(226,217,226)' },
                    { offset: "33%", color: 'rgb(166,106,193)' },
                    { offset: "66%", color: 'rgb(112,50,126)' },
                    { offset: "100%", color: 'rgb(226,217,226)' }
                ];

            case 'turbo':
                return [
                    { offset: "0%", color: 'rgb(35,23,27)' },
                    { offset: "25%", color: 'rgb(38,92,174)' },
                    { offset: "50%", color: 'rgb(86,197,184)' },
                    { offset: "75%", color: 'rgb(232,201,64)' },
                    { offset: "100%", color: 'rgb(208,22,40)' }
                ];

            default:
                return [
                    { offset: "0%", color: 'rgb(0,0,0)' },
                    { offset: "100%", color: 'rgb(255,255,255)' }
                ];
        }
    };

    const createGradient = () => {
        const stops = getColormapStops(colormap);
        const gradientId = `colorScale-${colormap}`;

        return (
            <defs>
                <linearGradient id={gradientId} x1="0%" y1="100%" x2="0%" y2="0%">
                    {stops.map((stop, index) => (
                        <stop 
                            key={index} 
                            offset={stop.offset} 
                            stopColor={stop.color} 
                        />
                    ))}
                </linearGradient>
            </defs>
        );
    };

    return (
        <div style={{ position: 'relative', marginRight: '10px' }}>
            <h6 className="mb-3">Value Range Clipping</h6>
            <div style={{ marginTop: '20px' }}>
                <Form.Group>
                    <Form.Label>Maximum Value</Form.Label>
                    <Form.Text className="text-muted d-block">
                        Values above this will be clipped
                    </Form.Text>
                    <Form.Control 
                        type="number" 
                        value={max} 
                        onChange={(e) => {
                            const newMax = parseInt(e.target.value);
                            if (!isNaN(newMax)) {
                                onRangeChange([min, newMax]);
                            }
                        }}
                    />
                </Form.Group>
            </div>
            <div className="d-flex align-items-center">
                <svg width={width + labelWidth + padding} height={totalHeight}>
                    {createGradient()}
                    {/* Background for scale labels to ensure visibility */}
                    <rect
                        x={0}
                        y={0}
                        width={labelWidth}
                        height={totalHeight}
                        fill="white"
                    />
                    {/* Gradient bar */}
                    <rect 
                        x={labelWidth + padding}
                        y={verticalPadding} 
                        width={width} 
                        height={height} 
                        fill={`url(#colorScale-${colormap})`}
                        stroke="black"
                        strokeWidth="1"
                    />
                    
                    {/* Scale markers */}
                    {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
                        <g key={fraction}>
                            <line 
                                x1={labelWidth}
                                y1={verticalPadding + (height * (1-fraction))}
                                x2={labelWidth + padding}
                                y2={verticalPadding + (height * (1-fraction))}
                                stroke="black" 
                            />
                            <text 
                                x={labelWidth - padding}
                                y={verticalPadding + (height * (1-fraction))}
                                textAnchor="end" 
                                alignmentBaseline="middle" 
                                fontSize="12"
                            >
                                {Math.round(min + (max - min) * fraction)}
                            </text>
                        </g>
                    ))}
                </svg>
            </div>
            
            <div style={{ marginTop: '20px' }}>
                <Form.Group>
                    <Form.Label>Minimum Value</Form.Label>
                        <Form.Text className="text-muted d-block">
                            Values below this will be clipped
                        </Form.Text>
                        <Form.Control 
                            type="number" 
                            value={min} 
                            onChange={(e) => {
                                const newMin = parseInt(e.target.value);
                                if (!isNaN(newMin)) {
                                    onRangeChange([newMin, max]);
                                }
                            }}
                        />
                </Form.Group>
            </div>
        </div>
    );
}