import type { AdapterEndpoint_t } from 'odin-react';
import { useState, useEffect, useCallback } from 'react';

type Point = [number, number];

interface ClickableImageProps {
  endpoint: AdapterEndpoint_t;
  imgPath: string;
  coordsPath?: string;
  coordsParam?: string;
  onSelection?: (coords: [[number, number], [number, number]]) => void;
  maximiseAxis?: string | null;
}

export function ClickableImage(props: ClickableImageProps) {
  const {
    endpoint,
    imgPath,
    coordsPath,
    coordsParam,
    onSelection,
    maximiseAxis = null,
  } = props;
  
  const [imgData, changeImgData] = useState<string | null>(null);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [endPoint, setEndPoint] = useState<Point | null>(null);
  const [points, setPoints] = useState<Point[]>([]);
  
  const refreshImage = useCallback(() => {
    endpoint.get<Blob>(imgPath, { responseType: "blob" })
      .then((result) => {
        if (imgData) { URL.revokeObjectURL(imgData); }
        const img_url = URL.createObjectURL(result);
        changeImgData(img_url);
      }).catch((error) => {
        console.error("IMAGE GET FAILED: ", error);
        changeImgData("");
      })
  }, [endpoint.updateFlag]);

  useEffect(() => {
    const timer_id = setInterval(refreshImage, 950);
    return () => clearInterval(timer_id);
  }, [refreshImage]);

  const getPoint = useCallback((e: React.MouseEvent<HTMLImageElement>): Point => {
    const bounds = e.currentTarget.getBoundingClientRect();
    return [e.clientX - bounds.left, e.clientY - bounds.top];
  }, []);

  const calculateRectangle = useCallback(() => {
    if (!startPoint || !endPoint) return;
    const xCoords = [startPoint[0], endPoint[0]];
    const yCoords = [startPoint[1], endPoint[1]];
    let minX = Math.min(...xCoords);
    let maxX = Math.max(...xCoords);
    let minY = Math.min(...yCoords);
    let maxY = Math.max(...yCoords);
    
    const canvas = document.getElementById('canvas') as HTMLElement | null;
    if (!canvas) return;
    
    if (maximiseAxis === 'x') {
      minX = 0;
      maxX = canvas.clientWidth;
    } else if (maximiseAxis === 'y') {
      minY = 0;
      maxY = canvas.clientHeight;
    }
    
    const rectanglePoints: Point[] = [
      [minX, minY],
      [maxX, minY],
      [maxX, maxY],
      [minX, maxY],
    ];
    setPoints(rectanglePoints);
  }, [startPoint, endPoint, maximiseAxis]);

  const handleContextMenu = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    if (startPoint || endPoint || points.length > 0) {
      e.preventDefault();
      setStartPoint(null);
      setEndPoint(null);
      setPoints([]);
    }
  }, [startPoint, endPoint, points]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const point = getPoint(e);
    setStartPoint(point);
    setEndPoint(point);
  }, [getPoint]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    e.preventDefault();
    if (startPoint) {
      const point = getPoint(e);
      setEndPoint(point);
      calculateRectangle();
    }
  }, [startPoint, getPoint, calculateRectangle]);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    e.preventDefault();
    if (!startPoint || !endPoint) return;
    
    calculateRectangle();
    const canvas = document.getElementById('canvas') as HTMLElement | null;
    if (!canvas) return;
    
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    
    const x1 = endPoint[0] / width;
    const x2 = startPoint[0] / width;
    const y1 = endPoint[1] / height;
    const y2 = startPoint[1] / height;
    
    const coords: [[number, number], [number, number]] = [
      [Math.min(x1, x2), Math.max(x1, x2)],
      [Math.min(y1, y2), Math.max(y1, y2)]
    ];

    // If no selection function provided, send direct to endpoint
    if (!onSelection) {
      const sendVal = {[coordsParam]: coords};
      // console.log("sendval:", JSON.stringify(sendVal));
      endpoint.put(sendVal, coordsPath);
    }
    else {
      onSelection(coords);
    }
    
    setStartPoint(null);
    setEndPoint(null);
    // setPoints([]);
  }, [startPoint, endPoint, calculateRectangle]);

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
        src={imgData || undefined}
        style={{
          display: 'block',
          width: '100%',
          height: 'auto',
          imageRendering: 'pixelated',
        }}
        draggable="false"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
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
