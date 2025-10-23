import { useState, useEffect, useCallback } from 'react';

function ClickableImage(props) {
  const {
    endpoint,
    imgSrc,
    fullpath,
    paramToUpdate,
    regions = {},
    getRegionColor,
    maximiseAxis = null,
    valuesAsPercentages = false
  } = props;
  const [imgData, setImgData] = useState(null);
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);
  const [points, setPoints] = useState([]);
  const [coords, setCoords] = useState([]);
  
  useEffect(() => {
    if (imgSrc) {
      setImgData(`data:image/jpg;base64,${imgSrc}`);
      }
  }, [imgSrc]);
  const getPoint = useCallback(e => {
    const bounds = e.target.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const y = e.clientY - bounds.top;
    return [x, y];
  }, []);
  const calculateRectangle = useCallback(() => {
    if (!startPoint || !endPoint) return;
    const xCoords = [startPoint[0], endPoint[0]];
    const yCoords = [startPoint[1], endPoint[1]];
    let minX = Math.min(...xCoords);
    let maxX = Math.max(...xCoords);
    let minY = Math.min(...yCoords);
    let maxY = Math.max(...yCoords);
    const canvas = document.getElementById('canvas');
    if (maximiseAxis === 'x') {
      minX = 0;
      maxX = canvas.clientWidth;
    } else if (maximiseAxis === 'y') {
      minY = 0;
      maxY = canvas.clientHeight;
    }
    const rectanglePoints = [
      [minX, minY],
      [maxX, minY],
      [maxX, maxY],
      [minX, maxY],
    ];
    setPoints(rectanglePoints);
    setCoords([[minX, maxX], [minY, maxY]]);
  }, [startPoint, endPoint, maximiseAxis]);
  const handleMouseDown = useCallback(e => {
    e.preventDefault();
    const point = getPoint(e);
    setStartPoint(point);
    setEndPoint(point);
  }, [getPoint]);
  const handleMouseMove = useCallback(e => {
    e.preventDefault();
    if (startPoint) {
      const point = getPoint(e);
      setEndPoint(point);
      calculateRectangle();
    }
  }, [startPoint, getPoint, calculateRectangle]);
  const handleMouseUp = useCallback(e => {
      e.preventDefault();
      if (startPoint) {
        calculateRectangle();
        const canvas = document.getElementById('canvas');
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        // Convert to 80x80 grid coordinates
        const x1 = Math.round((coords[0][0] / width) * 80);
        const x2 = Math.round((coords[0][1] / width) * 80);
        const y1 = Math.round((coords[1][0] / height) * 80);
        const y2 = Math.round((coords[1][1] / height) * 80);
        // Get existing regions and add new one
        const existingRegions = regions || {};
        const newRegionId = Object.keys(existingRegions).length + 1;
        const coordinates = [
          [Math.max(0, Math.min(x1, 79)), Math.max(0, Math.min(x2, 79))],
          [Math.max(0, Math.min(y1, 79)), Math.max(0, Math.min(y2, 79))]
        ];
        // Create updated regions dictionary
        const sendData = {
          ...existingRegions,
          [newRegionId.toString()]: coordinates
        };
        if (valuesAsPercentages) {
          const sendDataPercent = Object.fromEntries(
            Object.entries(sendData).map(([id, coord]) => [
              id,
                [
                  [parseFloat((coord[0][0] / 80 * 100).toFixed(2)), parseFloat((coord[0][1] / 80 * 100).toFixed(2))],
                  [parseFloat((coord[1][0] / 80 * 100).toFixed(2)), parseFloat((coord[1][1] / 80 * 100).toFixed(2))]
                ]
                ])
            );
          endpoint.put({ [paramToUpdate]: sendDataPercent }, fullpath);
        } 
        else {
          endpoint.put({ [paramToUpdate]: sendData }, fullpath);
        }
        setStartPoint(null);
        setEndPoint(null);
        setPoints([]);
      }
  }, [startPoint, coords, calculateRectangle, paramToUpdate, regions, valuesAsPercentages, endpoint, fullpath]);
  return (
    <div style={{
      position: 'relative',
      display: 'inline-block',
      width: '100%',
      height: 'auto',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      MozUserSelect: 'none',
      msUserSelect: 'none'
    }}>
      <img 
        src={imgData}
        style={{
          display: 'block',
          width: '100%',
          height: 'auto',
          imageRendering: 'pixelated', // Make image sharp when upscaled
          WebkitImageRendering: 'pixelated', // Safari image sharpness
          msImageRendering: 'pixelated' // Edge image sharpness
        }}
        draggable="false"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        alt="Detector view"
      />
      <svg
          id="canvas"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none'
          }}>
          {/* Render existing regions */}
          {Object.entries(regions).map(([id, region]) => {
            const [[x1, x2], [y1, y2]] = region;
            const canvas = document.getElementById('canvas');
            const width = canvas.clientWidth;
            const height = canvas.clientHeight;
            
            const color = getRegionColor(parseInt(id) - 1);
            
            // Scale to display coordinates
            const dx1 = (x1 * width) / 80;
            const dx2 = (x2 * width) / 80;
            const dy1 = (y1 * height) / 80;
            const dy2 = (y2 * height) / 80;
            return (
              <polygon
                key={id}
                points={`${dx1},${dy1} ${dx2},${dy1} ${dx2},${dy2} ${dx1},${dy2}`}
                style={{
                  pointerEvents: 'none',
                  fill: color.fill,
                  stroke: color.stroke
                }}
              />
            );
          })}
          
          {/* Render current selection */}
          {points.length === 4 &&
            <polygon
              points={points.map(point => point.join(",")).join(" ")}
              style={{
                pointerEvents: 'none',
                fill: 'rgba(255, 255, 255, 0.3)',
                stroke: 'white'
              }}
            />
          }
      </svg>
    </div>
  );
}

export default ClickableImage;